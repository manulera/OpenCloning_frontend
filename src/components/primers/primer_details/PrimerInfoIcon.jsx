import { Dialog, DialogContent, IconButton, Tooltip, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useSelector } from 'react-redux';
import { formatGcContent, formatMeltingTemperature, formatDeltaG } from './primerDetailsFormatting';

function TableSection({ title, values }) {
  return (
    <>
      {title && <TableRow><TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem' }} colSpan={3}>{title}</TableCell></TableRow>}
      {values.map((value) => (
        <TableRow key={value[0]}>
          <TableCell width="50%" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{value[0]}</TableCell>
          <TableCell colSpan={value[2] ? 1 : 2} sx={{ width: '1px', whiteSpace: 'nowrap' }}>{value[1]}</TableCell>
          {value[2] && <TableCell>{value[2]}</TableCell>}
        </TableRow>
      ))}
    </>
  );
}

function Primer3Figure({ figure }) {
  // Remove all trailing spaces
  const trimmedRows = figure.split('\n').map((row) => row.trim());
  const longestRow = Math.max(...trimmedRows.map((row) => row.length));
  return (
    <TableRow>
      <TableCell colSpan={3} sx={{ padding: 0, margin: 0 }}>
        <code style={{ width: '100%',
          whiteSpace: 'pre',
          fontFamily: 'monospace',
          display: 'block',
          maxWidth: '100%',
          overflow: 'auto',
          margin: 0,
          fontSize: `calc(100% * 80 / ${longestRow})` }}
        >
          {trimmedRows.join('\n')}
        </code>
      </TableCell>
    </TableRow>
  );
}

function PCRTable({ pcrDetail }) {
  const { sourceId, fwdPrimer, rvsPrimer, heterodimer } = pcrDetail;
  const sourceType = useSelector((state) => state.cloning.sources.find((source) => source.id === sourceId)?.type);
  const name = (sourceType === 'PCRSource') ? 'PCR' : 'Oligonucleotide hybridization';

  return (
    <Table size="small">
      <TableBody />

      <TableSection
        title={`${name} ${sourceId}`}
        values={[
          ['Primers names', fwdPrimer.name, rvsPrimer.name],
          ['Binding length', fwdPrimer.length, rvsPrimer.length],
          ['Tm (binding)', `${formatMeltingTemperature(fwdPrimer.melting_temperature)} °C`, `${formatMeltingTemperature(rvsPrimer.melting_temperature)} °C`],
          ['GC% (binding)', `${formatGcContent(fwdPrimer.gc_content)}%`, `${formatGcContent(rvsPrimer.gc_content)}%`],
          ['Tm difference', `${formatMeltingTemperature(fwdPrimer.melting_temperature - rvsPrimer.melting_temperature)} °C`],
        ]}
      />
      {heterodimer && (
        <>
          <TableSection
            values={[['Tm (heterodimer)', `${formatMeltingTemperature(heterodimer.melting_temperature)} °C`], ['ΔG (heterodimer)', `${formatDeltaG(heterodimer.deltaG)} kcal/mol`]]}
          />
          <Primer3Figure figure={heterodimer.figure} />
        </>
      )}
    </Table>
  );
}

function PrimerInfoDialog({ primer, primerDetails, open, onClose, pcrDetails }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        {primerDetails.status === 'success' ? (
          <>
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
                {/* TODO: Warning if length > 60 */}
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
            {pcrDetails.map((pcrDetail) => (
              <PCRTable
                key={pcrDetail.sourceId}
                pcrDetail={pcrDetail}
              />
            ))}
          </>
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

function PrimerInfoIcon({ primerDetails, primer, pcrDetails }) {
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
      {open && <PrimerInfoDialog primer={primer} primerDetails={primerDetails} open={open} onClose={handleClose} pcrDetails={pcrDetails} />}
    </>
  );
}

export default PrimerInfoIcon;
