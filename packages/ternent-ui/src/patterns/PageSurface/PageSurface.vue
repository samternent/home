<template>
  <div class="ui-page-surface">
    <div class="ui-page-surface__mesh" aria-hidden="true"></div>
    <div class="ui-page-surface__glow ui-page-surface__glow--primary" aria-hidden="true"></div>
    <div class="ui-page-surface__glow ui-page-surface__glow--accent" aria-hidden="true"></div>
    <div class="ui-page-surface__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-page-surface {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top center, color-mix(in srgb, var(--ui-primary-muted) 70%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--ui-tonal-tertiary) 72%, transparent), transparent 34%),
    var(--ui-bg);
  color: var(--ui-fg);
  isolation: isolate;
}

.ui-page-surface__content {
  position: relative;
  z-index: 1;
}

.ui-page-surface__mesh,
.ui-page-surface__glow {
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.ui-page-surface__mesh {
  opacity: 0.3;
  background-image:
    linear-gradient(color-mix(in srgb, var(--ui-border) 72%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ui-border) 72%, transparent) 1px, transparent 1px);
  background-size: 2rem 2rem;
  mask-image: radial-gradient(circle at center, black, transparent 72%);
}

.ui-page-surface__glow {
  filter: blur(64px);
  opacity: 0.5;
}

.ui-page-surface__glow--primary {
  top: 12%;
  left: 58%;
  width: 22rem;
  height: 22rem;
  background: color-mix(in srgb, var(--ui-primary) 22%, transparent);
}

.ui-page-surface__glow--accent {
  top: 48%;
  left: 8%;
  width: 18rem;
  height: 18rem;
  background: color-mix(in srgb, var(--ui-info) 16%, transparent);
}
</style>
