import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { BUTTON_ICON_SIZES, buttonClass, type ButtonStyleProps } from "../Button/Button";

export type ButtonLinkProps = ComponentProps<typeof Link> &
  ButtonStyleProps & {
    icon?: LucideIcon;
  };

/** A link to another page that looks like a Button. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {Icon && <Icon size={BUTTON_ICON_SIZES[size]} aria-hidden />}
      {children}
    </Link>
  );
}
