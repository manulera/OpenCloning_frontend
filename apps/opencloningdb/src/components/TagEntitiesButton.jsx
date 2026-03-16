import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, FormControl, Alert } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import TagMultiSelect from './TagMultiSelect';


export default function TagEntitiesButton({ selectedEntities, entityType, label, onSuccess }) {
  const [openDialog, setOpenDialog] = React.useState(false);

  if (selectedEntities.length < 1) {
    return null;
  }

  const handleClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Button
        variant="contained"
        disabled={selectedEntities.length === 0}
        sx={{ mb: 1 }}
        onClick={() => {
          setOpenDialog(true);
        }}
      >
        Tag {label}
      </Button>
      <TagEntitiesDialog selectedEntities={selectedEntities} entityType={entityType} label={label} open={openDialog} onClose={handleClose} onSuccess={onSuccess} />
    </>
  );
}

function TagEntitiesDialog({ selectedEntities, entityType, label, open, onClose, onSuccess }) {
  const [tags, setTags] = React.useState([]);
  const queryClient = useQueryClient();

  const attachTagsMutation = useMutation({
    mutationFn: async ({ entities, tagIds }) => {
      const requests = [];
      entities.forEach((entity) => {
        tagIds.forEach((tagId) => {
          // Skip if entity already has tag
          if (entity.tags?.some((t) => t.id === tagId)) {
            return;
          }

          let url;
          if (entityType === 'lines') {
            url = endpoints.lineTags(entity.id);
          } else if (entityType === 'input_entities') {
            url = endpoints.inputEntityTags(entity.id);
          } else {
            throw new Error(`Tagging not implemented for entity type: ${entityType}`);
          }

          const body = { tag_id: tagId };
          requests.push(openCloningDBHttpClient.post(url, body));
        });
      });

      await Promise.all(requests);
    },
    onSuccess: (_data, variables) => {
      // Refresh queries depending on entity type
      if (entityType === 'lines') {
        queryClient.invalidateQueries({ queryKey: ['lines'] });
        variables.entities.forEach((entity) => {
          queryClient.invalidateQueries({ queryKey: ['line', String(entity.id)] });
        });
      } else if (entityType === 'input_entities') {
        queryClient.invalidateQueries({ queryKey: ['sequences'] });
        queryClient.invalidateQueries({ queryKey: ['primers'] });
        variables.entities.forEach((entity) => {
          queryClient.invalidateQueries({ queryKey: ['sequence', String(entity.id)] });
          queryClient.invalidateQueries({ queryKey: ['primer', String(entity.id)] });
        });
      }
      setTags([]);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tags.length || !selectedEntities.length || attachTagsMutation.isPending) return;
    attachTagsMutation.mutate({
      entities: selectedEntities,
      tagIds: tags,
    });
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Tag {label}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <TagMultiSelect
              value={tags}
              onChange={(value) => {
                setTags(value);
              }}
            />
          </FormControl>
          {attachTagsMutation.isError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {attachTagsMutation.error?.response?.data?.detail ||
                attachTagsMutation.error?.message ||
                'Failed to tag entities'}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!tags.length || attachTagsMutation.isPending}
            >
              {attachTagsMutation.isPending ? 'Tagging…' : 'Tag'}
            </Button>
          </FormControl>
        </form>
      </DialogContent>
    </Dialog>
  );
}
