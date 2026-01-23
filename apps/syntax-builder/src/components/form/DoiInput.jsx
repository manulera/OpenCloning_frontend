import { TextField } from '@mui/material'
import React, { useRef, useState } from 'react'
import axios from 'axios';

async function validateDoi(doi, setError) {
  try {
    const response = await axios.get(`https://api.crossref.org/works/${doi}`);
    return response.data;
  } catch (error) {
    if (error.status === 404) {
      setError('DOI not found');
    } else {
      setError('Error validating DOI - ' + error.message);
    }
  }
}


function DoiInput({ label = 'DOI', onChange }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const timeoutIdRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setError('');
    setIsValidating(false);
    if (e.target.value.length !== 0) {
      const timeoutId = setTimeout(() => {
        setIsValidating(true);
        validateDoi(e.target.value, setError).then((data) => {
          onChange(data);
          setIsValidating(false);
        }).catch(() => {
          setIsValidating(false);
        });
      }, 500);
      timeoutIdRef.current = timeoutId;
    }
  };
  
  return (
    <TextField
      label={label}
      value={value}
      onChange={handleChange}
      placeholder="10.1234/example.doi"
      error={error !== ''}
      helperText={isValidating ? 'Validating...' : error || ' '}
    />
  )
}
export default DoiInput
