import React from 'react'
import { Upload as UploadIcon } from '@mui/icons-material'
import { 
  TableContainer,
  Button
} from '@mui/material'
import { useLinkedPlasmids } from '../context/FormDataContext';
import SectionWrapper from './SectionWrapper';
import { PlasmidSyntaxTable } from '@opencloning/ui/components/assembler';

function UploadPlasmidsButton({ onFileChange }) {
  const fileInputRef = React.useRef(null);
  return (<>
    <Button size="small" variant="contained" startIcon={<UploadIcon />} onClick={() => fileInputRef.current.click()}>Upload linked plasmids</Button>
    <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={(event) => onFileChange(Array.from(event.target.files))} accept=".gbk,.gb,.fasta,.fa,.dna" />
  </>
  )
}


function LinkedPlasmidsTable() {
  const { linkedPlasmids: plasmids, uploadPlasmids } = useLinkedPlasmids()
  return (
    <SectionWrapper title="Linked plasmids" actions={<UploadPlasmidsButton onFileChange={uploadPlasmids} />}>
      <TableContainer 
        sx={{ 
          maxHeight: 600,
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <PlasmidSyntaxTable plasmids={plasmids} />
      </TableContainer>
    </SectionWrapper>
  )
}

export default LinkedPlasmidsTable
