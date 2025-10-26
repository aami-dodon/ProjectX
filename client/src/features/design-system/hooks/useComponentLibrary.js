import { useMemo, useState } from 'react';
import { discoverComponents } from '../utils/componentRegistry.js';

export const useComponentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const components = useMemo(() => discoverComponents(), []);

  const filteredComponents = useMemo(() => {
    if (!searchTerm) return components;
    const query = searchTerm.toLowerCase();
    return components.filter((component) =>
      component.displayName.toLowerCase().includes(query)
    );
  }, [components, searchTerm]);

  return { components: filteredComponents, searchTerm, setSearchTerm };
};
