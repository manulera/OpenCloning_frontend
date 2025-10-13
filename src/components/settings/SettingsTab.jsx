import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, CardContent, CardHeader, Stack, TextField, InputAdornment, Typography, IconButton, Box } from '@mui/material';
import { cloningActions } from '../../store/cloning';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const { setGlobalPrimerSettings } = cloningActions;

function HeaderWithTooltip() {
    const tooltipMessage = (
        <Box>
            These settings affect thermodynamic calculations for:
            <ul>
                <li>Primer design</li>
                <li>Values displayed in the primer table</li>
                <li>Values displayed in the PCR details</li>
            </ul>
        </Box>
    )
    const title = (
        <Box>
            Global Primer Settings
            <Tooltip title={tooltipMessage} arrow placement="right">
                <IconButton size="small">
                    <InfoIcon />
                </IconButton>
            </Tooltip>
        </Box>
    )
    return (
        <CardHeader
            title={title}
        />
    )
}





function GlobalPrimerSettingsSection() {
    const dispatch = useDispatch();
    const current = useSelector((state) => state.cloning.global_primer_settings);
    const [editing, setEditing] = React.useState(false);
    const [form, setForm] = React.useState({
        primer_dna_concentration_nM: current.primer_dna_concentration_nM,
        monovalent_ions_mM: current.monovalent_ions_mM,
        divalent_ions_mM: current.divalent_ions_mM,
    });

    const fieldsValid = {
        primer_dna_concentration_nM: form.primer_dna_concentration_nM > 0,
        monovalent_ions_mM: form.monovalent_ions_mM > 0,
        divalent_ions_mM: form.divalent_ions_mM > 0,
    }
    const allFieldsValid = Object.values(fieldsValid).every((valid) => valid);

    React.useEffect(() => {
        if (!editing) {
            setForm({
                primer_dna_concentration_nM: current.primer_dna_concentration_nM,
                monovalent_ions_mM: current.monovalent_ions_mM,
                divalent_ions_mM: current.divalent_ions_mM,
            });
        }
    }, [current, editing]);

    const onChange = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const onCancel = () => {
        setEditing(false);
        setForm({
            primer_dna_concentration_nM: current.primer_dna_concentration_nM,
            monovalent_ions_mM: current.monovalent_ions_mM,
            divalent_ions_mM: current.divalent_ions_mM,
        });
    };

    const onSave = () => {
        dispatch(setGlobalPrimerSettings({
            primer_dna_concentration_nM: Number(form.primer_dna_concentration_nM),
            monovalent_ions_mM: Number(form.monovalent_ions_mM),
            divalent_ions_mM: Number(form.divalent_ions_mM),
        }));
        setEditing(false);
    };

    return (
        <Card>
            <HeaderWithTooltip />
            <CardContent sx={{ margin: 'auto' }}>

                <Stack spacing={2} sx={{ maxWidth: 300, margin: 'auto' }}>
                    <TextField
                        label="PrimerDNA concentration"
                        type="number"
                        value={form.primer_dna_concentration_nM}
                        onChange={onChange('primer_dna_concentration_nM')}
                        inputProps={{ min: 0, step: '1' }}
                        variant="standard"
                        required
                        disabled={!editing}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">nM</InputAdornment>,
                        }}
                        error={!fieldsValid.primer_dna_concentration_nM}
                        helperText={!fieldsValid.primer_dna_concentration_nM ? 'Must be greater than 0' : ''}
                    />
                    <TextField
                        label="Monovalent ions"
                        type="number"
                        value={form.monovalent_ions_mM}
                        onChange={onChange('monovalent_ions_mM')}
                        inputProps={{ min: 0, step: '0.1' }}
                        variant="standard"
                        required
                        disabled={!editing}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">mM</InputAdornment>,
                        }}
                        error={!fieldsValid.monovalent_ions_mM}
                        helperText={!fieldsValid.monovalent_ions_mM ? 'Must be greater than 0' : ''}
                    />
                    <TextField
                        label="Divalent ions"
                        type="number"
                        value={form.divalent_ions_mM}
                        onChange={onChange('divalent_ions_mM')}
                        inputProps={{ min: 0, step: '0.1' }}
                        variant="standard"
                        required
                        disabled={!editing}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">mM</InputAdornment>,
                        }}
                        error={!fieldsValid.divalent_ions_mM}
                        helperText={!fieldsValid.divalent_ions_mM ? 'Must be greater than 0' : ''}
                    />
                    {!editing ? (
                        <Stack direction="row" justifyContent="center">
                            <Button variant="contained" onClick={() => setEditing(true)}>Edit</Button>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Button onClick={onCancel}>Cancel</Button>
                            <Button variant="contained" onClick={onSave} disabled={!allFieldsValid}>Save</Button>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

function SettingsTab() {
    return (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 600, width: '100%' }}>
                <GlobalPrimerSettingsSection />
            </div>
        </div>
    );
}

export default SettingsTab;


