export const formFieldSizeValues = ["sm", "md", "lg"] as const;

export type FormFieldSize = (typeof formFieldSizeValues)[number];

export type FormFieldSlotProps = {
  describedBy?: string;
  disabled: boolean;
  id: string;
  invalid: boolean;
  required: boolean;
};
