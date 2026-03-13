export function parseBoolean(value) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return undefined;
}

export function parseString(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}

export function parseIntArray(values) {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values
    .flatMap((value) => String(value).split(','))
    .map((v) => parseInt(v, 10))
    .filter((v) => Number.isFinite(v));
}

export function parseStringArray(values) {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values.map((v) => String(v).trim()).filter((v) => v !== '');
}

export const VALID_SEQUENCE_TYPES = ['locus', 'allele', 'plasmid', 'pcr_product', 'restriction_fragment', 'linear_dna'];

export const SEQUENCE_TYPE_COLORS = {
  locus: { color: 'secondary.main' },
  allele: { color: 'warning.main' },
  plasmid: { color: 'primary.main' },
  pcr_product: { color: '#dd2d4a' },
  restriction_fragment: { color: 'success.main' },
  linear_dna: { color: 'default.main' },
};

export const SEQUENCE_TYPE_LABELS = {
  locus: 'Locus',
  allele: 'Allele',
  plasmid: 'Plasmid',
  pcr_product: 'PCR product',
  restriction_fragment: 'Restriction fragment',
  linear_dna: 'Linear DNA',
};

/**
 * Parse URL search params into sequence filter object.
 * Single source of truth for sequence query params.
 */
export function parseSequenceParams(searchParams) {
  const name = parseString(searchParams.get('name'));
  const tags = parseIntArray(searchParams.getAll('tags'));
  const sequence_types = searchParams
    .getAll('sequence_types')
    .filter((t) => VALID_SEQUENCE_TYPES.includes(t));
  const instantiated = parseBoolean(searchParams.get('instantiated'));
  return {
    name,
    tags: tags?.length ? tags : undefined,
    sequence_types: sequence_types?.length ? sequence_types : undefined,
    instantiated,
  };
}

/**
 * Write sequence filter params into URLSearchParams (mutates nextParams).
 * Removes 'page' so search resets to first page.
 */
export function applySequenceParamsToSearchParams(params, nextParams) {
  nextParams.delete('page');

  const keys = ['name', 'tags', 'sequence_types', 'instantiated'];
  keys.forEach((key) => nextParams.delete(key));

  if (params.name != null && String(params.name).trim() !== '') {
    nextParams.set('name', String(params.name).trim());
  }
  if (Array.isArray(params.tags) && params.tags.length > 0) {
    params.tags.forEach((id) => nextParams.append('tags', String(id)));
  }
  if (Array.isArray(params.sequence_types) && params.sequence_types.length > 0) {
    params.sequence_types.forEach((t) => nextParams.append('sequence_types', t));
  }
  if (params.instantiated === true || params.instantiated === false) {
    nextParams.set('instantiated', params.instantiated ? 'true' : 'false');
  }
}
