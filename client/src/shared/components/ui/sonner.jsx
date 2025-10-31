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
  toastOptions,
  ...props
}) => {
  const { theme = "system" } = useTheme()
  const baseClassNames = {
    toast: "toaster-toast",
    description: "toaster-description",
    actionButton: "toaster-action",
    cancelButton: "toaster-cancel",
    success: "toaster-success",
    info: "toaster-info",
    warning: "toaster-warning",
    error: "toaster-error",
  }

  const userClassNames = toastOptions?.classNames ?? {}
  const mergedClassNames = {
    ...userClassNames,
    ...Object.entries(baseClassNames).reduce((acc, [key, value]) => {
      const userValue = userClassNames[key]
      acc[key] = userValue ? `${value} ${userValue}` : value
      return acc
    }, {}),
  }

  const mergedToastOptions = {
    ...(toastOptions ?? {}),
    classNames: mergedClassNames,
    style: {
      background: "var(--toast-bg)",
      color: "var(--toast-fg)",
      borderColor: "var(--toast-border)",
      ...(toastOptions?.style ?? {}),
    },
    closeButton: false,
  }

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
      toastOptions={mergedToastOptions}
      {...props} />
  );
}

export { Toaster }
