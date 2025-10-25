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
import { Card } from '../../components/ui/card';
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background lg:flex-row">
      <aside className="border-border/60 bg-muted/10 px-6 py-8 lg:flex lg:w-72 lg:flex-col lg:border-r">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Acme Inc</p>
            <p className="text-sm font-medium text-foreground">Enterprise</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-10 flex-1 space-y-10">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{section.title}</p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-transparent bg-transparent px-3 py-2 text-left text-sm text-muted transition hover:border-border/60 hover:bg-muted/30 hover:text-foreground"
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.icon ? <item.icon className="h-4 w-4 text-muted" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Need a tour?</p>
              <p className="text-xs text-muted">Schedule time with an onboarding specialist.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2 text-sm">
            Book session
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="border-b border-border/60 bg-background/80 px-8 py-10">
          <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
            <span>Platform</span>
            <span className="text-muted">/</span>
            <span>Building Your Application</span>
            <span className="text-muted">/</span>
            <span>Data Fetching</span>
          </nav>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">Build data-driven experiences</h1>
            <p className="max-w-2xl text-sm text-muted lg:text-base">
              Pair reusable templates, curated blocks, and live usage metrics to orchestrate the product surfaces that matter. The layout mirrors the shadcn/ui sidebar reference while leaving space to plug in real content.
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
        </header>

        <div className="space-y-10 px-8 py-10">
          <section className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Card
                key={index}
                className="h-44 border-border/60 bg-muted/10 transition hover:border-border/80 hover:bg-muted/20"
              >
                <div className="flex h-full flex-col justify-between p-6">
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded bg-muted/50" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted/40" />
                      <div className="h-3 w-3/4 rounded bg-muted/30" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Preview</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border-border/60 bg-muted/10 p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Launch checklist</p>
                  <p className="text-xl font-semibold text-foreground">Map the rollout cadence</p>
                  <p className="text-sm text-muted">
                    Capture the same stacked-card rhythm showcased in the sidebar-07 layout. Use these placeholders to validate the grid before wiring real data.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {spotlightTiles.map((tile) => (
                    <div
                      key={tile.label}
                      className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted"
                    >
                      <p className="text-foreground">{tile.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em]">{tile.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-muted/10 p-6">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Inbox</p>
                  <p className="text-lg font-semibold text-foreground">Team notifications</p>
                  <p className="text-sm text-muted">Seven updates from collaborating squads require review.</p>
                </div>
                <Button variant="outline" className="mt-6 w-full gap-2 text-sm">
                  View all alerts
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {knowledgeCards.map((card) => (
              <Card key={card.title} className="border-border/60 bg-muted/10 p-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="text-sm text-muted">{card.description}</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted transition hover:text-foreground"
                  >
                    Explore
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
