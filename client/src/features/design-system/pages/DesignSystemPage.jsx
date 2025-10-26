import React from 'react';
import ThemeControls from '../components/ThemeControls.jsx';
import ComponentPreviewCard from '../components/ComponentPreviewCard.jsx';
import { useComponentLibrary } from '../hooks/useComponentLibrary.js';
import { useThemeDesigner } from '../hooks/useThemeDesigner.js';

const DesignSystemPage = () => {
  const { components, searchTerm, setSearchTerm } = useComponentLibrary();
  const { activeTheme, setActiveTheme, themeColors, updateToken, COLOR_TOKENS, hslStringToHex } =
    useThemeDesigner();

  return (
    <div className='flex h-full min-h-0 flex-col gap-10 overflow-hidden'>
      <section className='flex-none space-y-4'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Design System</h1>
          <p className='text-sm text-muted-foreground'>
            Explore the component library and adjust live theme tokens.
          </p>
        </div>
        <ThemeControls
          activeTheme={activeTheme}
          onModeChange={setActiveTheme}
          tokens={COLOR_TOKENS}
          themeColors={themeColors}
          onTokenChange={updateToken}
          valueFormatter={hslStringToHex}
        />
      </section>

      <section className='min-h-0 flex-1 overflow-y-auto'>
        <div className='space-y-6 pb-10'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-1'>
              <h2 className='text-2xl font-semibold tracking-tight text-foreground'>Component Library</h2>
              <p className='text-sm text-muted-foreground'>
                Components are imported automatically from src/components/ui.
              </p>
            </div>
            <div className='w-full max-w-sm'>
              <input
                type='search'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Search components'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              />
            </div>
          </div>
          <div className='grid gap-6'>
            {components.map((component) => (
              <ComponentPreviewCard key={component.slug} entry={component} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemPage;
