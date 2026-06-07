import type { CardPadding, CardVariant } from "../../primitives/Card/Card.types";

export type KeyValueListValue = boolean | number | string | null | undefined;

export type KeyValueListItem = {
  dataTest?: string;
  id?: string;
  label: string;
  value: KeyValueListValue;
};

export type KeyValueListProps = {
  items: KeyValueListItem[];
  padding?: CardPadding;
  variant?: CardVariant;
};
