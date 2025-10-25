import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Command,
  Component,
  LifeBuoy,
  MonitorSmartphone,
  Settings,
  Sparkles,
  SquareStack,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const navigationSections = [
  {
    title: 'Platform',
    items: [
      { label: 'Playground', icon: Command },
      { label: 'History', icon: MonitorSmartphone },
      { label: 'Shared', icon: SquareStack },
      { label: 'Models', icon: Component },
      { label: 'Documentation', icon: BookOpen },
      { label: 'Settings', icon: Settings },
    ],
  },
  {
    title: 'Projects',
    items: [
      { label: 'Design Engineering' },
      { label: 'Sales & Marketing' },
      { label: 'Travel' },
      { label: 'More' },
    ],
  },
];

const spotlightTiles = [
  { label: 'Scalability playbook', meta: 'Updated 2h ago' },
  { label: 'Streaming API explorer', meta: 'Draft in review' },
  { label: 'Realtime architecture kit', meta: 'Shared with 4 teams' },
  { label: 'Edge deployment recipes', meta: 'New in library' },
];

const knowledgeCards = [
  {
    title: 'Rapid prototyping shell',
    description: 'Bootstrap new experiences with opinionated defaults that mirror the shadcn/ui sidebar.',
  },
  {
    title: 'Onboarding journeys',
    description: 'Guide squads through capability discovery with contextual docs, snippets, and walkthroughs.',
  },
  {
    title: 'Platform pulse',
    description: 'Track integration health, release notes, and adoption in a single stream for leadership.',
  },
];

const HomePage = () => {
  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="space-y-6 rounded-2xl border border-border/70 bg-card/70 p-8 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Acme Inc</p>
            <p className="text-sm font-medium text-foreground">Enterprise workspace</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Sparkles className="h-4 w-4" />
            <span className="sr-only">Open spotlight</span>
          </Button>
        </div>

        <div className="space-y-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
            <span>Platform</span>
            <span className="text-muted">/</span>
            <span>Building Your Application</span>
            <span className="text-muted">/</span>
            <span>Data Fetching</span>
          </nav>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
              Build data-driven experiences
            </h1>
            <p className="max-w-2xl text-sm text-muted lg:text-base">
              Pair reusable templates, curated blocks, and live usage metrics to orchestrate the product surfaces that matter.
              Each module is wired into the unified dashboard layout so teams can focus on outcomes instead of scaffolding.
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

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-6">
          <div className="space-y-2">
            <CardTitle>Workspace navigation</CardTitle>
            <CardDescription>
              Jump into the surfaces your teams rely on the most. Each entry mirrors the structure of the sidebar navigation.
            </CardDescription>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{section.title}</p>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between rounded-md border border-transparent bg-transparent px-3 py-2 text-sm text-muted transition hover:border-border/70 hover:bg-muted/30 hover:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon ? <item.icon className="h-4 w-4 text-muted" /> : null}
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex h-full flex-col justify-between space-y-6">
          <div className="space-y-2">
            <CardTitle>Launch checklist</CardTitle>
            <CardDescription>
              Validate the experience before pushing to production. Each tile tracks readiness across collaborating teams.
            </CardDescription>
          </div>
          <div className="space-y-3">
            {spotlightTiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-lg border border-border/60 bg-background/50 p-4 text-sm text-muted transition hover:border-border/80 hover:bg-muted/40"
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
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {knowledgeCards.map((card) => (
          <Card key={card.title} className="flex h-full flex-col justify-between space-y-4">
            <div className="space-y-2">
              <CardTitle className="text-lg">{card.title}</CardTitle>
              <CardDescription className="mt-0 text-sm">{card.description}</CardDescription>
            </div>
            <Button variant="ghost" className="justify-start gap-2 text-sm">
              Explore resource
              <BookOpen className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border/60 bg-muted/10 p-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Need a tour?</p>
          <h2 className="text-lg font-semibold text-foreground">Schedule time with an onboarding specialist.</h2>
          <p className="text-sm text-muted">
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
    </div>
  );
};

export default HomePage;
