import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

import { batch, useDispatch } from 'react-redux';
import PrimerDesignHomologousRecombination from './PrimerDesignHomologousRecombination';
import PrimerDesignGibsonAssembly from './PrimerDesignGibsonAssembly';
import { cloningActions } from '../../../../store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';

function PrimerDesignSourceForm({ source }) {
  const [primerDesignType, setPrimerDesignType] = React.useState('');
  const { updateStoreEditor } = useStoreEditor();

  const { addPCRsAndSubsequentSourcesForAssembly, setMainSequenceId, setCurrentTab } = cloningActions;
  const dispatch = useDispatch();
  React.useEffect(() => {
    // Here the user does not have to select anything else
    if (primerDesignType === 'restriction_ligation' || primerDesignType === 'simple_pair') {
      const newEntity = {
        type: 'TemplateSequence',
        primer_design: primerDesignType,
        circular: false,
      };

      batch(() => {
        dispatch(addPCRsAndSubsequentSourcesForAssembly({ sourceId: source.id, newEntity, templateIds: [], sourceType: null }));
        dispatch(setMainSequenceId(source.input[0]));
        updateStoreEditor('mainEditor', source.input[0]);
        dispatch(setCurrentTab(3));
        // Scroll to the top of the page
        document.getElementById('shareyourcloning-app-tabs')?.scrollIntoView();
      });
    }
  }, [primerDesignType]);

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="select-primer-design-type-label">Purpose of primers</InputLabel>
        <Select
          id="select-primer-design-type"
          value={primerDesignType}
          onChange={(event) => setPrimerDesignType(event.target.value)}
          label="Purpose of primers"
        >
          <MenuItem value="simple_pair">Normal PCR</MenuItem>
          <MenuItem value="homologous_recombination">Homologous Recombination</MenuItem>
          <MenuItem value="crispr">CRISPR</MenuItem>
          <MenuItem value="gibson_assembly">Gibson Assembly</MenuItem>
          <MenuItem value="restriction_ligation">Restriction and Ligation</MenuItem>
        </Select>
      </FormControl>
      {['homologous_recombination', 'crispr'].includes(primerDesignType)
      && (
        <PrimerDesignHomologousRecombination source={source} primerDesignType={primerDesignType} />
      )}
      {primerDesignType === 'gibson_assembly' && (
        <PrimerDesignGibsonAssembly source={source} />
      )}
    </>

  );
}

export default PrimerDesignSourceForm;
