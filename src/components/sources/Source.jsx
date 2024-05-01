import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import SourceFile from './SourceFile';
import SourceRepositoryId from './SourceRepositoryId';
import SourceRestriction from './SourceRestriction';
import SourceAssembly from './SourceAssembly';
import SourceTypeSelector from './SourceTypeSelector';
import SourceBox from './SourceBox';
import SourcePCRorHybridization from './SourcePCRorHybridization';
import SourceHomologousRecombination from './SourceHomologousRecombination';
import SourceGenomeRegion from './SourceGenomeRegion';
import SourceManuallyTyped from './SourceManuallyTyped';
import ELabFTWSource from './ELabFTWSource';
import SourcePolymeraseExtension from './SourcePolymeraseExtension';

// There are several types of source, this components holds the common part,
// which for now is a select element to pick which kind of source is created
function Source({ sourceId }) {
  const source = useSelector((state) => state.cloning.sources.find((s) => s.id === sourceId), shallowEqual);
  const [sourceType, setSourceType] = React.useState(source.type);
  let specificSource = null;
  switch (sourceType) {
    /* eslint-disable */
    case 'UploadedFileSource':
      specificSource = <SourceFile {...{ sourceId }} />; break;
    case 'restriction':
      specificSource = <SourceRestriction {...{ sourceId }} />; break;
    case 'RepositoryIdSource':
      specificSource = <SourceRepositoryId {...{ sourceId }} />; break;
    case 'ligation':
      specificSource = <SourceAssembly {...{ sourceId, assemblyType: 'ligation' }} />; break;
    case 'gibson_assembly':
      specificSource = <SourceAssembly {...{ sourceId, assemblyType: 'gibson_assembly' }} />; break;
    case 'homologous_recombination':
      specificSource = <SourceHomologousRecombination {...{ sourceId }} />; break;
    case 'PCR':
      specificSource = <SourcePCRorHybridization {...{ sourceId }} />; break;
    case 'restriction_and_ligation':
      specificSource = <SourceAssembly {...{ sourceId, assemblyType: 'restriction_and_ligation' }} />; break;
    case 'genome_region':
      specificSource = <SourceGenomeRegion {...{ sourceId }} />; break;
    case 'ManuallyTypedSource':
      specificSource = <SourceManuallyTyped {...{ sourceId }} />; break;
    case 'crispr':
      specificSource = <SourceHomologousRecombination {...{ sourceId, isCrispr: true }} />; break;
    case 'OligoHybridizationSource':
      specificSource = <SourcePCRorHybridization {...{ sourceId }} />; break;
    case 'PolymeraseExtensionSource':
      specificSource = <SourcePolymeraseExtension {...{ sourceId }} />; break;
    case 'elabftw':
      specificSource = <ELabFTWSource {...{ sourceId }} />; break;
    default:
      break;
    /* eslint-enable */
  }

  return (
    <SourceBox {...{ sourceId }}>
      <SourceTypeSelector {...{ sourceId, sourceType, setSourceType }} />
      {specificSource}
    </SourceBox>
  );
}

export default React.memo(Source);
