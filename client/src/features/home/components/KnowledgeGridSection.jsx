import React from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const KnowledgeGridSection = ({ cards }) => {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
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
  );
};

export default KnowledgeGridSection;
