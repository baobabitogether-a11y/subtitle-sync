import {
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
} from "@/utils/appSettings";
import {
  getLovableTtsProvider,
  getServerOpenRouterApiKey,
  getSpeakApiToken,
  isSpeakApiPersonalToken,
  setSpeakApiToken,
  validateRemoteTtsService,
} from "@/lib/alternative-tts";

export const CREDENTIALS_UPDATED_EVENT = "yt-credentials-updated";
export const CREDENTIAL_VALIDATION_CACHE_KEY = "yt_credential_validation_cache_v1";

export type CredentialHealthStatus = "valid" | "missing" | "invalid";

interface CachedValidationEntry {
  fingerprint: string;
  status: "valid" | "invalid";
  error?: string;
  checkedAt: number;
}

interface CredentialValidationCache {
  openRouter?: CachedValidationEntry;
  ttsToken?: CachedValidationEntry;
}

export interface CredentialStatusSnapshot {
  openRouter: {
    status: CredentialHealthStatus;
    hasCustomKey: boolean;
    hasServerKey: boolean;
    lastError?: string;
    checkedAt?: number;
  };
  ttsToken: {
    status: CredentialHealthStatus;
    hasToken: boolean;
    lastError?: string;
    checkedAt?: number;
  };
}

export interface CredentialVerifyResult {
  ok: boolean;
  status: CredentialHealthStatus;
  message: string;
}

export function dispatchCredentialsUpdatedEvent(): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(CREDENTIALS_UPDATED_EVENT));
  } catch {
    // ignore event dispatch errors in minimal environments
  }
}

export function computeCredentialFingerprint(secret: string): string {
  const clean = secret.trim();
  if (!clean) return "";
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i += 1) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const head = clean.slice(0, 4);
  const tail = clean.length > 6 ? clean.slice(-3) : "";
  return `${clean.length}:${head}..${tail}:${(hash >>> 0).toString(16)}`;
}

