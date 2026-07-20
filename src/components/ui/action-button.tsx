"use client";

import React from "react";
import { Pencil, Trash2, type LucideIcon } from "lucide-react";
import {
  ACTION_BUTTON_BASE,
  ACTION_BUTTON_VARIANTS,
  ACTION_BUTTON_SIZES,
} from "@/constants/ui-classes";

const DEFAULT_ICON_FOR_TYPE: Record<string, LucideIcon> = {
  edit: Pencil,
  delete: Trash2,
};

export type ActionButtonType = keyof typeof ACTION_BUTTON_VARIANTS;
export type ActionButtonSize = keyof typeof ACTION_BUTTON_SIZES;

export type ActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children"
> & {
  type?: ActionButtonType;
  size?: ActionButtonSize;
  icon?: LucideIcon;
  hideIcon?: boolean;
  children?: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Native HTML button type attribute (avoids clash with visual `type`). */
  buttonType?: "button" | "submit" | "reset";
  className?: string;
};

/**
 * Unified action button aligned with the WhatsApp button design language.
 * - Compact, slightly squared (rounded-md), clean white surface
 * - Variant-based hover tint (edit = primary hint, delete = red hint)
 * - Same size scale as WhatsAppButton (sm/md) + lg for text-labeled actions
 * - Supports icon-only or icon + label
 *
 * Do NOT restyle WhatsAppButton — this component is the shared standard
 * for Edit / Delete / generic actions everywhere else.
 */
const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    {
      type = "default",
      size = "md",
      icon: IconProp,
      hideIcon = false,
      children,
      className = "",
      title,
      ariaLabel,
      disabled = false,
      onClick,
      buttonType = "button",
      ...rest
    },
    ref,
  ) {
    const variantClass =
      ACTION_BUTTON_VARIANTS[type] ?? ACTION_BUTTON_VARIANTS.default;
    const sizeConfig = ACTION_BUTTON_SIZES[size] ?? ACTION_BUTTON_SIZES.md;

    const ResolvedIcon = hideIcon
      ? null
      : IconProp ?? DEFAULT_ICON_FOR_TYPE[type] ?? null;

    const hasLabel =
      children !== undefined && children !== null && children !== false;
    const isIconOnly = Boolean(ResolvedIcon) && !hasLabel;
    const shapeClass = isIconOnly ? sizeConfig.iconOnly : sizeConfig.box;

    const resolvedAriaLabel =
      ariaLabel ?? (isIconOnly ? title : undefined);

    return (
      <button
        ref={ref}
        type={buttonType}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={resolvedAriaLabel}
        className={`${ACTION_BUTTON_BASE} ${variantClass} ${shapeClass} ${className}`}
        {...rest}
      >
        {ResolvedIcon ? (
          <ResolvedIcon
            className={sizeConfig.icon}
            strokeWidth={1.75}
            aria-hidden
          />
        ) : null}
        {hasLabel ? (
          <span className="whitespace-nowrap">{children}</span>
        ) : null}
      </button>
    );
  },
);

export default ActionButton;

/**
 * Convenience wrappers so feature code reads declaratively.
 * They just pre-set `type` — all other props pass through.
 */
export const EditButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ActionButtonProps, "type">
>(function EditButton(props, ref) {
  return <ActionButton ref={ref} type="edit" {...props} />;
});

export const DeleteButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ActionButtonProps, "type">
>(function DeleteButton(props, ref) {
  return <ActionButton ref={ref} type="delete" {...props} />;
});
