/* eslint-disable camelcase -- request/response fields match OpenAPI (snake_case) */
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { jsonToGenbank } from '@teselagen/bio-parsers';
import error2String from '@opencloning/utils/error2String';
import useAlerts from '../../hooks/useAlerts';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';
import { featureToGenbankLocationString } from '@opencloning/utils';

/** Matches OpenAPI `CloningType` */
export const CLONING_TYPES = ['domestication', 'synthesis'];

/** Matches OpenAPI `EnzymeToRemove` */
export const ENZYMES_TO_REMOVE = ['BsmBI', 'BsaI', 'BtgZI', 'BpiI'];

/** Matches OpenAPI `AllowedCategory` (exact strings) */
export const ALLOWED_CATEGORIES = [
  'PROM+5UTR (A1-A2-A3-B1-B2)',
  "PROM+5UTR(f) (A1-A2-A3-B1)",
  'DIST+PROX (A1-A2)',
  'CORE+5UTR (A3-B1-B2)',
  'DIST(A1)',
  'PROX (A2)',
  'INTERACTION ADAPTOR (A1-A2-A3-B1-B2b)',
  'PROM+5UTR+mir173 (A1-A2-A3-B1b)',
  'NTAG (B2)',
  'CDS (B3-B4-B5)',
  'CDS1 (B3)',
  'CDS2 (B4)',
  'CDS2+CTAG (B4-B5)',
  'CDS1+CDS2 (B3-B4)',
  'CTAG (B5)',
  "5'FS (B2-B3b)",
  'Target (B4b)',
  "'3FS (B5b)",
  'goi (B2-B3)',
  'int (B4)',
  'iog (B5)',
  'fgoi (B2-B3-B4-B5)',
  '3UTR+TERM (B6-C1)',
  'PROM DPolIII+DRCas12 (A1-A2-A3-B1-B2e)',
  '3_prime processing (B6c-C1)',
  'PROM DPolIII (A1-A2-A3-B1-B2c)',
  'PROM MPolIII (A1-A2-A3-B1-B2d)',
  'sgRNA (B6b-C1)',
];

const FOUR_BP = /^[ACGT]{4}$/;

function categoryPrefixSuffixValid(category, prefix, suffix) {
  const pref = prefix.toUpperCase();
  const suff = suffix.toUpperCase();
  if (!category) {
    return FOUR_BP.test(pref) && FOUR_BP.test(suff);
  }
  return prefix === '' && suffix === '';
}

function buildTextFileSequence(sequenceData) {
  const fileContent = jsonToGenbank(sequenceData);
  return {
    id: 1,
    type: 'TextFileSequence',
    sequence_file_format: 'genbank',
    overhang_crick_3prime: 0,
    overhang_watson_3prime: 0,
    file_content: fileContent,
  };
}

export default function BatchDomesticateDialog({ open, onClose, initialContext }) {
  const httpClient = useHttpClient();
  const backendRoute = useBackendRoute();
  const { addAlert } = useAlerts();

  const location = React.useMemo(() => featureToGenbankLocationString(initialContext.annotation), [initialContext]);
  const [cloningType, setCloningType] = React.useState('domestication');
  const [partName, setPartName] = React.useState(initialContext.annotation.name);
  const [prefix, setPrefix] = React.useState('');
  const [suffix, setSuffix] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [enzymes, setEnzymes] = React.useState(['BsaI', 'BsmBI']);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const categoryValueForApi = category || null;

  const validationOk = Boolean(
    partName.trim() && enzymes.length >= 1 && categoryPrefixSuffixValid(category, prefix, suffix),
  );

  const helperCategory = category
    ? 'With a category selected, prefix and suffix must be empty.'
    : 'Without a category, prefix and suffix must each be exactly 4 bases (A/C/G/T).';

  const toggleEnzyme = (name) => {
    setEnzymes((prev) => (prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]));
  };

  const handleCategoryChange = (e) => {
    const v = e.target.value;
    setCategory(v);
    if (v) {
      setPrefix('');
      setSuffix('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validationOk || !initialContext) return;
    setIsSubmitting(true);
    const sequence = buildTextFileSequence(initialContext.sequenceData);
    const body = {
      sequence,
      location: location.trim(),
      cloning_type: cloningType,
      part_name: partName.trim(),
      prefix: categoryValueForApi ? '' : prefix.toUpperCase(),
      suffix: categoryValueForApi ? '' : suffix.toUpperCase(),
      category: categoryValueForApi,
      enzymes,
    };
    try {
      const url = backendRoute('batch_cloning/domesticate');
      const { data } = await httpClient.post(url, body);
      console.log('batch_cloning/domesticate response', data);
      addAlert({ message: 'Domestication request completed (see console for response)', severity: 'success' });
      onClose();
    } catch (err) {
      console.log(err.response);
      addAlert({ message: error2String(err), severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Domesticate (experimental)</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {helperCategory}
          </Alert>
          <TextField
            margin="dense"
            label="Location"
            value={location}
            disabled
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Part name"
            value={partName}
            onChange={(ev) => setPartName(ev.target.value)}
            fullWidth
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="cloning-type-label">Cloning type</InputLabel>
            <Select
              labelId="cloning-type-label"
              label="Cloning type"
              value={cloningType}
              onChange={(ev) => setCloningType(ev.target.value)}
            >
              {CLONING_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel id="category-label" shrink>
              Category
            </InputLabel>
            <Select
              labelId="category-label"
              label="Category"
              value={category}
              onChange={handleCategoryChange}
              displayEmpty
              notched
            >
              <MenuItem value="">
                <em>None — use 4 bp prefix/suffix</em>
              </MenuItem>
              {ALLOWED_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Prefix"
            value={prefix}
            onChange={(ev) => setPrefix(ev.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
            fullWidth
            disabled={Boolean(category)}
            inputProps={{ maxLength: 4 }}
            helperText={category ? 'Clear category to edit' : 'Exactly 4 A/C/G/T when no category'}
          />
          <TextField
            margin="dense"
            label="Suffix"
            value={suffix}
            onChange={(ev) => setSuffix(ev.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
            fullWidth
            disabled={Boolean(category)}
            inputProps={{ maxLength: 4 }}
          />
          <Box sx={{ mt: 1 }}>
            <FormControl component="fieldset" variant="standard" required error={enzymes.length === 0}>
              <FormHelperText>Enzymes to remove (at least one)</FormHelperText>
              <FormGroup row>
                {ENZYMES_TO_REMOVE.map((enz) => (
                  <FormControlLabel
                    key={enz}
                    control={(
                      <Checkbox
                        checked={enzymes.includes(enz)}
                        onChange={() => toggleEnzyme(enz)}
                        name={enz}
                      />
                    )}
                    label={enz}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!validationOk || isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
