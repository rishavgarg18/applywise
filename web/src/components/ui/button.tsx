import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-accent text-white hover:bg-accent-hover shadow-sm",
      secondary:
        "bg-surface2 text-foreground border border-border hover:bg-border/40",
      ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface2",
      danger: "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20",
      outline:
        "border border-border bg-transparent text-foreground hover:bg-surface2",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-md",
      md: "px-4 py-2 text-sm rounded-md",
      lg: "px-6 py-2.5 text-base rounded-md",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
