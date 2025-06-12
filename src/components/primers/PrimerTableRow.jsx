import { IconButton, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import SubmitToDatabaseDialog from '../form/SubmitToDatabaseDialog';
import useDatabase from '../../hooks/useDatabase';
import PrimerDetailsTds from './primer_details/PrimerDetailsTds';
import PrimerInfoIcon from './primer_details/PrimerInfoIcon';

function PrimerTableRow({ primerDetails, deletePrimer, canBeDeleted, onEditClick, pcrDetails }) {
  const [saveToDatabaseDialogOpen, setSaveToDatabaseDialogOpen] = useState(false);

  const database = useDatabase();

  React.useEffect(() => {
    if (!primerDetails.database_id) {
      setSaveToDatabaseDialogOpen(false);
    }
  }, [primerDetails.database_id]);

  const isSavedToDatabase = database && primerDetails.database_id !== null;

  let deleteMessage;
  if (!canBeDeleted) {
    deleteMessage = isSavedToDatabase ? 'Cannot remove primer in use from session' : 'Cannot delete primer in use';
  } else {
    deleteMessage = isSavedToDatabase ? 'Remove from session' : 'Delete';
  }

  return (
    <tr>
      <td className="icons">
        <Tooltip arrow title={deleteMessage} placement="top">
          <IconButton onClick={() => (canBeDeleted && deletePrimer(primerDetails.id))}>
            {isSavedToDatabase ? <ClearIcon /> : <DeleteIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={isSavedToDatabase ? `Stored in ${database.name}` : 'Edit'} placement="top">
          {isSavedToDatabase ? (
            <IconButton
              onClick={() => window.open(database.getPrimerLink(primerDetails.database_id), '_blank')}
              sx={{ cursor: 'pointer' }}
            >
              <SaveIcon color="success" />
            </IconButton>
          ) : (
            <IconButton onClick={() => (onEditClick(primerDetails.id))}>
              <EditIcon />
            </IconButton>
          )}
        </Tooltip>
        <PrimerInfoIcon primerDetails={primerDetails} pcrDetails={pcrDetails} />
        {database && !primerDetails.database_id && (
          <>
            <Tooltip arrow title={`Save to ${database.name}`} placement="top">
              <IconButton onClick={() => setSaveToDatabaseDialogOpen(true)}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            {saveToDatabaseDialogOpen && (
              <SubmitToDatabaseDialog
                id={primerDetails.id}
                dialogOpen={saveToDatabaseDialogOpen}
                setDialogOpen={setSaveToDatabaseDialogOpen}
                resourceType="primer"
              />
            )}
          </>
        )}
      </td>
      <td className="name">{primerDetails.name}</td>
      <PrimerDetailsTds
        primerId={primerDetails.id}
        primerDetails={primerDetails}
        pcrDetails={pcrDetails}
      />
      <td className="sequence">{primerDetails.sequence}</td>
    </tr>
  );
}

export default PrimerTableRow;
