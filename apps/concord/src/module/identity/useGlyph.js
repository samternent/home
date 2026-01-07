import { ref, computed } from "vue";

export default function useGlyph(identity) {
  const sequence = ref(null);
  const colors = ref(null);
  const curve = ref(null);
  const isReady = computed(() => sequence.value && colors.value && curve.value);

  async function generateGlyph() {
    if (!identity) return;
    try {
      const points = await crypto.subtle.digest(
        "sha-256",
        new TextEncoder().encode(identity)
      );
      // tale the frst 24 bytes and chunk them into color arrays
      const pointClone = [...Array.from(new Uint8Array(points))];
      const colorsRaw = pointClone.slice(0, 24);
      curve.value = pointClone.slice(24, 32);

      // hash the next 40 bytes to get the 64 grid sequence
      const hash = await crypto.subtle.digest(
        "sha-512",
        new Uint8Array(colorsRaw).buffer
      );
      sequence.value = Array.from(new Uint8Array(hash));

      const maxLen = colorsRaw.length / 3;
      colors.value = [];
      while (colors.value.length < maxLen) {
        colors.value.push(colorsRaw.splice(0, 3));
      }

      for (let i = 0; i < 8; i++) {
        colors.value[i];
      }
    } catch (err) {
      console.log(err);
    }
  }

  generateGlyph();

  return {
    sequence,
    colors,
    curve,
    isReady,
  };
}
