const endpoints = {
  sequences: '/sequences',
  sequence: (id) => `/sequence/${id}`,
  sequenceTextFile: (id) => `/sequence/${id}/text_file_sequence`,
  sequenceCloningStrategy: (id) => `/sequence/${id}/cloning_strategy`,
  sequenceChildren: (id) => `/sequence/${id}/children`,
  sequenceSequencingFiles: (id) => `/sequence/${id}/sequencing_files`,
  sequenceSearch: '/sequence/search',
  sequencingFileDownload: (id) => `/sequencing_files/${id}/download`,
  sequenceSequencingFileDelete: (sequenceId, fileId) => `/sequence/${sequenceId}/sequencing_files/${fileId}`,
  postSequence: '/sequence',
  primers: '/primers',
  primer: (id) => `/primer/${id}`,
  primerTemplateSequences: (id) => `/primer/${id}/sequences`,
  postPrimer: '/primer',
  lines: '/lines',
  line: (id) => `/line/${id}`,
  lineTags: (id) => `/line/${id}/tags`,
  inputEntityTags: (id) => `/input_entity/${id}/tags`,
  postLine: '/line',
  tags: '/tags',
};

export default endpoints;
