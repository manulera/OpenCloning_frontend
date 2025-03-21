import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { getInputSequencesFromSourceId } from '../../store/cloning_utils';
import { cloningActions } from '../../store/cloning';
import useDatabase from '../../hooks/useDatabase';

const { replaceSource } = cloningActions;

function SourceTypeSelector({ source }) {
  const { id: sourceId, type: sourceType } = source;
  const dispatch = useDispatch();
  const database = useDatabase();
  const sourceIsPrimerDesign = useSelector((state) => source.output && state.cloning.sequences.find((e) => e.id === source.output).primer_design !== undefined);
  const noExternalRequests = useSelector((state) => state.cloning.config.noExternalRequests);

  const onChange = (event) => {
    // Clear the source other than these fields
    dispatch(replaceSource({
      id: sourceId,
      type: event.target.value,
      input: source.input,
      output: source.output,
    }));
  };
  const inputSequences = useSelector((state) => getInputSequencesFromSourceId(state, sourceId), shallowEqual);
  const sequencesExist = useSelector((state) => state.cloning.sequences.length > 0, shallowEqual);
  const options = [];
  if (inputSequences.length === 0) {
    options.push(<MenuItem key="UploadedFileSource" value="UploadedFileSource">Submit file</MenuItem>);
    if (!noExternalRequests) {
      options.push(<MenuItem key="RepositoryIdSource" value="RepositoryIdSource">Repository ID</MenuItem>);
      options.push(<MenuItem key="GenomeCoordinatesSource" value="GenomeCoordinatesSource">Genome region</MenuItem>);
    }
    options.push(<MenuItem key="ManuallyTypedSource" value="ManuallyTypedSource">Enter manually</MenuItem>);
    options.push(<MenuItem key="OligoHybridizationSource" value="OligoHybridizationSource">Oligonucleotide hybridization</MenuItem>);
    if (database) {
      options.push(<MenuItem key="DatabaseSource" value="DatabaseSource">{`Import from ${database.name}`}</MenuItem>);
    }
    if (sequencesExist) {
      options.push(<MenuItem key="CopySequence" value="CopySequence">Use an existing sequence</MenuItem>);
    }
  } else {
    // See https://github.com/manulera/OpenCloning_frontend/issues/101
    if (inputSequences.length < 2) {
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
      {!sourceType && (<h2 className="empty-source-title">{inputSequences.length === 0 ? 'Import a sequence' : 'Use this sequence'}</h2>)}
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
