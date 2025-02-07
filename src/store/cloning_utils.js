import { flipContainedRange } from '@teselagen/range-utils';

export const isEntityInputOfAnySource = (id, sources) => (sources.find((source) => source.input.includes(id))) !== undefined;

export function getIdsOfEntitiesWithoutChildSource(sources, entities) {
  let idsEntitiesWithChildSource = [];
  sources.forEach((source) => {
    idsEntitiesWithChildSource = idsEntitiesWithChildSource.concat(source.input);
  });
  const entitiesNotChildSource = [];

  entities.forEach((entity) => {
    if (!idsEntitiesWithChildSource.includes(entity.id)) {
      entitiesNotChildSource.push(entity);
    }
  });
  return entitiesNotChildSource.map((entity) => entity.id);
}

export function getInputEntitiesFromSourceId(state, sourceId) {
  const thisSource = state.cloning.sources.find((s) => s.id === sourceId);
  // Entities must be returned in the same order as in the source input
  return thisSource.input.map((id) => state.cloning.entities.find((e) => e.id === id));
}

export function isSourceATemplate({ sources, entities }, sourceId) {
  // Get the output sequence
  const source = sources.find((s) => s.id === sourceId);
  const sequences = [...entities.filter((e) => e.id === source.output), ...entities.filter((e) => source.input.includes(e.id))];
  return sequences.some((s) => s.type === 'TemplateSequence');
}

export function getPrimerDesignObject({ sources, entities }) {
  // Find sequences that are templates and have primer_design set
  const outputSequences = entities.filter((e) => e.type === 'TemplateSequence' && e.primer_design !== undefined);
  if (outputSequences.length === 0) {
    // return 'No primer design sequence templates found';
    return { finalSource: null, otherInputIds: [], pcrSources: [], outputSequences: [] };
  }
  const mockSequenceIds = outputSequences.map((s) => s.id);

  // Find the PCRs from which the mock sequences are outputs
  const pcrSources = sources.filter((s) => mockSequenceIds.includes(s.output));

  // Find the template sequences form those PCRs
  const templateSequences = entities.filter((e) => pcrSources.some((ps) => ps.input.includes(e.id)));

  // They should not be mock sequences
  if (templateSequences.some((ts) => ts.type === 'TemplateSequence')) {
    // return 'TemplateSequence input to final source is a TemplateSequence';
    return { finalSource: null, otherInputIds: [], pcrSources: [], outputSequences: [] };
  }

  // Find the source they are input to (there should be zero or one)
  const finalSources = sources.filter((s) => s.input.some((i) => mockSequenceIds.includes(i)));

  if (finalSources.length === 0) {
    // return as is
    return { finalSource: null, otherInputIds: [], pcrSources, outputSequences };
  }
  if (finalSources.length > 1) {
    // error
    return { finalSource: null, otherInputIds: [], pcrSources: [], outputSequences: [] };
  }

  const finalSource = finalSources[0];

  // Inputs to the finalSource that are not mock sequences with primer_design
  const otherInputIds = finalSource.input.filter((i) => !mockSequenceIds.includes(i));
  const otherInputs = entities.filter((e) => otherInputIds.includes(e.id));
  // There should be no TemplateSequence as an input that does not have primer_design set
  if (otherInputs.some((i) => i.type === 'TemplateSequence' && i.primer_design === undefined)) {
    // return 'TemplateSequence input to final source does not have primer_design set';
    return { finalSource: null, otherInputIds: [], pcrSources: [], outputSequences: [] };
  }

  return { finalSource, otherInputIds, pcrSources, outputSequences };
}

const formatPrimer = (primer, position) => {
  const { name, sequence, id } = primer;
  return {
    id: `${id}`,
    name,
    ...position,
    type: 'primer_bind',
    primerBindsOn: '3prime',
    forward: position.strand === 1,
    bases: sequence,
  };
};

export function getPrimerLinks({ primers, primer2entityLinks }, entityId) {
  const relatedLinks = primer2entityLinks.filter((link) => link.entityId === entityId);
  const out = relatedLinks.map(({ position, primerId }) => {
    const primer = primers.find((p) => p.id === primerId);
    if (primer === undefined) {
      return null;
    }
    return formatPrimer(primer, position);
  });
  return out.filter((p) => p !== null);
}

export function pcrPrimerPositionsInInput(source, sequenceData) {
  if (source.type !== 'PCRSource') {
    throw new Error('Source is not a PCRSource');
  }
  const fwd = { ...source.assembly[1].left_location };
  const rvs = { ...source.assembly[1].right_location };
  const { size } = sequenceData;

  fwd.end -= 1;
  rvs.end -= 1;
  if (!source.assembly[1].reverse_complemented) {
    fwd.strand = 1;
    rvs.strand = -1;
    return [fwd, rvs];
  }

  const fwd2 = flipContainedRange(fwd, { start: 0, end: size - 1 }, size);
  const rvs2 = flipContainedRange(rvs, { start: 0, end: size - 1 }, size);

  fwd2.strand = -1;
  rvs2.strand = 1;
  return [fwd2, rvs2];
}

export function pcrPrimerPositionsInOutput(primers, sequenceData) {
  const [fwdPrimer, rvsPrimer] = primers;
  return [
    { start: 0, end: fwdPrimer.sequence.length - 1, strand: 1 },
    { start: sequenceData.size - rvsPrimer.sequence.length, end: sequenceData.size - 1, strand: -1 },
  ];
}

