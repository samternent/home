import { h, withModifiers } from "vue";

export default function createApp(engine) {
  const { start, stop } = engine;
  return {
    render() {
      return h(
        "div",
        [
          h("button", { onClick: start }, "Start"),
          h("button", { onClick: stop }, "Stop"),
        ]
      );
    },
  };
}
