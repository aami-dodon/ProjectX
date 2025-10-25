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
import { SinglePageLayout } from '../layout/SinglePageLayout';

const HomePage = () => {
  return (
    <SinglePageLayout className="gap-8 lg:gap-10">
      <HomeHeroSection />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <WorkspaceNavigationPanel sections={navigationSections} />
        <LaunchChecklistPanel tiles={spotlightTiles} />
      </section>

      <KnowledgeGridSection cards={knowledgeCards} />

      <OnboardingCtaSection />
    </SinglePageLayout>
  );
};

export default HomePage;
