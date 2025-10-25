import React, { Suspense, lazy } from 'react';
import HomeHeroSection from '../../features/home/components/HomeHeroSection';
import {
  navigationSections,
  spotlightTiles,
  knowledgeCards,
} from '../../features/home/data';

const WorkspaceNavigationPanel = lazy(() =>
  import('../../features/home/components/WorkspaceNavigationPanel'),
);
const LaunchChecklistPanel = lazy(() =>
  import('../../features/home/components/LaunchChecklistPanel'),
);
const KnowledgeGridSection = lazy(() =>
  import('../../features/home/components/KnowledgeGridSection'),
);
const OnboardingCtaSection = lazy(() =>
  import('../../features/home/components/OnboardingCtaSection'),
);

const PanelSkeleton = ({ className = '' }) => (
  <div
    className={`h-full min-h-[200px] animate-pulse rounded-2xl border border-border/60 bg-card/40 p-6 ${className}`}
  >
    <div className="mb-4 h-5 w-1/3 rounded bg-muted/60" />
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-muted/40" />
      <div className="h-4 w-5/6 rounded bg-muted/40" />
      <div className="h-4 w-2/3 rounded bg-muted/40" />
    </div>
  </div>
);

const HomePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-[calc(var(--space-xl)+var(--space-lg))] lg:gap-10">
      <HomeHeroSection />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Suspense fallback={<PanelSkeleton />}>
          <WorkspaceNavigationPanel sections={navigationSections} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton className="lg:col-start-2" />}>
          <LaunchChecklistPanel tiles={spotlightTiles} />
        </Suspense>
      </section>

      <Suspense fallback={<PanelSkeleton />}>
        <KnowledgeGridSection cards={knowledgeCards} />
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        <OnboardingCtaSection />
      </Suspense>
    </div>
  );
};

export default HomePage;
