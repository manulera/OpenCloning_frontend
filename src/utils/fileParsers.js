import { stringIsNotDNA } from '../store/cloning_utils';
import { readSubmittedTextFile } from './readNwrite';

export const primersFromTextFile = async (fileUploaded, existingNames) => {
  const fileContent = await readSubmittedTextFile(fileUploaded);
  const lines = fileContent.split(/\r\n|\r|\n/);

  let delimiter = null;
  if (fileUploaded.name.endsWith('.csv')) {
    delimiter = ',';
  } else if (fileUploaded.name.endsWith('.tsv')) {
    delimiter = '\t';
  } else {
    throw new Error('File must be a .csv or .tsv file');
  }

  const headers = lines[0].split(delimiter);

  const requiredHeaders = ['name', 'sequence'];
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );

  // The number of tabs on headers and all lines should be > 1 and the same
  if (headers.length < 2) {
    throw new Error('Headers should have at least 2 columns');
  }

  // All lines should have the same number of tabs
  if (lines.some((line) => line.split(delimiter).length !== headers.length)) {
    throw new Error('All lines should have the same number of columns');
  }

  // Required headers should be present
  if (missingHeaders.length > 0) {
    throw new Error(`Headers missing: ${missingHeaders.join(', ')}`);
  }

  const primersToAdd = lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const obj = { error: '' };
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });

    if (existingNames.includes(obj.name)) {
      obj.error = 'existing';
    } else if (stringIsNotDNA(obj.sequence)) {
      obj.error = 'invalid';
      // TODO: Improvement: check for already existing sequences
      // While this is not a problem, it removes data redundancy
    }

    return obj;
  });

  return primersToAdd;
};
