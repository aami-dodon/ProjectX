import React from 'react';
import { Sparkles, ArrowUpRight, Briefcase } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/card';

const HomeHeroSection = () => {
  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Acme Inc</p>
          <CardDescription className="text-xs">Enterprise workspace</CardDescription>
        </div>
        <Button variant="ghost" size="icon">
          <Sparkles className="h-4 w-4" />
          <span className="sr-only">Open spotlight</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>Platform</span>
          <span className="text-muted-foreground">/</span>
          <span>Building Your Application</span>
          <span className="text-muted-foreground">/</span>
          <span>Data Fetching</span>
        </nav>
        <div className="space-y-4">
          <CardTitle className="text-3xl lg:text-4xl">Build data-driven experiences</CardTitle>
          <CardDescription className="max-w-2xl text-sm lg:text-base">
            Pair reusable templates, curated blocks, and live usage metrics to orchestrate the product surfaces that matter.
            Each module is wired into the unified dashboard layout so teams can focus on outcomes instead of scaffolding.
          </CardDescription>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-3">
        <Button size="sm" className="gap-2">
          Launch workspace
          <ArrowUpRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="gap-2">
          Share update
          <Briefcase className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HomeHeroSection;