function readValidationCache(): CredentialValidationCache {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_VALIDATION_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CredentialValidationCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeValidationCache(next: CredentialValidationCache): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(CREDENTIAL_VALIDATION_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function clearCredentialValidationCache(target: "openRouter" | "ttsToken" | "all"): void {
  const cache = readValidationCache();
  if (target === "all") {
    writeValidationCache({});
    return;
  }
  const next = { ...cache };
  delete next[target];
  writeValidationCache(next);
}

function setCachedValidationStatus(
  target: "openRouter" | "ttsToken",
  fingerprint: string,
  status: "valid" | "invalid",
  error?: string,
): void {
  if (!fingerprint) return;
  const cache = readValidationCache();
  cache[target] = {
    fingerprint,
    status,
    error,
    checkedAt: Date.now(),
  };
  writeValidationCache(cache);
}

/**
 * Returns the effective OpenRouter API key, ignoring TTS Speak tokens (spk_/tts_)
 * that may have been entered into legacy shared slots.
 */
export function getEffectiveOpenRouterKey(): string {
  const custom = getOpenRouterApiKeySetting().trim();
  if (custom && !isSpeakApiPersonalToken(custom)) {
    return custom;
  }
  return getServerOpenRouterApiKey().trim();
}

export function getEffectiveTtsServiceToken(): string {
  return getSpeakApiToken().trim();
}

export function getCredentialStatusSnapshot(): CredentialStatusSnapshot {
  const customOrRaw = getOpenRouterApiKeySetting().trim();
  const hasCustomOpenRouter = Boolean(customOrRaw && !isSpeakApiPersonalToken(customOrRaw));
  const serverOrKey = getServerOpenRouterApiKey().trim();
  const hasServerKey = Boolean(serverOrKey);
  const effectiveOpenRouter = hasCustomOpenRouter ? customOrRaw : serverOrKey;

  const ttsToken = getEffectiveTtsServiceToken();
  const hasTtsToken = Boolean(ttsToken);

  const cache = readValidationCache();

  let openRouterStatus: CredentialHealthStatus = "missing";
  let openRouterError: string | undefined;
  let openRouterCheckedAt: number | undefined;
  if (customOrRaw && isSpeakApiPersonalToken(customOrRaw)) {
    openRouterStatus = "invalid";
    openRouterError =
      "Looks like a TTS Speak token (spk_). Enter an OpenRouter key (sk-or-...).";
  } else if (effectiveOpenRouter) {
    const fp = computeCredentialFingerprint(effectiveOpenRouter);
    const cached = cache.openRouter;
    if (cached && cached.fingerprint === fp) {
      openRouterStatus = cached.status;
      openRouterError = cached.error;
      openRouterCheckedAt = cached.checkedAt;
    } else {
      openRouterStatus = "valid";
    }
  }

  let ttsStatus: CredentialHealthStatus = "missing";
  let ttsError: string | undefined;
  let ttsCheckedAt: number | undefined;
  if (hasTtsToken) {
    const fp = computeCredentialFingerprint(ttsToken);
    const cached = cache.ttsToken;
    if (cached && cached.fingerprint === fp) {
      ttsStatus = cached.status;
      ttsError = cached.error;
      ttsCheckedAt = cached.checkedAt;
    } else {
      ttsStatus = "valid";
    }
  }

  return {
    openRouter: {
      status: openRouterStatus,
      hasCustomKey: hasCustomOpenRouter,
      hasServerKey,
      lastError: openRouterError,
      checkedAt: openRouterCheckedAt,
    },
    ttsToken: {
      status: ttsStatus,
      hasToken: hasTtsToken,
      lastError: ttsError,
      checkedAt: ttsCheckedAt,
    },
  };
}

export function saveFloatingOpenRouterKey(rawKey: string): CredentialStatusSnapshot {
  const clean = rawKey.trim();
  clearCredentialValidationCache("openRouter");
  setOpenRouterApiKeySetting(clean);
  if (clean && isSpeakApiPersonalToken(clean)) {
    const fp = computeCredentialFingerprint(clean);
    setCachedValidationStatus(
      "openRouter",
      fp,
      "invalid",
      "Looks like a TTS Speak token (spk_). Enter an OpenRouter key (sk-or-...).",
    );
  }
  dispatchCredentialsUpdatedEvent();
  return getCredentialStatusSnapshot();
}

export function saveFloatingTtsServiceToken(rawToken: string): CredentialStatusSnapshot {
  let clean = rawToken.trim();
  if (clean.toLowerCase().startsWith("bearer ")) {
    clean = clean.slice(7).trim();
  }
  clearCredentialValidationCache("ttsToken");
  setSpeakApiToken(clean);
  dispatchCredentialsUpdatedEvent();
  return getCredentialStatusSnapshot();
}

export async function verifyOpenRouterCredential(
  apiKeyOverride?: string,
): Promise<CredentialVerifyResult> {
  const key = (apiKeyOverride !== undefined ? apiKeyOverride : getEffectiveOpenRouterKey()).trim();
  if (!key) {
    clearCredentialValidationCache("openRouter");
    dispatchCredentialsUpdatedEvent();
    return {
      ok: false,
      status: "missing",
      message: "OpenRouter API key is missing.",
    };
  }
  if (isSpeakApiPersonalToken(key)) {
    const fp = computeCredentialFingerprint(key);
    const msg = "That is a Speak API token (spk_), not an OpenRouter key (sk-or-...).";
    setCachedValidationStatus("openRouter", fp, "invalid", msg);
    dispatchCredentialsUpdatedEvent();
    return { ok: false, status: "invalid", message: msg };
  }

  const fp = computeCredentialFingerprint(key);
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
    const res = await fetch("https://openrouter.ai/api/v1/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      setCachedValidationStatus("openRouter", fp, "valid");
      dispatchCredentialsUpdatedEvent();
      return { ok: true, status: "valid", message: "OpenRouter API key verified." };
    }
    if (res.status === 401 || res.status === 403) {
      const msg = `OpenRouter rejected key (HTTP ${res.status}).`;
      setCachedValidationStatus("openRouter", fp, "invalid", msg);
      dispatchCredentialsUpdatedEvent();
      return { ok: false, status: "invalid", message: msg };
    }
    return {
      ok: false,
      status: "valid",
      message: `OpenRouter returned HTTP ${res.status}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error verifying OpenRouter key.";
    return {
      ok: false,
      status: "valid",
      message: `Verification could not complete: ${msg}`,
    };
  }
}

export async function verifyTtsServiceTokenCredential(
  tokenOverride?: string,
): Promise<CredentialVerifyResult> {
  let token = (tokenOverride !== undefined ? tokenOverride : getEffectiveTtsServiceToken()).trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }
  if (!token) {
    clearCredentialValidationCache("ttsToken");
    dispatchCredentialsUpdatedEvent();
    return {
      ok: false,
      status: "missing",
      message: "TTS-Service token is missing.",
    };
  }

  const fp = computeCredentialFingerprint(token);
  try {
    const res = await validateRemoteTtsService("lovable", {
      lang: "en",
      provider: getLovableTtsProvider(),
      speakApiToken: token,
      isAnonymous: false,
    });
    if (res.ok) {
      setCachedValidationStatus("ttsToken", fp, "valid");
      dispatchCredentialsUpdatedEvent();
      return { ok: true, status: "valid", message: "TTS-Service token verified." };
    }
    const errText = (res.error || "").toLowerCase();
    const isAuthFailure =
      errText.includes("401") ||
      errText.includes("403") ||
      errText.includes("unauthorized") ||
      errText.includes("invalid personal api token") ||
      errText.includes("invalid token");
    if (isAuthFailure) {
      const msg = res.error || "TTS-Service rejected the token (unauthorized).";
      setCachedValidationStatus("ttsToken", fp, "invalid", msg);
      dispatchCredentialsUpdatedEvent();
      return { ok: false, status: "invalid", message: msg };
    }
    return {
      ok: false,
      status: "valid",
      message: res.error || "Could not verify TTS-Service token.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error verifying TTS-Service token.";
    return {
      ok: false,
      status: "valid",
      message: `Verification could not complete: ${msg}`,
    };
  }
}

export function subscribeToCredentialUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleCustom = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (
      !e.key ||
      e.key === "yt_openrouter_api_key" ||
      e.key === "yt_openrouter_api_key_v1" ||
      e.key === "yt_alternative_tts_lovable_api_key_v1" ||
      e.key === "yt_speak_api_token_v1" ||
      e.key === CREDENTIAL_VALIDATION_CACHE_KEY
    ) {
      callback();
    }
  };
  window.addEventListener(CREDENTIALS_UPDATED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CREDENTIALS_UPDATED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
