import React from 'react';

function AssemblyPlanDisplayer({
  source,
}) {
  if (!source.assembly) {
    return null;
  }

  const fragments = source.assembly.map((fragment) => {
    const { sequence, left_location, right_location, reverse_complemented } = fragment;
    const leftPart = left_location || '';
    const rightPart = right_location || '';
    return `${sequence}${reverse_complemented ? '_rc' : ''}[${leftPart},${rightPart}]`;
  });

  // Join left-right pairs with

  return (
    <div className="assembly-plan-displayer">
      {fragments.join(' - ')}
    </div>
  );
}

export default React.memo(AssemblyPlanDisplayer);
