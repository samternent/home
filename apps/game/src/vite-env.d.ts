/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "concords-game-kit";
declare module "@/module/background";
declare module "@/module/character";
// declare module "@/modules/identity";
// declare module "@/modules/encryption";
// declare module "@/modules/appShell";
