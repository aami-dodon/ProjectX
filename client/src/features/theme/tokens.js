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
    swatchClass: 'bg-primary text-primary-foreground',
    description: 'Brand accent used for primary actions and key highlights.',
  },
  {
    name: 'Secondary',
    swatchClass: 'bg-secondary text-secondary-foreground',
    description: 'Subtle accent for secondary actions and neutral surfaces.',
  },
  {
    name: 'Success',
    swatchClass: 'bg-success text-success-foreground',
    description: 'Positive confirmations and healthy status messaging.',
  },
  {
    name: 'Warning',
    swatchClass: 'bg-warning text-warning-foreground',
    description: 'Cautions, reminders, and soft alerts that precede destructive flows.',
  },
  {
    name: 'Info',
    swatchClass: 'bg-info text-info-foreground',
    description: 'Supportive informational banners or inline help text.',
  },
  {
    name: 'Destructive',
    swatchClass: 'bg-destructive text-destructive-foreground',
    description: 'Dangerous operations like deletions and revocations.',
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
