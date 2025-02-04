import { Button, Checkbox, FormControl, FormControlLabel } from '@mui/material';
import React from 'react';
import { batch, useDispatch } from 'react-redux';
import SingleInputSelector from '../../../sources/SingleInputSelector';
import { cloningActions } from '../../../../store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import LabelWithTooltip from '../../../form/LabelWithTooltip';
import useGatewaySites from '../../../../hooks/useGatewaySites';
import NoAttPSitesError from '../common/NoAttPSitesError';
import RetryAlert from '../../../form/RetryAlert';

const { addTemplateChildAndSubsequentSource, setCurrentTab, setMainSequenceId } = cloningActions;

function PrimerDesignGatewayBP({ source }) {
  const [target, setTarget] = React.useState('');
  const [greedy, setGreedy] = React.useState(false);

  const { updateStoreEditor } = useStoreEditor();
  const { requestStatus, sites: sitesInTarget, attemptAgain } = useGatewaySites({ target, greedy });
  const nbOfAttPSites = sitesInTarget.filter((site) => site.siteName.startsWith('attP')).length;

  const dispatch = useDispatch();
  const onSubmit = (event) => {
    event.preventDefault();
    const newSource = {
      input: [Number(target)],
      type: 'GatewaySource',
      reaction_type: 'BP',
      greedy,
      output: null,
    };
    const newEntity = {
      type: 'TemplateSequence',
      primer_design: 'gateway_bp',
      circular: false,
    };

    batch(() => {
      dispatch(addTemplateChildAndSubsequentSource({ newSource, newEntity, sourceId: source.id }));
      dispatch(setMainSequenceId(source.input[0]));
      updateStoreEditor('mainEditor', source.input[0]);
      dispatch(setCurrentTab(3));
      // Scroll to the top of the page
      document.getElementById('opencloning-app-tabs')?.scrollIntoView();
    });
  };
  return (
    <form onSubmit={onSubmit}>

      <FormControl fullWidth>
        <SingleInputSelector
          label="Donor vector"
          selectedId={target}
          onChange={(e) => setTarget(e.target.value)}
          inputEntityIds={[]}
          helperText={requestStatus.status === 'loading' ? 'Validating...' : ''}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormControlLabel
          control={<Checkbox checked={greedy} onChange={() => setGreedy(!greedy)} />}
          label={(
            <LabelWithTooltip label="Greedy attP finder" tooltip="Use a more greedy consensus site to find attP sites (might give false positives)" />
                )}
        />
      </FormControl>

      {requestStatus.status === 'success' && target && nbOfAttPSites < 2 && (
        <NoAttPSitesError sites={sitesInTarget} />
      )}
      {requestStatus.status === 'error' && (
        <RetryAlert onRetry={attemptAgain}>
          {requestStatus.message}
        </RetryAlert>
      )}
      {target && requestStatus.status === 'success' && nbOfAttPSites > 1 && (
        <Button type="submit" variant="contained" color="success">
          Design primers
        </Button>
      )}
    </form>
  );
}

export default React.memo(PrimerDesignGatewayBP);
