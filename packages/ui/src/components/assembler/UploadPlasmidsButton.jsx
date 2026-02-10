import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Box } from '@mui/material';
import { useConfig } from '../../providers';
import LocalFileSelect from '../form/LocalFileSelect';
import { usePlasmidsLogic } from './usePlasmidsLogic';
import PlasmidSyntaxTable from './PlasmidSyntaxTable';
import { jsonToGenbank } from '@teselagen/bio-parsers';

function formatPlasmid(sequenceData) {

  const { appData } = sequenceData;
  const { fileName, correspondingParts, longestFeature } = appData;
  const [left_overhang, right_overhang] = correspondingParts[0].split('-');
  
  let plasmidName = fileName;
  if (longestFeature[0]?.name) {
    plasmidName += ` (${longestFeature[0].name})`;
  }
  
  return {
    type: 'loadedFile',
    plasmid_name: plasmidName,
    file_name: fileName,
    left_overhang,
    right_overhang,
    key: `${left_overhang}-${right_overhang}`,
    sequenceData,
    genbankString: jsonToGenbank(sequenceData),
  };
  
}

export function UploadPlasmidsFromLocalServerButton({ handleFileChange }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState(null);
  const {localFilesPath} = useConfig();
  
  const onFileSelected = React.useCallback(async (files) => {
    try {
      await handleFileChange(files)
    } catch (e) {
      setError(e.message)
    }
  }, [handleFileChange, setError])
  
  if (!localFilesPath) {
    return null;
  }
  
  return <>
    <Button color="primary" onClick={() => setDialogOpen(true)}>
          Load Plasmids from Local Server
    </Button>
    {dialogOpen && <Dialog open onClose={() => setDialogOpen(false)}>
      <DialogTitle>Load Plasmids from Local Server</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <LocalFileSelect onFileSelected={onFileSelected} type="sequence" multiple />
      </DialogContent>
    </Dialog>}
  </>
}
  
function UploadPlasmidsButton({ addPlasmids, syntax }) {
  const { uploadPlasmids, linkedPlasmids, setLinkedPlasmids } = usePlasmidsLogic(syntax)
  const validPlasmids = React.useMemo(() => linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length === 1), [linkedPlasmids])
  const invalidPlasmids = React.useMemo(() => linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length !== 1), [linkedPlasmids])
  const fileInputRef = React.useRef(null)
  
  const handleFileChange = async (files) => {
    fileInputRef.current.value = ''
    await uploadPlasmids(Array.from(files))
  }
  
  const handleImportValidPlasmids = React.useCallback(() => {
    addPlasmids(validPlasmids.map(formatPlasmid))
    setLinkedPlasmids([])
  }, [addPlasmids, validPlasmids, setLinkedPlasmids])
  
  return (<>
    <Button color="primary" onClick={() => fileInputRef.current.click()}>
          Add Plasmids
    </Button>
    <input multiple type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(event) => handleFileChange(Array.from(event.target.files))} accept=".gbk,.gb,.fasta,.fa,.dna" />
    <UploadPlasmidsFromLocalServerButton handleFileChange={handleFileChange} />
    <Dialog
      maxWidth="lg"
      fullWidth
      open={invalidPlasmids.length > 0 || validPlasmids.length > 0}
      onClose={() => setLinkedPlasmids([])}
      PaperProps={{
        style: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogActions sx={{ justifyContent: 'center', position: 'sticky', top: 0, zIndex: 99, background: '#fff' }}>
        <Button disabled={validPlasmids.length === 0} variant="contained" color="success" onClick={handleImportValidPlasmids}>Import valid plasmids</Button>
        <Button variant="contained" color="error" onClick={() => setLinkedPlasmids([])}>Cancel</Button>
      </DialogActions>
      {invalidPlasmids.length > 0 && (
        <Box data-testid="invalid-plasmids-box">
          <DialogTitle>Invalid Plasmids</DialogTitle>
          <DialogContent>
            <PlasmidSyntaxTable plasmids={invalidPlasmids} />
          </DialogContent>
        </Box>
      )}
      {validPlasmids.length > 0 && (
        <Box data-testid="valid-plasmids-box">
          <DialogTitle>Valid Plasmids</DialogTitle>
          <DialogContent>
            <PlasmidSyntaxTable plasmids={validPlasmids} />
          </DialogContent>
        </Box>
      )}
    </Dialog>
  </>)
}

export default UploadPlasmidsButton
