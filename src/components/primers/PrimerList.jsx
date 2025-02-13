import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import PrimerForm from './PrimerForm';
import PrimerTableRow from './PrimerTableRow';
import './PrimerList.css';
import { cloningActions } from '../../store/cloning';
import ImportPrimersButton from './import_primers/ImportPrimersButton';
import PrimerDatabaseImportForm from './import_primers/PrimerDatabaseImportForm';
import { getUsedPrimerIds } from '../../store/cloning_utils';
import useDatabase from '../../hooks/useDatabase';

function PrimerList() {
  const primers = useSelector((state) => state.cloning.primers, shallowEqual);
  const { deletePrimer: deleteAction, addPrimer: addAction, editPrimer: editAction } = cloningActions;
  const database = useDatabase();
  const dispatch = useDispatch();
  const deletePrimer = (id) => dispatch(deleteAction(id));
  const addPrimer = (newPrimer) => dispatch(addAction(newPrimer));
  const editPrimer = (editedPrimer) => dispatch(editAction(editedPrimer));
  const [addingPrimer, setAddingPrimer] = React.useState(false);
  const [editingPrimerId, setEditingPrimerId] = React.useState(null);
  const [importingPrimer, setImportingPrimer] = React.useState(false);
  const onEditClick = (id) => {
    setEditingPrimerId(id);
    setAddingPrimer(false);
  };
  const editingPrimer = primers.find((p) => p.id === editingPrimerId);
  const switchAddingPrimer = () => setAddingPrimer(!addingPrimer);
  // We don't allow used primers to be deleted
  const primerIdsInUse = useSelector(
    (state) => getUsedPrimerIds(state.cloning.sources),
    shallowEqual,
  );

  return (
    <>
      <div className="primer-table-container">
        <table>
          <thead>
            <tr>
              <th> </th>
              <th>Name</th>
              <th>Sequence</th>
            </tr>
          </thead>
          <tbody>
            {primers.filter((primer) => primer.id !== editingPrimerId).map((primer) => (
              <PrimerTableRow
                key={primer.id}
                primer={primer}
                deletePrimer={deletePrimer}
                canBeDeleted={!primerIdsInUse.includes(primer.id)}
                onEditClick={onEditClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="primer-form-container">
        {(editingPrimerId && (
        <PrimerForm
          key="primer-edit"
          submitPrimer={editPrimer}
          cancelForm={() => setEditingPrimerId(null)}
          existingNames={primers.filter((p) => p.name !== editingPrimer.name).map((p) => p.name)}
          disabledSequenceText={primerIdsInUse.includes(editingPrimerId) ? 'Cannot edit sequence in use' : ''}
          primer={editingPrimer}
        />
        )) || (addingPrimer && (
        <PrimerForm
          key="primer-add"
          submitPrimer={addPrimer}
          cancelForm={switchAddingPrimer}
          existingNames={primers.map((p) => p.name)}
        />
        )) || (importingPrimer && (
          <PrimerDatabaseImportForm
            submitPrimer={addPrimer}
            cancelForm={() => setImportingPrimer(false)}
            existingNames={primers.map((p) => p.name)}
          />
        )) || (
          <div className="primer-add-container">
            <Button
              variant="contained"
              onClick={switchAddingPrimer}
            >
              Add Primer
            </Button>
            <ImportPrimersButton addPrimer={addPrimer} />
            {database && (
              <Button
                variant="contained"
                onClick={() => setImportingPrimer(true)}
              >
                {`Import from ${database.name}`}
              </Button>
            )}
          </div>
        )}
      </div>

    </>
  );
}

export default PrimerList;
