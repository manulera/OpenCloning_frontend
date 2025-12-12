import { useDispatch } from 'react-redux';
import { cloningActions } from '../store/cloning';

export default function useAlerts() {
  const dispatch = useDispatch();

  const addAlert = (alert) => {
    dispatch(cloningActions.addAlert(alert));
  };

  const removeAlert = (message) => {
    dispatch(cloningActions.removeAlert(message));
  };

  return { addAlert, removeAlert };
}
