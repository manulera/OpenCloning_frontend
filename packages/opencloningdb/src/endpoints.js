const endpoints = {
  sequences: '/sequences',
  sequence: (id) => `/sequence/${id}`,
  sequenceTextFile: (id) => `/sequence/${id}/text_file_sequence`,
  sequenceCloningStrategy: (id) => `/sequence/${id}/cloning_strategy`,
  sequenceSequencingFiles: (id) => `/sequence/${id}/sequencing_files`,
  sequencingFileDownload: (id) => `/sequencing_files/${id}/download`,
  postSequence: '/sequence',
  primers: '/primers',
  primer: (id) => `/primer/${id}`,
  postPrimer: '/primer',
  lines: '/lines',
  line: (id) => `/line/${id}`,
};

export default endpoints;
