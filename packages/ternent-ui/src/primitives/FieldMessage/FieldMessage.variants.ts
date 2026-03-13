import type { FieldMessageSize, FieldMessageTone } from "./FieldMessage.types";

export const fieldMessageBaseClass = "text-[var(--ui-fg-muted)]";

export const fieldMessageSizeClasses: Record<FieldMessageSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const fieldMessageToneClasses: Record<FieldMessageTone, string> = {
  muted: "text-[var(--ui-fg-muted)]",
  critical: "text-[var(--ui-critical)]",
};
