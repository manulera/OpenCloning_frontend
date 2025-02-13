import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

import { batch, useDispatch } from 'react-redux';
import PrimerDesignHomologousRecombination from './PrimerDesignHomologousRecombination';
import PrimerDesignGibsonAssembly from './PrimerDesignGibsonAssembly';
import { cloningActions } from '../../../../store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import PrimerDesignGatewayBP from './PrimerDesignGatewayBP';

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
        // Scroll to the top of the page after 300ms
        setTimeout(() => {
          document.querySelector('.tab-panels-container')?.scrollTo({ top: 0, behavior: 'instant' });
        }, 300);
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
          <MenuItem value="GibsonAssemblySource">Gibson Assembly</MenuItem>
          <MenuItem value="InFusionSource">In-Fusion</MenuItem>
          <MenuItem value="restriction_ligation">Restriction and Ligation</MenuItem>
          <MenuItem value="gateway_bp">Gateway BP reaction</MenuItem>
        </Select>
      </FormControl>
      {['homologous_recombination', 'crispr'].includes(primerDesignType)
      && (
        <PrimerDesignHomologousRecombination source={source} primerDesignType={primerDesignType} />
      )}
      {['GibsonAssemblySource', 'InFusionSource'].includes(primerDesignType) && (
        <PrimerDesignGibsonAssembly source={source} assemblyType={primerDesignType} />
      )}
      {primerDesignType === 'gateway_bp' && (
        <PrimerDesignGatewayBP source={source} />
      )}
    </>
  );
}

export default PrimerDesignSourceForm;
