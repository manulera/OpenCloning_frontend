import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Stack } from '@mui/material';
import { cloningActions } from '../../../../store/cloning';

function GlobalPrimerSettingsDialog({ open, onClose }) {
    const dispatch = useDispatch();
    const current = useSelector((state) => state.cloning.globalPrimerSettings);
    const [dnaConc, setDnaConc] = React.useState(String(current.primer_dna_concentration ?? ''));
    const [mono, setMono] = React.useState(String(current.primer_salt_monovalent ?? ''));
    const [diva, setDiva] = React.useState(String(current.primer_salt_divalent ?? ''));

    React.useEffect(() => {
        setDnaConc(String(current.primer_dna_concentration ?? ''));
        setMono(String(current.primer_salt_monovalent ?? ''));
        setDiva(String(current.primer_salt_divalent ?? ''));
    }, [current]);

    const onSubmit = (e) => {
        e.preventDefault();
        const updates = {
            primer_dna_concentration: Number(dnaConc),
            primer_salt_monovalent: Number(mono),
            primer_salt_divalent: Number(diva),
        };
        dispatch(cloningActions.setGlobalPrimersettings(updates));
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit }}>
            <DialogTitle>Global Primer Settings</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
                    <TextField
                        label="DNA concentration (nM)"
                        type="number"
                        value={dnaConc}
                        onChange={(e) => setDnaConc(e.target.value)}
                        inputProps={{ min: 0, step: '1' }}
                        variant="standard"
                        required
                    />
                    <TextField
                        label="Monovalent ions (mM)"
                        type="number"
                        value={mono}
                        onChange={(e) => setMono(e.target.value)}
                        inputProps={{ min: 0, step: '0.1' }}
                        variant="standard"
                        required
                    />
                    <TextField
                        label="Divalent ions (mM)"
                        type="number"
                        value={diva}
                        onChange={(e) => setDiva(e.target.value)}
                        inputProps={{ min: 0, step: '0.1' }}
                        variant="standard"
                        required
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}

function GlobalPrimerSettingsButton() {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>Global Primer Settings</Button>
            {open && (
                <GlobalPrimerSettingsDialog open={open} onClose={() => setOpen(false)} />
            )}
        </>
    );
}

export default GlobalPrimerSettingsButton;
