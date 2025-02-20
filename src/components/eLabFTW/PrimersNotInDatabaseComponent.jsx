import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import { getSubState } from '../../utils/thunks';
import { getUsedPrimerIds } from '../../store/cloning_utils';
import ELabFTWCategorySelect from './ELabFTWCategorySelect';

function PrimersNotInDabaseComponent({ id, submissionData, setSubmissionData }) {
  const primerCategoryId = submissionData?.primerCategoryId;
  const primers = useSelector((state) => {
    const subState = getSubState(state, id, true);
    const primersInUse = getUsedPrimerIds(subState.sources);
    return subState.primers.filter((p) => !p.database_id && primersInUse.includes(p.id));
  });

  if (primers.length === 0) return null;

  return (
    <Alert
      severity={primerCategoryId ? 'success' : 'info'}
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
      {!primerCategoryId && (
        <>
          <div>Do you want used primers to be saved to the database?</div>
          <ul>
            {primers.map((primer) => (
              <li key={primer.id}>
                {primer.name}
              </li>
            ))}
          </ul>
        </>
      )}

      <ELabFTWCategorySelect
        setCategory={(c) => {
          setSubmissionData((prev) => ({ ...prev, primerCategoryId: c ? c.id : null }));
        }}
        label="Save primers as"
        fullWidth
      />

    </Alert>
  );
}

export default PrimersNotInDabaseComponent;
