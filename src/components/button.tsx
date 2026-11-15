import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "destructive" | "destructiveText";
type Size = "default" | "small";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm",
  secondary: "bg-muted text-foreground",
  destructive: "bg-destructive/10 text-destructive",
  // Only red text, no fill: a dangerous action that shouldn't catch the eye.
  destructiveText: "text-destructive",
};

const SIZE_CLASSES: Record<Size, string> = {
  default: "h-12 rounded-xl px-5 text-base",
  small: "h-9 rounded-lg px-3 text-sm",
};

function buttonClasses(variant: Variant, size: Size, className = "") {
  return `inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-opacity active:opacity-70 disabled:opacity-50 [&_svg]:size-[18px] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

// A link that looks like a button: for buttons that open another screen.
export function ButtonLink({
  variant = "primary",
  size = "default",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props} />
  );
}
