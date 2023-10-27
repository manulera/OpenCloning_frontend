import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import MultipleOutputsSelector from './MultipleOutputsSelector';
import useBackendAPI from '../../hooks/useBackendAPI';
import { getInputEntitiesFromSourceId } from '../../store/cloning_utils';

function SourcePCR({ sourceId }) {
  const inputEntities = useSelector((state) => getInputEntitiesFromSourceId(state, sourceId), shallowEqual);
  const primers = useSelector((state) => state.primers.primers);
  const { waitingMessage, sources, entities, sendRequest } = useBackendAPI(sourceId);
  const [selectedPrimerIds, setSelectedPrimersIds] = React.useState([]);

  const onChange = (event) => {
    const { options } = event.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(Number(options[i].value));
      }
    }
    setSelectedPrimersIds(value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const requestData = {
      sequences: inputEntities,
      primers: primers.filter((p) => selectedPrimerIds.includes(p.id)),
      source: {
        input: inputEntities.map((e) => e.id),
        primer_annealing_settings: { minimum_annealing: 15 },
      },
    };
    sendRequest('pcr', requestData);
  };

  return (
    <div className="restriction">
      <h3 className="header-nodes">PCR</h3>
      <form onSubmit={onSubmit}>
        <label htmlFor="select_multiple_primers">
          <select multiple value={selectedPrimerIds} id="select_multiple_primers" onChange={onChange}>
            {primers.map((primer) => <option value={primer.id}>{primer.name}</option>)}
          </select>
        </label>
        <button type="submit">Submit</button>
      </form>
      <div>{waitingMessage}</div>
      <MultipleOutputsSelector {...{
        sources, entities, sourceId, inputEntities,
      }}
      />
    </div>
  );
}

export default SourcePCR;
