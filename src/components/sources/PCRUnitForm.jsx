import { Accordion, AccordionDetails, AccordionSummary, FormControl, InputLabel, ListItemText, MenuItem, Select, Tooltip } from '@mui/material';
import React from 'react';
import { useDispatch } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import { cloningActions } from '../../store/cloning';
import SingleInputSelector from './SingleInputSelector';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function PCRUnitWrapper({ index, children, onDelete }) {
  if (index === null) {
    return (
      <div className="pcr-unit">
        {children}
      </div>
    );
  }

  return (
    <Accordion className="pcr-unit" defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${index}-content`}
        id={`${index}-header`}
        sx={{ backgroundColor: 'lightgray' }}
      >
        {(index !== 0) && (
        <Tooltip onClick={onDelete} title="Delete primer pair" arrow placement="left">
          <CancelIcon color="gray" />
        </Tooltip>
        )}
        <ListItemText sx={{ my: 0 }}>
          Primer pair
          {' '}
          {index + 1}
        </ListItemText>
      </AccordionSummary>
      <AccordionDetails sx={{ py: 0, my: 1 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

function PCRUnitForm({ primers, forwardPrimerId, reversePrimerId, onChangeForward, onChangeReverse, sourceId, sourceInput = [], index = null, deletePrimerPair = null }) {
  const { setCurrentTab, updateSource } = cloningActions;
  const dispatch = useDispatch();
  const goToPrimerTab = () => {
    dispatch(setCurrentTab(1));
  };

  const updateInput = (value) => {
    if (index !== null) {
      const newInput = [...sourceInput];
      newInput[index] = value;
      dispatch(updateSource({ id: sourceId, input: newInput }));
    }
  };

  const onDelete = () => {
    if (index !== null) {
      const newInput = [...sourceInput];
      newInput.splice(index, 1);
      deletePrimerPair();
      dispatch(updateSource({ id: sourceId, input: newInput }));
    }
  };

  return (
    <PCRUnitWrapper index={index} key={index && `pcr-unit-${index}`} onDelete={onDelete}>
      {(index !== null) ? (
        <FormControl fullWidth>
          <SingleInputSelector
            label="Target sequence"
            selectedId={sourceInput[index] || ''}
            onChange={(e) => updateInput(e.target.value)}
            inputSequenceIds={sourceInput}
            disabled={index === 0}
          />
        </FormControl>
      ) : null}

      <FormControl fullWidth>
        <InputLabel id="select-forward-primer-label">Forward primer</InputLabel>
        <Select
          labelId="select-forward-primer-label"
          id="select-forward-primer"
          value={forwardPrimerId}
          onChange={onChangeForward}
          label="Forward primer"
          MenuProps={MenuProps}
        >
          <MenuItem onClick={goToPrimerTab} value="">
            <AddCircleIcon color="success" />
            <em style={{ marginLeft: 8 }}>Create primer</em>
          </MenuItem>
          {primers.map(({ name, id }) => (<MenuItem key={id} value={id}>{name}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="select-reverse-primer-label">Reverse primer</InputLabel>
        <Select
          labelId="select-reverse-primer-label"
          id="select-reverse-primer"
          value={reversePrimerId}
          onChange={onChangeReverse}
          label="Reverse primer"
          MenuProps={MenuProps}
        >
          <MenuItem onClick={goToPrimerTab} value="">
            <AddCircleIcon color="success" />
            <em style={{ marginLeft: 8 }}>Create primer</em>
          </MenuItem>
          {primers.map(({ name, id }) => (<MenuItem key={id} value={id}>{name}</MenuItem>))}
        </Select>
      </FormControl>
    </PCRUnitWrapper>
  );
}

export default PCRUnitForm;
