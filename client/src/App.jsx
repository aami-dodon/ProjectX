import React, { useMemo, useState } from 'react';
import {
  ArrowUpCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Columns,
  Database,
  File,
  Github,
  HelpCircle,
  LayoutDashboard,
  List,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  PlusCircle,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from './components/ui/avatar.jsx';
import { Badge } from './components/ui/badge.jsx';
import { Button } from './components/ui/button.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card.jsx';
import { Separator } from './components/ui/separator.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table.jsx';
import { cn } from './lib/utils.js';

const navMain = [
  { title: 'Dashboard', icon: LayoutDashboard, active: true },
  { title: 'Lifecycle', icon: List },
  { title: 'Analytics', icon: BarChart3 },
  { title: 'Projects', icon: ClipboardList },
  { title: 'Team', icon: Users },
];

const navDocuments = [
  { title: 'Data Library', icon: Database },
  { title: 'Reports', icon: ClipboardList },
  { title: 'Word Assistant', icon: File },
];

const navSecondary = [
  { title: 'Settings', icon: Settings },
  { title: 'Get Help', icon: HelpCircle },
  { title: 'Search', icon: Search },
];

const metricCards = [
  {
    title: 'Total Revenue',
    value: '$1,250.00',
    delta: '+12.5%',
    direction: 'up',
    summary: 'Trending up this month',
    helper: 'Visitors for the last 6 months',
  },
  {
    title: 'New Customers',
    value: '1,234',
    delta: '-20%',
    direction: 'down',
    summary: 'Down 20% this period',
    helper: 'Acquisition needs attention',
  },
  {
    title: 'Active Accounts',
    value: '45,678',
    delta: '+12.5%',
    direction: 'up',
    summary: 'Strong user retention',
    helper: 'Engagement exceed targets',
  },
  {
    title: 'Growth Rate',
    value: '4.5%',
    delta: '+4.5%',
    direction: 'up',
    summary: 'Steady performance',
    helper: 'Meets growth projections',
  },
];

const outlineRows = [
  {
    id: 1,
    header: 'Cover page',
    type: 'Cover page',
    status: 'In Process',
    target: '18',
    limit: '5',
    reviewer: 'Eddie Lake',
  },
  {
    id: 2,
    header: 'Table of contents',
    type: 'Table of contents',
    status: 'Done',
    target: '29',
    limit: '24',
    reviewer: 'Eddie Lake',
  },
  {
    id: 3,
    header: 'Executive summary',
    type: 'Narrative',
    status: 'Done',
    target: '10',
    limit: '13',
    reviewer: 'Eddie Lake',
  },
  {
    id: 4,
    header: 'Technical approach',
    type: 'Narrative',
    status: 'Done',
    target: '27',
    limit: '23',
    reviewer: 'Jamik Tashpulatov',
  },
  {
    id: 5,
    header: 'Design',
    type: 'Narrative',
    status: 'In Process',
    target: '2',
    limit: '16',
    reviewer: 'Jamik Tashpulatov',
  },
  {
    id: 6,
    header: 'Capabilities',
    type: 'Narrative',
    status: 'In Process',
    target: '20',
    limit: '8',
    reviewer: 'Jamik Tashpulatov',
  },
  {
    id: 7,
    header: 'Integration with existing systems',
    type: 'Narrative',
    status: 'In Process',
    target: '19',
    limit: '21',
    reviewer: 'Jamik Tashpulatov',
  },
  {
    id: 8,
    header: 'Innovation and Advantages',
    type: 'Narrative',
    status: 'Done',
    target: '25',
    limit: '26',
    reviewer: 'Assign reviewer',
  },
];

const viewTabs = [
  { value: 'outline', label: 'Outline' },
  { value: 'past-performance', label: 'Past Performance', badge: 3 },
  { value: 'key-personnel', label: 'Key Personnel', badge: 2 },
  { value: 'focus-documents', label: 'Focus Documents' },
];

const chartSeries = {
  '90d': createSeries(30, '2024-04-01'),
  '30d': createSeries(14, '2024-05-18'),
  '7d': createSeries(7, '2024-06-20'),
};

function createSeries(length, startDate) {
  const start = new Date(startDate);
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = Math.round(
      70 + Math.sin(index / 2.5) * 18 + Math.cos(index / 3.6) * 12 + index * 0.6,
    );
    return { label: date, value };
  });
}

function formatDateLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildChartPath(points) {
  if (points.length === 0) return '';
  const maxValue = Math.max(...points.map((point) => point.value));
  const minValue = Math.min(...points.map((point) => point.value));
  const range = maxValue - minValue || 1;
  const coordinates = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const normalized = (point.value - minValue) / range;
    const y = 100 - normalized * 100;
    return `${x},${y}`;
  });
  return coordinates.join(' ');
}

function StatusBadge({ status }) {
  const isDone = status === 'Done';
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wide',
        isDone ? 'text-emerald-400' : 'text-amber-300',
      )}
    >
      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status}
    </Badge>
  );
}

