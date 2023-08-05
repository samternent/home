import { h } from "vue";

export default function createApp(engine) {
  const { isPaused } = engine;
  return {
    render() {
      return h(
        "div",
        [
          isPaused || h("div", {}, "Paused"),
        ]
      );
    },
  };
}
