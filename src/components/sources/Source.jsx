import React from 'react';
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
import CollectionSource from './CollectionSource';

// There are several types of source, this components holds the common part,
// which for now is a select element to pick which kind of source is created
function Source({ source }) {
  const { id: sourceId, type: sourceType } = source;
  let specificSource = null;
  const templateOnlySources = ['CollectionSource'];
  switch (sourceType) {
    /* eslint-disable */
    case 'UploadedFileSource':
      specificSource = <SourceFile {...{ source }} />; break;
    case 'RestrictionEnzymeDigestionSource':
      specificSource = <SourceRestriction {...{ source }} />; break;
    case 'RepositoryIdSource':
      specificSource = <SourceRepositoryId {...{ source }} />; break;
    case 'AddGeneIdSource':
      specificSource = <SourceRepositoryId {...{ source, initialSelectedRepository: 'addgene' }} />; break;
    case 'LigationSource':
      specificSource = <SourceAssembly {...{ source, assemblyType: 'LigationSource' }} />; break;
    case 'GibsonAssemblySource':
      specificSource = <SourceAssembly {...{ source, assemblyType: 'GibsonAssemblySource' }} />; break;
    case 'HomologousRecombinationSource':
      specificSource = <SourceHomologousRecombination {...{ source }} />; break;
    case 'PCRSource':
      specificSource = <SourcePCRorHybridization {...{ source }} />; break;
    case 'RestrictionAndLigationSource':
      specificSource = <SourceAssembly {...{ source, assemblyType: 'RestrictionAndLigationSource' }} />; break;
    case 'GenomeCoordinatesSource':
      specificSource = <SourceGenomeRegion {...{ source }} />; break;
    case 'ManuallyTypedSource':
      specificSource = <SourceManuallyTyped {...{ source }} />; break;
    case 'CRISPRSource':
      specificSource = <SourceHomologousRecombination {...{ source, isCrispr: true }} />; break;
    case 'OligoHybridizationSource':
      specificSource = <SourcePCRorHybridization {...{ source }} />; break;
    case 'PolymeraseExtensionSource':
      specificSource = <SourcePolymeraseExtension {...{ source }} />; break;
    case 'elabftw':
      specificSource = <ELabFTWSource {...{ source }} />; break;
    case 'CollectionSource':
      specificSource = <CollectionSource {...{ source }} />; break;
    default:
      break;
    /* eslint-enable */
  }

  return (
    <SourceBox {...{ sourceId }}>
      {!templateOnlySources.includes(sourceType) && (<SourceTypeSelector {...{ source }} />)}
      {specificSource}
    </SourceBox>
  );
}

export default React.memo(Source);
