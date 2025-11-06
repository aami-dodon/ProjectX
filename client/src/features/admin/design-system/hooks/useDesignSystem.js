import { useMemo } from "react";

const BASE_COLOR_TOKENS = [
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

const SEMANTIC_COLOR_TOKENS = [
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

const EXTENDED_COLOR_TOKENS = [
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

const BUTTON_VARIANTS = [
  { variant: "default", label: "Default" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "ghost", label: "Ghost" },
  { variant: "link", label: "Link" },
  { variant: "destructive", label: "Destructive" },
];

const BUTTON_SIZES = [
  { size: "sm", label: "Small" },
  { size: "default", label: "Default" },
  { size: "lg", label: "Large" },
];

const ICON_BUTTON_SIZES = [
  { size: "icon-sm", label: "Icon SM" },
  { size: "icon", label: "Icon" },
  { size: "icon-lg", label: "Icon LG" },
];

const BADGE_VARIANTS = [
  { variant: "default", label: "Default" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "destructive", label: "Destructive" },
];

const TYPOGRAPHY_SCALE = [
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

const TYPOGRAPHY_META = [
  {
    id: "fonts",
    title: "Font families",
    description: "Sans and mono tokens defined globally.",
    sample: "Inter & JetBrains Mono",
    tokens: ["--font-sans", "--font-mono"],
    sampleTokens: {
      font: "--font-sans",
      size: "--text-sm",
      leading: "--leading-relaxed",
      weight: "--font-weight-medium",
    },
  },
  {
    id: "letter-spacing",
    title: "Letter spacing",
    description: "Shared tokens for headings, body, and supporting copy.",
    sample: "Letter spacing tokens",
    tokens: ["--tracking-tight", "--tracking-wide", "--tracking-widest"],
    sampleTokens: {
      font: "--font-sans",
      size: "--text-xs",
      leading: "--leading-snug",
      weight: "--font-weight-medium",
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

const TOKEN_PROPERTY_LABELS = {
  font: "font-family",
  size: "font-size",
  lineHeight: "line-height",
  leading: "line-height",
  weight: "font-weight",
  tracking: "letter-spacing",
};

const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

export function useDesignSystem() {
  return useMemo(
    () => ({
      colorTokens: {
        base: [...BASE_COLOR_TOKENS],
        semantic: [...SEMANTIC_COLOR_TOKENS],
        extended: [...EXTENDED_COLOR_TOKENS],
      },
      buttonVariants: clone(BUTTON_VARIANTS),
      buttonSizes: clone(BUTTON_SIZES),
      iconButtonSizes: clone(ICON_BUTTON_SIZES),
      badgeVariants: clone(BADGE_VARIANTS),
      typographyScale: clone(TYPOGRAPHY_SCALE),
      typographyMeta: clone(TYPOGRAPHY_META),
      tokenPropertyLabels: { ...TOKEN_PROPERTY_LABELS },
    }),
    []
  );
}
