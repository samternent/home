import type { PropType } from "vue";
import type { AccordionValue } from "./Accordion.types";

export const accordionProps = {
  multiple: {
    type: Boolean,
    default: false,
  },
  collapsible: {
    type: Boolean,
    default: true,
  },
  lazyMount: {
    type: Boolean,
    default: true,
  },
  value: {
    type: [String, Array] as PropType<AccordionValue>,
    default: undefined,
  },
};
