import { Children } from "react";

export function StatusLayout({ children }) {
  const childElements = Children.toArray(children);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {childElements.map((child, index) => (
        <div key={child.key ?? index} className="flex w-full max-w-xl justify-center">
          {child}
        </div>
      ))}
    </div>
  );
}
