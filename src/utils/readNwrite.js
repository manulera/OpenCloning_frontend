import { elementToSVG, inlineResources } from 'dom-to-svg';
import { jsonToFasta, jsonToGenbank } from '@teselagen/bio-parsers';
import {
  BlobWriter,
  ZipWriter,
  TextReader,
  BlobReader,
  ZipReader,
  configure,
} from '@zip.js/zip.js';

configure({
  useWebWorkers: false,
});

export function base64ToBlob(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes]);
}

export const downloadBlob = (blob, fileName) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const file2base64 = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result.split(',')[1];
    resolve(base64String);
  };
  reader.readAsDataURL(file);
});

export const downloadTextFile = (text, fileName, type = 'text/plain') => {
  const blob = new Blob([text], { type });
  downloadBlob(blob, fileName);
};

export async function getZipFileBlob(files) {
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
  await Promise.all(files.map((file) => zipWriter.add(file.name, file.reader)));
  return zipWriter.close();
}

export async function readSubmittedTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = (error) => {
      reject(new Error('Error reading text file'));
    };
  });
}

export function formatStateForJsonExport(cloningState) {
  const { entities, sources, description, primers } = cloningState;
  return {
    sequences: entities, sources, description, primers,
  };
}

export const prettyPrintJson = (json) => `${JSON.stringify(json, null, 2)}\n`;

export const downloadStateAsJson = async (cloningState, fileName = 'cloning_strategy.json') => {
  const output = formatStateForJsonExport(cloningState);
  downloadTextFile(prettyPrintJson(output), fileName, 'application/json');
};

export const downloadStateAsZip = async (cloningState, zipFileName = 'cloning_strategy.zip') => {
  const output = formatStateForJsonExport(cloningState);
  output.files = cloningState.files;
  const fileNames = cloningState.files.map((file) => `verification-${file.sequence_id}-${file.file_name}`);
  const files2write = [
    { name: 'cloning_strategy.json', reader: new TextReader(prettyPrintJson(output)) },
    ...fileNames.map((fileName) => {
      const base64Content = sessionStorage.getItem(fileName);
      if (!base64Content) {
        const nameOnly = fileName.replace(/verification-\d+-/, '');
        throw new Error(`File ${nameOnly} not found in session storage`);
      }
      return { name: fileName, reader: new BlobReader(base64ToBlob(base64Content)) };
    }),
  ];
  const blob = await getZipFileBlob(files2write);
  downloadBlob(blob, zipFileName);
};

export const downloadSequence = (fileName, sequenceData) => {
  if (sequenceData === undefined) {
    return;
  }
  if (fileName.endsWith('.gb')) {
    downloadTextFile(jsonToGenbank(sequenceData), fileName);
  } else if (fileName.endsWith('.fasta')) {
    downloadTextFile(jsonToFasta(sequenceData), fileName);
  }
};

export const downloadCloningStrategyAsSvg = async (fileName) => {
  const container = document.querySelector('div.share-your-cloning');
  // Clone the container to avoid modifying the original
  const containerCopy = container.cloneNode(true);
  containerCopy.id = 'temp-div-svg-print';

  // Make sure the entire element is displayed
  containerCopy.style.overflow = 'visible';
  containerCopy.style.width = 'fit-content';
  containerCopy.style.height = 'fit-content';
  containerCopy.style.position = 'absolute';
  containerCopy.style.left = '-9999px';

  // Remove all MUI icons from the copy before converting to SVG
  const muiIcons = containerCopy.querySelectorAll('.MuiSvgIcon-root');
  muiIcons.forEach((icon) => icon.remove());

  // Remove all "Add" buttons
  const addButtons = containerCopy.querySelectorAll('.hang-from-node');
  addButtons.forEach((button) => button.remove());

  // Remove all "New source box"
  const newSourceBoxes = containerCopy.querySelectorAll('.new_source_box');
  newSourceBoxes.forEach((box) => box.remove());

  container.appendChild(containerCopy);
  const node2print = document.getElementById('temp-div-svg-print');

  const svgDocument = elementToSVG(node2print);
  container.removeChild(node2print);

  await inlineResources(svgDocument.documentElement);
  const svgString = new XMLSerializer().serializeToString(svgDocument);
  downloadTextFile(svgString, fileName);
};

export async function loadHistoryFile(file) {
  const isZipFile = file.name.endsWith('.zip');
  const isJsonFile = file.name.endsWith('.json');

  let cloningStrategyFile;
  let verificationFiles = [];

  if (isZipFile) {
    const zipReader = new ZipReader(new BlobReader(file));
    // Only in the root directory (e.g. Mac sometimes add __MACOSX/.. to the zip)
    const entries = (await zipReader.getEntries()).filter((entry) => !entry.filename.includes('/'));
    const jsonFilesInZip = entries.filter((entry) => entry.filename.endsWith('.json'));

    if (jsonFilesInZip.length !== 1) {
      throw new Error('Zip file must contain exactly one JSON file.');
    }
    cloningStrategyFile = await jsonFilesInZip[0].getData(new BlobWriter());
    verificationFiles = await Promise.all(entries
      .filter((entry) => /verification-\d+-.*\.ab1/.test(entry.filename))
      .map((entry) => {
        const blob = entry.getData(new BlobWriter());
        return new File([blob], entry.filename, { type: blob.type });
      }));
  } else if (isJsonFile) {
    cloningStrategyFile = file;
  }

  let cloningStrategy;
  try {
    cloningStrategy = JSON.parse(await readSubmittedTextFile(cloningStrategyFile));
  } catch (error) {
    throw new Error('Invalid JSON file.');
  }
  const newCloningStrategy = { ...cloningStrategy, entities: cloningStrategy.sequences };
  delete newCloningStrategy.sequences;

  // Drop the files if loading only json
  if (isJsonFile) {
    newCloningStrategy.files = [];
  }

  // Check files
  if (isZipFile) {
    if (!newCloningStrategy.files) {
      newCloningStrategy.files = [];
    }
    // Missing files in zip
    const stateFileNames = newCloningStrategy.files.map((f) => `verification-${f.sequence_id}-${f.file_name}`);
    const verificationFileNames = verificationFiles.map((f) => f.name);

    const missingFile = stateFileNames.find((name) => !verificationFileNames.includes(name));
    if (missingFile) {
      throw new Error(`File ${missingFile} not found in zip.`);
    }

    // Excess file in zip
    const excessFile = verificationFileNames.find((name) => !stateFileNames.includes(name));
    if (excessFile) {
      throw new Error(`File ${excessFile} found in zip but not in cloning strategy.`);
    }
  }

  return { cloningStrategy: newCloningStrategy, verificationFiles };
}

export const loadFilesToSessionStorage = async (files, networkShift = 0) => {
  await Promise.all(files.map(async (file) => {
    const fileContent = await file2base64(file);
    const filename = file.name.replace(/verification-(\d+)-/, (match, num) => `verification-${parseInt(num, 10) + networkShift}-`);
    sessionStorage.setItem(filename, fileContent);
  }));
};
