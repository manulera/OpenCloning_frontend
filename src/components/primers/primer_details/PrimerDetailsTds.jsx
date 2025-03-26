import { Skeleton } from '@mui/material';
import React from 'react';
import { formatGcContent, formatMeltingTemperature } from './primerDetailsFormatting';

function PrimerDetailsTds({ primerDetails, pcrDetails }) {
  // A primer could be involved in multiple PCR reactions, so we pick the one in which it has the longest
  // annealing length for display in the table.
  const firstPCRDetails = pcrDetails[0];

  let thisPrimerPCRInfo = null;
  if (firstPCRDetails) {
    thisPrimerPCRInfo = firstPCRDetails.fwdPrimer.id === primerDetails.id ? firstPCRDetails.fwdPrimer : firstPCRDetails.rvsPrimer;
  }

  const loadingOrErrorComponent = <Skeleton variant="text" height={20} />;

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
      <td style={{ whiteSpace: 'nowrap' }} className="length">{length || loadingOrErrorComponent}</td>
      <td style={{ whiteSpace: 'nowrap' }} className="melting-temperature">{meltingTemperature || loadingOrErrorComponent}</td>
      <td style={{ whiteSpace: 'nowrap' }} className="gc-content">{gcContent || loadingOrErrorComponent}</td>
    </>
  );
}

export default PrimerDetailsTds;
