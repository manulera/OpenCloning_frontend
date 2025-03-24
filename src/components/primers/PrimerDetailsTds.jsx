import { Skeleton, Tooltip, IconButton } from '@mui/material';
import React from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { usePrimerDetails } from './usePrimerDetails';

function PrimerDetailsTds({ primer }) {
  const { getPrimerDetails } = usePrimerDetails();
  const [primerDetails, setPrimerDetails] = React.useState({ status: 'loading' });
  const [connectionAttempt, setConnectionAttempt] = React.useState(0);
  const retryGetPrimerDetails = () => setConnectionAttempt((prev) => prev + 1);

  React.useEffect(() => {
    const fetchPrimerDetails = async () => {
      try {
        const details = await getPrimerDetails(primer.sequence);
        setPrimerDetails({ status: 'success', ...details });
      } catch (error) {
        console.error(error);
        setPrimerDetails({ status: 'error', error });
      }
    };
    fetchPrimerDetails();
  }, [primer.sequence, connectionAttempt]);
  const loadingOrErrorComponent = primerDetails.status === 'loading' ? (
    <Skeleton variant="text" height={20} />
  ) : (
    <Tooltip title="Retry request to get primer details" placement="top" arrow>
      <IconButton onClick={retryGetPrimerDetails}>
        <ErrorIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle', padding: 0 }} />
      </IconButton>
    </Tooltip>
  );
  return (
    <>
      <td className="melting-temperature">{primerDetails.status === 'success' ? primerDetails.melting_temperature : loadingOrErrorComponent}</td>
      <td className="gc-content">{primerDetails.status === 'success' ? primerDetails.gc_content : loadingOrErrorComponent}</td>
    </>
  );
}

export default PrimerDetailsTds;
