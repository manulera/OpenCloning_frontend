import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash-es';
import { Box, Button } from '@mui/material';
import { getPcrTemplateSequenceId, getPrimerDesignObject } from '../../../../store/cloning_utils';
// Component selection handled via selector utility
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { cloningActions } from '../../../../store/cloning';
import { selectPrimerDesignComponent } from './designSelector';

function PrimerDesigner() {
  const { updateStoreEditor } = useStoreEditor();
  const dispatch = useDispatch();
  const { setMainSequenceId } = cloningActions;

  const { finalSource, otherInputIds, pcrSources, outputSequences } = useSelector(
    (state) => getPrimerDesignObject(state.cloning),
    isEqual,
  );

  const mainSequenceId = useSelector((state) => state.cloning.mainSequenceId);

  const templateSequenceIds = pcrSources.map((pcrSource) => getPcrTemplateSequenceId(pcrSource));
  const openPrimerDesigner = () => {
    updateStoreEditor('mainEditor', templateSequenceIds[0]);
    dispatch(setMainSequenceId(templateSequenceIds[0]));
  };

  // Nothing to design
  if (templateSequenceIds.length === 0) {
    return null;
  }

  // The network supports design of primers, but the current main sequence is not part of it
  const showPrimerDesigner = [...templateSequenceIds, ...otherInputIds].includes(mainSequenceId);

  const component = selectPrimerDesignComponent({ finalSource, otherInputIds, pcrSources, outputSequences });
  return (
    <>
      {!showPrimerDesigner && (
      <div>
        <Button sx={{ mb: 4 }} variant="contained" color="success" onClick={openPrimerDesigner}>Open primer designer</Button>
      </div>
      )}
      <Box className="primer-design" sx={{ display: showPrimerDesigner ? 'block' : 'none', width: '60%', minWidth: '600px', margin: 'auto', border: 1, borderRadius: 2, overflow: 'hidden', borderColor: 'primary.main', marginBottom: 5 }}>
        <Box sx={{ margin: 'auto', display: 'flex', height: 'auto', borderBottom: 2, borderColor: 'primary.main', backgroundColor: 'primary.main' }}>
          <Box component="h2" sx={{ margin: 'auto', py: 1, color: 'white' }}>Primer designer</Box>
        </Box>
        {component}
      </Box>
    </>
  );
}

export default React.memo(PrimerDesigner);
