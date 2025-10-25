import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const OnboardingCtaSection = () => {
  return (
    <section className="grid gap-4 rounded-2xl border border-border/60 bg-muted/10 p-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Need a tour?</p>
        <h2 className="text-lg font-semibold text-foreground">Schedule time with an onboarding specialist.</h2>
        <p className="text-sm text-muted-foreground">
          Walk through the unified dashboard experience, connect data sources, and tailor the workspace to your team's workflows.
        </p>
      </div>
      <div className="flex items-end justify-end">
        <Button variant="outline" className="w-full gap-2 text-sm sm:w-auto">
          Book session
          <LifeBuoy className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default OnboardingCtaSection;
