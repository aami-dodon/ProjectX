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
  const mergedToastOptions = {
    ...(toastOptions ?? {}),
    classNames: {
      toast: "toaster-toast",
      description: "toaster-description",
      actionButton: "toaster-action",
      cancelButton: "toaster-cancel",
      closeButton: "toaster-close",
      ...(toastOptions?.classNames ?? {}),
    },
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
