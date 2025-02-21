import { Alert, Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { getReverseComplementSequenceString as reverseComplement } from '@teselagen/sequence-utils';
import { isEqual } from 'lodash-es';
import { parseFeatureLocation } from '@teselagen/bio-parsers';
import { useDispatch, useSelector } from 'react-redux';
import useGatewaySites from '../../../../hooks/useGatewaySites';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { cloningActions } from '../../../../store/cloning';
import { usePrimerDesign } from './PrimerDesignContext';
import RequestStatusWrapper from '../../../form/RequestStatusWrapper';

const knownCombinations = [
  {
    siteNames: ['attP4', 'attP1'],
    spacers: ['GGGGACAACTTTGTATAGAAAAGTTGNN', reverseComplement('GGGGACTGCTTTTTTGTACAAACTTGN')],
    orientation: [true, true],
    message: 'Primers tails designed based on pDONR™ P4-P1R',
    translationFrame: [4, 6],
  },
  {
    siteNames: ['attP1', 'attP2'],
    spacers: ['GGGGACAAGTTTGTACAAAAAAGCAGGCTNN', reverseComplement('GGGGACCACTTTGTACAAGAAAGCTGGGTN')],
    orientation: [true, false],
    message: 'Primers tails designed based on pDONR™ 221',
    translationFrame: [4, 6],
  },
  {
    siteNames: ['attP2', 'attP3'],
    spacers: ['GGGGACAGCTTTCTTGTACAAAGTGGNN', reverseComplement('GGGGACAACTTTGTATAATAAAGTTGN')],
    orientation: [false, false],
    message: 'Primers tails designed based on pDONR™ P2R-P3',
    translationFrame: [4, 6],
  },
];

function SiteSelect({ donorSites, site, setSite, label }) {
  return (
    <FormControl sx={{ minWidth: '10em' }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={site ? `${site.siteName}-${site.location}` : ''}
        onChange={(e) => setSite(
          donorSites.find(({ siteName, location }) => `${siteName}-${location}` === e.target.value),
        )}
        label={label}
      >
        {donorSites.map(({ siteName, location }) => (
          <MenuItem key={`${siteName}-${location}`} value={`${siteName}-${location}`}>
            {siteName}
            {' '}
            {location}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const { setMainSequenceSelection } = cloningActions;

function GatewayRoiSelect({ id, greedy = false }) {
  const [leftSite, setLeftSite] = React.useState(null);
  const [rightSite, setRightSite] = React.useState(null);
  const [donorSites, setDonorSites] = React.useState([]);
  const { requestStatus, attemptAgain, sites } = useGatewaySites({ target: id, greedy });
  const { updateStoreEditor } = useStoreEditor();
  const donorVectorSequenceLength = useSelector((state) => state.cloning.teselaJsonCache[id].sequence.length);
  const dispatch = useDispatch();
  const { knownCombination, handleKnownCombinationChange } = usePrimerDesign();
  React.useEffect(() => {
    if (requestStatus.status === 'success') {
      setDonorSites(sites.filter(({ siteName }) => siteName.startsWith('attP')));
    }
  }, [sites]);
  // React.useEffect(() => {
  //   if (knownCombination) {
  //     const left = donorSites.find(({ siteName }) => knownCombination.siteNames[0] === siteName);
  //     const right = donorSites.find(({ siteName }) => knownCombination.siteNames[1] === siteName);
  //     setLeftSite(left);
  //     setRightSite(right);
  //   }
  // }, [knownCombination]);

  // Update the store editor when the left and right site are selected
  React.useEffect(() => {
    if (leftSite && rightSite) {
      const leftSiteLocation = parseFeatureLocation(leftSite.location, 0, 0, 0, 1, donorVectorSequenceLength)[0];
      const rightSiteLocation = parseFeatureLocation(rightSite.location, 0, 0, 0, 1, donorVectorSequenceLength)[0];
      const selectionLayer = { start: leftSiteLocation.start, end: rightSiteLocation.end };
      updateStoreEditor('mainEditor', null, selectionLayer);
      dispatch(setMainSequenceSelection({ selectionLayer, caretPosition: -1 }));
    }
  }, [leftSite, rightSite, donorSites, donorVectorSequenceLength]);

  const checkKnownCombination = React.useCallback((newLeftSite, newRightSite) => {
    if (newLeftSite && newRightSite) {
      const leftSiteLocation = parseFeatureLocation(newLeftSite.location, 0, 0, 0, 1, donorVectorSequenceLength)[0];
      const rightSiteLocation = parseFeatureLocation(newRightSite.location, 0, 0, 0, 1, donorVectorSequenceLength)[0];
      const selectionLayer = { start: leftSiteLocation.start, end: rightSiteLocation.end };
      const selection = { selectionLayer, caretPosition: -1 };
      const siteNames = [newLeftSite.siteName, newRightSite.siteName];
      const orientation = [newLeftSite.location.includes('(+)'), newRightSite.location.includes('(+)')];
      const knownCombinationForward = knownCombinations.find(({ siteNames: knownSites, orientation: knownOrientation }) => isEqual(knownSites, siteNames) && isEqual(knownOrientation, orientation));
      if (knownCombinationForward) {
        handleKnownCombinationChange(knownCombinationForward, selection);
        return;
      }
      const siteNamesReverse = [newRightSite.siteName, newLeftSite.siteName];
      const orientationReverse = [!newRightSite.location.includes('(+)'), !newLeftSite.location.includes('(+)')];
      const knownCombinationReverse = knownCombinations.find(({ siteNames: knownSites, orientation: knownOrientation }) => isEqual(knownSites, siteNamesReverse) && isEqual(knownOrientation, orientationReverse));
      if (knownCombinationReverse) {
        handleKnownCombinationChange(knownCombinationReverse, selection);
        return;
      }
      handleKnownCombinationChange(null, selection);
    }
  }, []);

  const onSiteSelectLeft = React.useCallback((site) => {
    setLeftSite(site);
    if (rightSite === null || isEqual(rightSite, site)) {
      // Find the first different one
      const differentSite = donorSites.find(({ location }) => location !== site.location);
      setRightSite(differentSite);
      checkKnownCombination(site, differentSite);
      return;
    }
    checkKnownCombination(site, rightSite);
  }, [rightSite, donorSites]);

  const onSiteSelectRight = React.useCallback((site) => {
    setRightSite(site);
    if (leftSite === null || isEqual(leftSite, site)) {
      // Find the first different one
      const differentSite = donorSites.find(({ location }) => location !== site.location);
      setLeftSite(differentSite);
      checkKnownCombination(differentSite, site);
      return;
    }
    checkKnownCombination(leftSite, site);
  }, [leftSite, donorSites]);
  return (
    <RequestStatusWrapper requestStatus={requestStatus} retry={attemptAgain} donorSites={donorSites}>

      <Box sx={{ my: 2, '& > div': { mx: 1 } }}>
        <SiteSelect donorSites={donorSites} site={leftSite} setSite={onSiteSelectLeft} label="Left attP site" />
        <SiteSelect donorSites={donorSites} site={rightSite} setSite={onSiteSelectRight} label="Right attP site" />
      </Box>
      {knownCombination && (<Alert sx={{ width: '80%', margin: 'auto', mb: 2 }} severity="info">{knownCombination.message}</Alert>)}
      {knownCombination === null && (leftSite && rightSite) && (<Alert sx={{ width: '80%', margin: 'auto', mb: 2 }} severity="error">No recommended primer tails found</Alert>)}
    </RequestStatusWrapper>
  );
}

export default GatewayRoiSelect;
