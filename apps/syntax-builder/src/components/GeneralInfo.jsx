import React from 'react'
import SectionWrapper from './SectionWrapper';
import DoiInput from './form/DoiInput';
import EnzymeInput from './form/EnzymeInput';
import { Box, Typography } from '@mui/material';
import OrcidInput from './form/OrcidInput';

const boxStyle = { width: 400, display: 'flex', flexDirection: 'column', gap: 2 };

function GeneralInfo() {
  return (
    <SectionWrapper title="General Info">
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <Box sx={boxStyle}>
          <Typography variant="h6">Assembly enzymes</Typography>
          <EnzymeInput label="Assembly enzyme" helperText=" " />
          <EnzymeInput label="Domestication enzyme" helperText=" " />
        </Box>
        <Box sx={boxStyle}>
          <Typography variant="h6">Related publications</Typography>
          <DoiInput />
          <DoiInput />
        </Box>
        <Box sx={boxStyle}>
          <Typography variant="h6">Submitters</Typography>
          <OrcidInput />
          <OrcidInput />
        </Box>
      </Box>
    </SectionWrapper>
  )
}

export default GeneralInfo
