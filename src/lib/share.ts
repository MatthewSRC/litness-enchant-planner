import { Platform } from "react-native";

// Builds are shared as `?build=<id>`: the planner opens with that build loaded.
const web = Platform.OS === "web" && typeof window !== "undefined";

export const buildFromUrl = () => (web ? new URLSearchParams(window.location.search).get("build") : null);

/** Keeps the address bar on the build being shown, so it can be copied from there too. */
export function setBuildInUrl(id: string | null) {
  if (!web) return;
  const url = new URL(window.location.href);
  if ((url.searchParams.get("build") ?? null) === id) return;
  if (id) url.searchParams.set("build", id);
  else url.searchParams.delete("build");
  window.history.replaceState(null, "", url);
}

export const buildLink = (id: string) => (web ? `${window.location.origin}${window.location.pathname}?build=${id}` : `?build=${id}`);

// Older copy path for pages where the Clipboard API is refused (embedded browsers, non-HTTPS).
function copyWithSelection(text: string) {
  if (!web) return false;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** Copies the link, or opens the system share sheet where copying isn't allowed. */
export async function shareLink(url: string, title: string): Promise<"copied" | "shared" | "failed"> {
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    if (copyWithSelection(url)) return "copied";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return "shared";
      } catch {}
    }
    return "failed";
  }
}
