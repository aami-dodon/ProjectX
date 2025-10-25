import React from 'react';
import ThemeToggleCard from '../../components/ui/ThemeToggleCard';
import {
  colorTokens,
  colorRamps,
  spacingTokens,
  radiiTokens,
  buttonVariants as buttonVariantTokens,
} from '../../features/theme';
import { SinglePageLayout, PageHeader } from '../layout/SinglePageLayout';
import { Card, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const ColorTokensSection = () => (
  <Card className="space-y-md">
    <div className="space-y-xs">
      <CardTitle>Color tokens</CardTitle>
      <CardDescription>
        Preview surface, text, and semantic colors pulled directly from the theme system.
      </CardDescription>
    </div>
    <div className="grid gap-md md:grid-cols-2">
      {colorTokens.map((token) => (
        <div
          key={token.name}
          className={`flex flex-col gap-xs rounded-lg border border-border/60 px-md py-md shadow-sm transition-colors ${token.swatchClass}`}
        >
          <span className="body-sm font-semibold">{token.name}</span>
          <p className="body-xs opacity-80">{token.description}</p>
        </div>
      ))}
    </div>
  </Card>
);

const SpacingTokensSection = () => (
  <Card className="space-y-md">
    <div className="space-y-xs">
      <CardTitle>Spacing scale</CardTitle>
      <CardDescription>
        The spacing system keeps vertical rhythm and responsive padding consistent across layouts.
      </CardDescription>
    </div>
    <div className="grid gap-md md:grid-cols-2">
      {spacingTokens.map((token) => (
        <div
          key={token.name}
          className="flex flex-col gap-sm rounded-lg border border-dashed border-border/70 bg-muted/40 px-md py-sm"
        >
          <div className="flex items-baseline justify-between gap-md">
            <div>
              <p className="body-sm font-semibold text-foreground">{token.name}</p>
              <p className="body-xs text-muted-foreground">{token.utility}</p>
            </div>
            <span className="body-xs font-mono text-muted-foreground">{token.cssVar}</span>
          </div>
          <div className="flex items-center justify-start">
            <div className="h-2 rounded-full bg-primary-400" style={{ width: `calc(var(${token.cssVar}) * 14)` }} />
          </div>
          <p className="body-xs text-muted-foreground">{token.description}</p>
        </div>
      ))}
    </div>
  </Card>
);

const RadiiTokensSection = () => (
  <Card className="space-y-md">
    <div className="space-y-xs">
      <CardTitle>Radii scale</CardTitle>
      <CardDescription>
        Rounded corners create the tactile feel of the interface, scaling with component hierarchy.
      </CardDescription>
    </div>
    <div className="grid gap-md sm:grid-cols-3">
      {radiiTokens.map((token) => (
        <div key={token.name} className="flex flex-col items-center gap-sm text-center">
          <div className={`h-24 w-full max-w-[120px] border border-border/60 bg-secondary-50 ${token.className}`} />
          <div className="space-y-1">
            <p className="body-sm font-semibold text-foreground">{token.name}</p>
            <p className="body-xs text-muted-foreground">{token.description}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const ColorRampsSection = () => (
  <Card className="space-y-md">
    <div className="space-y-xs">
      <CardTitle>Color ramps</CardTitle>
      <CardDescription>
        Multi-step scales unlock consistent hover states, analytics palettes, and stateful gradients.
      </CardDescription>
    </div>
    <div className="space-y-md">
      {colorRamps.map((ramp) => (
        <div key={ramp.name} className="space-y-sm">
          <div className="space-y-1">
            <p className="body-sm font-semibold text-foreground">{ramp.name}</p>
            <p className="body-xs text-muted-foreground">{ramp.description}</p>
          </div>
          <div className="grid grid-cols-5 gap-sm sm:grid-cols-10">
            {ramp.swatches.map((swatch) => (
              <div key={swatch.step} className="flex flex-col items-center gap-xs">
                <div className={`h-10 w-full rounded-md ${swatch.swatchClass}`} aria-hidden="true" />
                <span className="caption text-muted-foreground">{swatch.step}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const ButtonTokensSection = () => (
  <Card className="space-y-md">
    <div className="space-y-xs">
      <CardTitle>Button variants</CardTitle>
      <CardDescription>
        Each variant inherits typography, spacing, and state tokens managed by the theme.
      </CardDescription>
    </div>
    <div className="flex flex-wrap gap-sm">
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
    <SinglePageLayout>
      <PageHeader
        title="Theme &amp; Tokens"
        description="Explore the reusable primitives that power the product interface and quickly preview theme switching."
      />

      <div className="flex flex-col gap-xl">
        <ThemeToggleCard />
        <ColorTokensSection />
        <ColorRampsSection />
        <SpacingTokensSection />
        <RadiiTokensSection />
        <ButtonTokensSection />
      </div>
    </SinglePageLayout>
  );
};

export default ThemePage;
