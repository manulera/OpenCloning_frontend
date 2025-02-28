import React from 'react';
import { useSelector } from 'react-redux';
import isEqual from 'lodash-es/isEqual';
import { getAllParentSources } from '../utils/network';
import NetWorkNode from './NetworkNode';
import NewSourceBox from './sources/NewSourceBox';
import DragAndDropCloningHistoryWrapper from './DragAndDropCloningHistoryWrapper';

function CloningHistory() {
  const startingSourceIds = useSelector(
    (state) => {
      const entityIds = state.cloning.entities.map((entity) => entity.id);
      const entityIdsOfInputs = state.cloning.sources.flatMap((source) => source.input);
      const terminalEntities = entityIds.filter((entityId) => !entityIdsOfInputs.includes(entityId));
      const terminalSources = state.cloning.sources.filter((source) => terminalEntities.includes(source.output) || source.output === null);
      terminalSources.sort((source1, source2) => {
        const parentSources1 = [];
        const parentSources2 = [];
        getAllParentSources(source1, state.cloning.sources, parentSources1);
        getAllParentSources(source2, state.cloning.sources, parentSources2);
        const parentSources1Ids = parentSources1.map((source) => source.id);
        const parentSources2Ids = parentSources2.map((source) => source.id);
        return Math.min(...parentSources1Ids) - Math.min(...parentSources2Ids);
      });
      return terminalSources.map((source) => source.id);
    },
    isEqual,
  );
  return (
    <DragAndDropCloningHistoryWrapper>
      <div className="tf-tree tf-ancestor-tree">
        <div>
          <ul>
            {startingSourceIds.map((sourceId) => (
              <NetWorkNode key={sourceId} {...{ sourceId }} />
            ))}
            {/* There is always a box on the right side to add a source */}
            <li key="new_source_box" className="new_source_box">
              <span className="tf-nc"><span className="node-text"><NewSourceBox /></span></span>
            </li>
          </ul>
        </div>
      </div>
    </DragAndDropCloningHistoryWrapper>

  );
}

export default React.memo(CloningHistory);
