import { SettingsContext } from '@shared/lib/contexts';
import { useContext } from 'react';

const useSettings = () => useContext(SettingsContext);

export default useSettings;
