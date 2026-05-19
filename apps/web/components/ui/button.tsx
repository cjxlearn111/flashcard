import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
        secondary:
          "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50",
        ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
