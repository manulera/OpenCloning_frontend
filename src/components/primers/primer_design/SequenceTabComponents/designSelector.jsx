import React from 'react';
import PrimerDesignRestriction from './PrimerDesignRestriction';
import PrimerDesignSimplePair from './PrimerDesignSimplePair';
import PrimerDesignGibsonAssembly from './PrimerDesignGibsonAssembly';
import PrimerDesignHomologousRecombination from './PrimerDesignHomologousRecombination';
import PrimerDesignGatewayBP from './PrimerDesignGatewayBP';
import PrimerDesignEBIC from './PrimerDesignEBIC';
import { DESIGN_TYPES, SOURCE_TYPES, isGibsonLikeSourceType } from './constants';

/**
 * Selects the appropriate primer design component to render based on the
 * current cloning graph context.
 */
export function selectPrimerDesignComponent({ finalSource, otherInputIds, pcrSources, outputSequences }) {
  const hasSinglePCR = pcrSources.length === 1;
  const firstOutput = outputSequences && outputSequences[0];

  // No final source: simple pair or restriction-ligation are single-PCR modes
  if (!finalSource && hasSinglePCR && firstOutput?.primer_design === DESIGN_TYPES.RESTRICTION_LIGATION) {
    return <PrimerDesignRestriction pcrSource={pcrSources[0]} />;
  }
  if (!finalSource && hasSinglePCR && firstOutput?.primer_design === DESIGN_TYPES.SIMPLE_PAIR) {
    return <PrimerDesignSimplePair pcrSource={pcrSources[0]} />;
  }

  // Gibson-like assemblies
  if (isGibsonLikeSourceType(finalSource?.type)) {
    return <PrimerDesignGibsonAssembly pcrSources={pcrSources} />;
  }

  // Homologous recombination (two inputs required)
  if (finalSource?.type === SOURCE_TYPES.HOMOLOGOUS_RECOMBINATION && otherInputIds.length === 1 && hasSinglePCR) {
    return (
      <PrimerDesignHomologousRecombination
        homologousRecombinationTargetId={otherInputIds[0]}
        pcrSource={pcrSources[0]}
      />
    );
  }

  // Gateway BP
  if (
    finalSource?.type === SOURCE_TYPES.GATEWAY
    && otherInputIds.length === 1
    && hasSinglePCR
    && firstOutput?.primer_design === DESIGN_TYPES.GATEWAY_BP
  ) {
    return <PrimerDesignGatewayBP donorVectorId={otherInputIds[0]} pcrSource={pcrSources[0]} />;
  }

  // EBIC
  if (
    finalSource?.type === SOURCE_TYPES.RESTRICTION_LIGATION
    && outputSequences.every((o) => o.primer_design === DESIGN_TYPES.EBIC)
  ) {
    return <PrimerDesignEBIC pcrSources={pcrSources} />;
  }

  return null;
}
