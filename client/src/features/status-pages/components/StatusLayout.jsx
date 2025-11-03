import { Children } from "react";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export function StatusLayout({ children }) {
  const childElements = Children.toArray(children);

  return (
    <ScrollArea className="min-h-svh w-full">
      <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
        {childElements.map((child, index) => (
          <div
            key={child.key ?? index}
            className="w-full max-w-xl flex justify-center">
            {child}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
