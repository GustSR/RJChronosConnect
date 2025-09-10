import { useLocalStorage } from '@shared/lib/hooks';
import { createContext, ReactNode } from 'react';
import { THEMES } from '../../config/constants';
import { themeSettingsProps } from '../../config/theme';

const initialSettings: themeSettingsProps = {
  direction: 'ltr',
  theme: THEMES.LIGHT,
  responsiveFontSizes: true,
};

export const SettingsContext = createContext({
  settings: initialSettings,
  saveSettings: (_arg: themeSettingsProps) => {},
});

// component props type
type settingsProviderProps = {
  children: ReactNode;
};

const SettingsProvider = ({ children }: settingsProviderProps) => {
  const { data: settings, storeData: setSettings } = useLocalStorage(
    'settings',
    initialSettings
  );

  const saveSettings = (updateSettings: themeSettingsProps) => {
    setSettings(updateSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
