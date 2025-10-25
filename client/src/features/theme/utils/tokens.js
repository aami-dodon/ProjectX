export const colorTokens = [
  {
    name: 'Background & Foreground',
    swatchClass: 'bg-background text-foreground',
    description: 'Primary surface color with default text contrast applied across the app shell.',
  },
  {
    name: 'Card & Muted',
    swatchClass: 'bg-card text-muted-foreground',
    description: 'Layered surfaces like cards, tables, and quiet interface chrome.',
  },
  {
    name: 'Primary',
    swatchClass: 'bg-primary-500 text-primary-foreground',
    description: 'Brand accent used for primary actions and key highlights.',
  },
  {
    name: 'Secondary',
    swatchClass: 'bg-secondary-200 text-secondary-900',
    description: 'Subtle accent for secondary actions and neutral surfaces.',
  },
  {
    name: 'Success',
    swatchClass: 'bg-success-500 text-success-50',
    description: 'Positive confirmations and healthy status messaging.',
  },
  {
    name: 'Warning',
    swatchClass: 'bg-warning-400 text-warning-900',
    description: 'Cautions, reminders, and soft alerts that precede destructive flows.',
  },
  {
    name: 'Info',
    swatchClass: 'bg-info-500 text-info-50',
    description: 'Supportive informational banners or inline help text.',
  },
  {
    name: 'Destructive',
    swatchClass: 'bg-destructive-500 text-destructive-50',
    description: 'Dangerous operations like deletions and revocations.',
  },
];

const rampSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const buildRamp = (token, { borderFallback = 200 } = {}) =>
  rampSteps.map((step, index) => {
    const borderStep = index === 0 ? borderFallback : index === rampSteps.length - 1 ? rampSteps[index - 1] : step;
    return {
      step,
      swatchClass: `border border-${token}-${borderStep} bg-${token}-${step}`,
    };
  });

export const colorRamps = [
  {
    name: 'Primary ramp',
    description: 'Ten-step scale for brand-forward accents, call-to-action hover states, and data visualization.',
    swatches: buildRamp('primary', { borderFallback: 100 }),
  },
  {
    name: 'Secondary ramp',
    description: 'Cool neutral ramp for secondary surfaces and subdued interface chrome.',
    swatches: buildRamp('secondary', { borderFallback: 100 }),
  },
  {
    name: 'Success ramp',
    description: 'Green ramp to represent healthy states, trends, and SLA progress.',
    swatches: buildRamp('success', { borderFallback: 100 }),
  },
  {
    name: 'Warning ramp',
    description: 'Amber ramp tuned for cautionary messaging and “at risk” signals prior to errors.',
    swatches: buildRamp('warning', { borderFallback: 100 }),
  },
  {
    name: 'Info ramp',
    description: 'Cyan ramp used in inline guidance, helper banners, and analytics overlays.',
    swatches: buildRamp('info', { borderFallback: 100 }),
  },
  {
    name: 'Destructive ramp',
    description: 'Red ramp for failure states, destructive confirmations, and alert badges.',
    swatches: buildRamp('destructive', { borderFallback: 100 }),
  },
];

export const spacingTokens = [
  {
    name: 'Space XS',
    utility: '.gap-xs / .py-xs',
    cssVar: '--space-xs',
    description: 'Micro spacing for icon alignment and dense clusters.',
  },
  {
    name: 'Space SM',
    utility: '.gap-sm / .px-sm',
    cssVar: '--space-sm',
    description: 'Tight spacing for form controls and inline groups.',
  },
  {
    name: 'Space MD',
    utility: '.gap-md / .px-md',
    cssVar: '--space-md',
    description: 'Default body spacing used between related elements.',
  },
  {
    name: 'Space LG',
    utility: '.gap-lg / .py-lg',
    cssVar: '--space-lg',
    description: 'Section padding and comfortable breathing room.',
  },
  {
    name: 'Space XL',
    utility: '.gap-xl / .py-xl',
    cssVar: '--space-xl',
    description: 'Major page framing and hero layouts.',
  },
];

export const radiiTokens = [
  {
    name: 'Radius LG',
    className: 'rounded-lg',
    description: 'Default radius for interactive surfaces like cards and buttons.',
  },
  {
    name: 'Radius MD',
    className: 'rounded-md',
    description: 'Used for nested surfaces (inputs, secondary cards).',
  },
  {
    name: 'Radius SM',
    className: 'rounded-sm',
    description: 'Applies to tight elements such as tags and table chips.',
  },
];

export const buttonVariants = [
  { variant: 'default', label: 'Default' },
  { variant: 'secondary', label: 'Secondary' },
  { variant: 'outline', label: 'Outline' },
  { variant: 'ghost', label: 'Ghost' },
  { variant: 'destructive', label: 'Destructive' },
  { variant: 'link', label: 'Link' },
];

export const defaultEditorContent = `
  <h2>Audit evidence summary</h2>
  <p>
    Use this rich text editor to capture narratives with the same typography tokens used in production.
    Try toggling bold headings, bullet lists, and annotations to see how each element responds to theme changes.
  </p>
  <ul>
    <li>Leverage semantic headings to build a clear hierarchy.</li>
    <li>Use bullet points to highlight procedural steps or controls.</li>
    <li>Embed links to supporting documentation without leaving the flow.</li>
  </ul>
`;
