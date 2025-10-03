import React from 'react'
import data from './assembler_data.json'
import data2 from './assembler_data2.json'
import { Autocomplete, Box, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';

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

function Assembler() {
    const [assembly, setAssembly] = React.useState([{ category: '', id: [] }])

    const setCategory = (category, index) => {
        if (category === '') {
            const newAssembly = assembly.slice(0, index)
            newAssembly[index] = { category: '', id: [] }
            setAssembly(newAssembly)
            return
        }
        setAssembly(assembly.map((item, i) => i === index ? { category, id: [] } : item))
    }
    const setId = (idArray, index) => {
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

    React.useEffect(() => {
        const lastPosition = assembly.length - 1
        if (assembly[lastPosition].category.endsWith('F')) {
            return
        }
        if (assembly[lastPosition].category !== '') {
            const newAssembly = [...assembly, { category: '', id: [] }]
            setAssembly(newAssembly)
        }
    }, [assembly])

    return (
        <div style={{ marginLeft: '200px' }}>
            <h1>Assembler</h1>

            <Stack direction="row">
                {assembly.map((item, index) => {
                    const allowedCategories = item.category ? [item.category] : categories.filter((category) => categoryFilter(category, index === 0 ? '' : assembly[index - 1].category))

                    return (
                        <Box key={index} sx={{ width: '200px' }} >
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    endAdornment={item.category && (<InputAdornment position="end"><IconButton onClick={() => setCategory('', index)}><ClearIcon /></IconButton></InputAdornment>)}
                                    value={item.category}
                                    onChange={(e) => setCategory(e.target.value, index)}
                                    label="Category"
                                    disabled={index < assembly.length - 1}
                                >
                                    {allowedCategories.map((category) => (
                                        <MenuItem value={category}>{category}</MenuItem>
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
                        </Box>)
                })}
            </Stack>
        </div >
    )
}

export default Assembler
