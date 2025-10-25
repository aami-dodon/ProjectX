import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const LaunchChecklistPanel = ({ tiles }) => {
  return (
    <Card className="flex h-full flex-col justify-between space-y-6">
      <div className="space-y-2">
        <CardTitle>Launch checklist</CardTitle>
        <CardDescription>
          Validate the experience before pushing to production. Each tile tracks readiness across collaborating teams.
        </CardDescription>
      </div>
      <div className="space-y-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground transition hover:border-border/80 hover:bg-muted/40"
          >
            <p className="text-foreground">{tile.label}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em]">{tile.meta}</p>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-2 w-full gap-2 text-sm">
        View rollout plan
        <ArrowUpRight className="h-4 w-4" />
      </Button>
    </Card>
  );
};

export default LaunchChecklistPanel;
