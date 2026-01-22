import React from 'react'
import { Upload as UploadIcon } from '@mui/icons-material'
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  TableContainer,
  Box,
  Typography,
  Chip,
  Paper,
  Button
} from '@mui/material'
import { useLinkedPlasmids } from './useAssociatedPlasmids';


function PlasmidRow({ plasmid }) {
  const { name, appData } = plasmid;
  const { fileName, correspondingParts, partInfo, longestFeature } = appData;
  let sx = undefined;
  let infoStr = '';
  let longestFeatureStr = '-';
  if (partInfo.length === 1) {
    sx = {
      backgroundColor: partInfo[0]?.color,
    }
    infoStr = partInfo[0] ? partInfo[0].name : 'Spans multiple parts';
    longestFeatureStr = longestFeature ? longestFeature[0].name : '-';
  }
  const multipleParts = partInfo.length > 1;
  if (multipleParts) {
    infoStr = 'Contains multiple parts';
  }

  return (
    <TableRow sx={sx}>
      <TableCell sx={{ maxWidth: 200 }}>
        <Typography variant="body2" noWrap title={name}>
          {name}
        </Typography>
      </TableCell>
      <TableCell sx={{ maxWidth: 200 }}>
        <Typography variant="body2" noWrap title={fileName}>
          {fileName}
        </Typography>
      </TableCell>
      <TableCell sx={multipleParts ? {backgroundColor: 'red'} : null}>
        {correspondingParts && correspondingParts.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {correspondingParts.slice(0, 2).map((part, idx) => (
              <Chip 
                key={idx} 
                label={part} 
                size="small" 
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
            {correspondingParts.length > 2 && (
              <Chip 
                label={`+${correspondingParts.length - 2}`} 
                size="small" 
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2">{infoStr}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{longestFeatureStr}</Typography>
      </TableCell>
    </TableRow>
  )
}

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
    <Paper sx={{ p: 1.5, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6">Linked plasmids</Typography>
        <UploadPlasmidsButton onFileChange={uploadPlasmids} />
      </Box>
      <TableContainer 
        sx={{ 
          maxHeight: 600,
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <Table stickyHeader size="small">
          <TableHead sx={{ '& th': { fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Part</TableCell>
              <TableCell>Part Info</TableCell>
              <TableCell>Longest Feature</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plasmids.map((plasmid, index) => (
              <PlasmidRow key={index} plasmid={plasmid} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default LinkedPlasmidsTable
