import React from 'react';
import {
  HomeHeroSection,
  WorkspaceNavigationPanel,
  LaunchChecklistPanel,
  KnowledgeGridSection,
  OnboardingCtaSection,
  navigationSections,
  spotlightTiles,
  knowledgeCards,
} from '../../features/home';

const HomePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-[calc(var(--space-xl)+var(--space-lg))] lg:gap-10">
      <HomeHeroSection />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <WorkspaceNavigationPanel sections={navigationSections} />
        <LaunchChecklistPanel tiles={spotlightTiles} />
      </section>

      <KnowledgeGridSection cards={knowledgeCards} />

      <OnboardingCtaSection />
    </div>
  );
};

export default HomePage;
