import React from 'react'
import { Box, SpeedDial, SpeedDialAction } from '@mui/material'
import { Add as AddIcon, Build as BuildIcon, Search as SearchIcon, PushPin as PushPinIcon, Sync as SyncIcon } from '@mui/icons-material'
import useDatabase from '../hooks/useDatabase';
import { batch, useDispatch, useStore } from 'react-redux';
import { getSequenceIdsThatAreInput, getSequenceIdsThatAreNotInput, getSequencesNotInDatabase } from '@opencloning/utils/network';
import { cloningActions } from '@opencloning/store/cloning';
import useAlerts from '../hooks/useAlerts';
import { cloneDeep } from 'lodash-es';
import useBackendRoute from '../hooks/useBackendRoute';
import useHttpClient from '../hooks/useHttpClient';

const { setState: setCloningState } = cloningActions;


function useLocateSequencesInDatabaseAction() {
  const database = useDatabase();
  const store = useStore();
  const dispatch = useDispatch();
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const url = backendRoute('normalize_cloning_strategy');

  const { addAlert } = useAlerts();
  const main = React.useCallback(async () => {
    const { sequences: seqState, sources: srcState, primers, description } = store.getState().cloning;
    let sequences = cloneDeep(seqState);
    let sources = cloneDeep(srcState);

    const sequencesNotInDb = getSequencesNotInDatabase(sources, sequences);
    if (sequencesNotInDb.length === 0) {
      addAlert({
        message: 'All sequences are already in the database',
        severity: 'success',
      });
      return;
    }
    const promises = sequencesNotInDb.map((sequence) => database.locateSequenceInDatabase(sequence));
    const results = await Promise.all(promises);
    if (!results.some((result) => result.length > 0)) {
      addAlert({
        message: 'No sequences located in database',
        severity: 'success',
      });
      return;
    }

    for (let i = 0; i < results.length; i++) {
      if (results[i].length === 0) {
        continue;
      }

      const newSequence = { ...results[i][0].sequence, id: sequences[i].id };
      const newSource = { type: 'DatabaseSource', database_id: results[i][0].sequence_ref.id, input: [], id: sequences[i].id };
      sources = sources.map((s) => s.id === sequences[i].id ? newSource : s);
      sequences = sequences.map((s) => s.id === sequences[i].id ? newSequence : s);
      addAlert({
        message: `Sequence ${sequences[i].id} located in database`,
        severity: 'success',
      });
    }
    const { data: newCloningStrategy } = await httpClient.post(url, { sequences, sources, primers, description });
    dispatch(setCloningState(newCloningStrategy));

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
  }, [database, store, dispatch, addAlert]);
  return main;
}
function CloningSpeedDial() {
  const database = useDatabase();
  const locateSequencesInDatabaseAction = useLocateSequencesInDatabaseAction();
  return (
    // <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
    <Box sx={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000 }}>
      <SpeedDial icon={<BuildIcon />} ariaLabel="Cloning tools" direction="up" >
        { Boolean(database.locateSequenceInDatabase) && <SpeedDialAction icon={<SyncIcon />} tooltipTitle="Synchronize sequences with database" onClick={locateSequencesInDatabaseAction} /> }
      </SpeedDial>

    </Box>
  // </Box>
  )
}

export default CloningSpeedDial
