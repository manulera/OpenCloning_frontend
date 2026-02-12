import React from 'react'
import {
  Alert, Autocomplete, Box, Button, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ButtonGroup
} from '@mui/material'
import { Clear as ClearIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useAssembler } from './useAssembler';
import { useDispatch } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import AssemblerPart from './AssemblerPart';

import useCombinatorialAssembly from './useCombinatorialAssembly';
import ExistingSyntaxDialog from './ExistingSyntaxDialog';
import error2String from '@opencloning/utils/error2String';
import { categoryFilter } from './assembler_utils';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';
import useAlerts from '../../hooks/useAlerts';
import UploadPlasmidsButton from './UploadPlasmidsButton';
import { useConfig } from '../../providers';


const { setState: setCloningState, setCurrentTab: setCurrentTabAction } = cloningActions;


function formatItemName(item) {
  // Fallback in case the item is not found (while updating list)
  return item ? `${item.plasmid_name}` : '-'
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
      <Table size="small" data-testid="assembler-product-table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            {currentCategories.map(category => (
              <TableCell key={category} sx={{ fontWeight: 'bold' }}>
                {categories.find((c) => c.id === category)?.displayName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {expandedAssemblies.map((parts, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell padding="checkbox">
                <IconButton data-testid="assembler-product-table-view-button" onClick={() => handleViewAssembly(rowIndex)} size="small">
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
      <FormControl data-testid="category-select" fullWidth sx={{ mb: 2 }}>
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
          <FormControl data-testid="plasmid-select" fullWidth>
            <Autocomplete
              multiple
              value={item.plasmidIds}
              onChange={(e, value) => setId(value, index)}
              options={allowedPlasmids.map((item) => item.id)}
              getOptionLabel={(id) => formatItemName(plasmids.find((d) => d.id === id))}
              renderInput={(params) => <TextField {...params} label="Plasmids" />}
              renderOption={(props, option) => {
                const { key, ...restProps } = props
                const plasmid = plasmids.find((d) => d.id === option)
                return (
                  <MenuItem key={key} {...restProps} sx={{ backgroundColor: plasmid.type === 'loadedFile' ? 'success.light' : undefined }}>
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

export function AssemblerComponent({ plasmids, categories, assemblyEnzyme }) {

  const [requestedAssemblies, setRequestedAssemblies] = React.useState([])
  const [errorMessage, setErrorMessage] = React.useState('')
  const [loadingMessage, setLoadingMessage] = React.useState('')

  const clearAssemblySelection = React.useCallback(() => {
    setRequestedAssemblies([])
    setErrorMessage('')
  }, [])

  const { assembly, setCategory, setId, expandedAssemblies, assemblyComplete, canBeSubmitted, currentCategories } = useCombinatorialAssembly({ onValueChange: clearAssemblySelection, categories, plasmids })
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
      const assemblies = await requestAssemblies(resp, assemblyEnzyme)
      setRequestedAssemblies(assemblies)
    } catch (e) {
      if (e.assembly) {
        errorMessage = (<><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error2String(e)}</div><div>Error assembling {e.assembly.map((p) => formatItemName(p.plasmid)).join(', ')}</div></>)
      } else if (e.plasmid) {
        errorMessage = (<><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error2String(e)}</div><div>Error fetching sequence for {formatItemName(e.plasmid)}</div></>)
      }
      setErrorMessage(errorMessage)
    } finally {
      setLoadingMessage(false)
    }
  }

  const options = React.useMemo(() => assemblyComplete ? assembly : [...assembly, { category: '', plasmidIds: [] }], [assembly, assemblyComplete])

  return (
    <Box className="assembler-container" sx={{ width: '80%', margin: 'auto', mb: 4 }}>

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
          data-testid="assembler-submit-button"
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
  if (!syntax) {
    return []
  }
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

function LoadSyntaxButton({ setSyntax, addPlasmids }) {
  const [existingSyntaxDialogOpen, setExistingSyntaxDialogOpen] = React.useState(false)
  const httpClient = useHttpClient();
  const { staticContentPath } = useConfig();
  const backendRoute = useBackendRoute();
  const { addAlert } = useAlerts();
  const onSyntaxSelect = React.useCallback(async (syntax, plasmids) => {
    const url = backendRoute('validate_syntax');
    try {
      await httpClient.post(url, syntax);
      setSyntax(syntax)
      addPlasmids(plasmids)
    } catch (error) {
      addAlert({
        message: error2String(error),
        severity: 'error',
      });
    }
  }, [setSyntax, addPlasmids, httpClient, backendRoute, addAlert])
  return <>
    <Button color="success" onClick={() => setExistingSyntaxDialogOpen(true)}>Load Syntax</Button>
    {existingSyntaxDialogOpen && <ExistingSyntaxDialog staticContentPath={staticContentPath} onClose={() => setExistingSyntaxDialogOpen(false)} onSyntaxSelect={onSyntaxSelect}/>}
  </>
}



function Assembler() {
  const [syntax, setSyntax] = React.useState(null);
  const [plasmids, setPlasmids] = React.useState([])

  const categories = React.useMemo(() => {
    return categoriesFromSyntaxAndPlasmids(syntax, plasmids)
  }, [syntax, plasmids])

  const addPlasmids = React.useCallback((newPlasmids) => {
    setPlasmids((prevPlasmids) => {
      const maxId = Math.max(...prevPlasmids.map((plasmid) => plasmid.id), 0)
      return [...prevPlasmids, ...newPlasmids.map((plasmid, index) => ({ ...plasmid, id: maxId + index + 1 }))]
    })
  }, [])

  const clearPlasmids = React.useCallback(() => {
    setPlasmids(prev => prev.filter((plasmid) => plasmid.type !== 'loadedFile'))
  }, [])

  return (
    <>
      <Alert severity="warning" sx={{ maxWidth: '400px', margin: 'auto', fontSize: '.9rem', mb: 2 }}>
        The Assembler is experimental. Use with caution.
      </Alert>
      <ButtonGroup>
        <LoadSyntaxButton setSyntax={setSyntax} addPlasmids={addPlasmids} />
        {syntax && <UploadPlasmidsButton addPlasmids={addPlasmids} syntax={syntax} />}
        {syntax && <Button color="error" onClick={clearPlasmids}>Remove uploaded plasmids</Button>}
      </ButtonGroup>
      {syntax && <AssemblerComponent plasmids={plasmids} syntax={syntax} categories={categories} assemblyEnzyme={syntax.assemblyEnzyme} />}
    </>
  )
}

export default Assembler
