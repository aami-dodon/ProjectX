import { Children } from "react";

import { ScrollArea } from "@/shared/components/ui/scroll-area";

export function StatusLayout({ children }) {
  const childElements = Children.toArray(children);

  return (
    <ScrollArea
      className="min-h-svh w-full"
      viewportClassName="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {childElements.map((child, index) => (
        <ScrollArea
          key={child.key ?? index}
          className="w-full max-w-xl [&>[data-slot=scroll-area-corner]]:hidden [&>[data-slot=scroll-area-scrollbar]]:hidden"
          viewportClassName="flex w-full justify-center">
          {child}
        </ScrollArea>
      ))}
    </ScrollArea>
  );
}
