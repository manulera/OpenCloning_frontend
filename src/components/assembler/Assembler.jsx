import React from 'react'
import data from './assembler_data.json'
import data2 from './assembler_data2.json'
import { Alert, Autocomplete, Box, Button, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';
import { useAssembler } from './useAssembler';
import { arrayCombinations } from '../eLabFTW/utils';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useDispatch } from 'react-redux';
import { cloningActions } from '../../store/cloning';


const { setState: setCloningState, setCurrentTab: setCurrentTabAction } = cloningActions;

let formattedData = data.map((item) => ({
    ...item,
    category: data2.find((item2) => item2.overhang === item.left_overhang).name + '_' + data2.find((item2) => item2.overhang === item.right_overhang).name
}))

const categories = [...new Set(formattedData.map((item) => item.category))].sort()

const categoryFilter = (category, previousCategory) => {
    if (previousCategory === '') {
        return category.startsWith('A_')
    }
    return previousCategory.split('_')[1] === category.split('_')[0]
}

function AssemblerLink({ overhang }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '80px' }}>
            <Box sx={{ flex: 1, height: '2px', bgcolor: 'primary.main' }} />
            <Box sx={{ mx: 1, px: 1, py: 0.5, bgcolor: 'background.paper', border: 1, borderColor: 'primary.main', borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                {overhang}
            </Box>
            <Box sx={{ flex: 1, height: '2px', bgcolor: 'primary.main' }} />
        </Box>
    )
}

function Assembler() {
    const [assembly, setAssembly] = React.useState([{ category: '', id: [] }])
    const { requestSources, requestAssemblies } = useAssembler()
    const [requestedAssemblies, setRequestedAssemblies] = React.useState([])
    const [loadingMessage, setLoadingMessage] = React.useState('')
    const [errorMessage, setErrorMessage] = React.useState('')
    const dispatch = useDispatch()
    const onSubmitAssembly = async () => {
        clearAssembly()
        const sources = assembly.map(({ id }) => id.map((id) => (formattedData.find((item) => item.id === id).source)))
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
            const newAssembly = assembly.slice(0, index)
            newAssembly[index] = { category: '', id: [] }
            setAssembly(newAssembly)
            return
        }
        setAssembly(assembly.map((item, i) => i === index ? { category, id: [] } : item))
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
        const firstOption = formattedData.find((item) => item.id === idArray[0])
        const category = currentItem.category || firstOption?.category || ''

        setAssembly(assembly.map((item, i) => i === index ? { id: idArray, category } : item))
    }

    const handleViewAssembly = (index) => {
        const newState = requestedAssemblies[index]
        dispatch(setCloningState(newState))
        dispatch(setCurrentTabAction(0))
    }

    React.useEffect(() => {
        const lastPosition = assembly.length - 1
        if (assembly[lastPosition].category.endsWith('A')) {
            return
        }
        if (assembly[lastPosition].category !== '') {
            const newAssembly = [...assembly, { category: '', id: [] }]
            setAssembly(newAssembly)
        }
    }, [assembly])

    const expandedAssemblies = arrayCombinations(assembly.map(({ id }) => id))
    const assemblyComplete = assembly.every((item) => item.category !== '' && item.id.length > 0)
    const currentCategories = assembly.map((item) => item.category)

    return (
        <Box className="assembler-container" sx={{ width: '80%', margin: 'auto', mb: 4 }}>
            <Alert severity="warning" sx={{ maxWidth: '400px', margin: 'auto', fontSize: '.9rem' }}>
                The Assembler is experimental. Use with caution.
            </Alert>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ overflowX: 'auto', my: 2 }}>
                {assembly.map((item, index) => {
                    const allowedCategories = item.category ? [item.category] : categories.filter((category) => categoryFilter(category, index === 0 ? '' : assembly[index - 1].category))
                    const isCompleted = item.category !== '' && item.id.length > 0
                    const borderColor = isCompleted ? 'success.main' : 'primary.main'

                    return (
                        <React.Fragment key={index}>
                            {/* Link before first box */}
                            {index === 0 && item.category !== '' && (
                                <AssemblerLink overhang={formattedData.find((d) => d.category === item.category).left_overhang} />
                            )}

                            <Box sx={{ width: '250px', border: 3, borderColor, borderRadius: 4, p: 2 }}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        endAdornment={item.category && (<InputAdornment position="end"><IconButton onClick={() => setCategory('', index)}><ClearIcon /></IconButton></InputAdornment>)}
                                        value={item.category}
                                        onChange={(e) => setCategory(e.target.value, index)}
                                        label="Category"
                                        disabled={index < assembly.length - 1}
                                    >
                                        {allowedCategories.map((category) => (
                                            <MenuItem value={category}>{category === 'F_A' ? 'Backbone' : category}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        multiple
                                        value={item.id}
                                        onChange={(e, value) => setId(value, index)}
                                        label="ID"
                                        options={formattedData.filter((d) => allowedCategories.includes(d.category)).map((item) => item.id)}
                                        renderInput={(params) => <TextField {...params} label="ID" />}
                                    />
                                </FormControl>
                            </Box>

                            {/* Link between boxes */}
                            {index < assembly.length - 1 && item.category !== '' && (
                                <AssemblerLink overhang={formattedData.find((d) => d.category === item.category).right_overhang} />
                            )}

                            {/* Link after last box */}
                            {index === assembly.length - 1 && item.category !== '' && (
                                <AssemblerLink overhang={formattedData.find((d) => d.category === item.category).right_overhang} />
                            )}
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
                                            {part}
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

export default Assembler
