import { Box, Button, Checkbox, FormControl, FormControlLabel, Tooltip, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash-es';
import MultipleInputsSelector from '../../../sources/MultipleInputsSelector';
import { cloningActions } from '@opencloning/store/cloning';
import { getPcrTemplateSequenceId } from '@opencloning/store/cloning_utils';
import useNavigateAfterPrimerDesign from './useNavigateAfterPrimerDesign';
import { getSequenceLabel } from '../SequenceTabComponents/utils/getSequenceLabel';

const { addPCRsAndSubsequentSourcesForAssembly } = cloningActions;

function AmplifySectionTitle() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5, alignSelf: 'stretch' }}>
      <Typography variant="caption" sx={{ fontSize: '1rem', color: 'text.secondary' }}>
        Amplify
      </Typography>
      <Tooltip
        arrow
        placement="top"
        title="Checked sequences will be amplified by PCR with designed primers. Unchecked sequences are used directly in the assembly without amplification."
      >
        <InfoIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
      </Tooltip>
    </Box>
  );
}

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
  const dispatch = useDispatch();
  const navigateAfterDesign = useNavigateAfterPrimerDesign();

  const sequenceNames = useSelector(
    ({ cloning }) => targets.map((id) => ({ id, name: cloning.teselaJsonCache[id]?.name || 'template' })),
    isEqual,
  );

  const onInputChange = (newInputSequenceIds) => {
    const newValue = newInputSequenceIds.includes(inputSequenceId) ? newInputSequenceIds : [...newInputSequenceIds, inputSequenceId];
    setTargets(newValue);
    setAmplified(Array(newValue.length).fill(true));
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

  const onSubmit = (event) => {
    event.preventDefault();
    const newSequence = {
      type: 'TemplateSequence',
      primer_design: 'gibson_assembly',
      circular: false,
    };

    const firstAmplifiedId = targets.find((_, i) => amplified[i]) ?? inputSequenceId;
    navigateAfterDesign(
      () => dispatch(addPCRsAndSubsequentSourcesForAssembly({
        sourceId: source.id,
        newSequence,
        templateIds: targets,
        sourceType: assemblyType,
        amplified,
      })),
      firstAmplifiedId,
    );
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
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <AmplifySectionTitle />
          {targets.map((id, index) => {
            const name = sequenceNames.find((s) => s.id === id)?.name || 'template';
            const label = getSequenceLabel(id, name);
            return (
              <FormControl key={id} sx={{ alignItems: 'flex-start', mb: 0.5 }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={amplified[index]}
                      onChange={() => handleAmplifiedToggle(index)}
                      disabled={amplified[index] && !canToggleOff(index)}
                      size="small"
                    />
                  )}
                  label={(
                    <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                      {label}
                    </Typography>
                  )}
                  sx={{ mr: 0 }}
                />
              </FormControl>
            );
          })}
        </Box>
      )}

      <Button type="submit" variant="contained" color="success">
        Design primers
      </Button>

    </form>
  );
}

export default PrimerDesignGibsonAssembly;
