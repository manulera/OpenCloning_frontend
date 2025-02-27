import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';
import { genbankToJson, jsonToFasta } from '@teselagen/bio-parsers';
import useBackendAPI from '../../hooks/useBackendAPI';
import SourceGenomeRegion from '../sources/SourceGenomeRegion';
import { downloadTextFile } from '../../utils/readNwrite';
import DownloadSequenceFileDialog from '../DownloadSequenceFileDialog';

function QuickGenomeDialog({ open, setOpen }) {
  const { requestStatus, sendPostRequest, sources, entities } = useBackendAPI();

  const [downloadSequence, setDownloadSequence] = React.useState(() => null);
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);
  React.useEffect(() => {
    if (sources.length === 1) {
      const downloadCallback = (fileName) => {
        if (fileName.endsWith('.gb')) {
          downloadTextFile(entities[0].file_content, fileName);
        } else if (fileName.endsWith('.fasta')) {
          downloadTextFile(jsonToFasta(genbankToJson(entities[0].file_content)[0].parsedSequence), fileName);
        }
      };
      setDownloadSequence(() => downloadCallback);
      setDownloadDialogOpen(true);
    }
  }, [sources, entities]);
  // A dummy source
  const source = { id: 0, type: 'GenomeRegionSource', output: null };
  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="misc-dialog">
      <DialogTitle sx={{ textAlign: 'center', fontSize: 'x-large' }}> Download genome region </DialogTitle>
      <DialogContent className="select-source" sx={{ minWidth: '600px' }}>
        <div style={{ width: '60%', margin: 'auto' }}>
          <SourceGenomeRegion {...{ source, requestStatus, sendPostRequest }} />
        </div>
      </DialogContent>
      { downloadSequence && <DownloadSequenceFileDialog {...{ downloadSequence, dialogOpen: downloadDialogOpen, setDialogOpen: setDownloadDialogOpen, downloadCallback: downloadSequence }} /> }
    </Dialog>
  );
}

export default QuickGenomeDialog;
