import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';

function PrimerInfoDialog({ primer, primerDetails, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Primer details</DialogTitle>
      <DialogContent>
        <Typography>
          {primerDetails.status === 'success' ? (
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>{primer.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Length</TableCell>
                  <TableCell>{primerDetails.length}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tm (full sequence)</TableCell>
                  <TableCell>{`${primerDetails.melting_temperature} °C`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>GC% (full sequence)</TableCell>
                  <TableCell>{`${primerDetails.gc_content}%`}</TableCell>
                </TableRow>
                {primerDetails.homodimer_melting_temperature && (
                  <>
                    <TableRow>
                      <TableCell>Tm (homodimer)</TableCell>
                      <TableCell>{`${primerDetails.homodimer_melting_temperature} °C`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ΔG (homodimer)</TableCell>
                      <TableCell>{`${primerDetails.homodimer_dg} kcal/mol`}</TableCell>
                    </TableRow>
                  </>
                )}
                {primerDetails.binding_length && (
                  <>
                    <TableRow>
                      <TableCell>Tm (binding sequence)</TableCell>
                      <TableCell>{`${primerDetails.binding_melting_temperature} °C`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>GC% (binding sequence)</TableCell>
                      <TableCell>{`${primerDetails.binding_gc_content}%`}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          ) : (
            <p>Error loading primer details</p>
          )}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

function PrimerInfoIcon({ primerDetails, primer }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <Tooltip title="Primer details" placement="top" arrow>
        <IconButton disabled={primerDetails.status !== 'success'} onClick={handleOpen}>
          <InfoIcon />
        </IconButton>
      </Tooltip>
      {open && <PrimerInfoDialog primer={primer} primerDetails={primerDetails} open={open} onClose={handleClose} />}
    </>
  );
}

export default PrimerInfoIcon;
