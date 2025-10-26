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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

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
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Workspace navigation</CardTitle>
        <CardDescription>
          Jump into the surfaces your teams rely on the most. Each entry mirrors the structure of the sidebar navigation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {section.title}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon ? iconComponents[item.icon] : null;

                  return (
                    <Button key={item.label} variant="ghost" size="sm" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceNavigationPanel;
