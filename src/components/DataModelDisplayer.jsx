import { isEqual } from 'lodash-es';
import React from 'react';
import { useSelector } from 'react-redux';
import moclo from './assembler/moclo.json';
import AssemblerPart from './assembler/AssemblerPart';

function DataModelDisplayer() {
  const { sources,  sequences, primers } = useSelector((state) => state.cloning, isEqual);
  const trimmedSequences = sequences.map((s) => {
    const seqOut = { ...s };
    seqOut.file_content = '[...]';
    return seqOut;
  });
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {moclo.map((item) => (
      <div key={item.header}>
        <h2>{item.header}</h2>
        <p style={{ display: 'flex', justifyContent: 'center' }}>
          <AssemblerPart data={item} />
        </p>
      </div>
    ))
    }
  </div>;
  // TODO: proper json syntax highlighting here
  return (
    <div className="data-model-displayer">
      <p>
        Visit the
        {' '}
        <a href="https://opencloning.github.io/OpenCloning_LinkML" target="_blank" rel="noopener noreferrer">data model documentation</a>
        .
      </p>

      <code>
        {JSON.stringify({ sources, sequences: trimmedSequences, primers }, null, 4)}
      </code>
    </div>
  );
}

export default DataModelDisplayer;
