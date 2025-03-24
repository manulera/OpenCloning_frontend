import { IconButton, Skeleton, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import ErrorIcon from '@mui/icons-material/Error';
import SubmitToDatabaseDialog from '../form/SubmitToDatabaseDialog';
import useDatabase from '../../hooks/useDatabase';
import { usePrimerDetails } from './usePrimerDetails';

function PrimerTableRow({ primer, deletePrimer, canBeDeleted, onEditClick }) {
  const [saveToDatabaseDialogOpen, setSaveToDatabaseDialogOpen] = useState(false);
  const [primerDetails, retryGetPrimerDetails] = usePrimerDetails(primer.sequence);
  const database = useDatabase();

  const loadingOrErrorComponent = primerDetails.status === 'loading' ? (
    <Skeleton variant="text" height={20} />
  ) : (
    <Tooltip title="Retry request to get primer details" placement="top" arrow>
      <IconButton onClick={retryGetPrimerDetails}>
        <ErrorIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle', padding: 0 }} />
      </IconButton>
    </Tooltip>
  );

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
        <Tooltip arrow title={primer.database_id ? `Stored in ${database.name}` : 'Edit'} placement="top">
          {primer.database_id ? (
            <IconButton
              onClick={() => window.open(database.getPrimerLink(primer.database_id), '_blank')}
              sx={{ cursor: 'pointer' }}
            >
              <SaveIcon color="success" />
            </IconButton>
          ) : (
            <IconButton onClick={() => (onEditClick(primer.id))}>
              <EditIcon />
            </IconButton>
          )}
        </Tooltip>
        {database && !primer.database_id && (
          <>
            <Tooltip arrow title={`Save to ${database.name}`} placement="top">
              <IconButton onClick={() => setSaveToDatabaseDialogOpen(true)}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            {saveToDatabaseDialogOpen && (
              <SubmitToDatabaseDialog
                id={primer.id}
                dialogOpen={saveToDatabaseDialogOpen}
                setDialogOpen={setSaveToDatabaseDialogOpen}
                resourceType="primer"
              />
            )}
          </>
        )}
      </td>
      <td className="name">{primer.name}</td>
      <td className="melting-temperature">{primerDetails.status === 'success' ? primerDetails.melting_temperature : loadingOrErrorComponent}</td>
      <td className="gc-content">{primerDetails.status === 'success' ? primerDetails.gc_content : loadingOrErrorComponent}</td>
      <td className="sequence">{primer.sequence}</td>
    </tr>
  );
}

export default PrimerTableRow;