function MetricCard({ title, value, delta, direction, summary, helper }) {
  const TrendIcon = direction === 'down' ? TrendingDown : TrendingUp;
  const trendColor = direction === 'down' ? 'text-rose-400' : 'text-emerald-400';
  return (
    <Card className="border-border/50 bg-card/70">
      <CardHeader className="relative pb-4">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
        <div className="absolute right-6 top-6">
          <Badge variant="outline" className={cn('gap-1 rounded-lg px-2 py-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {delta}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-1 text-sm">
        <span className="flex items-center gap-2 font-medium">
          {summary}
          <TrendIcon className={cn('h-4 w-4', trendColor)} />
        </span>
        <span className="text-muted-foreground">{helper}</span>
      </CardFooter>
    </Card>
  );
}

function ChartCard({ activeRange, onRangeChange }) {
  const points = chartSeries[activeRange] ?? [];
  const chartPath = useMemo(() => buildChartPath(points), [points]);
  const linePoints = chartPath || '0,100 100,100';
  const polygonPoints = chartPath ? `0,100 ${chartPath} 100,100` : '0,100 100,100';
  const gradientId = `gradient-${activeRange}`;
  const labels = points.length > 0 ? [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]] : [];

  return (
    <Card className="border-border/50 bg-card/70">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Total Visitors</CardTitle>
            <CardDescription className="text-sm">Total for the last 3 months</CardDescription>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 p-1 sm:flex">
            {['90d', '30d', '7d'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onRangeChange(range)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                  activeRange === range ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {range === '90d' && 'Last 3 months'}
                {range === '30d' && 'Last 30 days'}
                {range === '7d' && 'Last 7 days'}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:hidden">
          <select
            value={activeRange}
            onChange={(event) => onRangeChange(event.target.value)}
            className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
          >
            <option value="90d">Last 3 months</option>
            <option value="30d">Last 30 days</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="mt-6">
        <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted/10 p-6">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(148, 163, 184, 0.45)" />
                <stop offset="100%" stopColor="rgba(148, 163, 184, 0.05)" />
              </linearGradient>
            </defs>
            <polygon fill={`url(#${gradientId})`} points={polygonPoints} />
            <polyline
              fill="none"
              stroke="rgba(203, 213, 225, 0.9)"
              strokeWidth="2.2"
              points={linePoints}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.map((item) => (
              <span key={item.label.toISOString()}>{formatDateLabel(item.label)}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutlineTable({ activeView, onViewChange }) {
  return (
    <Card className="border-border/50 bg-card/70">
      <CardHeader className="gap-6 pb-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onViewChange(tab.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                    activeView === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                  {tab.badge ? (
                    <Badge
                      variant="secondary"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 text-[11px]"
                    >
                      {tab.badge}
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-border/60 bg-transparent text-xs uppercase tracking-wide"
              >
                <Columns className="h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-border/60 bg-transparent text-xs uppercase tracking-wide"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <TableRow>
                <TableHead className="w-[32%]">Header</TableHead>
                <TableHead>Section Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outlineRows.map((row) => (
                <TableRow key={row.id} className="border-border/40">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">{row.header}</span>
                      <span className="text-xs text-muted-foreground">ID #{row.id.toString().padStart(3, '0')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg px-2 py-1 text-xs text-muted-foreground">
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">{row.target}</TableCell>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">{row.limit}</TableCell>
                  <TableCell className="text-sm text-foreground">{row.reviewer}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SidebarNavButton({ icon: Icon, label, active }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/15 text-primary shadow-inner shadow-primary/20'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function App() {
  const [activeRange, setActiveRange] = useState('90d');
  const [activeView, setActiveView] = useState('outline');

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border/60 bg-[hsl(226,25%,5%)]/80 px-6 py-6 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          Acme Inc.
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2">
            <Button className="flex-1 gap-2 rounded-xl" size="default">
              <PlusCircle className="h-4 w-4" />
              Quick Create
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl border-border/60 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="sr-only">Inbox</span>
            </Button>
          </div>
          <div className="space-y-1">
            {navMain.map((item) => (
              <SidebarNavButton key={item.title} icon={item.icon} label={item.title} active={item.active} />
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Documents</div>
            <div className="space-y-1">
              {navDocuments.map((item) => (
                <SidebarNavButton key={item.title} icon={item.icon} label={item.title} />
              ))}
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
                More
              </button>
            </div>
          </div>
        </div>
        <div className="mt-auto space-y-4">
          <Separator className="bg-border/60" />
          <div className="space-y-1">
            {navSecondary.map((item) => (
              <SidebarNavButton key={item.title} icon={item.icon} label={item.title} />
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback className="rounded-xl bg-primary/20 text-sm font-semibold text-primary">SC</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
              <div className="font-medium">shadcn</div>
              <div className="text-xs text-muted-foreground">m@example.com</div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card/40 px-6">
          <h1 className="text-lg font-semibold">Documents</h1>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 bg-transparent">
            <Github className="h-4 w-4" />
            GitHub
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>
            <ChartCard activeRange={activeRange} onRangeChange={setActiveRange} />
            <OutlineTable activeView={activeView} onViewChange={setActiveView} />
          </div>
        </main>
      </div>
    </div>
  );
}
