import React from 'react';
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

const { addToSourcesWithHiddenAncestors, removeFromSourcesWithHiddenAncestors, addSequenceInBetween } = cloningActions;

const SequenceWrapper = React.memo(({ children, entityId, entityIsTemplate }) => {
  if (entityId === null) {
    return children;
  }
  const hasDatabaseId = useSelector((state) => getSourceDatabaseId(state.cloning.sources, entityId) !== undefined);
  return (
    <li key={entityId} id={`sequence-${entityId}`} className="sequence-node">
      <span className="tf-nc" style={{ borderColor: hasDatabaseId ? 'green' : 'default' }}>
        <span className="node-text">
          {
            entityIsTemplate ? (
              <TemplateSequence entityId={entityId} />
            ) : (
              <>
                <SequenceEditor {...{ entityId }} />
                <MainSequenceCheckBox {...{ id: entityId }} />
              </>
            )
          }
          <div className="corner-id" style={{ color: hasDatabaseId ? 'green' : 'default' }}>{entityId}</div>
        </span>
      </span>
      <ul>
        {children}
      </ul>
    </li>
  );
});

// A component that renders the ancestry tree
function NetWorkNode({ sourceId }) {
  const [entityId, sourceInput, hasDatabaseId] = useSelector((state) => {
    const s = state.cloning.sources.find((source) => source.id === sourceId);
    return [s.output, s.input, getSourceDatabaseId(state.cloning.sources, s.output) !== undefined];
  }, isEqual);
  const entityIsTemplate = useSelector((state) => entityId && state.cloning.entities.find((entity) => entity.id === entityId).type === 'TemplateSequence');
  const sourceIsTemplate = useSelector((state) => isSourceATemplate(state.cloning, sourceId), isEqual);
  const ancestorsHidden = useSelector((state) => state.cloning.sourcesWithHiddenAncestors.includes(sourceId));
  const parentSourceIds = useSelector((state) => {
    const parentSources = state.cloning.sources.filter((source) => sourceInput.includes(source.output));
    return parentSources.map((source) => source.id);
  }, isEqual);
  const dispatch = useDispatch();

  const onVisibilityClick = React.useCallback(() => {
    if (ancestorsHidden) {
      dispatch(removeFromSourcesWithHiddenAncestors(sourceId));
      // Give it a bit of time to render the ancestors
      setTimeout(() => {
        // If it has children sequence align to the children
        if (entityId) {
          document.getElementById(`sequence-${entityId}`)?.scrollIntoView({ alignToTop: false, block: 'end' });
        } else {
          document.getElementById(`source-${sourceId}`)?.scrollIntoView({ alignToTop: false, block: 'end' });
        }
      }, 100);
    } else {
      dispatch(addToSourcesWithHiddenAncestors(sourceId));
    }
  }, [ancestorsHidden, sourceId, entityId]);

  const Icon = ancestorsHidden ? VisibilityIcon : VisibilityOffIcon;
  const visibilityIconToolTip = ancestorsHidden ? 'Show ancestors' : 'Hide ancestors';

  return (
    <SequenceWrapper {...{ entityId, entityIsTemplate }}>
      <li key={sourceId} id={`source-${sourceId}`} className={`source-node ${ancestorsHidden ? 'hidden-ancestors' : ''}`}>
        <Box component="span" className="tf-nc" style={{ borderColor: hasDatabaseId ? 'green' : 'default' }}>
          <span className="node-text">
            <SourceBox {...{ sourceId }}>
              {(entityId !== null && !sourceIsTemplate) ? (
                <FinishedSource {...{ sourceId }} />
              ) : (
                <Source {...{ sourceId }} />
              )}
            </SourceBox>
            <div className="corner-id" style={{ color: hasDatabaseId ? 'green' : 'default' }}>
              {sourceId}
            </div>
            { (!sourceIsTemplate && sourceInput.length > 0 && entityId) && (
            <div className="before-node before-node-visibility">
              <Tooltip key={`ancestors-hidden-${ancestorsHidden}`} arrow title={visibilityIconToolTip} placement="left">
                <div>
                  <Icon onClick={onVisibilityClick} style={{ color: 'grey' }} />
                </div>
              </Tooltip>
            </div>
            )}
            { (sourceIsTemplate && sourceInput.length > 0)
            && (
            <div className="before-node before-node-sequence-in-between">
              <Tooltip key={`ancestors-hidden-${ancestorsHidden}`} arrow title="Add sequence in between" placement={sourceInput.length > 1 ? 'top' : 'left'}>
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
            <NetWorkNode sourceId={id} key={`node-${id}`} />
          ))}
        </ul>
        )}
      </li>
    </SequenceWrapper>
  );
}

export default React.memo(NetWorkNode);
