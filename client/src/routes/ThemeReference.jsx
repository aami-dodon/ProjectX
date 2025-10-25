import React, { useState } from 'react';
import { Card, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { SinglePageLayout, PageHeader } from '../components/layout/SinglePageLayout';
import useTheme from '../hooks/useTheme';
import { SimpleEditor, EditorProse } from '../components/editor';

const colorTokens = [
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

const spacingTokens = [
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

const radiiTokens = [
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

const buttonVariants = [
  { variant: 'default', label: 'Default' },
  { variant: 'secondary', label: 'Secondary' },
  { variant: 'outline', label: 'Outline' },
  { variant: 'ghost', label: 'Ghost' },
  { variant: 'destructive', label: 'Destructive' },
  { variant: 'link', label: 'Link' },
];

const defaultEditorContent = `
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

const ThemeReference = () => {
  const { theme, setTheme } = useTheme();
  const [editorContent, setEditorContent] = useState(defaultEditorContent);

  return (
    <SinglePageLayout>
      <PageHeader
        eyebrow="Design System"
        title="Theme & Tokens Reference"
        description="A living style guide composed from the same primitives used across the product. Use this page to audit typography, elevation, color tokens, and component states in both light and dark themes."
        descriptionClassName="lead max-w-3xl text-muted-foreground"
      />

      <div className="flex flex-wrap items-center justify-between gap-sm rounded-lg border border-border bg-muted/30 px-md py-sm">
        <div className="flex flex-col gap-xs">
          <span className="body-sm font-medium text-foreground">Dark mode</span>
          <p className="body-xs text-muted">
            Toggle the global theme class to preview how tokens cascade through every component state.
          </p>
        </div>
        <Switch
          aria-label="Toggle dark mode"
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
      </div>

      <section className="grid gap-lg md:grid-cols-2">
        <Card className="flex flex-col gap-md">
          <div>
            <CardTitle>Typography scale</CardTitle>
            <CardDescription>
              Utilities map directly to tokenized font sizes, tracking, and line heights defined in <code>theme.css</code>.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <span className="eyebrow text-muted">Page Title</span>
              <p className="h1">Heading One</p>
              <p className="lead">Lead copy reinforces primary actions and key insights.</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="h2">Heading Two</p>
              <p className="body-lg">
                Body large supports narrative content with relaxed spacing for comfortable reading.
              </p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="h3">Heading Three</p>
              <p className="body-md">Default body text keeps detail dense yet readable.</p>
              <p className="body-sm text-muted">Body small and muted for helper information and metadata.</p>
              <p className="caption">Caption text provides compact annotations.</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-md">
          <div>
            <CardTitle>Buttons &amp; states</CardTitle>
            <CardDescription>
              The shadcn <code>&lt;Button /&gt;</code> component consumes the same variant tokens and focus rings.
            </CardDescription>
          </div>
          <div className="grid gap-sm sm:grid-cols-2">
            {buttonVariants.map(({ variant, label }) => (
              <div key={variant} className="flex flex-col gap-xs">
                <span className="body-sm text-muted">{label}</span>
                <Button variant={variant}>Enabled</Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="flex flex-col gap-lg">
        <div>
          <CardTitle>Color tokens</CardTitle>
          <CardDescription>
            Swatches render directly from the CSS custom properties to stay in sync across light and dark palettes.
          </CardDescription>
        </div>
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {colorTokens.map(({ name, swatchClass, description }) => (
            <div key={name} className="flex flex-col gap-sm rounded-lg border border-border bg-card/60 p-md">
              <div className={`flex h-20 items-center justify-center rounded-md ${swatchClass}`}>
                <span className="body-sm font-medium">{name}</span>
              </div>
              <p className="body-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <CardTitle>Rich text editor</CardTitle>
          <CardDescription>
            The tiptap-powered editor mirrors the product experience, including the toolbar, typography tokens, and live theme
            preview.
          </CardDescription>
        </div>
        <div className="grid gap-md lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SimpleEditor
            value={editorContent}
            onChange={setEditorContent}
            placeholder="Document how this theme supports your controls…"
            className="min-h-[280px]"
          />
          <div className="flex flex-col gap-sm">
            <span className="body-sm text-muted">Live preview</span>
            <EditorProse
              html={editorContent}
              className="prose-sm rounded-lg border border-border bg-background/60 p-md shadow-inner"
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-lg">
        <div>
          <CardTitle>Spacing scale</CardTitle>
          <CardDescription>
            Layout utilities reference shared spacing tokens. The preview bars below expand using the matching CSS variables.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-sm">
          {spacingTokens.map(({ name, utility, cssVar, description }) => (
            <div key={name} className="grid gap-sm rounded-lg border border-dashed border-border bg-background/60 p-md sm:grid-cols-[auto_auto_1fr] sm:items-center">
              <div className="body-sm font-medium text-foreground">{name}</div>
              <div className="body-xs text-muted">{utility}</div>
              <div className="flex flex-col gap-xs">
                <div
                  className="rounded-full bg-primary/30"
                  style={{ blockSize: `var(${cssVar})` }}
                />
                <p className="body-xs text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-lg">
        <div>
          <CardTitle>Radii tokens</CardTitle>
          <CardDescription>
            Rounded corners inherit from the base <code>--radius</code> token and cascade down for nested components.
          </CardDescription>
        </div>
        <div className="grid gap-md sm:grid-cols-3">
          {radiiTokens.map(({ name, className, description }) => (
            <div key={name} className="flex flex-col gap-sm">
              <div className={`h-24 border border-border bg-muted/40 ${className}`} />
              <div>
                <p className="body-sm font-medium text-foreground">{name}</p>
                <p className="body-xs text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-md">
        <div>
          <CardTitle>Global prose utilities</CardTitle>
          <CardDescription>
            Apply the <code>.prose</code> class when rendering long-form content to inherit typography, spacing, and media rules.
          </CardDescription>
        </div>
        <div className="prose rounded-lg border border-border bg-background/60 p-lg">
          <h2>Example article heading</h2>
          <p>
            Evidence narratives, policy updates, and audit responses should wrap content in <code>.prose</code> to ensure consistent
            typography. Inline links, <code>code</code> snippets, and ordered lists automatically receive the correct tokens.
          </p>
          <ol>
            <li>Use semantic headings to structure long-form content.</li>
            <li>Leverage callouts with <code>&lt;blockquote&gt;</code> for quotes or reminders.</li>
            <li>Prefer theme tokens over hard-coded values to maintain parity across modes.</li>
          </ol>
          <blockquote>
            Consistent theming accelerates delivery and keeps compliance evidence human-friendly.
          </blockquote>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-lg bg-muted/40 px-md py-sm">
          <p className="body-sm text-muted">
            Need a quick reference later? Bookmark this route or check the docs entry under <code>reference/theme-reference.md</code>.
          </p>
          <Button variant="link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top
          </Button>
        </div>
      </Card>
    </SinglePageLayout>
  );
};

export default ThemeReference;
