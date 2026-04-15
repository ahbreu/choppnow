import { CatalogRuntimeData, CatalogSyncStatus, VISIBLE_BACKEND_SYNC_ERROR_CODES } from "./repository";

export type CatalogStatusTone = "normal" | "warning" | "error";

export function getCatalogRuntimeSourceLabel(source: CatalogRuntimeData["source"] | null) {
  if (source === "api") return "API";
  if (source === "cache") return "Cache";
  if (source === "seed") return "Base";
  return "N/D";
}

function formatSyncMoment(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCatalogSyncSummary(
  status: CatalogSyncStatus | null,
  mode: "compact" | "detailed"
): { text: string; tone: CatalogStatusTone } {
  if (!status) {
    return {
      text: mode === "compact" ? "Sync sem leitura" : "Sincronizacao local ainda sem leitura.",
      tone: "warning",
    };
  }

  if (status.lastErrorCode) {
    const backendCodeMatch = status.lastError?.match(/^\[([A-Z0-9_]+)\]/);
    const backendCode = backendCodeMatch?.[1] ?? null;
    const exposedBackendCodes = new Set<string>(VISIBLE_BACKEND_SYNC_ERROR_CODES);
    const backendCodeSuffix =
      backendCode && exposedBackendCodes.has(backendCode) ? ` (${backendCode})` : "";
    if (status.lastErrorCode === "network_error") {
      return {
        text:
          mode === "compact"
            ? `Conexao oscilando. Fila ${status.pendingCount}`
            : `Fila pendente: ${status.pendingCount}. Conexao indisponivel para sincronizar agora.`,
        tone: "error",
      };
    }
    if (status.lastErrorCode === "backend_rejected") {
      return {
        text:
          mode === "compact"
            ? `Backend rejeitou. Fila ${status.pendingCount}`
            : `Fila pendente: ${status.pendingCount}. Backend rejeitou a atualizacao de estoque${backendCodeSuffix}.`,
        tone: "error",
      };
    }

    const formattedAttempt = formatSyncMoment(status.lastAttemptAt);
    const suffix = formattedAttempt ? ` (tentativa ${formattedAttempt})` : "";
    return {
      text:
        mode === "compact"
          ? `Sync com alerta. Fila ${status.pendingCount}`
          : `Fila pendente: ${status.pendingCount}. Sync com alerta${suffix}.`,
      tone: "error",
    };
  }

  if (status.pendingCount === 0) {
    return {
      text: mode === "compact" ? "Sync em dia" : "Fila pendente: 0. Sync em dia.",
      tone: "normal",
    };
  }

  if (mode === "compact") {
    return {
      text: `Sync pendente ${status.pendingCount}`,
      tone: "warning",
    };
  }

  const formattedSuccess = formatSyncMoment(status.lastSuccessAt);
  if (formattedSuccess) {
    return {
      text: `Fila pendente: ${status.pendingCount}. Ultima sincronizacao em ${formattedSuccess}.`,
      tone: "warning",
    };
  }

  return {
    text: `Fila pendente: ${status.pendingCount}. Aguardando primeira sincronizacao.`,
    tone: "warning",
  };
}
