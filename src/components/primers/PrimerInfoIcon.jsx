import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

function PrimerInfoDialog({ primer, primerDetails, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Primer details</DialogTitle>
      <DialogContent>
        <Typography>
          {primerDetails.status === 'success' ? (
            <>
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
              {primerDetails.homodimer_melting_temperature && (

              <code style={{
                width: '100%',
                whiteSpace: 'pre',
                fontFamily: 'monospace',
                display: 'block',
                maxWidth: '100%',
                overflow: 'auto',
                fontSize: 'min(1rem, calc(100% / (var(--char-count, 80) / 80)))',
              }}
              >
                {primerDetails.homodimer_figure}
              </code>

              )}
            </>
          ) : (
            <p>Error loading primer details</p>
          )}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

const primerWarning = (primerDetails) => {
  if (primerDetails.homodimer_dg && primerDetails.homodimer_dg < -8000) {
    return 'May form homodimers';
  }
  return '';
};

function PrimerInfoIcon({ primerDetails, primer }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const warning = primerWarning(primerDetails);
  const tooltipTitle = warning === '' ? 'Primer details' : warning;
  return (
    <>
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <IconButton disabled={primerDetails.status !== 'success'} onClick={handleOpen}>
          {warning === '' ? <InfoIcon /> : <WarningIcon color="warning" />}
        </IconButton>
      </Tooltip>
      {open && <PrimerInfoDialog primer={primer} primerDetails={primerDetails} open={open} onClose={handleClose} />}
    </>
  );
}

export default PrimerInfoIcon;
