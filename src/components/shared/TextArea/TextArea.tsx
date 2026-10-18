"use client";

import { useImperativeHandle, useRef, type Ref, type TextareaHTMLAttributes } from "react";
import { useAutoResize } from "@/hooks/useAutoResize";
import { cn } from "@/utils/cn";
import { fieldClass } from "@/styles/fieldStyles";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
  invalid?: boolean;
  /** Grow and shrink to fit the content instead of using a fixed number of rows. */
  autoResize?: boolean;
};

export function TextArea({
  ref,
  invalid = false,
  autoResize = false,
  className,
  rows,
  ...props
}: TextAreaProps) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current!);
  useAutoResize(innerRef, String(props.value ?? ""), autoResize);

  return (
    <textarea
      ref={innerRef}
      rows={autoResize ? 1 : rows}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldClass(invalid),
        "resize-none rounded-lg p-3",
        autoResize && "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
