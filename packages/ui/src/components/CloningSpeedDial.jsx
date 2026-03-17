import React from 'react'
import { Box, SpeedDial, SpeedDialAction } from '@mui/material'
import { Add as AddIcon, Build as BuildIcon, Search as SearchIcon, PushPin as PushPinIcon } from '@mui/icons-material'
import useDatabase from '../hooks/useDatabase';
import { batch, useDispatch, useStore } from 'react-redux';
import { getSequenceIdsThatAreInput, getSequenceIdsThatAreNotInput } from '@opencloning/utils/network';
import { cloningActions } from '@opencloning/store/cloning';

const { deleteSourceAndItsChildren, addSourceAndItsOutputSequence } = cloningActions;


function useLocateSequencesInDatabaseAction() {
  const database = useDatabase();
  const store = useStore();
  const dispatch = useDispatch();

  const main = React.useCallback(async () => {
    const { sequences, sources } = store.getState().cloning;

    const promises = sequences.map((sequence) => database.locateSequenceInDatabase(sequence));
    const results = await Promise.all(promises);
    const resultsMap = new Map();
    for (let i = 0; i < results.length; i++) {
      resultsMap.set(sequences[i].id, results[i]);
    }
    const handledSequenceIds = new Set();
    const allSequenceIds = new Set(sequences.map((sequence) => sequence.id));

    const sequenceIdsThatAreNotInput = getSequenceIdsThatAreNotInput(sequences, sources);
    console.log(sequenceIdsThatAreNotInput);
    let iter = 0;
    // while (handledSequenceIds.size < sequences.length || iter < sequences.length) {
    //   iter++;
    //   const sequenceIdsThatAreInput = new Set(getSequenceIdsThatAreInput(sources));

    //   if (!sequenceIdsThatAreInput.includes(sequence.id)) {
    //     const newSource = {
    //       input: [],
    //       type: 'DatabaseSource',
    //       database_id: result[0].sequence_ref.id,
    //     };
    //     const newSequence = result[0].sequence
    //     batch(() => {
    //       dispatch(deleteSourceAndItsChildren(sequence.id));
    //       dispatch(addSourceAndItsOutputSequence({ source: newSource, sequence: newSequence }));
    //     });
    //   }
    //   console.log(result);
    // }
  }, [database, store, dispatch]);
  return main;
}
function CloningSpeedDial() {
  const database = useDatabase();
  const locateSequencesInDatabaseAction = useLocateSequencesInDatabaseAction();
  return (
    // <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
    <Box sx={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000 }}>
      <SpeedDial icon={<BuildIcon />} ariaLabel="Cloning tools" direction="up" >
        { Boolean(database.locateSequenceInDatabase) && <SpeedDialAction icon={<PushPinIcon />} tooltipTitle="Locate sequences in database" onClick={locateSequencesInDatabaseAction} /> }
      </SpeedDial>

    </Box>
  // </Box>
  )
}

export default CloningSpeedDial
