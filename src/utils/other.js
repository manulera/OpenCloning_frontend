// From https://github.com/sindresorhus/escape-string-regexp/blob/main/index.js
export function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d');
}

export function getUrlParameters() {
  const query = window.location.search;
  const searchParams = new URLSearchParams(query);
  return Object.fromEntries(searchParams.entries());
}
