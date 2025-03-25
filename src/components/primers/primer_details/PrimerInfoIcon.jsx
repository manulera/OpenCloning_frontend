import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { formatGcContent, formatMeltingTemperature, formatDeltaG } from './primerDetailsFormatting';

function TableSection({ title, values }) {
  return (
    <>
      <TableRow><TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem' }} colSpan={2}>{title}</TableCell></TableRow>
      {values.map((value) => (
        <TableRow key={value[0]}>
          <TableCell width="50%" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{value[0]}</TableCell>
          <TableCell>{value[1]}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function Primer3Figure({ figure }) {
  const rows = figure.split('\n').length;
  return (
    <TableRow>
      <TableCell colSpan={2} sx={{ padding: 0, margin: 0 }}>
        <code style={{ width: '100%',
          whiteSpace: 'pre',
          fontFamily: 'monospace',
          display: 'block',
          maxWidth: '100%',
          overflow: 'auto',
          margin: 0,
          fontSize: `calc(100% * 70 / ${figure.length / rows})` }}
        >
          {figure}
        </code>
      </TableCell>
    </TableRow>
  );
}

function PrimerInfoDialog({ primer, primerDetails, open, onClose }) {
  console.log(primerDetails);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        {primerDetails.status === 'success' ? (
          <Table size="small">
            <TableBody>
              <TableSection
                title="Full sequence"
                values={[
                  ['Name', primer.name],
                  ['Length', primerDetails.length],
                  ['Tm (full sequence)', `${formatMeltingTemperature(primerDetails.melting_temperature)} °C`],
                  ['GC% (full sequence)', `${formatGcContent(primerDetails.gc_content)}%`],
                ]}
              />
              {primerDetails.binding_length && (
                <TableSection
                  title="Binding sequence"
                  values={[
                    ['Binding length', primerDetails.binding_length],
                    ['Tm (binding sequence)', `${formatMeltingTemperature(primerDetails.binding_melting_temperature)} °C`],
                    ['GC% (binding sequence)', `${formatGcContent(primerDetails.binding_gc_content)}%`],
                  ]}
                />
              )}
              {primerDetails.homodimer && (
                <>
                  <TableSection
                    title="Homodimer"
                    values={[
                      ['Tm (homodimer)', `${formatMeltingTemperature(primerDetails.homodimer.melting_temperature)} °C`],
                      ['ΔG (homodimer)', `${formatDeltaG(primerDetails.homodimer.deltaG)} kcal/mol`],
                    ]}
                  />
                  <Primer3Figure figure={primerDetails.homodimer.figure} />
                </>
              )}
              {primerDetails.hairpin && (
                <>
                  <TableSection
                    title="Hairpin"
                    values={[
                      ['Tm (hairpin)', `${formatMeltingTemperature(primerDetails.hairpin.melting_temperature)} °C`],
                      ['ΔG (hairpin)', `${formatDeltaG(primerDetails.hairpin.deltaG)} kcal/mol`],
                    ]}
                  />
                  <Primer3Figure figure={primerDetails.hairpin.figure} />
                </>
              )}
            </TableBody>
          </Table>
        ) : (
          <p>Error loading primer details</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

const primerProblematicValues = (primerDetails) => {
  const problematicValues = {
    homodimer: '',
    hairpin: '',
    gcContent: '',
    meltingTemperature: '',
  };
  if (primerDetails.homodimer && primerDetails.homodimer.deltaG < -8000) {
    problematicValues.homodimer = 'May form homodimers';
  }
  if (primerDetails.hairpin && primerDetails.hairpin.deltaG < -8000) {
    problematicValues.hairpin = 'May form hairpins';
  }
  if (primerDetails.gc_content < 0.35 || primerDetails.gc_content > 0.65) {
    problematicValues.gcContent = 'GC content is outside the optimal range';
  }
  if (primerDetails.melting_temperature < 50 || primerDetails.melting_temperature > 70) {
    problematicValues.meltingTemperature = 'Melting temperature is outside the optimal range';
  }
  return problematicValues;
};

const primerWarning = (problematicValues) => {
  const field = Object.keys(problematicValues).find((key) => problematicValues[key] !== '');
  return field ? problematicValues[field] : '';
};

function PrimerInfoIcon({ primerDetails, primer }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const warning = primerWarning(primerProblematicValues(primerDetails));
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
