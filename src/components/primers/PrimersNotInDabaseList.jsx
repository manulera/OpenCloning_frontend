import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import { getSubState } from '../../utils/thunks';
import { getUsedPrimerIds } from '../../store/cloning_utils';
import ElabFTWCategorySelect from '../form/eLabFTW/ElabFTWCategorySelect';

const apiKey = import.meta.env.VITE_ELABFTW_API_WRITE_KEY;

function PrimersNotInDabaseList({ id, primerCategoryId, setPrimerCategoryId }) {
  const primers = useSelector((state) => {
    const subState = getSubState(state, id);
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

      <ElabFTWCategorySelect
        setCategory={(c) => setPrimerCategoryId(c.id)}
        apiKey={apiKey}
        label="Save primers as"
        fullWidth
      />

    </Alert>
  );
}

export default PrimersNotInDabaseList;
