import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import ThemeToggleCard from '../../components/ui/ThemeToggleCard';
import { colorTokens, radiiTokens, buttonVariants as buttonVariantTokens } from '../../features/theme';
import { Card, CardTitle, CardDescription } from '../../components/ui/card';
import { Button, buttonVariants } from '../../components/ui/button';

const PageHeader = ({ title, eyebrow, description, descriptionClassName }) => {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        <Link to="/" className={`${buttonVariants({ variant: 'ghost' })} inline-flex items-center gap-2`}>
          <Home className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </div>
      {description ? (
        <p className={descriptionClassName ?? 'text-sm text-muted-foreground'}>{description}</p>
      ) : null}
    </header>
  );
};

const ColorTokensSection = () => (
  <Card className="space-y-4">
    <div className="space-y-2">
      <CardTitle>Color tokens</CardTitle>
      <CardDescription>
        Preview the core surfaces and semantic accents provided by the shadcn/ui theme.
      </CardDescription>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {colorTokens.map((token) => (
        <div
          key={token.name}
          className={`flex flex-col gap-2 rounded-lg border border-border/60 p-4 shadow-sm transition-colors ${token.swatchClass}`}
        >
          <span className="text-sm font-semibold">{token.name}</span>
          <p className="text-xs opacity-80">{token.description}</p>
        </div>
      ))}
    </div>
  </Card>
);

const RadiiTokensSection = () => (
  <Card className="space-y-4">
    <div className="space-y-2">
      <CardTitle>Radii scale</CardTitle>
      <CardDescription>
        Rounded corners help components feel tactile and consistent across the interface.
      </CardDescription>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {radiiTokens.map((token) => (
        <div key={token.name} className="flex flex-col items-center gap-2 text-center">
          <div className={`h-24 w-full max-w-[120px] border border-border/60 bg-muted ${token.className}`} />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{token.name}</p>
            <p className="text-xs text-muted-foreground">{token.description}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const ButtonTokensSection = () => (
  <Card className="space-y-4">
    <div className="space-y-2">
      <CardTitle>Button variants</CardTitle>
      <CardDescription>
        Each variant uses the shared theme tokens for color, radius, and typography.
      </CardDescription>
    </div>
    <div className="flex flex-wrap gap-3">
      {buttonVariantTokens.map((button) => (
        <Button key={button.variant} variant={button.variant}>
          {button.label}
        </Button>
      ))}
    </div>
  </Card>
);

const ThemePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-16">
      <PageHeader
        title="Theme &amp; Tokens"
        description="Explore the reusable primitives that power shadcn/ui components across the product."
      />

      <div className="flex flex-col gap-8">
        <ThemeToggleCard />
        <ColorTokensSection />
        <RadiiTokensSection />
        <ButtonTokensSection />
      </div>
    </div>
  );
};

export default ThemePage;
