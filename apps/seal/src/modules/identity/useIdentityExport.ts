import { computed } from "vue";
import { serializeIdentity } from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";
import { useIdentitySession } from "./useIdentitySession";

export function useIdentityExport() {
  const { identity } = useIdentitySession();

  const exportedPayload = computed(() => {
    if (!identity.value) return "";
    return serializeIdentity(identity.value);
  });

  const downloadExport = () => {
    if (!exportedPayload.value || typeof document === "undefined") return;

    const filename = `${appConfig.appId}-identity-export.json`;
    const blob = new Blob([exportedPayload.value], {
      type: "application/json",
    });
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
