import { useMemo, useState } from "react";
import {
  IconColorSwatch,
  IconComponents,
  IconLayoutBoardSplit,
  IconLetterSpacing,
  IconPalette,
  IconPencil,
  IconTypography,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Toggle } from "@/shared/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { TextEditor } from "@/shared/components/text-editor";

const baseColorTokens = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "border",
  "input",
  "ring",
];

const semanticColorTokens = [
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
];

const extendedColorTokens = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

const buttonVariants = [
  { variant: "default", label: "Default" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "ghost", label: "Ghost" },
  { variant: "link", label: "Link" },
  { variant: "destructive", label: "Destructive" },
];

const buttonSizes = [
  { size: "sm", label: "Small" },
  { size: "default", label: "Default" },
  { size: "lg", label: "Large" },
];

const iconButtonSizes = [
  { size: "icon-sm", label: "Icon SM" },
  { size: "icon", label: "Icon" },
  { size: "icon-lg", label: "Icon LG" },
];

const badgeVariants = [
  { variant: "default", label: "Default" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "destructive", label: "Destructive" },
];

const typographyScale = [
  {
    id: "display",
    title: "Display",
    description: "High-impact hero treatments and KPI callouts.",
    items: [
      {
        id: "display-2xl",
        name: "Display 2XL",
        usage: "Primary hero headings and executive summaries.",
        sample: "AI Governance Overview",
        tokens: {
          font: "--font-sans",
          size: "--text-6xl",
          lineHeight: "--text-6xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-tight",
        },
      },
      {
        id: "display-xl",
        name: "Display XL",
        usage: "Spotlight modules and dashboard hero copy.",
        sample: "Risk posture trending positive",
        tokens: {
          font: "--font-sans",
          size: "--text-5xl",
          lineHeight: "--text-5xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-tight",
        },
      },
      {
        id: "display-lg",
        name: "Display LG",
        usage: "Section intros, summary cards, and marketing banners.",
        sample: "Enterprise controls coverage",
        tokens: {
          font: "--font-sans",
          size: "--text-4xl",
          lineHeight: "--text-4xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-tight",
        },
      },
    ],
  },
  {
    id: "headlines",
    title: "Headlines",
    description: "Core page headings and major section titles.",
    items: [
      {
        id: "headline-xl",
        name: "Headline XL",
        usage: "Top-level page headings inside feature layouts.",
        sample: "Control evidence summary",
        tokens: {
          font: "--font-sans",
          size: "--text-3xl",
          lineHeight: "--text-3xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-tight",
        },
      },
      {
        id: "headline-lg",
        name: "Headline LG",
        usage: "Card headers and major subsection titles.",
        sample: "Assessment readiness checklist",
        tokens: {
          font: "--font-sans",
          size: "--text-2xl",
          lineHeight: "--text-2xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-tight",
        },
      },
      {
        id: "headline-md",
        name: "Headline MD",
        usage: "Widget headings and data table intros.",
        sample: "Workflow automation queue",
        tokens: {
          font: "--font-sans",
          size: "--text-xl",
          lineHeight: "--text-xl--line-height",
          weight: "--font-weight-semibold",
          tracking: "--tracking-normal",
        },
      },
    ],
  },
  {
    id: "body",
    title: "Body Copy",
    description: "Paragraphs, summaries, and supporting narratives.",
    items: [
      {
        id: "body-lg",
        name: "Body LG",
        usage: "Descriptive paragraphs and multi-sentence summaries.",
        sample:
          "Use this size for page descriptions and onboarding copy across compliance workflows.",
        tokens: {
          font: "--font-sans",
          size: "--text-lg",
          leading: "--leading-relaxed",
          weight: "--font-weight-normal",
          tracking: "--tracking-normal",
        },
      },
      {
        id: "body-base",
        name: "Body Base",
        usage: "Default form copy, data explanations, and modal text.",
        sample:
          "This base size handles most body text, checklists, and inline explanations in the app.",
        tokens: {
          font: "--font-sans",
          size: "--text-base",
          leading: "--leading-relaxed",
          weight: "--font-weight-normal",
          tracking: "--tracking-normal",
        },
      },
      {
        id: "body-sm",
        name: "Body SM",
        usage: "Helper text and secondary descriptions.",
        sample:
          "Compact helper text for field descriptions, table subtitles, and metadata blurbs.",
        tokens: {
          font: "--font-sans",
          size: "--text-sm",
          leading: "--leading-snug",
          weight: "--font-weight-normal",
          tracking: "--tracking-normal",
        },
      },
    ],
  },
  {
    id: "supporting",
    title: "Supporting Text",
    description: "Labels, captions, and monospace treatments.",
    items: [
      {
        id: "supporting-label",
        name: "Label",
        usage: "Overlines, filter labels, and data viz annotations.",
        sample: "STATUS UPDATE",
        tokens: {
          font: "--font-sans",
          size: "--text-xs",
          leading: "--leading-tight",
          weight: "--font-weight-medium",
          tracking: "--tracking-widest",
          transform: "uppercase",
        },
      },
      {
        id: "supporting-caption",
        name: "Caption",
        usage: "Caption copy and muted metadata.",
        sample: "Additional context for data tables or component footers.",
        tokens: {
          font: "--font-sans",
          size: "--text-xs",
          leading: "--leading-snug",
          weight: "--font-weight-normal",
          tracking: "--tracking-normal",
        },
      },
      {
        id: "supporting-mono",
        name: "Numeric / Mono",
        usage: "Identifiers, code snippets, and tightly aligned numerics.",
        sample: "0x3A CONTROL-42",
        tokens: {
          font: "--font-mono",
          size: "--text-sm",
          leading: "--leading-tight",
          weight: "--font-weight-medium",
          tracking: "--tracking-normal",
        },
      },
    ],
  },
];

