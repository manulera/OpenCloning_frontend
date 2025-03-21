import React from 'react';
import { SimpleCircularOrLinearView } from '@teselagen/ove';
import { shallowEqual, useSelector } from 'react-redux';
import { reversePositionInRange } from '@teselagen/range-utils';
import { isEqual } from 'lodash-es';
import { getinputSequencesFromSourceId } from '../../store/cloning_utils';

function getCutParameters(seq, cut, isLeft) {
  if (cut === null) {
    return isLeft ? [0, 0, 0] : [seq.size, seq.size, 0];
  }
  const { cut_watson: watson, overhang: ovhg } = cut;
  const crick = (watson - ovhg) % seq.size;
  return [watson, crick, ovhg];
}

function SubSequenceDisplayer({
  source, sourceId,
}) {
  if (!['PCRSource', 'RestrictionEnzymeDigestionSource'].includes(source.type)) {
    return null;
  }
  const inputSequences = useSelector((state) => getinputSequencesFromSourceId(state, sourceId), shallowEqual);
  const seq = useSelector((state) => state.cloning.teselaJsonCache[inputSequences[0].id], isEqual);

  const editorName = `subsequence_editor_${sourceId}`;
  let selectionLayer = null;

  if (['PCRSource'].includes(source.type)) {
    if (!source.assembly[1].reverse_complemented) {
      selectionLayer = {
        start: source.assembly[1].left_location.start,
        end: source.assembly[1].right_location.end,
      };
    } else {
      selectionLayer = {
        end: reversePositionInRange(source.assembly[1].left_location.start, seq.size),
        start: reversePositionInRange(source.assembly[1].right_location.end, seq.size),
      };
    }
  }
  if (['RestrictionEnzymeDigestionSource'].includes(source.type)) {
    // The edges have the form (watson_pos, ovhg)

    const [leftWatson, leftCrick, leftOvhg] = getCutParameters(seq, source.left_edge, true);
    const [rightWatson, rightCrick, RightOvhg] = getCutParameters(seq, source.right_edge, false);

    selectionLayer = {
      start: leftOvhg > 0 ? leftCrick : leftWatson,
      end: RightOvhg > 0 ? rightWatson : rightCrick,
    };
  }

  return (
    <div className="multiple-output-selector">
      <SimpleCircularOrLinearView {...{ sequenceData: seq, editorName, selectionLayer, caretPosition: null, height: 'auto' }} />
    </div>
  );
}

export default SubSequenceDisplayer;
