import { defineAsyncComponent, type Component } from "vue";
import type { AppApi } from "@/app/api";
import type { RuntimeAppSurfaceEditorConfig } from "@/runtime/apps/registry";
import type { EntityDetailsPanelConfig } from "@/runtime/entities";

export type RuntimeEntryEditorContext = {
  appApi: AppApi;
  surfaceEditor?: RuntimeAppSurfaceEditorConfig;
};

export type RuntimeEntryEditorDefinition<TRecord> = {
  appId: string;
  entityType: string;
  buildCreatePanelConfig(context: RuntimeEntryEditorContext): EntityDetailsPanelConfig;
  buildEditPanelConfig(
    record: TRecord,
    context: RuntimeEntryEditorContext,
  ): EntityDetailsPanelConfig;
};

export function resolveSurfaceEditorCustomFormComponent(
  editor?: RuntimeAppSurfaceEditorConfig,
): Component | undefined {
  if (editor?.customFormComponent) {
    return editor.customFormComponent;
  }

  if (editor?.customFormComponentLoader) {
    return defineAsyncComponent(editor.customFormComponentLoader);
  }

  return undefined;
}
