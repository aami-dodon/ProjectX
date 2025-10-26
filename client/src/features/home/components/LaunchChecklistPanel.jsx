import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const LaunchChecklistPanel = ({ tiles }) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2">
        <CardTitle>Launch checklist</CardTitle>
        <CardDescription>
          Validate the experience before pushing to production. Each tile tracks readiness across collaborating teams.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="space-y-1 p-4">
              <CardTitle className="text-base">{tile.label}</CardTitle>
              <CardDescription className="text-[11px] uppercase tracking-[0.2em]">
                {tile.meta}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full gap-2">
          View rollout plan
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LaunchChecklistPanel;
