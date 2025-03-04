import { Alert, Button, CircularProgress } from '@mui/material';
import React from 'react';
import useBackendRoute from '../hooks/useBackendRoute';
import useHttpClient from '../hooks/useHttpClient';

function ExternalServicesStatusCheck() {
  const [servicesDown, setServicesDown] = React.useState([]);
  const [connectAttempt, setConnectAttemp] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  React.useEffect(() => {
    setLoading(true);
    const checkServices = async () => {
      const services = [
        {
          message: 'Backend server is down',
          url: backendRoute(''),
          check: (resp) => resp.status === 200,
        },
      ];
      const downServices = [];
      await Promise.all(
        services.map(async (service) => {
          try {
            const resp = await httpClient.get(service.url);
            if (!service.check(resp)) {
              downServices.push(service);
            }
          } catch (error) {
            downServices.push(service);
          }
        }),
      );
      setServicesDown(downServices);
      setLoading(false);
      if (connectAttempt > 0 && downServices.length === 0) {
        setSuccessMessage('All services are up and running!');
      }
    };
    checkServices();
  }, [connectAttempt]);
  if (successMessage) {
    return (
      <Alert severity="success" className="service-status-check-alert" onClose={() => setSuccessMessage('')}>
        {successMessage}
      </Alert>
    );
  }
  if (servicesDown.length > 0) {
    return (
      <Alert
        severity="error"
        className="service-status-check-alert"
        action={(
          <div>
            {loading ? (
              <CircularProgress color="inherit" size="2em" />
            ) : (
              <Button color="inherit" size="small" onClick={() => setConnectAttemp((prev) => prev + 1)}>
                RE-CHECK
              </Button>
            )}
          </div>
        )}
      >
        <div>
          {servicesDown.map((service) => (
            <div key={service.message}>{service.message}</div>
          ))}
        </div>
      </Alert>
    );
  }
  return null;
}

export default ExternalServicesStatusCheck;
