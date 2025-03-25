import React from 'react';
import { isEqual } from 'lodash-es';
import { useSelector } from 'react-redux';
import { getPrimerBindingInfoFromSource } from '../../../store/cloning_utils';
import { usePrimerDetailsEndpoints } from './usePrimerDetailsEndpoints';

export function usePCRDetails(sourceIds) {
  const [pcrDetails, setPcrDetails] = React.useState([]);
  const [connectionAttempt, setConnectionAttempt] = React.useState(0);
  const retryGetPCRDetails = () => setConnectionAttempt((prev) => prev + 1);

  const { getPrimerDetails, getHeterodimerDetails } = usePrimerDetailsEndpoints();
  const bindingInfos = useSelector((state) => {
    const { primers, sources, teselaJsonCache } = state.cloning;
    return sourceIds.map((sourceId) => {
      const source = sources.find((s) => s.id === sourceId);
      const sequenceLength = teselaJsonCache[source.input[0]].size;
      return getPrimerBindingInfoFromSource(primers, source, sequenceLength);
    });
  }, isEqual);

  React.useEffect(() => {
    const fetchPrimerDetails = async (bindingInfo) => {
      let fwdPrimer = await getPrimerDetails(bindingInfo.fwdPrimer.sequence.slice(-bindingInfo.fwdLength));
      fwdPrimer = { ...fwdPrimer, ...bindingInfo.fwdPrimer };
      let rvsPrimer = await getPrimerDetails(bindingInfo.rvsPrimer.sequence.slice(-bindingInfo.rvsLength));
      rvsPrimer = { ...rvsPrimer, ...bindingInfo.rvsPrimer };
      const heterodimer = await getHeterodimerDetails(bindingInfo.fwdPrimer.sequence, bindingInfo.rvsPrimer.sequence);
      return { sourceId: bindingInfo.sourceId, fwdPrimer, rvsPrimer, heterodimer };
    };
    const getAllDetails = async () => {
      const details = await Promise.all(bindingInfos.map(fetchPrimerDetails));
      setPcrDetails(details);
    };
    getAllDetails();
  }, [bindingInfos, connectionAttempt]);

  return { pcrDetails, retryGetPCRDetails };
}
