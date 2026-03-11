import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border border-border bg-white px-3 text-sm shadow-sm outline-none ring-accent/30 transition focus:ring-2",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

