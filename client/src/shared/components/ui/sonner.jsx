import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "color-mix(in oklch, var(--success) 18%, var(--background) 82%)",
          "--success-border": "color-mix(in oklch, var(--success) 36%, var(--border) 64%)",
          "--success-text": "var(--success)",
          "--info-bg": "color-mix(in oklch, var(--info) 18%, var(--background) 82%)",
          "--info-border": "color-mix(in oklch, var(--info) 36%, var(--border) 64%)",
          "--info-text": "var(--info)",
          "--warning-bg": "color-mix(in oklch, var(--warning) 18%, var(--background) 82%)",
          "--warning-border": "color-mix(in oklch, var(--warning) 36%, var(--border) 64%)",
          "--warning-text": "var(--warning-foreground)",
          "--error-bg": "color-mix(in oklch, var(--danger) 18%, var(--background) 82%)",
          "--error-border": "color-mix(in oklch, var(--danger) 36%, var(--border) 64%)",
          "--error-text": "var(--danger)"
        }
      }
      {...props} />
  );
}

export { Toaster }
