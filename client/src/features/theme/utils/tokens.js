export const colorTokens = [
  {
    name: 'Background',
    swatchClass: 'bg-background text-foreground',
    description: 'Primary surface color for the app shell and default text color.',
  },
  {
    name: 'Card',
    swatchClass: 'bg-card text-card-foreground',
    description: 'Raised surfaces like cards, tables, and popovers.',
  },
  {
    name: 'Primary',
    swatchClass: 'bg-primary text-primary-foreground',
    description: 'Brand accent used for primary actions and focused states.',
  },
  {
    name: 'Secondary',
    swatchClass: 'bg-secondary text-secondary-foreground',
    description: 'Neutral tone for secondary actions and quiet surfaces.',
  },
  {
    name: 'Muted',
    swatchClass: 'bg-muted text-muted-foreground',
    description: 'Subtle backgrounds and supporting text treatments.',
  },
  {
    name: 'Accent',
    swatchClass: 'bg-accent text-accent-foreground',
    description: 'Highlights interactive regions like badges or focus rings.',
  },
  {
    name: 'Destructive',
    swatchClass: 'bg-destructive text-destructive-foreground',
    description: 'High-attention states such as errors and destructive confirmations.',
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
    description: 'Used for nested surfaces such as inputs and menus.',
  },
  {
    name: 'Radius SM',
    className: 'rounded-sm',
    description: 'Applies to tight elements like tags and table chips.',
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
