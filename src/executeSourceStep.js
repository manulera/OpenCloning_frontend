export default function executeSourceStep(source, updateOrCreateEntity, uniqueIdDispatcher) {
  if (source.type === 'file') {
    if (typeof source.file_content !== 'undefined') {
      const newEntity = {
        kind: 'entity',
        id: uniqueIdDispatcher(),
        sequence: {
          type: 'file',
          file_extension: source.file_extension,
          file_content: source.file_content,
        },
      };
      // Add the entity
      updateOrCreateEntity(newEntity, source);
      // Set the output of the source TODO: This does not seem super clean
      source.output = newEntity.id;
    }
  } else if (source.type === 'genbank_id') {
    if (typeof source.output_list !== 'undefined' && source.output_list.length) {
      const newEntity = {
        kind: 'entity',
        id: uniqueIdDispatcher(),
        sequence: source.output_list[0].sequence,
      };
      // Add the entity
      updateOrCreateEntity(newEntity, source);
      // Set the output of the source TODO: This does not seem super clean
      source.output = newEntity.id;
    }
  } else if (source.type === 'restriction') {
    if (source.output_index !== null) {
      const newEntity = {
        kind: 'entity',
        id: uniqueIdDispatcher(),
        sequence: source.output_list[source.output_index].sequence,
      };
      // Add the entity
      updateOrCreateEntity(newEntity, source);
      // Set the output of the source TODO: This does not seem super clean
      source.output = newEntity.id;
    }
  }
}
