/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "@/modules/ledger";
declare module "@/modules/identity";
declare module "@/modules/encryption";
declare module "@/modules/appShell";
