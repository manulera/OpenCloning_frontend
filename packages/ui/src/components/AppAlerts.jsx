import { Alert } from '@mui/material';
import { isEqual } from 'lodash-es';
import React from 'react';
import { useSelector } from 'react-redux';
import useAlerts from '../hooks/useAlerts';
import ExternalServicesStatusCheck from './ExternalServicesStatusCheck';

function AppAlerts() {
  const { alerts } = useSelector((state) => state.cloning, isEqual);
  const { removeAlert } = useAlerts();
  return (
    <div id="global-error-message-wrapper">
      {alerts.map((alert, index) => (<Alert key={index} severity={alert.severity} onClose={() => { removeAlert(alert.message); }}>{alert.message}</Alert>))}
      <ExternalServicesStatusCheck />
    </div>
  );
}

export default AppAlerts;
