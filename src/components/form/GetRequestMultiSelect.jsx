import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Alert, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

export default function GetRequestMultiSelect({ getOptionsFromResponse, url, label, messages, onChange, httpClient, multiple = true, autoComplete = true, getOptionLabel, requestHeaders = {}, ...rest }) {
  const { loadingMessage, errorMessage } = messages;
  const [options, setOptions] = React.useState([]);
  const [connectAttempt, setConnectAttemp] = React.useState(0);
  const [error, setError] = React.useState(false);
  const [waitingMessage, setWaitingMessage] = React.useState(loadingMessage);

  React.useEffect(() => {
    httpClient.get(url, { headers: requestHeaders }).then(({ data }) => {
      setWaitingMessage(null);
      setOptions(getOptionsFromResponse(data));
      setError(false);
    }).catch((e) => { setWaitingMessage(errorMessage); setError(true); });
  }, [connectAttempt]);

  if (error) {
    return (
      <Alert
        sx={{ alignItems: 'center' }}
        severity="error"
        action={(
          <Button color="inherit" size="small" onClick={() => { setWaitingMessage('Retrying...'); setConnectAttemp(connectAttempt + 1); }}>
            Retry
          </Button>
        )}
      >
        {waitingMessage}
      </Alert>
    );
  }

  if (waitingMessage) {
    return (

      <Alert severity="info" icon={<CircularProgress color="inherit" size="1em" />}>
        {waitingMessage}
      </Alert>

    );
  }

  return (
    <FormControl {...rest}>
      {autoComplete ? (
        <Autocomplete
          multiple={multiple}
          onChange={(event, value) => { onChange(value); }}
          id="tags-standard"
          options={options}
          getOptionLabel={getOptionLabel}
          defaultValue={multiple ? [] : ''}
          freeSolo
          forcePopupIcon
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              helperText={waitingMessage}
              error={error}
            />
          )}
        />
      ) : (
        <>
          <InputLabel id={`select-${label.replaceAll(' ', '-')}`}>{label}</InputLabel>
          <Select
            multiple={multiple}
            onChange={(event) => { onChange(event.target.value, options); }}
            label={label}
            defaultValue={multiple ? [] : ''}
          >
            {options.map((option) => (
              <MenuItem key={getOptionLabel(option)} value={getOptionLabel(option)}>
                {getOptionLabel(option)}
              </MenuItem>
            ))}
          </Select>
        </>
      )}
    </FormControl>
  );
}
