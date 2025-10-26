import React, { useMemo } from 'react';
import { buildVariantGroups } from '../utils/componentVariants.js';

const PreviewSurface = ({ children, className }) => (
  <div
    className={[
      'flex min-h-[4rem] items-center justify-center rounded-md border border-border bg-background p-4',
      className || '',
    ]
      .join(' ')
      .trim()}
  >
    {children}
  </div>
);

const ComponentPreviewCard = ({ entry }) => {
  const { displayName, slug, module, Component, variantHelper, config } = entry;
  const DemoComponent = config?.Demo || null;
  const disableDefault = Boolean(config?.disableDefault);

  const defaultProps = useMemo(() => {
    if (config?.getDefaultProps) {
      return config.getDefaultProps({ module, displayName, slug }) || {};
    }
    if (config?.defaultProps) {
      return config.defaultProps;
    }
    if (Component) {
      return { children: displayName };
    }
    return {};
  }, [Component, config, displayName, module, slug]);

  const variantGroups = useMemo(() => buildVariantGroups(variantHelper), [variantHelper]);

  return (
    <div className='rounded-lg border bg-card text-card-foreground shadow-sm'>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <div>
          <h3 className='text-lg font-semibold'>{displayName}</h3>
          <p className='text-xs font-mono text-muted-foreground'>{slug}.jsx</p>
        </div>
      </div>
      <div className='space-y-6 p-4'>
        {DemoComponent ? (
          <DemoComponent module={module} displayName={displayName} slug={slug} />
        ) : Component && !disableDefault ? (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Default
              </p>
              <PreviewSurface className={config?.wrapperClassName}>
                <Component {...defaultProps} />
              </PreviewSurface>
            </div>
            {variantGroups.map((group) => (
              <div key={group.name} className='space-y-3'>
                <p className='text-sm font-semibold capitalize text-foreground'>{group.name}</p>
                <div className='flex flex-wrap gap-3'>
                  {group.items.map((item) => (
                    <div key={item.label} className='space-y-2'>
                      <PreviewSurface className={config?.wrapperClassName}>
                        <Component {...defaultProps} {...item.props} />
                      </PreviewSurface>
                      <p className='text-xs text-muted-foreground'>
                        {item.label}
                        {item.isDefault ? ' · default' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Preview unavailable. Add a demo configuration in component-demo.config.js.
          </p>
        )}
        {config?.note ? <p className='text-xs text-muted-foreground'>{config.note}</p> : null}
      </div>
    </div>
  );
};

export default ComponentPreviewCard;
