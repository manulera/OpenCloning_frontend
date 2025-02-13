import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';
import { batch, useDispatch, useStore } from 'react-redux';
import useDatabase from '../../hooks/useDatabase';
import { cloningActions } from '../../store/cloning';
import { getSubState } from '../../utils/thunks';

function SubmitToDatabaseDialog({ id, dialogOpen, setDialogOpen, resourceType }) {
  const dispatch = useDispatch();
  const store = useStore();
  const [submissionData, setSubmissionData] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const database = useDatabase();

  const handleClose = () => {
    setDialogOpen(false);
    setErrorMessage('');
  };

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        sx: { width: '40%' },
        onSubmit: async (event) => {
          event.preventDefault();
          // This should never happen
          if (!database.isSubmissionDataValid(submissionData)) {
            setErrorMessage('Submission data is invalid');
            return;
          }
          try {
            if (resourceType === 'primer') {
              const oldPrimer = store.getState().cloning.primers.find((p) => p.id === id);
              const primerDatabaseId = await database.submitPrimerToDatabase({ submissionData, primer: oldPrimer });
              const newPrimer = { ...oldPrimer, database_id: primerDatabaseId };
              batch(() => {
                dispatch(cloningActions.editPrimer(newPrimer));
                dispatch(cloningActions.addAlert({
                  message: 'Primer created successfully',
                  severity: 'success',
                }));
              });
            } else if (resourceType === 'sequence') {
              const substate = getSubState(store.getState(), id);
              const { databaseId, primerMappings } = await database.submitSequenceToDatabase({ submissionData, substate, id });

              batch(() => {
                primerMappings.forEach((mapping) => dispatch(cloningActions.addDatabaseIdToPrimer(mapping)));
                dispatch(cloningActions.addDatabaseIdToEntity({ databaseId, id }));
                dispatch(cloningActions.addAlert({
                  message: 'Sequence created successfully',
                  severity: 'success',
                }));
              });
            }
          } catch (error) {
            setErrorMessage(error.message);
            return;
          }
          setDialogOpen(false);
          setErrorMessage('');
        },
      }}
    >
      <DialogTitle>{`Save ${resourceType} to ${database.name}`}</DialogTitle>
      <DialogContent>
        <database.SubmitToDatabaseComponent id={id} submissionData={submissionData} setSubmissionData={setSubmissionData} resourceType={resourceType} />
        {resourceType === 'sequence' && <database.PrimersNotInDabaseComponent id={id} submissionData={submissionData} setSubmissionData={setSubmissionData} />}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={submissionData === null || !database.isSubmissionDataValid(submissionData)}>Submit</Button>
      </DialogActions>
    </Dialog>

  );
}

export default SubmitToDatabaseDialog;
