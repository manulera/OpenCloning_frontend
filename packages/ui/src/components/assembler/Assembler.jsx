import React from 'react'
import { Alert, Autocomplete, Box, Button, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { Clear as ClearIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useAssembler } from './useAssembler';
import { useDispatch } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import RequestStatusWrapper from '../form/RequestStatusWrapper';
import useHttpClient from '../../hooks/useHttpClient';
import AssemblerPart from './AssemblerPart';
import { partsToEdgesGraph } from './graph_utils';

import moCloYTKSyntax from '../../../../../apps/syntax-builder/public/syntax/moclo_ytk/syntax.json'
import moCloPlasmids from '../../../../../apps/syntax-builder/public/syntax/moclo_ytk/plasmids.json'
import { jsonToGenbank } from '@teselagen/bio-parsers';
import useCombinatorialAssembly from './useCombinatorialAssembly';
import { usePlasmidsLogic } from './usePlasmidsLogic';

const { setState: setCloningState, setCurrentTab: setCurrentTabAction } = cloningActions;

const categoryFilter = (category, categories, previousCategoryId) => {
  if (previousCategoryId === null) {
    return category.left_overhang === categories[0].left_overhang
  }
  const previousCategory = categories.find((category) => category.id === previousCategoryId)
  return previousCategory?.right_overhang === category.left_overhang
}

function formatPlasmid(sequenceData) {

  const { appData } = sequenceData;
  const { fileName, correspondingParts, longestFeature } = appData;
  const [left_overhang, right_overhang] = correspondingParts[0].split('-');

  let plasmidName = fileName;
  if (longestFeature[0]?.name) {
    plasmidName += ` (${longestFeature[0].name})`;
  }

  return {
    type: 'loadedFile',
    plasmid_name: plasmidName,
    file_name: fileName,
    left_overhang,
    right_overhang,
    key: `${left_overhang}-${right_overhang}`,
    sequenceData,
    genbankString: jsonToGenbank(sequenceData),
  };

}

const formattedMoCloPlasmids = moCloPlasmids
  .filter(({ appData}) => appData.correspondingParts.length === 1)
  .map(formatPlasmid);

formattedMoCloPlasmids.push({
  collection: "Ecoli Nanobody Toolkit",
  plasmid_name: 'HELLO!',
  left_overhang:"CCCT",
  right_overhang:"AACG",
  key: "CCCT-AACG",
  longest_feature_type:"CDS",
  source:{
    id: 0,
    type: "AddgeneIdSource",
    input: [],
    repository_id: "65115",
  }
})


function formatItemName(item) {
  return `${item.plasmid_name}`
}

function AssemblerProductTable({ requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories }) {

  const dispatch = useDispatch()
  const handleViewAssembly = (index) => {
    const newState = requestedAssemblies[index]
    dispatch(setCloningState(newState))
    dispatch(setCurrentTabAction(0))
  }
  return (
    <TableContainer sx={{ '& td': { fontSize: '1.2rem' }, '& th': { fontSize: '1.2rem' } }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            {currentCategories.map(category => (
              <TableCell key={category} sx={{ fontWeight: 'bold' }}>
                {categories.find((c) => c.id === category).displayName}
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
  )
}

function AssemblerBox({ item, index, setCategory, setId, categories, plasmids, assembly }) {

  const allowedCategories = categories.filter((category) => categoryFilter(category, categories, index === 0 ? null : assembly[index - 1].category))
  const isCompleted = item.category !== '' && item.plasmidIds.length > 0
  const borderColor = isCompleted ? 'success.main' : 'primary.main'
  const thisCategory = categories.find((category) => category.id === item.category)
  const allowedPlasmids = thisCategory ? plasmids.filter((d) => d.key === thisCategory.key) : [];

  return(
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
            <MenuItem key={category.id} value={category.id}>{category.displayName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {thisCategory && (
        <>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              value={item.plasmidIds}
              onChange={(e, value) => setId(value, index)}
              options={allowedPlasmids.map((item) => item.id)}
              getOptionLabel={(id) => formatItemName(plasmids.find((d) => d.id === id))}
              renderInput={(params) => <TextField {...params} label="Plasmids" />}
              renderOption={(props, option) => {
                const plasmid = plasmids.find((d) => d.id === option)
                return (
                  <MenuItem {...props} sx={{ backgroundColor: plasmid.type === 'loadedFile' ? 'success.light' : undefined }}>
                    {formatItemName(plasmid)}
                  </MenuItem>
                )}}
            />
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AssemblerPart data={ thisCategory }/>
          </Box>
        </>
      )}
    </Box>
  )
}

function AssemblerComponent({ plasmids, categories }) {

  const [requestedAssemblies, setRequestedAssemblies] = React.useState([])
  const [errorMessage, setErrorMessage] = React.useState('')
  const [loadingMessage, setLoadingMessage] = React.useState('')

  const clearAssemblySelection = React.useCallback(() => {
    setRequestedAssemblies([])
    setErrorMessage('')
  }, [])

  const { assembly, setCategory, setId, expandedAssemblies, assemblyComplete, canBeSubmitted, currentCategories } = useCombinatorialAssembly({ onValueChange: clearAssemblySelection, categories })
  const { requestSources, requestAssemblies } = useAssembler()

  const onSubmitAssembly = async () => {
    clearAssemblySelection()
    const selectedPlasmids = assembly.map(({ plasmidIds }) => plasmidIds.map((id) => (plasmids.find((item) => item.id === id))))

    let errorMessage = 'Error fetching sequences'
    try {
      setLoadingMessage('Requesting sequences...')
      const resp = await requestSources(selectedPlasmids)
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

  const options = React.useMemo(() => assemblyComplete ? assembly : [...assembly, { category: '', plasmidIds: [] }], [assembly, assemblyComplete])

  return (
    <Box className="assembler-container" sx={{ width: '80%', margin: 'auto', mb: 4 }}>
      <Alert severity="warning" sx={{ maxWidth: '400px', margin: 'auto', fontSize: '.9rem' }}>
                The Assembler is experimental. Use with caution.
      </Alert>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ overflowX: 'auto', my: 2 }}>
        {options.map((item, index) =>
          <AssemblerBox key={index} {...{item, index, setCategory, setId, categories, plasmids, assembly}} />
        )}
      </Stack>
      {canBeSubmitted && <>
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
        <AssemblerProductTable {...{requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories}} />
      }

    </Box >
  )
}

function displayNameFromCategory(category) {
  let name = ''
  if (category.name) {
    name = category.name
    if (category.info)
      name += ` (${category.info}) `
  }
  if (category.left_name && category.right_name) {
    name += `${category.left_name}_${category.right_name}`
  }
  if (name === '') {
    name = category.key
  }
  return name.trim()
}

function categoriesFromSyntaxAndPlasmids(syntax, plasmids) {
  const newCategories = syntax.parts.map((part) => ({
    ...part,
    left_name: syntax.overhangNames[part.left_overhang] || null,
    right_name: syntax.overhangNames[part.right_overhang] || null,
    key: `${part.left_overhang}-${part.right_overhang}`,
  }))
  let newCategoryKeys = newCategories.map((category) => category.key)
  plasmids.forEach((plasmid) => {
    if (!newCategoryKeys.includes(plasmid.key)) {
      const {left_overhang, right_overhang} = plasmid
      newCategories.push({
        left_overhang,
        right_overhang,
        left_name: syntax.overhangNames[left_overhang] || null,
        right_name: syntax.overhangNames[right_overhang] || null,
        key: `${left_overhang}-${right_overhang}`,
      })
      newCategoryKeys.push(`${left_overhang}-${right_overhang}`)
    }
  })
  newCategories.forEach((category, index) => {
    category.id = index + 1
    category.displayName = displayNameFromCategory(category)
  })
  return newCategories
}

function AddPlasmidsButton({ addPlasmids, syntax }) {
  const { uploadPlasmids, linkedPlasmids, setLinkedPlasmids } = usePlasmidsLogic(syntax)
  const fileInputRef = React.useRef(null)

  React.useEffect(() => {
    if (linkedPlasmids.length > 0) {
      const validPlasmids = linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length === 1)
      const invalidPlasmids = linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length !== 1)
      addPlasmids(validPlasmids.map(formatPlasmid))
      setLinkedPlasmids([])
    }
  }, [linkedPlasmids, addPlasmids, setLinkedPlasmids])

  const handleFileChange = (event) => {
    uploadPlasmids(Array.from(event.target.files))
    fileInputRef.current.value = ''
  }

  return (<>
    <Button variant="contained" color="primary" onClick={() => fileInputRef.current.click()}>
      Add Plasmids
    </Button>
    <input multiple type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".gbk,.gb,.fasta,.fa,.dna" />
  </>)
}

function Assembler() {
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' })
  const [syntax, setSyntax] = React.useState(moCloYTKSyntax);
  const [retry, setRetry] = React.useState(0)
  const [plasmids, setPlasmids] = React.useState([])
  const httpClient = useHttpClient()

  const graph = React.useMemo(() => {
    return partsToEdgesGraph(syntax.parts)
  }, [syntax])

  const categories = React.useMemo(() => {
    return categoriesFromSyntaxAndPlasmids(syntax, plasmids)
  }, [syntax, plasmids])

  const addPlasmids = React.useCallback((newPlasmids) => {
    setPlasmids((prevPlasmids) => {
      const maxId = Math.max(...prevPlasmids.map((plasmid) => plasmid.id), 0)
      return [...prevPlasmids, ...newPlasmids.map((plasmid, index) => ({ ...plasmid, id: maxId + index + 1 }))]
    })
  }, [])

  // React.useEffect(() => {
  //   addPlasmids(formattedMoCloPlasmids)
  // }, [addPlasmids])

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
      <AddPlasmidsButton addPlasmids={addPlasmids} syntax={syntax} />
      <AssemblerComponent plasmids={plasmids} syntax={syntax} categories={categories} />
    </RequestStatusWrapper>
  )
}

export default Assembler