export function getPCRPrimers({ primers, sources, teselaJsonCache }, entityId) {
  let out = [];

  // Get PCRs that have this entity as input
  const sourcesInput = sources.filter((s) => s.input.includes(entityId));
  const sequenceData = teselaJsonCache[entityId];

  sourcesInput.forEach((sourceInput) => {
    if (sourceInput?.type === 'PCRSource' && sourceInput.assembly?.length === 3) {
      const pcrPrimers = [sourceInput.assembly[0].sequence, sourceInput.assembly[2].sequence].map((id) => primers.find((p) => p.id === id));
      const primerPositions = pcrPrimerPositionsInInput(sourceInput, sequenceData);
      out = out.concat(pcrPrimers.map((primer, i) => formatPrimer(primer, primerPositions[i])));
    }
  });

  // Get the PCR that have this entity as output (if any)
  const sourceOutput = sources.find((s) => s.output === entityId);
  if (sourceOutput?.type === 'PCRSource') {
    const pcrPrimers = [sourceOutput.assembly[0].sequence, sourceOutput.assembly[2].sequence].map((id) => primers.find((p) => p.id === id));
    const primerPositions = pcrPrimerPositionsInOutput(pcrPrimers, sequenceData);
    out = out.concat(pcrPrimers.map((primer, i) => formatPrimer(primer, primerPositions[i])));
  }
  return out;
}

export function getNextUniqueId({ sources, entities }) {
  const allIds = [...sources.map((s) => s.id), ...entities.map((e) => e.id)];
  if (allIds.length === 0) {
    return 1;
  }
  return Math.max(...allIds) + 1;
}

export function getNextPrimerId(primers) {
  const allIds = primers.map((p) => p.id);
  if (allIds.length === 0) {
    return 1;
  }
  return Math.max(...allIds) + 1;
}

export function shiftSource(source, networkShift, primerShift) {
  const newSource = { ...source };

  // Common part
  newSource.id += networkShift;
  if (newSource.output) {
    newSource.output += networkShift;
  }
  newSource.input = newSource.input.map((i) => i + networkShift);

  // Primer part
  if (newSource.type === 'PCRSource' && newSource.assembly?.length > 0) {
    // Shift primer ids in assembly representation
    newSource.assembly[0].sequence += primerShift;
    newSource.assembly[2].sequence += primerShift;

    // Shift sequence ids in assembly representation
    newSource.assembly[1].sequence += networkShift;
  } else if (newSource.type === 'OligoHybridizationSource') {
    if (newSource.forward_oligo) {
      newSource.forward_oligo += primerShift;
    }
    if (newSource.reverse_oligo) {
      newSource.reverse_oligo += primerShift;
    }
  } else if (newSource.type === 'CRISPRSource') {
    newSource.guides = newSource.guides?.map((i) => i + primerShift);
  }

  // Shift assembly representation
  if (newSource.type !== 'PCRSource' && newSource.assembly?.length > 0) {
    newSource.assembly.forEach((part) => {
      part.sequence += networkShift;
    });
  }

  return newSource;
}

export function shiftStateIds(newState, oldState, skipPrimers = false) {
  const { sources: newSources, entities: newEntities, primers: newPrimers, files: newFiles } = newState;
  const { sources: oldSources, entities: oldEntities, primers: oldPrimers } = oldState;
  let networkShift = getNextUniqueId({ sources: oldSources, entities: oldEntities });
  // Substract the smallest id to minimize the starting id
  networkShift -= Math.min(...[...newSources.map((s) => s.id), ...newEntities.map((e) => e.id)]);
  const primerShift = skipPrimers ? 0 : getNextPrimerId(oldPrimers);
  return {
    newState2: {
      entities: newEntities.map((e) => ({ ...e, id: e.id + networkShift })),
      primers: newPrimers.map((p) => ({ ...p, id: p.id + primerShift })),
      sources: newSources.map((s) => shiftSource(s, networkShift, primerShift)),
      files: newFiles ? newFiles.map((f) => ({ ...f, sequence_id: f.sequence_id + networkShift })) : [],
    },
    networkShift };
}

export function stringIsNotDNA(str) {
  return str.match(/[^agct]/i) !== null;
}

export function formatGatewaySites(sites) {
  const foundSites = [];
  Object.keys(sites).forEach((siteName) => {
    sites[siteName].forEach((location) => {
      foundSites.push({ siteName, location });
    });
  });
  return foundSites;
}

export function getSourceDatabaseId(sources, entityId) {
  const source = sources.find((s) => s.output === entityId);
  return source?.database_id;
}

export function getUsedPrimerIds(sources) {
  const forPcr = sources
    .filter((s) => s.type === 'PCRSource' && s.assembly?.length > 0)
    .map((s) => [s.assembly[0].sequence, s.assembly[2].sequence]).flat();
  const forHybridization = sources
    .filter((s) => s.type === 'OligoHybridizationSource')
    .flatMap((s) => [s.forward_oligo, s.reverse_oligo]);
  const forCRISPR = sources
    .filter((s) => s.type === 'CRISPRSource')
    .flatMap((s) => s.guides);

  return forPcr.concat(forHybridization).concat(forCRISPR);
}
