import { Skeleton, Tooltip, IconButton } from '@mui/material';
import React from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { formatGcContent, formatMeltingTemperature } from './primerDetailsFormatting';

function PrimerDetailsTds({ primerId, primerDetails, retryGetPrimerDetails, pcrDetails, retryGetPCRDetails }) {
  // A primer could be involved in multiple PCR reactions, so we pick the one in which it has the longest
  // annealing length for display in the table.
  const longestPcrDetails = pcrDetails.reduce((longest, current) => {
    const currentLength = current.fwdPrimer.id === primerId ? current.fwdPrimer.length : current.rvsPrimer.length;
    const longestLength = longest.fwdPrimer.id === primerId ? longest.fwdPrimer.length : longest.rvsPrimer.length;
    return currentLength > longestLength ? current : longest;
  }, pcrDetails[0]);

  let thisPrimerPCRInfo = null;
  if (longestPcrDetails) {
    thisPrimerPCRInfo = longestPcrDetails.fwdPrimer.id === primerId ? longestPcrDetails.fwdPrimer : longestPcrDetails.rvsPrimer;
  }

  const loadingOrErrorComponent = primerDetails.status === 'loading' ? (
    <Skeleton variant="text" height={20} />
  ) : (
    <Tooltip title="Retry request to get primer details" placement="top" arrow>
      <IconButton onClick={() => {
        retryGetPrimerDetails();
        retryGetPCRDetails();
      }}
      >
        <ErrorIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle', padding: 0 }} />
      </IconButton>
    </Tooltip>
  );

  let meltingTemperature = formatMeltingTemperature(primerDetails?.melting_temperature);
  let gcContent = formatGcContent(primerDetails?.gc_content);
  let length = primerDetails?.length;
  if (thisPrimerPCRInfo) {
    // We pick the pair with the highest binding length for display here
    meltingTemperature = `${formatMeltingTemperature(thisPrimerPCRInfo.melting_temperature)} (${meltingTemperature})`;
    gcContent = `${formatGcContent(thisPrimerPCRInfo.gc_content)} (${gcContent})`;
    length = `${thisPrimerPCRInfo.length} (${length})`;
  }
  return (
    <>
      <td style={{ whiteSpace: 'nowrap' }} className="length">{primerDetails.status === 'success' ? length : loadingOrErrorComponent}</td>
      <td style={{ whiteSpace: 'nowrap' }} className="melting-temperature">{primerDetails.status === 'success' ? meltingTemperature : loadingOrErrorComponent}</td>
      <td style={{ whiteSpace: 'nowrap' }} className="gc-content">{primerDetails.status === 'success' ? gcContent : loadingOrErrorComponent}</td>
    </>
  );
}

export default PrimerDetailsTds;
