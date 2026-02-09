
import React from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, Chip, Box } from '@mui/material'

function PartChip({ name, overhang}) {
  const label = name ? `${overhang} (${name})` : overhang;
  return (
    <Chip label={label} size="small" sx={{ fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }}
    />
  )
}

function PlasmidRow({ plasmid }) {
  const { name, appData } = plasmid;
  const { fileName, correspondingParts, correspondingPartsNames, partInfo, longestFeature } = appData;
  let sx = undefined;
  let infoStr = '-';
  let longestFeatureStr = '-';
  let noParts = partInfo.length === 0;
  if (partInfo.length === 1) {
    sx = {
      backgroundColor: partInfo[0]?.color,
    }
    infoStr = partInfo[0] ? partInfo[0].name : 'Spans multiple parts';
    longestFeatureStr = longestFeature[0] ? longestFeature[0].name : '-';
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {noParts ? '-' : correspondingParts.map((part, idx) => (
            <PartChip key={idx} name={correspondingPartsNames[idx]} overhang={part}
            />
          ))}
        </Box>
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

function PlasmidSyntaxTable( { plasmids } ) {
  return (
    <Table stickyHeader size="small">
      <TableHead sx={{ '& th': { fontWeight: 'bold' } }}>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>File Name</TableCell>
          <TableCell>Overhangs</TableCell>
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
  )
}

export default PlasmidSyntaxTable
