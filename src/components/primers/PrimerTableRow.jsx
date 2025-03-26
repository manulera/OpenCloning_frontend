import { IconButton, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { useSelector } from 'react-redux';
import SubmitToDatabaseDialog from '../form/SubmitToDatabaseDialog';
import useDatabase from '../../hooks/useDatabase';
import PrimerDetailsTds from './primer_details/PrimerDetailsTds';
import PrimerInfoIcon from './primer_details/PrimerInfoIcon';
import { getSourcesWherePrimerIsUsed } from '../../store/cloning_utils';
import { usePCRDetails } from './primer_details/usePCRDetails';

function PrimerTableRow({ primerDetails, deletePrimer, canBeDeleted, onEditClick }) {
  const [saveToDatabaseDialogOpen, setSaveToDatabaseDialogOpen] = useState(false);
  const pcrSourceIds = useSelector((state) => {
    const pcrs = getSourcesWherePrimerIsUsed(state.cloning.sources, primerDetails.id).filter((s) => s.type === 'PCRSource');
    return pcrs.map((s) => s.id);
  });
  const { pcrDetails, retryGetPCRDetails } = usePCRDetails(pcrSourceIds);
  const database = useDatabase();

  React.useEffect(() => {
    if (!primerDetails.database_id) {
      setSaveToDatabaseDialogOpen(false);
    }
  }, [primerDetails.database_id]);

  let deleteMessage;
  if (!canBeDeleted) {
    deleteMessage = primerDetails.database_id ? 'Cannot remove primer in use from session' : 'Cannot delete primer in use';
  } else {
    deleteMessage = primerDetails.database_id ? 'Remove from session' : 'Delete';
  }

  return (
    <tr>
      <td className="icons">
        <Tooltip arrow title={deleteMessage} placement="top">
          <IconButton onClick={() => (canBeDeleted && deletePrimer(primerDetails.id))}>
            {primerDetails.database_id ? <ClearIcon /> : <DeleteIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={primerDetails.database_id ? `Stored in ${database.name}` : 'Edit'} placement="top">
          {primerDetails.database_id ? (
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
        retryGetPCRDetails={retryGetPCRDetails}
      />
      <td className="sequence">{primerDetails.sequence}</td>
    </tr>
  );
}

export default PrimerTableRow;
