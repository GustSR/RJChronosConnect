import { useEffect, useState } from 'react';
import { themeSettingsProps } from '@shared/lib/theme';

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [data, setData] = useState(initialValue);

  useEffect(() => {
    const getData = window.localStorage.getItem(key);
    if (getData) {
      setData(JSON.parse(getData));
    }
  }, [key]);

  const storeData = (updateValue: T | themeSettingsProps) => {
    setData(updateValue);
    window.localStorage.setItem(key, JSON.stringify(updateValue));
  };

  return { data, storeData };
};

export default useLocalStorage;
