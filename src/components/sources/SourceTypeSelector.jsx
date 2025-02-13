import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { getInputEntitiesFromSourceId } from '../../store/cloning_utils';
import { cloningActions } from '../../store/cloning';

function SourceTypeSelector({ source }) {
  const { id: sourceId, type: sourceType } = source;
  const dispatch = useDispatch();
  const sourceIsPrimerDesign = source.output && useSelector((state) => state.cloning.entities.find((e) => e.id === source.output).primer_design !== undefined);
  const { replaceSource } = cloningActions;

  const onChange = (event) => {
    // Clear the source other than these fields
    dispatch(replaceSource({
      id: sourceId,
      type: event.target.value,
      input: source.input,
      output: source.output,
    }));
  };
  const inputEntities = useSelector((state) => getInputEntitiesFromSourceId(state, sourceId), shallowEqual);
  const entitiesExist = useSelector((state) => state.cloning.entities.length > 0, shallowEqual);
  const options = [];
  if (inputEntities.length === 0) {
    options.push(<MenuItem key="UploadedFileSource" value="UploadedFileSource">Submit file</MenuItem>);
    options.push(<MenuItem key="RepositoryIdSource" value="RepositoryIdSource">Repository ID</MenuItem>);
    options.push(<MenuItem key="GenomeCoordinatesSource" value="GenomeCoordinatesSource">Genome region</MenuItem>);
    options.push(<MenuItem key="ManuallyTypedSource" value="ManuallyTypedSource">Enter manually</MenuItem>);
    options.push(<MenuItem key="OligoHybridizationSource" value="OligoHybridizationSource">Oligonucleotide hybridization</MenuItem>);
    // elab-demo
    // options.push(<MenuItem key="elabftw" value="elabftw">Import from eLabFTW</MenuItem>);
    if (entitiesExist) {
      options.push(<MenuItem key="CopyEntity" value="CopyEntity">Use an existing sequence</MenuItem>);
    }
  } else {
    // See https://github.com/manulera/OpenCloning_frontend/issues/101
    if (inputEntities.length < 2) {
      options.push(<MenuItem key="RestrictionEnzymeDigestionSource" value="RestrictionEnzymeDigestionSource">Restriction</MenuItem>);
      options.push(<MenuItem key="PCRSource" value="PCRSource">PCR</MenuItem>);
      options.push(<MenuItem key="PolymeraseExtensionSource" value="PolymeraseExtensionSource">Polymerase extension</MenuItem>);
      options.push(<MenuItem key="ReverseComplementSource" value="ReverseComplementSource">Reverse complement</MenuItem>);
      options.push(<MenuItem key="AnnotationSource" value="AnnotationSource">Annotate features</MenuItem>);
    }
    options.push(<MenuItem key="LigationSource" value="LigationSource">Ligation (sticky / blunt)</MenuItem>);
    options.push(<MenuItem key="GibsonAssemblySource" value="GibsonAssemblySource">Gibson assembly</MenuItem>);
    options.push(<MenuItem key="HomologousRecombinationSource" value="HomologousRecombinationSource">Homologous recombination</MenuItem>);
    options.push(<MenuItem key="CRISPRSource" value="CRISPRSource">CRISPR</MenuItem>);
    options.push(<MenuItem key="RestrictionAndLigationSource" value="RestrictionAndLigationSource">Restriction + ligation / Golden Gate</MenuItem>);
    options.push(<MenuItem key="OverlapExtensionPCRLigationSource" value="OverlapExtensionPCRLigationSource">Join overlap extension PCR fragments</MenuItem>);
    options.push(<MenuItem key="InFusionSource" value="InFusionSource">In-Fusion</MenuItem>);
    options.push(<MenuItem key="GatewaySource" value="GatewaySource">Gateway</MenuItem>);
  }

  // Sort options by text content
  options.sort((a, b) => a.props.children.localeCompare(b.props.children));

  return (
    <>
      {!sourceType && (<h2 className="empty-source-title">{inputEntities.length === 0 ? 'Import a sequence' : 'Use this sequence'}</h2>)}
      <FormControl fullWidth>
        <InputLabel id={`select-source-${sourceId}-label`}>Source type</InputLabel>
        <Select
          value={sourceType || ''}
          onChange={onChange}
          labelId={`select-source-${sourceId}-label`}
          // Note how you have to set the label in two places
          // see https://stackoverflow.com/questions/67064682/material-ui-outlined-select-label-is-not-rendering-properly
          label="Source type"
          disabled={sourceIsPrimerDesign}
        >
          {options}
        </Select>
      </FormControl>
    </>

  );
}

export default SourceTypeSelector;
