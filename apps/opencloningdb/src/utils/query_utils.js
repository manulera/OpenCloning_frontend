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

