import { computed } from "vue";
import { appConfig } from "@/app/config/app.config";
import { useIdentitySession } from "./useIdentitySession";

export function useIdentityExport() {
  const { identity } = useIdentitySession();

  const exportedPayload = computed(() => {
    if (!identity.value) return "";

    return JSON.stringify(
      {
        id: identity.value.id,
        fingerprint: identity.value.fingerprint,
        serializedIdentity: identity.value.serializedIdentity,
      },
      null,
      2,
    );
  });

  const downloadExport = () => {
    if (!exportedPayload.value || typeof document === "undefined") return;

    const filename = `${appConfig.appId}-identity-export.json`;
    const blob = new Blob([exportedPayload.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return {
    exportedPayload,
    downloadExport,
  };
}
