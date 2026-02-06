import { IInputs } from "../generated/ManifestTypes";

/**
 * Gets the Dataverse client URL so we can build web resource URLs.
 * Tries PCF context first, then parent frame Xrm (model-driven app host).
 */
export function getClientUrl(context: ComponentFramework.Context<IInputs>): string | null {
  const ctx = context as unknown as { page?: { getClientUrl?: () => string } };
  if (ctx?.page?.getClientUrl) {
    try {
      return ctx.page.getClientUrl();
    } catch {
      // ignore
    }
  }
  try {
    const win = typeof window !== "undefined" ? window : undefined;
    const parent = win?.parent as Window & { Xrm?: { Utility?: { getGlobalContext?: () => { getClientUrl?: () => string } } } } | undefined;
    const url = parent?.Xrm?.Utility?.getGlobalContext?.()?.getClientUrl?.();
    if (url) return url;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Loads a JavaScript web resource by name. The script is appended to document.head.
 * Resolves when the script has loaded (or rejects on error).
 */
export function loadWebResourceScript(clientUrl: string, webResourceName: string): Promise<void> {
  const name = webResourceName.trim();
  if (!name) return Promise.reject(new Error("Web resource name is empty"));

  const base = clientUrl.replace(/\/$/, "");
  const url = `${base}/WebResources/${name}`;

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${name}`));
    document.head.appendChild(script);
  });
}
