import { Skeleton, Tooltip, IconButton } from '@mui/material';
import React from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { useSelector } from 'react-redux';
import { usePrimerDetails } from './usePrimerDetails';
import { getPrimerBindingLength, getSourcesWherePrimerIsUsed } from '../../../store/cloning_utils';
import { formatGcContent, formatMeltingTemperature } from './primerDetailsFormatting';

function PrimerDetailsTds({ primer, primerDetails, setPrimerDetails }) {
  const { getPrimerDetails } = usePrimerDetails();
  const [connectionAttempt, setConnectionAttempt] = React.useState(0);
  const primerBindingLenght = useSelector((state) => {
    const sources = getSourcesWherePrimerIsUsed(state.cloning.sources, primer.id);
    const { primers } = state.cloning;
    const bindingLengths = sources.map((source) => getPrimerBindingLength(primers, source, primer.id, state.cloning.teselaJsonCache[source.input[0]]));
    if (bindingLengths.length === 0) {
      return 0;
    }
    return Math.max(...bindingLengths);
  });

  const retryGetPrimerDetails = () => setConnectionAttempt((prev) => prev + 1);

  React.useEffect(() => {
    const fetchPrimerDetails = async () => {
      try {
        const details = await getPrimerDetails(primer.sequence);
        if (primerBindingLenght) {
          const bindingDetails = await getPrimerDetails(primer.sequence.slice(-primerBindingLenght));
          details.binding_melting_temperature = bindingDetails.melting_temperature;
          details.binding_gc_content = bindingDetails.gc_content;
          details.binding_length = primerBindingLenght;
        }
        setPrimerDetails({ status: 'success', ...details });
      } catch (error) {
        console.error(error);
        setPrimerDetails({ status: 'error', error });
      }
    };
    fetchPrimerDetails();
  }, [primer.sequence, connectionAttempt, primerBindingLenght]);

  const loadingOrErrorComponent = primerDetails.status === 'loading' ? (
    <Skeleton variant="text" height={20} />
  ) : (
    <Tooltip title="Retry request to get primer details" placement="top" arrow>
      <IconButton onClick={retryGetPrimerDetails}>
        <ErrorIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle', padding: 0 }} />
      </IconButton>
    </Tooltip>
  );
  let meltingTemperature = formatMeltingTemperature(primerDetails?.melting_temperature);
  if (primerBindingLenght) {
    meltingTemperature = `${formatMeltingTemperature(primerDetails.binding_melting_temperature)} (${formatMeltingTemperature(primerDetails.melting_temperature)})`;
  }
  let gcContent = formatGcContent(primerDetails?.gc_content);
  if (primerBindingLenght) {
    gcContent = `${formatGcContent(primerDetails.binding_gc_content)} (${formatGcContent(primerDetails.gc_content)})`;
  }
  let length = primerDetails?.length;
  if (primerBindingLenght) {
    length = `${primerDetails.binding_length} (${primerDetails.length})`;
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