const typographyMeta = [
  {
    id: "font-sans",
    title: "Sans stack",
    description: "Primary UI font stack applied globally via var(--font-sans).",
    sample: "Aa Governance",
    tokens: ["--font-sans"],
    sampleTokens: {
      font: "--font-sans",
      size: "--text-lg",
      leading: "--leading-tight",
      weight: "--font-weight-semibold",
    },
  },
  {
    id: "font-mono",
    title: "Mono stack",
    description: "Used for IDs, data, and inline code moments.",
    sample: "0x41 2025",
    tokens: ["--font-mono"],
    sampleTokens: {
      font: "--font-mono",
      size: "--text-base",
      leading: "--leading-normal",
      weight: "--font-weight-medium",
    },
  },
  {
    id: "tracking",
    title: "Letter spacing",
    description: "Apply tracking tokens to balance dense dashboards with readable labels.",
    sample: "TRACKING TOKENS",
    tokens: ["--tracking-tight", "--tracking-normal", "--tracking-wide", "--tracking-wider", "--tracking-widest"],
    sampleTokens: {
      font: "--font-sans",
      size: "--text-xs",
      leading: "--leading-tight",
      weight: "--font-weight-semibold",
      tracking: "--tracking-widest",
      transform: "uppercase",
    },
  },
  {
    id: "line-height",
    title: "Line heights",
    description: "Shared rhythm tokens for paragraphs and helper copy.",
    sample: "Line height cadence keeps paragraphs comfortable for longer AI governance explanations.",
    tokens: ["--leading-tight", "--leading-snug", "--leading-normal", "--leading-relaxed"],
    sampleTokens: {
      font: "--font-sans",
      size: "--text-sm",
      leading: "--leading-normal",
      weight: "--font-weight-normal",
    },
  },
];

const tokenPropertyLabels = {
  font: "font-family",
  size: "font-size",
  lineHeight: "line-height",
  leading: "line-height",
  weight: "font-weight",
  tracking: "letter-spacing",
};

