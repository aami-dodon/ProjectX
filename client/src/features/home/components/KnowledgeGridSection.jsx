import React from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const KnowledgeGridSection = ({ cards }) => {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="flex h-full flex-col">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              Explore resource
              <BookOpen className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
};

export default KnowledgeGridSection;
