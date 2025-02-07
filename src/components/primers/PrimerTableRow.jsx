import { IconButton, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import DialogSubmitToElab from '../form/eLabFTW/DialogSubmitToElab';

function PrimerTableRow({ primer, deletePrimer, canBeDeleted, onEditClick }) {
  const [saveToDatabaseDialogOpen, setSaveToDatabaseDialogOpen] = useState(false);

  React.useEffect(() => {
    if (!primer.database_id) {
      setSaveToDatabaseDialogOpen(false);
    }
  }, [primer.database_id]);

  let deleteMessage;
  if (!canBeDeleted) {
    deleteMessage = primer.database_id ? 'Cannot remove primer in use from session' : 'Cannot delete primer in use';
  } else {
    deleteMessage = primer.database_id ? 'Remove from session' : 'Delete';
  }

  return (
    <tr>
      <td className="icons">
        <Tooltip arrow title={deleteMessage} placement="top">
          <IconButton onClick={() => (canBeDeleted && deletePrimer(primer.id))}>
            {primer.database_id ? <ClearIcon /> : <DeleteIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={primer.database_id ? 'In eLabFTW database' : 'Edit'} placement="top">
          {primer.database_id ? (
            <IconButton sx={{ cursor: 'default' }}>
              <SaveIcon color="success" />
            </IconButton>
          ) : (
            <IconButton onClick={() => (onEditClick(primer.id))}>
              <EditIcon />
            </IconButton>
          )}
        </Tooltip>
        {!primer.database_id && (
          <>
            <Tooltip arrow title="Save to eLabFTW" placement="top">
              <IconButton onClick={() => setSaveToDatabaseDialogOpen(true)}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <DialogSubmitToElab
              id={primer.id}
              dialogOpen={saveToDatabaseDialogOpen}
              setDialogOpen={setSaveToDatabaseDialogOpen}
              resourceType="primer"
            />
          </>
        )}
      </td>
      <td className="name">{primer.name}</td>
      <td className="sequence">{primer.sequence}</td>
    </tr>
  );
}

export default PrimerTableRow;
