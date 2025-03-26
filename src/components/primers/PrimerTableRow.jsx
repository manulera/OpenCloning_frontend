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
import { useSinglePrimerSequenceDetails } from './primer_details/useSinglePrimerSequenceDetails';
import { getSourcesWherePrimerIsUsed } from '../../store/cloning_utils';
import { usePCRDetails } from './primer_details/usePCRDetails';

function PrimerTableRow({ primer, deletePrimer, canBeDeleted, onEditClick }) {
  const [saveToDatabaseDialogOpen, setSaveToDatabaseDialogOpen] = useState(false);
  const { primerDetails, retryGetPrimerDetails } = useSinglePrimerSequenceDetails(primer.sequence);
  const pcrSourceIds = useSelector((state) => {
    const pcrs = getSourcesWherePrimerIsUsed(state.cloning.sources, primer.id).filter((s) => s.type === 'PCRSource');
    return pcrs.map((s) => s.id);
  });
  const { pcrDetails, retryGetPCRDetails } = usePCRDetails(pcrSourceIds);
  const database = useDatabase();

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
        <PrimerInfoIcon primer={primer} primerDetails={primerDetails} pcrDetails={pcrDetails} />
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
      <PrimerDetailsTds
        primerId={primer.id}
        primerDetails={primerDetails}
        retryGetPrimerDetails={retryGetPrimerDetails}
        pcrDetails={pcrDetails}
        retryGetPCRDetails={retryGetPCRDetails}
      />
      <td className="sequence">{primer.sequence}</td>
    </tr>
  );
}

export default PrimerTableRow;
