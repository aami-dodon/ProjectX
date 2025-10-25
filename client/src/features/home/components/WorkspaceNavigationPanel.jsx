import React from 'react';
import {
  ArrowUpRight,
  Command,
  MonitorSmartphone,
  SquareStack,
  Component as ComponentIcon,
  BookOpen,
  Settings,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '../../../components/ui/card';

const iconComponents = {
  Command,
  MonitorSmartphone,
  SquareStack,
  Component: ComponentIcon,
  BookOpen,
  Settings,
};

const WorkspaceNavigationPanel = ({ sections }) => {
  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <CardTitle>Workspace navigation</CardTitle>
        <CardDescription>
          Jump into the surfaces your teams rely on the most. Each entry mirrors the structure of the sidebar navigation.
        </CardDescription>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{section.title}</p>
            <ul className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon ? iconComponents[item.icon] : null;

                return (
                  <li
                    key={item.label}
                    className="flex items-center justify-between rounded-md border border-transparent bg-transparent px-3 py-2 text-sm text-muted transition hover:border-border/70 hover:bg-muted/30 hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {Icon ? <Icon className="h-4 w-4 text-muted" /> : null}
                      <span className="font-medium">{item.label}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WorkspaceNavigationPanel;
