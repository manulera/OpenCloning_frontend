import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Chip, InputLabel, MenuItem, Select } from '@mui/material';
import { isEqual } from 'lodash-es';
import { getIdsOfEntitiesWithoutChildSource } from '../../store/cloning_utils';

function MultipleInputsSelector({ inputEntityIds, onChange, label }) {
  const entityNotChildSourceIds = useSelector(({ cloning }) => getIdsOfEntitiesWithoutChildSource(cloning.sources, cloning.entities), isEqual);

  // The possible options should include the already selected ones + the one without children
  // we eliminate duplicates (can happen if the change of input does not update the source)
  const options = [...new Set(inputEntityIds.concat(entityNotChildSourceIds))];
  const sequenceNames = useSelector(({ cloning }) => options.map((id) => ({ id, name: cloning.teselaJsonCache[id].name })), isEqual);

  const onInputChange = (event) => {
    const selectedIds = event.target.value;
    if (selectedIds.includes('all')) {
      onChange(options);
    } else {
      onChange(selectedIds);
    }
  };

  return (
    <>
      <InputLabel id="demo-multiple-chip-label">{label}</InputLabel>
      <Select
        labelId="demo-multiple-chip-label"
        id="demo-multiple-chip"
        multiple
        value={inputEntityIds}
        onChange={onInputChange}
        label={label}
        // input={<OutlinedInput id="select-multiple-chip" label="Select input sequences" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={`${value} - ${sequenceNames.find(({ id }) => id === value).name}`} />
            ))}
          </Box>
        )}
      >
        <MenuItem
          key="all"
          value="all"
        >
          <em>Select all</em>
        </MenuItem>
        {options.map((id, index) => (
          <MenuItem
            key={id}
            value={id}
          >
            {`${id} - ${sequenceNames[index].name}`}
          </MenuItem>
        ))}

      </Select>
    </>
  );
}

export default MultipleInputsSelector;
