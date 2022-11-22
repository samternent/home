import { Extension, markInputRule } from "@tiptap/core";

const inputRegex = /:$/;

export const EmojiSearch = Extension.create({
  name: "emojiSearch",

  addInputRules() {
    console.log(this);
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },
});
