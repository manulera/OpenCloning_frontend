import React from 'react';
import { FormControl, TextField, Box } from '@mui/material';
import { stringIsNotDNA } from '@opencloning/store/cloning_utils';
import CollapsableLabel from './CollapsableLabel';
import { usePrimerDesign } from './PrimerDesignContext';

function PrimerSpacerForm({ open = true }) {
  const { spacers, setSpacers, circularAssembly, templateSequenceNames, templateSequenceIds } = usePrimerDesign();
  const [localSpacers, setLocalSpacers] = React.useState(spacers);
  const timeoutRef = React.useRef();

  // Debounced upstream updates to avoid heavy re-rendering
  const handleSpacerChange = (index, value) => {
    setLocalSpacers((current) => current.map((spacer, i) => (i === index ? value : spacer)));

    // Clear any existing timeout
    clearTimeout(timeoutRef.current);

    // Set new timeout and store its ID in the ref
    timeoutRef.current = setTimeout(() => {
      setSpacers((current) => current.map((spacer, i) => (i === index ? value : spacer)));
    }, 500);
  };

  React.useEffect(() => {
    if (!localSpacers.every((spacer, index) => spacer === spacers[index])) {
      setLocalSpacers(spacers);
    }
  }, [spacers]);

  const fragmentCount = templateSequenceIds.length;

  const sequenceNamesWrapped = [...templateSequenceNames, templateSequenceNames[0]];
  const templateSequenceIdsWrapped = [...templateSequenceIds, templateSequenceIds[0]];

  const getSequenceName = (seqIndex) => {
    const name = sequenceNamesWrapped[seqIndex];
    const id = templateSequenceIdsWrapped[seqIndex];
    return name && name !== 'name' ? `Seq. ${id} (${name})` : `Seq. ${id}`;
  };

  const getSpacerLabel = (index) => {
    if (index === 0 && !circularAssembly) {
      return `Before ${getSequenceName(index)}`;
    } if (index === fragmentCount && !circularAssembly) {
      return `After ${getSequenceName(fragmentCount - 1)}`;
    }
    if (circularAssembly) {
      return `Between ${getSequenceName(index)} and ${getSequenceName(index + 1)}`;
    }
    return `Between ${getSequenceName(index - 1)} and ${getSequenceName(index)}`;
  };

  return (
    <CollapsableLabel label="Spacer sequences" className="primer-spacer-form" open={open}>
      <Box sx={{ pt: 1, width: '80%', margin: 'auto' }}>
        <Box>
          {localSpacers.map((spacer, index) => {
            const error = stringIsNotDNA(spacer) ? 'Invalid DNA sequence' : '';
            return (
              <FormControl key={index} fullWidth sx={{ mb: 2 }}>
                <TextField
                  label={getSpacerLabel(index)}
                  value={spacer}
                  onChange={(e) => handleSpacerChange(index, e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{
                    id: 'sequence',
                  }}
                    // Error if not DNA
                  error={error !== ''}
                  helperText={error}
                />
              </FormControl>
            );
          })}
        </Box>
      </Box>
    </CollapsableLabel>
  );
}

export default PrimerSpacerForm;
