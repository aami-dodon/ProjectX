import componentDemoConfig from './component-demo.config.js';
import { toPascalCase, toDisplayName, toCamelCase } from './nameFormatting.js';

const componentModules = import.meta.glob('@/components/ui/*.jsx', { eager: true });

export const discoverComponents = () =>
  Object.entries(componentModules)
    .map(([path, module]) => {
      const fileName = path.split('/').pop();
      const slug = fileName.replace(/\.jsx$/i, '');
      const hasLeadingCapital = /^[A-Z]/.test(slug);
      const exportName = hasLeadingCapital ? slug : toPascalCase(slug);
      const displayName = toDisplayName(exportName);
      const Component = module[exportName] || module.default || null;

      const camelName = toCamelCase(slug);
      const variantKeys = Object.entries(module).filter(
        ([key, value]) => typeof value === 'function' && key.toLowerCase().includes('variants')
      );
      const directMatch = variantKeys.find(([key]) =>
        key.toLowerCase().startsWith(camelName.toLowerCase())
      );
      const helperEntry = directMatch || variantKeys[0] || null;
      const variantHelper = helperEntry ? helperEntry[1] : null;

      return {
        path,
        slug,
        module,
        displayName,
        Component,
        variantHelper,
        config: componentDemoConfig[slug] || null,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
