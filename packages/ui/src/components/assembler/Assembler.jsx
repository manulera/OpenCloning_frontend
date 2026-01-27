import React from 'react'
import { Alert, Autocomplete, Box, Button, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { Clear as ClearIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useAssembler } from './useAssembler';
import { arrayCombinations } from '../eLabFTW/utils';
import { useDispatch } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import RequestStatusWrapper from '../form/RequestStatusWrapper';
import useHttpClient from '../../hooks/useHttpClient';
import AssemblerPart from './AssemblerPart';
import { partsToEdgesGraph } from './graph_utils';

import moCloYTKSyntax from '../../../../../apps/syntax-builder/public/syntax/moclo_ytk/syntax.json'
import moCloPlasmids from '../../../../../apps/syntax-builder/public/syntax/moclo_ytk/plasmids.json'

const { setState: setCloningState, setCurrentTab: setCurrentTabAction } = cloningActions;

const categoryFilter = (category, categories, previousCategoryId) => {
  if (previousCategoryId === null) {
    return category.left_overhang === categories[0].left_overhang
  }
  const previousCategory = categories.find((category) => category.id === previousCategoryId)
  return previousCategory?.right_overhang === category.left_overhang
}

const formattedMoCloPlasmids = moCloPlasmids
  .filter(({ appData}) => appData.correspondingParts.length === 1)
  .map((sequenceData, index) => {
    const { appData } = sequenceData;
    const { fileName, correspondingParts, longestFeature } = appData;
    const [left_overhang, right_overhang] = correspondingParts[0].split('-');
    
    return {
      type: 'loadedFile',
      id: index + 1,
      plasmid_name: `${fileName} (${longestFeature[0].name})`,
      left_overhang,
      right_overhang,
      key: `${left_overhang}-${right_overhang}`,
      sequenceData
    };
  });


function formatItemName(item) {
  return `${item.plasmid_name}`
}


function isAssemblyComplete(assembly, categories) {
  const lastPosition = assembly.length - 1
  if (lastPosition === -1) {
    return false
  }
  const lastCategory = categories.find((category) => category.id === assembly[lastPosition].category)
  console.log('lastCategory',lastPosition, lastCategory)
  return lastCategory?.right_overhang === categories[0].left_overhang
}

function AssemblerComponent({ plasmids, categories }) {

  const [assembly, setAssembly] = React.useState([])

  const { requestSources, requestAssemblies } = useAssembler()
  const [requestedAssemblies, setRequestedAssemblies] = React.useState([])
  const [loadingMessage, setLoadingMessage] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const dispatch = useDispatch()

  const onSubmitAssembly = async () => {
    clearAssembly()
    const selectedPlasmids = assembly.map(({ id }) => id.map((id) => (plasmids.find((item) => item.id === id))))
    console.log('selectedPlasmids', selectedPlasmids)
    const sources = 'blah'
    let errorMessage = 'Error fetching sequences'
    try {
      setLoadingMessage('Requesting sequences...')
      const resp = await requestSources(sources)
      errorMessage = 'Error assembling sequences'
      setLoadingMessage('Assembling...')
      const assemblies = await requestAssemblies(resp)
      setRequestedAssemblies(assemblies)
    } catch (e) {
      setErrorMessage(errorMessage)
    } finally {
      setLoadingMessage(false)
    }
  }

  const clearAssembly = () => {
    setRequestedAssemblies([])
    setErrorMessage('')
  }

  const setCategory = (category, index) => {
    clearAssembly()
    if (category === '') {
      setAssembly(prev => prev.slice(0, index))
    } else {
      setAssembly(prev => [...prev.slice(0, index), { category, id: [] }])
    }
  }
  const setId = (idArray, index) => {
    clearAssembly()
    // Handle case where user clears all selections (empty array)
    if (!idArray || idArray.length === 0) {
      setAssembly(assembly.map((item, i) => i === index ? { ...item, id: [] } : item))
      return
    }

    // For multiple selection, we need to determine the category based on the first selected item
    // or maintain the current category if it's already set
    const currentItem = assembly[index]
    const firstOption = plasmids.find((item) => item.id === idArray[0])
    const category = currentItem.category || firstOption?.category || ''

    setAssembly(assembly.map((item, i) => i === index ? { id: idArray, category } : item))
  }

  const handleViewAssembly = (index) => {
    const newState = requestedAssemblies[index]
    dispatch(setCloningState(newState))
    dispatch(setCurrentTabAction(0))
  }

  React.useEffect(() => {
    const newAssembly = [...assembly]
    while (true) {
      if (isAssemblyComplete(newAssembly, categories)) {
        break
      }
      let lastPosition = newAssembly.length - 1
      const previousCategoryId = lastPosition === -1 ? null : newAssembly[lastPosition].category
      let nextCategories = categories.filter((category) => categoryFilter(category, categories, previousCategoryId))
      if (nextCategories.length !== 1) {
        break
      } else if (nextCategories.length === 1) {
        newAssembly.push({ category: nextCategories[0].id, id: [] })
      }
    }
    if (newAssembly.length !== assembly.length) {
      setAssembly(newAssembly)
    }
  }, [assembly, categories])


  const expandedAssemblies = arrayCombinations(assembly.map(({ id }) => id))
  const assemblyComplete = isAssemblyComplete(assembly, categories)
  const currentCategories = assembly.map((item) => item.category)
  const options = assemblyComplete ? assembly : [...assembly, { category: '', id: [] }]

  return (
    <Box className="assembler-container" sx={{ width: '80%', margin: 'auto', mb: 4 }}>
      <Alert severity="warning" sx={{ maxWidth: '400px', margin: 'auto', fontSize: '.9rem' }}>
                The Assembler is experimental. Use with caution.
      </Alert>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ overflowX: 'auto', my: 2 }}>
        {options.map((item, index) => {
          const allowedCategories = categories.filter((category) => categoryFilter(category, categories, index === 0 ? null : assembly[index - 1].category))
          const isCompleted = item.category !== '' && item.id.length > 0
          const borderColor = isCompleted ? 'success.main' : 'primary.main'
          const thisCategory = categories.find((category) => category.id === item.category)
          const allowedPlasmids = thisCategory ? plasmids.filter((d) => d.key === thisCategory.key) : [];

          return (
            <React.Fragment key={index}>
              {/* Link before first box */}
              <Box sx={{ width: '250px', border: 3, borderColor, borderRadius: 4, p: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    endAdornment={item.category && allowedCategories.length > 1 && (<InputAdornment position="end"><IconButton onClick={() => setCategory('', index)}><ClearIcon /></IconButton></InputAdornment>)}
                    value={item.category}
                    onChange={(e) => setCategory(e.target.value, index)}
                    label="Category"
                    disabled={index < assembly.length}
                  >
                    {allowedCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name} ({category.info})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    value={item.id}
                    onChange={(e, value) => setId(value, index)}
                    label="ID"
                    options={allowedPlasmids.map((item) => item.id)}
                    getOptionLabel={(id) => formatItemName(plasmids.find((d) => d.id === id))}
                    renderInput={(params) => <TextField {...params} label="ID" />}
                  />
                </FormControl>
                {thisCategory && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <AssemblerPart data={ thisCategory }/>
                  </Box>
                )}
              </Box>

            </React.Fragment>
          )
        })}
      </Stack>
      {assemblyComplete && <>
        <Button
          sx={{ p: 2, px: 4, my: 2, fontSize: '1.2rem' }}
          variant="contained"
          color="primary"
          onClick={onSubmitAssembly}
          disabled={Boolean(loadingMessage)}>
          {loadingMessage ? <><CircularProgress /> {loadingMessage}</> : 'Submit'}
        </Button>
      </>}
      {errorMessage && <Alert severity="error" sx={{ my: 2, maxWidth: 300, margin: 'auto', fontSize: '1.2rem' }}>{errorMessage}</Alert>}
      {requestedAssemblies.length > 0 &&
                <TableContainer sx={{ '& td': { fontSize: '1.2rem' }, '& th': { fontSize: '1.2rem' } }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        {currentCategories.map(category => (
                          <TableCell key={category} sx={{ fontWeight: 'bold' }}>
                            {category === 'F_A' ? 'Backbone' : category}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expandedAssemblies.map((parts, rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell padding="checkbox">
                            <IconButton onClick={() => handleViewAssembly(rowIndex)} size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                          {parts.map((part, colIndex) => (
                            <TableCell key={colIndex}>
                              {formatItemName(plasmids.find((d) => d.id === part))}
                            </TableCell>
                          ))}


                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
      }

    </Box >
  )
}

function Assembler() {
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' })
  const [syntax, setSyntax] = React.useState(moCloYTKSyntax);

  const [graph, setGraph] = React.useState(null)
  const [categories, setCategories] = React.useState([])
  const [data2, setData2] = React.useState([])

  React.useEffect(() => {
    setGraph(partsToEdgesGraph(syntax.parts))
  }, [syntax])

  React.useEffect(() => {
    const newCategories = syntax.parts.map((part) => ({
      ...part,
      left_name: syntax.overhangNames[part.left_overhang] || null,
      right_name: syntax.overhangNames[part.right_overhang] || null,
      key: `${part.left_overhang}-${part.right_overhang}`,
    }))
    setCategories(newCategories)
  }, [syntax])
  
  
  const [retry, setRetry] = React.useState(0)
  const [plasmids, setPlasmids] = React.useState(formattedMoCloPlasmids)
  const httpClient = useHttpClient()
  
  React.useEffect(() => {
    setRequestStatus({ status: 'loading' })
    const fetchData = async () => {
      try {
        // const { data } = await httpClient.get('https://assets.opencloning.org/open-dna-collections/scripts/index_overhangs.json')
        // const formattedData = data.map((item) => ({
        //   ...item,
        //   category: data2.find((item2) => item2.overhang === item.left_overhang).name + '_' + data2.find((item2) => item2.overhang === item.right_overhang).name
        // }))

        // const categories = [...new Set(formattedData.map((item) => item.category))].sort()
        // setPlasmids(formattedData)
        // setCategories(categories)
        setRequestStatus({ status: 'success' })
      } catch (error) {
        setRequestStatus({ status: 'error', message: 'Could not load assembler data' })
      }
    }
    fetchData()

  }, [retry])
  return (
    <RequestStatusWrapper requestStatus={requestStatus} retry={() => setRetry((prev) => prev + 1)}>
      <AssemblerComponent plasmids={plasmids} syntax={syntax} categories={categories} />
    </RequestStatusWrapper>
  )
}

export default Assembler
