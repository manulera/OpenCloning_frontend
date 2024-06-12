import { Alert, Tooltip } from '@mui/material';
import React from 'react';

function TemplateSequence({ entity }) {
  let svgContent = null;
  let tooltipText = null;

  if (entity.circular === true) {
    tooltipText = 'Circular sequence expected';
    svgContent = <circle cx="60" cy="60" r="40" stroke="lightgrey" strokeWidth="9" fill="none" />;
  } else if (entity.circular === false) {
    svgContent = <line x1="10" y1="60" x2="140" y2="60" stroke="lightgrey" strokeWidth="9" />;
    tooltipText = 'Linear sequence expected';
  } else {
    svgContent = (
      <>
        <circle cx="30" cy="40" r="25" stroke="lightgrey" strokeWidth="5" fill="none" />
        <line x1="10" y1="110" x2="110" y2="20" stroke="grey" strokeWidth="2" />
        <line x1="60" y1="90" x2="110" y2="90" stroke="lightgrey" strokeWidth="5" />
      </>
    );
    tooltipText = 'Linear/circular sequence expected';
  }
  const toolTipElement = <div style={{ fontSize: 'medium' }}>{tooltipText}</div>;
  return (
    <div>
      <Tooltip title={toolTipElement}>
        <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
          {svgContent}
        </svg>
      </Tooltip>
      {entity.primer_design && (
      <Alert severity="info">
        Use me as input to
        <br />
        {' '}
        activate the primer designer!
      </Alert>
      )}
    </div>
  );
}

export default React.memo(TemplateSequence);