function createTypographyStyle(tokens = {}) {
  const style = {};

  if (tokens.font) {
    style.fontFamily = `var(${tokens.font})`;
  }
  if (tokens.size) {
    style.fontSize = `var(${tokens.size})`;
  }
  if (tokens.leading) {
    style.lineHeight = `var(${tokens.leading})`;
  } else if (tokens.lineHeight) {
    style.lineHeight = `var(${tokens.lineHeight})`;
  }
  if (tokens.weight) {
    style.fontWeight = `var(${tokens.weight})`;
  }
  if (tokens.tracking) {
    style.letterSpacing = `var(${tokens.tracking})`;
  }
  if (tokens.transform) {
    style.textTransform = tokens.transform;
  }

  return style;
}

function Section({ icon: Icon, title, description, children, id }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-full border bg-muted/60 text-muted-foreground">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <Card className="border-border/70">
        <CardContent className="flex flex-col gap-6 pt-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function ColorGrid({ tokens }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tokens.map((token) => (
        <div key={token} className="flex items-center gap-4 rounded-lg border bg-muted/40 p-4">
          <span
            className="size-14 shrink-0 rounded-md border"
            style={{ backgroundColor: `var(--${token})` }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">--{token}</span>
            <span className="text-xs text-muted-foreground">{`var(--${token})`}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographySamples() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          {typographyScale.map((group) => (
            <div key={group.id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid gap-3">
                {group.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.usage}</span>
                    </div>
                    <div className="text-balance text-foreground" style={createTypographyStyle(item.tokens)}>
                      {item.sample}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      {Object.entries(item.tokens)
                        .filter(([, token]) => typeof token === "string" && token.startsWith("--"))
                        .map(([key, token]) => (
                          <code key={`${item.id}-${key}`} className="rounded border bg-muted/30 px-2 py-1 font-mono">
                            {`${tokenPropertyLabels[key]}: var(${token})`}
                          </code>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">index.css typography tokens</h4>
            <p className="text-xs text-muted-foreground">
              Base styles expose Tailwind's CSS custom properties so type scales stay consistent across features.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {typographyMeta.map((meta) => (
              <div key={meta.id} className="flex flex-col gap-2 rounded-md border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta.title}
                  </span>
                  <span className="rounded bg-muted/40 px-2 py-1 text-xs font-medium text-foreground" style={createTypographyStyle(meta.sampleTokens)}>
                    {meta.sample}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {meta.tokens.map((token) => (
                    <code key={token} className="rounded border bg-muted/30 px-2 py-1 font-mono">
                      {`var(${token})`}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ButtonShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {buttonVariants.map(({ variant, label }) => (
          <div key={variant} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{label}</span>
              <Badge variant="outline" className="text-xs">variant="{variant}"</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {buttonSizes.map(({ size }) => (
                <Button key={size} variant={variant} size={size}>
                  {size === "default" ? "Button" : `${label} ${size}`}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {iconButtonSizes.map(({ size }) => (
                <Button key={size} variant={variant} size={size}>
                  <IconLayoutBoardSplit className="size-4" />
                  <span className="sr-only">Icon button</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex flex-wrap gap-3">
        {badgeVariants.map(({ variant, label }) => (
          <Badge key={variant} variant={variant}>
            {label} badge
          </Badge>
        ))}
      </div>
    </div>
  );
}

function FormShowcase() {
  const [newsletter, setNewsletter] = useState(true);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Form Controls</CardTitle>
          <CardDescription>Inputs, selects, and helper copy in the shared UI system.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field className="flex flex-col gap-2">
            <FieldLabel>Email address</FieldLabel>
            <FieldDescription>We will send project notifications to this inbox.</FieldDescription>
            <FieldContent>
              <Input type="email" placeholder="you@example.com" className="w-full" />
            </FieldContent>
          </Field>
          <Field className="flex flex-col gap-2">
            <FieldLabel>Workspace role</FieldLabel>
            <FieldContent>
              <Select defaultValue="admin">
                <SelectTrigger className="w-full" size="default">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>Each role has a different permission set.</FieldDescription>
          </Field>
          <Label className="flex items-center gap-3 text-sm font-medium">
            <Checkbox
              checked={newsletter}
              onCheckedChange={(value) => setNewsletter(Boolean(value))}
            />
            Subscribe to compliance updates
          </Label>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </CardFooter>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Skeletons & states</CardTitle>
          <CardDescription>Use skeletons for loading placeholders and disabled controls for pending flows.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Skeleton preview</span>
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="disabled-input">Disabled input</Label>
            <Input id="disabled-input" placeholder="Disabled" disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tabs</Label>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4 text-sm text-muted-foreground">
                Overview tab content goes here.
              </TabsContent>
              <TabsContent value="activity" className="mt-4 text-sm text-muted-foreground">
                Activity tab content goes here.
              </TabsContent>
              <TabsContent value="billing" className="mt-4 text-sm text-muted-foreground">
                Billing tab content goes here.
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RichTextShowcase() {
  const [content, setContent] = useState(
    "<p><strong>Draft remediation notes</strong> with inline highlights, evidence links, and alignment controls.</p><p>Use the toolbar to demonstrate headings, lists, and formatting tokens.</p>"
  );

  const wordCount = useMemo(() => {
    const plainText = content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!plainText) {
      return 0;
    }

    return plainText.split(" ").length;
  }, [content]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Text editor</CardTitle>
          <CardDescription>Shared rich text editor built on TipTap with shadcn styling.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TextEditor
            value={content}
            onChange={setContent}
            placeholder="Draft remediation guidance..."
            editorClassName="min-h-[16rem]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Includes headings, highlights, alignment, and link management controls.</span>
            <span className="font-medium text-foreground">Word count: {wordCount}</span>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>The formatted output mirrors how rich text renders in product surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Serialized HTML</span>
            <pre className="max-h-48 overflow-auto rounded-md border bg-muted/10 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{content}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InteractiveShowcase() {
  const [toggleOn, setToggleOn] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("quarterly");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Toggle systems</CardTitle>
          <CardDescription>Toggle buttons and toggle groups share styling tokens.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Toggle pressed={toggleOn} onPressedChange={setToggleOn}>
              Default
            </Toggle>
            <Toggle variant="outline">Outline</Toggle>
            <Toggle size="sm">Small</Toggle>
            <Toggle size="lg">Large</Toggle>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Toggle Group</span>
            <ToggleGroup type="multiple" defaultValue={["daily"]} variant="outline" size="default">
              <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
              <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Menus & overlays</CardTitle>
          <CardDescription>Dropdown menus, tooltips, and sheets reuse the shared primitives.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DropdownMenu onValueChange={setDropdownValue}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-fit">
                Billing cadence
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Cadence</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={dropdownValue} onValueChange={setDropdownValue}>
                <DropdownMenuRadioItem value="monthly">Monthly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="quarterly">Quarterly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="annually">Annually</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Manage subscription</DropdownMenuItem>
                <DropdownMenuCheckboxItem checked>Include invoices</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <IconPalette className="size-4" />
                  <span className="sr-only">Palette info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-sm">Theme aware component tokens.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Review update</SheetTitle>
                <SheetDescription>Sheets slide from the edge and respect the theme tokens.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3 text-sm">
                <p>
                  Use sheets for secondary flows, contextual onboarding, or details that should not leave the current screen.
                </p>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Close sheet
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Mobile Navigation</DrawerTitle>
                <DrawerDescription>Drawer surfaces adapt to viewport constraints while using shared spacing tokens.</DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-3 px-4 text-sm">
                <p>Use drawers for compact flows such as approvals, filters, or acknowledgements.</p>
                <ToggleGroup type="single" defaultValue="approve" className="w-full" variant="outline" size="default">
                  <ToggleGroupItem value="approve" className="flex-1">
                    Approve
                  </ToggleGroupItem>
                  <ToggleGroupItem value="reject" className="flex-1">
                    Reject
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <DrawerFooter>
                <Button onClick={() => setDrawerOpen(false)}>Confirm</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentShowcase() {
  const tableData = useMemo(
    () => [
      { name: "Security Review", owner: "Avery Smith", status: "In progress" },
      { name: "Vendor Risk", owner: "Jordan Lee", status: "Blocked" },
      { name: "Policy Update", owner: "Taylor Chen", status: "Completed" },
    ],
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Cards & layout</CardTitle>
          <CardDescription>Cards compose headers, content, and footers to deliver consistent modules.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Compliance summary</CardTitle>
              <CardDescription>Reusable within dashboards and detail pages.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Frameworks</span>
                <span className="text-lg font-semibold">7</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Tasks open</span>
                <span className="text-lg font-semibold">24</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Latest audit</span>
                <span>2024-04-16</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Owner</span>
                <span>Avery Smith</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button size="sm" variant="outline">
                View report
              </Button>
            </CardFooter>
          </Card>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src="https://i.pravatar.cc/100?img=12" alt="Profile" />
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Avatar</span>
              <span className="text-xs text-muted-foreground">For team presence and assignments.</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Tables & navigation</CardTitle>
          <CardDescription>Tables, breadcrumbs, and separators align with spacing and typography tokens.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Frameworks</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>ISO 27001</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.name} data-state={row.status === "Blocked" ? "selected" : undefined}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.owner}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Completed" ? "secondary" : row.status === "Blocked" ? "destructive" : "outline"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Active compliance programs with their current owners.</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">Design System</h1>
              <p className="text-sm text-muted-foreground">
                Central reference for typography, colors, and reusable interface components powering the client.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              Updated {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            This page mirrors the single page layout used by system health and surfaces every shared component with example
            variants.
          </p>
        </div>

        <Section
          id="css-tokens"
          icon={IconColorSwatch}
          title="CSS Tokens"
          description="Global CSS custom properties configured in index.css."
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Base surfaces</h3>
              <ColorGrid tokens={baseColorTokens} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Semantic tokens</h3>
              <ColorGrid tokens={semanticColorTokens} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Extended palette</h3>
              <ColorGrid tokens={extendedColorTokens} />
            </div>
          </div>
        </Section>

        <Section
          id="typography"
          icon={IconTypography}
          title="Typography"
          description="Heading hierarchy, body copy, and supporting text scales."
        >
          <TypographySamples />
        </Section>

        <Section
          id="buttons"
          icon={IconComponents}
          title="Buttons & Badges"
          description="Interactive button variants, sizes, and supporting badges."
        >
          <ButtonShowcase />
        </Section>

        <Section
          id="forms"
          icon={IconLetterSpacing}
          title="Form Controls"
          description="Shared form primitives for inputs, selects, checkboxes, skeletons, and tabs."
        >
          <FormShowcase />
        </Section>

        <Section
          id="text-editor"
          icon={IconPencil}
          title="Rich Text Editor"
          description="TipTap-powered editor with toolbar controls and live preview."
        >
          <RichTextShowcase />
        </Section>

        <Section
          id="interactions"
          icon={IconPalette}
          title="Interactive Elements"
          description="Toggle family, dropdown menus, tooltips, and sheets."
        >
          <InteractiveShowcase />
        </Section>

        <Section
          id="content"
          icon={IconLayoutBoardSplit}
          title="Content Patterns"
          description="Cards, avatars, breadcrumbs, and tables composed with shared tokens."
        >
          <ContentShowcase />
        </Section>
      </div>
    </div>
  );
}

export default DesignSystemPage;
