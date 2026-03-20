import React from 'react'
import TagChip from './TagChip'
import { Box, Chip, Tooltip } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useAppAlerts from '../hooks/useAppAlerts';
import { Add as AddIcon } from '@mui/icons-material';
import TagEntitiesDialog from './TagEntitiesDialog';



function TagChipList({tags, entityId=null, entityType=null}) {
  // If id is passed, it can edit the tags
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = React.useState(false);
  const addTagMutation = useMutation({
    mutationFn: async (tagId) => {
      let url;
      if (entityType === 'lines') {
        url = endpoints.lineTags(entityId);
      } else if (entityType === 'input_entities') {
        url = endpoints.inputEntityTags(entityId);
      } else {
        throw new Error(`Tagging not implemented for entity type: ${entityType}`);
      }

      await openCloningDBHttpClient.post(url, { tag_id: tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['sequence', entityId, 'cloning_strategy'] });
      queryClient.invalidateQueries({ queryKey: ['line', entityId] });
      queryClient.invalidateQueries({ queryKey: ['primer', entityId] });
    },
    onError: (error) => {
      addAlert({ message: error?.response?.data?.detail || error?.message || 'Failed to add tag', severity: 'error' });
    },
  });


  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['sequence', entityId, 'cloning_strategy'] });
    queryClient.invalidateQueries({ queryKey: ['line', entityId] });
    queryClient.invalidateQueries({ queryKey: ['primer', entityId] });
    addAlert({ message: 'Tag added successfully', severity: 'success' });
  };
  if (!tags?.length) return '—';
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    {tags.sort((a, b) => a.name.localeCompare(b.name)).map((tag) => <TagChip key={tag.id} tag={tag} />)}
    {entityId && entityType && (
      <>
        <Tooltip title="Add tag" arrow placement="right">
          <Chip
            size="small"
            label={<AddIcon fontSize="small" />}
            onClick={() => setOpenDialog(true)}
          />
        </Tooltip>
        <TagEntitiesDialog
          selectedEntities={[{id: entityId}]}
          entityType={entityType}
          label="Tag"
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onSuccess={onSuccess}
          excludeTagIds={tags.map((tag) => tag.id)}
        />
      </>
    )}
  </Box>
}

export default TagChipList
