import React from 'react';
import { stringIsNotDNA } from '@opencloning/store/cloning_utils';

export default function useSpacers({ initialLength, circularAssembly, templateSequenceIdsLength }) {
  const [spacers, setSpacers] = React.useState(Array(initialLength).fill(''));

  const spacersAreValid = React.useMemo(
    () => spacers.every((spacer) => !stringIsNotDNA(spacer)),
    [spacers],
  );

  React.useEffect(() => {
    if (circularAssembly && spacers.length !== templateSequenceIdsLength) {
      setSpacers((current) => current.slice(1));
    }
    if (!circularAssembly && spacers.length !== templateSequenceIdsLength + 1) {
      setSpacers((current) => ['', ...current]);
    }
  }, [circularAssembly, spacers, templateSequenceIdsLength]);

  return { spacers, setSpacers, spacersAreValid };
}
