import React from 'react'
import TagChip from './TagChip'

function TagChipList({tags}) {
  if (!tags?.length) return '—';
  return <>
    {tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
  </>
}

export default TagChipList
