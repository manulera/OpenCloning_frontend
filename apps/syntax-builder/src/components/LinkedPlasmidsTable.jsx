import React from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'


function PlasmidRow({ plasmid }) {
  const { name, appData } = plasmid;
  const { fileName, correspondingParts, partInfo } = appData;
  let sx = undefined;
  let infoStr = '';
  if (partInfo.length === 1) {
    sx = {
      backgroundColor: partInfo[0]?.color,
    }
    infoStr = partInfo[0] ? partInfo[0].name : 'Spans multiple parts';
  }
  const multipleParts = partInfo.length > 1;
  if (multipleParts) {
    infoStr = 'Contains multiple parts';
  }
  return (
    <TableRow sx={sx}>
      <TableCell>{name}</TableCell>
      <TableCell>{fileName}</TableCell>
      <TableCell sx={multipleParts ? {backgroundColor: 'red'} : null}>{correspondingParts?.join(', ')}</TableCell>
      <TableCell>{infoStr}</TableCell>
    </TableRow>
  )
}

function LinkedPlasmidsTable({ plasmids }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>File Name</TableCell>
          <TableCell>Part</TableCell>
          <TableCell>Part Info</TableCell>
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

export default LinkedPlasmidsTable
