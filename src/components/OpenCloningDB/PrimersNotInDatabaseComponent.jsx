import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import { getSubState } from '../../utils/network';

function PrimersNotInDatabaseComponent({ id, submissionData, setSubmissionData }) {
  const primers = useSelector((state) => {
    const subState = getSubState(state, id, true);
    return subState.primers.filter((p) => !p.database_id);
  });

  if (primers.length === 0) return null;

  return (
    <Alert
      severity="info"
      sx={{
        marginTop: 2,
        paddingY: 1,
        width: '100%',
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
      icon={false}
    >
      <div>Primers will be saved to the database, consider changing their name</div>

    </Alert>
  );
}

export default PrimersNotInDatabaseComponent;
