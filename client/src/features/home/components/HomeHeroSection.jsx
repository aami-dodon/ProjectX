import React from 'react';
import { Sparkles, ArrowUpRight, Briefcase } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const HomeHeroSection = () => {
  return (
    <section className="space-y-6 rounded-2xl border border-border/70 bg-card/70 p-8 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Acme Inc</p>
          <p className="text-sm font-medium text-foreground">Enterprise workspace</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Sparkles className="h-4 w-4" />
          <span className="sr-only">Open spotlight</span>
        </Button>
      </div>

      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span>Platform</span>
          <span className="text-muted-foreground">/</span>
          <span>Building Your Application</span>
          <span className="text-muted-foreground">/</span>
          <span>Data Fetching</span>
        </nav>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">Build data-driven experiences</h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
            Pair reusable templates, curated blocks, and live usage metrics to orchestrate the product surfaces that
            matter. Each module is wired into the unified dashboard layout so teams can focus on outcomes instead of
            scaffolding.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" className="gap-2">
              Launch workspace
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="gap-2">
              Share update
              <Briefcase className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;
