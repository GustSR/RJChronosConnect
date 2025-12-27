import { TitleContext } from '@shared/lib/contexts/TitleContext';
import { useContext, useEffect } from 'react';

const useTitle = (text: string) => {
  const { title, setTitle } = useContext(TitleContext);

  const normalizedTitle = text.replace(/\s*-\s*RJ\s*Chronos\s*$/i, '').trim();

  useEffect(() => setTitle(normalizedTitle), [normalizedTitle, setTitle]);

  return title;
};

export default useTitle;
