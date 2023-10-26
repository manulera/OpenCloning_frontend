import React from 'react';

const TabPanel = React.forwardRef(({ children, value, index, ...other }, ref) => {
  const style = (value === index) ? { visibility: 'visible' } : { visibility: 'hidden', height: 0, overflow: 'hidden' };

  return (
    <div
      role="tabpanel"
      style={style}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
});

export default TabPanel;
