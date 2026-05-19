import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-semibold text-slate-900 leading-none",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";

export { Label };
