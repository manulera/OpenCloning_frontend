import { selectedRegion2SequenceLocation } from '../../../../utils/selectedRegionUtils';
import { ebicTemplateAnnotation, joinSequencesIntoSingleSequence, simulateHomologousRecombination } from '../../../../utils/sequenceManipulation';
import { DESIGN_TYPES } from './constants';

// Build the in-memory preview sequence product for the current design.
export function computeSequenceProduct({
  designType,
  rois,
  spacers,
  primerDesignSettings,
  fragmentOrientations,
  circularAssembly,
  sequenceIds,
  teselaJsonCache,
  sequences,
}) {
  if (!rois || rois.some((r) => r === null)) return null;

  const seqRecords = sequenceIds.map((id) => teselaJsonCache[id]);
  const fullSequences = sequenceIds.map((id) => sequences.find((e) => e.id === id));

  if (designType === DESIGN_TYPES.SIMPLE_PAIR || designType === DESIGN_TYPES.RESTRICTION_LIGATION) {
    const enzymeSpacers = designType === DESIGN_TYPES.RESTRICTION_LIGATION ? primerDesignSettings.enzymeSpacers : ['', ''];
    const extendedSpacers = [enzymeSpacers[0] + spacers[0], spacers[1] + enzymeSpacers[1]];
    const product = joinSequencesIntoSingleSequence(
      fullSequences,
      rois.map((s) => s.selectionLayer),
      fragmentOrientations,
      extendedSpacers,
      circularAssembly,
      'primer tail',
    );
    product.name = 'PCR product';
    return product;
  }

  if (designType === DESIGN_TYPES.GIBSON_ASSEMBLY) {
    const product = joinSequencesIntoSingleSequence(
      fullSequences,
      rois.map((s) => s.selectionLayer),
      fragmentOrientations,
      spacers,
      circularAssembly,
    );
    product.name = 'Gibson Assembly product';
    return product;
  }

  if (designType === DESIGN_TYPES.HOMOLOGOUS_RECOMBINATION) {
    const product = simulateHomologousRecombination(
      seqRecords[0],
      seqRecords[1],
      rois,
      fragmentOrientations[0] === 'reverse',
      spacers,
    );
    product.name = 'Homologous recombination product';
    return product;
  }

  if (designType === DESIGN_TYPES.GATEWAY_BP) {
    const product = joinSequencesIntoSingleSequence(
      [fullSequences[0]],
      [rois[0].selectionLayer],
      fragmentOrientations,
      spacers,
      false,
      'primer tail',
    );
    product.name = 'PCR product';
    const { knownCombination } = primerDesignSettings;
    // Add translation frame features
    const leftFeature = {
      start: knownCombination.translationFrame[0],
      end: spacers[0].length - 1,
      type: 'CDS',
      name: 'translation frame',
      strand: 1,
      forward: true,
    };
    const nbAas = Math.floor((spacers[1].length - knownCombination.translationFrame[1]) / 3);
    const rightStart = product.sequence.length - knownCombination.translationFrame[1] - nbAas * 3;
    const rightFeature = {
      start: rightStart,
      end: product.sequence.length - knownCombination.translationFrame[1] - 1,
      type: 'CDS',
      name: 'translation frame',
      strand: 1,
      forward: true,
    };
    product.features.push(leftFeature);
    product.features.push(rightFeature);
    return product;
  }

  if (designType === DESIGN_TYPES.EBIC) {
    return ebicTemplateAnnotation(seqRecords[0], rois[0].selectionLayer, primerDesignSettings);
  }

  return null;
}

// Build the request payload and endpoint for the primer design API.
export function buildDesignPrimerRequest({
  designType,
  sequenceIds,
  rois,
  fragmentOrientations,
  spacers,
  circularAssembly,
  primerDesignSettings,
  teselaJsonCache,
  sequences,
  globalPrimerSettings,
}) {
  const paramsForRequest = Object.fromEntries(
    Object.entries(primerDesignSettings)
      .filter(([_, value]) => typeof value !== 'function'),
  );

  let endpoint = '';
  let requestData = {};
  let params = {};

  if (designType === DESIGN_TYPES.GIBSON_ASSEMBLY) {
    endpoint = 'gibson_assembly';
    params = { ...paramsForRequest, circular: circularAssembly };
    requestData = {
      pcr_templates: sequenceIds.map((id, index) => ({
        sequence: sequences.find((e) => e.id === id),
        location: selectedRegion2SequenceLocation(rois[index], teselaJsonCache[id].size),
        forward_orientation: fragmentOrientations[index] === 'forward',
      })),
      spacers,
    };
  } else if (designType === DESIGN_TYPES.HOMOLOGOUS_RECOMBINATION) {
    endpoint = 'homologous_recombination';
    const [pcrTemplateId, homologousRecombinationTargetId] = sequenceIds;
    params = { ...paramsForRequest };
    requestData = {
      pcr_template: {
        sequence: sequences.find((e) => e.id === pcrTemplateId),
        location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[pcrTemplateId].size),
        forward_orientation: fragmentOrientations[0] === 'forward',
      },
      homologous_recombination_target: {
        sequence: sequences.find((e) => e.id === homologousRecombinationTargetId),
        location: selectedRegion2SequenceLocation(rois[1], teselaJsonCache[homologousRecombinationTargetId].size),
      },
      spacers,
    };
  } else if (
    designType === DESIGN_TYPES.SIMPLE_PAIR
    || designType === DESIGN_TYPES.GATEWAY_BP
    || designType === DESIGN_TYPES.RESTRICTION_LIGATION
  ) {
    endpoint = 'simple_pair';
    const pcrTemplateId = sequenceIds[0];
    params = { ...paramsForRequest };
    requestData = {
      pcr_template: {
        sequence: sequences.find((e) => e.id === pcrTemplateId),
        location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[pcrTemplateId].size),
        forward_orientation: fragmentOrientations[0] === 'forward',
      },
      spacers,
    };
  } else if (designType === DESIGN_TYPES.EBIC) {
    endpoint = 'ebic';
    params = { ...paramsForRequest };
    requestData = {
      template: {
        sequence: sequences.find((e) => e.id === sequenceIds[0]),
        location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[sequenceIds[0]].size),
      },
    };
  }

  requestData.settings = globalPrimerSettings;
  return { endpoint, requestData, params };
}
