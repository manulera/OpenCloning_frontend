import { useDispatch } from 'react-redux';
import { appActions } from '../store/appReducer';

export default function useAppAlerts() {
  const dispatch = useDispatch();

  const addAlert = (alert) => {
    dispatch(appActions.addAlert(alert));
  };

  const removeAlert = (message) => {
    dispatch(appActions.removeAlert(message));
  };

  return { addAlert, removeAlert };
}
