import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '../../../components/ui/card';

const OnboardingCtaSection = () => {
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Need a tour?</p>
          <CardTitle className="text-lg">Schedule time with an onboarding specialist.</CardTitle>
          <CardDescription>
            Walk through the unified dashboard experience, connect data sources, and tailor the workspace to your team's
            workflows.
          </CardDescription>
        </div>
        <div className="flex items-end justify-end">
          <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
            Book session
            <LifeBuoy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingCtaSection;
