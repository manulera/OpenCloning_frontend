import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Tooltip } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { isEqual } from 'lodash-es';
import Source from './sources/Source';
import './NetworkTree.css';
import SequenceEditor from './SequenceEditor';
import FinishedSource from './sources/FinishedSource';
import MainSequenceCheckBox from './MainSequenceCheckBox';
import TemplateSequence from './TemplateSequence';
import { getSourceDatabaseId, isSourceATemplate } from '../store/cloning_utils';
import { cloningActions } from '../store/cloning';
import SourceBox from './sources/SourceBox';
import { getSortedSourceIds } from '../utils/network';

const { addToSourcesWithHiddenAncestors, removeFromSourcesWithHiddenAncestors, addSequenceInBetween } = cloningActions;

const SequenceContent = React.memo(({ sequenceId, sequenceIsTemplate }) => {
  const hasDatabaseId = useSelector((state) => Boolean(getSourceDatabaseId(state.cloning.sources, sequenceId)));
  return (
    <span className="tf-nc" style={{ borderColor: hasDatabaseId ? 'green' : 'default' }}>
      <span className="node-text">
        {sequenceIsTemplate ? (
          <TemplateSequence sequenceId={sequenceId} />
        ) : (
          <>
            <SequenceEditor {...{ sequenceId }} />
            <MainSequenceCheckBox {...{ id: sequenceId }} />
          </>
        )}
        <div className="corner-id" style={{ color: hasDatabaseId ? 'green' : 'default' }}>{sequenceId}</div>
      </span>
    </span>
  );
});

function SequenceWrapper({ children, sequenceId, sequenceIsTemplate }) {
  if (sequenceId === null) {
    return children;
  }
  return (
    <li key={sequenceId} id={`sequence-${sequenceId}`} className="sequence-node">
      <SequenceContent {...{ sequenceId, sequenceIsTemplate }} />
      <ul>
        {children}
      </ul>
    </li>
  );
}

// A component that renders the ancestry tree
function NetWorkNode({ sourceId }) {
  const tooltipRef = useRef(null);
  const info = useSelector((state) => {
    const s = state.cloning.sources.find((source) => source.id === sourceId);
    const sequenceId = s.output;
    return {
      sequenceId,
      sourceInput: s.input,
      hasDatabaseId: Boolean(getSourceDatabaseId(state.cloning.sources, s.output)),
      sequenceIsTemplate: sequenceId && state.cloning.sequences.find((sequence) => sequence.id === sequenceId).type === 'TemplateSequence',
      sourceIsTemplate: isSourceATemplate(state.cloning, sourceId),
    };
  }, isEqual);
  const { sequenceId, sourceInput, hasDatabaseId, sequenceIsTemplate, sourceIsTemplate } = info;

  const ancestorsHidden = useSelector((state) => state.cloning.sourcesWithHiddenAncestors.includes(sourceId));
  const parentSourceIds = useSelector((state) => {
    const parentSources = state.cloning.sources.filter((source) => sourceInput.includes(source.output));
    return getSortedSourceIds(parentSources, state.cloning.sources);
  }, isEqual);

  const dispatch = useDispatch();

  const onVisibilityClick = React.useCallback(() => {
    if (ancestorsHidden) {
      dispatch(removeFromSourcesWithHiddenAncestors(sourceId));
      // Give it a bit of time to render the ancestors
      setTimeout(() => {
        // If it has children sequence align to the children
        if (sequenceId) {
          document.getElementById(`sequence-${sequenceId}`)?.scrollIntoView({ alignToTop: false, block: 'end' });
        } else {
          document.getElementById(`source-${sourceId}`)?.scrollIntoView({ alignToTop: false, block: 'end' });
        }
      }, 100);
    } else {
      dispatch(addToSourcesWithHiddenAncestors(sourceId));
    }

    if (tooltipRef.current) {
      tooltipRef.current.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    }
  }, [ancestorsHidden, sourceId, sequenceId]);

  const Icon = ancestorsHidden ? VisibilityIcon : VisibilityOffIcon;
  const visibilityIconToolTip = ancestorsHidden ? 'Show ancestors' : 'Hide ancestors';

  return (
    <SequenceWrapper {...{ sequenceId, sequenceIsTemplate }}>
      <li id={`source-${sourceId}`} className={`source-node ${ancestorsHidden ? 'hidden-ancestors' : ''}`}>
        <Box component="span" className="tf-nc" style={{ borderColor: hasDatabaseId ? 'green' : 'default' }}>
          <span className="node-text">
            <SourceBox {...{ sourceId }}>
              {(sequenceId !== null && !sourceIsTemplate) ? (
                <FinishedSource {...{ sourceId }} />
              ) : (
                <Source {...{ sourceId }} />
              )}
            </SourceBox>
            <div className="corner-id" style={{ color: hasDatabaseId ? 'green' : 'default' }}>
              {sourceId}
            </div>
            { (!sourceIsTemplate && sourceInput.length > 0 && sequenceId) && (
            <div className="before-node before-node-visibility">
              <Tooltip
                arrow
                title={visibilityIconToolTip}
                placement="left"
              >
                <div ref={tooltipRef}>
                  <Icon onClick={onVisibilityClick} style={{ color: 'grey' }} />
                </div>
              </Tooltip>
            </div>
            )}
            { (sourceIsTemplate && sourceInput.length > 0)
            && (
            <div className="before-node before-node-sequence-in-between">
              <Tooltip arrow title="Add sequence in between" placement={sourceInput.length > 1 ? 'top' : 'left'}>
                <div>
                  <AddCircleIcon onClick={() => { dispatch(addSequenceInBetween(sourceId)); }} color="success" />
                </div>
              </Tooltip>
            </div>
            )}
          </span>
        </Box>
        {parentSourceIds.length > 0 && (
        <ul className={ancestorsHidden ? 'hidden-ancestors' : ''}>
          {parentSourceIds.map((id) => (
            <MemoizedNetWorkNode sourceId={id} key={`node-${id}`} />
          ))}
        </ul>
        )}
      </li>
    </SequenceWrapper>
  );
}

const MemoizedNetWorkNode = React.memo(NetWorkNode);

export default React.memo(NetWorkNode);
