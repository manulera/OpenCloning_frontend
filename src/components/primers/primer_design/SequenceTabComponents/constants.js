/**
 * Shared constants and helpers for primer design components.
 */

/**
 * @readonly
 */
export const DESIGN_TYPES = Object.freeze({
  SIMPLE_PAIR: 'simple_pair',
  RESTRICTION_LIGATION: 'restriction_ligation',
  GIBSON_ASSEMBLY: 'gibson_assembly',
  HOMOLOGOUS_RECOMBINATION: 'homologous_recombination',
  GATEWAY_BP: 'gateway_bp',
  EBIC: 'ebic',
});

/**
 * Source type strings as produced by the cloning graph.
 * @readonly
 */
export const SOURCE_TYPES = Object.freeze({
  GIBSON_ASSEMBLY: 'GibsonAssemblySource',
  IN_FUSION: 'InFusionSource',
  IN_VIVO_ASSEMBLY: 'InVivoAssemblySource',
  CRE_LOX_RECOMBINATION: 'CreLoxRecombinationSource',
  HOMOLOGOUS_RECOMBINATION: 'HomologousRecombinationSource',
  GATEWAY: 'GatewaySource',
  RESTRICTION_LIGATION: 'RestrictionAndLigationSource',
});

/**
 * Returns true if the given source type represents a Gibson-like assembly.
 * @param {string|null|undefined} type
 * @returns {boolean}
 */
export function isGibsonLikeSourceType(type) {
  return [
    SOURCE_TYPES.GIBSON_ASSEMBLY,
    SOURCE_TYPES.IN_FUSION,
    SOURCE_TYPES.IN_VIVO_ASSEMBLY,
    SOURCE_TYPES.CRE_LOX_RECOMBINATION,
  ].includes(type || '');
}
