export default function primersToTabularFile(primers, separator) {
  const rowsArrays = [
    ['id', 'name', 'sequence'],
    ...primers.map((primer) => [`${primer.id}`, primer.name, primer.sequence]),
  ];

  const rows = rowsArrays.map((row) => row.join(separator));
  const out = rows.join('\n');

  return out;
}
