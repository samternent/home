export const fieldMessageSizeValues = ["sm", "md", "lg"] as const;
export const fieldMessageToneValues = ["muted", "critical"] as const;

export type FieldMessageSize = (typeof fieldMessageSizeValues)[number];
export type FieldMessageTone = (typeof fieldMessageToneValues)[number];
