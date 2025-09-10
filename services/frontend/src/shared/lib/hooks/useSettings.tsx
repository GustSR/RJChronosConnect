import { SettingsContext } from '../contexts';
import { useContext } from 'react';

const useSettings = () => useContext(SettingsContext);

export default useSettings;
