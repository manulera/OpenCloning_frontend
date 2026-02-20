import { Button, Checkbox, FormControl, FormControlLabel, List, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash-es';
import MultipleInputsSelector from '../../../sources/MultipleInputsSelector';
import { cloningActions } from '@opencloning/store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { getPcrTemplateSequenceId } from '@opencloning/store/cloning_utils';

function isValidAmplifiedConfig(config) {
  for (let i = 0; i < config.length - 1; i++) {
    if (!config[i] && !config[i + 1]) return false;
  }
  if (config.length > 1 && !config[0] && !config[config.length - 1]) return false;
  return true;
}

function PrimerDesignGibsonAssembly({ source, assemblyType }) {
  const [targets, setTargets] = React.useState(source.input.map(({ sequence }) => sequence));
  const [amplified, setAmplified] = React.useState(() => source.input.map(() => true));
  const inputSequenceId = getPcrTemplateSequenceId(source);

  const sequenceNames = useSelector(
    ({ cloning }) => targets.map((id) => ({ id, name: cloning.teselaJsonCache[id]?.name || 'template' })),
    isEqual,
  );

  const onInputChange = (newInputSequenceIds) => {
    if (!newInputSequenceIds.includes(inputSequenceId)) {
      setTargets((prev) => [...prev, ...newInputSequenceIds]);
      setAmplified((prev) => [...prev, ...newInputSequenceIds.map(() => true)]);
    } else {
      setTargets(newInputSequenceIds);
      setAmplified((prev) => {
        const newAmplified = newInputSequenceIds.map((id) => {
          const oldIndex = targets.indexOf(id);
          return oldIndex !== -1 ? prev[oldIndex] : true;
        });
        return newAmplified;
      });
    }
  };

  const handleAmplifiedToggle = (index) => {
    setAmplified((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const canToggleOff = (index) => {
    if (!amplified[index]) return true;
    const next = [...amplified];
    next[index] = false;
    return isValidAmplifiedConfig(next);
  };

  const { updateStoreEditor } = useStoreEditor();
  const { addPCRsAndSubsequentSourcesForAssembly, setCurrentTab, setMainSequenceId } = cloningActions;
  const dispatch = useDispatch();
  const onSubmit = (event) => {
    event.preventDefault();
    const newSequence = {
      type: 'TemplateSequence',
      primer_design: 'gibson_assembly',
      circular: false,
    };

    batch(() => {
      dispatch(addPCRsAndSubsequentSourcesForAssembly({
        sourceId: source.id,
        newSequence,
        templateIds: targets,
        sourceType: assemblyType,
        amplified,
      }));
      const firstAmplifiedId = targets.find((_, i) => amplified[i]) ?? inputSequenceId;
      dispatch(setMainSequenceId(firstAmplifiedId));
      updateStoreEditor('mainEditor', firstAmplifiedId);
      dispatch(setCurrentTab(3));
      setTimeout(() => {
        document.querySelector('.tab-panels-container')?.scrollTo({ top: 0, behavior: 'instant' });
      }, 300);
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <FormControl fullWidth>
        <MultipleInputsSelector
          inputSequenceIds={targets}
          label="Input sequences (in order)"
          onChange={onInputChange}
        />
      </FormControl>

      {targets.length > 1 && (
        <List dense sx={{ mt: 1 }}>
          {targets.map((id, index) => {
            const name = sequenceNames.find((s) => s.id === id)?.name || 'template';
            const label = name !== 'name' ? `${id} - ${name}` : `${id}`;
            return (
              <ListItem key={id} disablePadding sx={{ pl: 1 }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={amplified[index]}
                      onChange={() => handleAmplifiedToggle(index)}
                      disabled={amplified[index] && !canToggleOff(index)}
                      size="small"
                    />
                  )}
                  label={<ListItemText primary={`Amplify ${label}`} />}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Button type="submit" variant="contained" color="success">
        Design primers
      </Button>

    </form>
  );
}

export default PrimerDesignGibsonAssembly;
