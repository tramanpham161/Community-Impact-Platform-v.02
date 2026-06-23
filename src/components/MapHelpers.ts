import { SECTOR_COLOURS } from "@/lib/types";
import type { Organisation, CommunityInsight } from "@/lib/types";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const cut = slice.lastIndexOf(" ");
  return (cut > max * 0.6 ? slice.slice(0, cut) : slice).trimEnd() + "\u2026";
}

export function makeOrgMarker(org: Organisation): HTMLElement {
  const el = document.createElement("div");
  el.className = "org-pin";
  el.style.cssText = "width:24px;height:24px;cursor:pointer;";
  el.dataset.orgId = org.id;
  el.title = org.name;
  el.innerHTML = "<span class=\"org-pin-dot\" aria-hidden style=\"position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:9999px;pointer-events:none;box-shadow:0 0 0 2px #ffffff,0 1px 2px rgba(0,0,0,.25);\"></span>";
  return el;
}

export function updateOrgMarker(el: HTMLElement, org: Organisation, selectedOrgId: string | null, popupTarget: any) {
  const colour = SECTOR_COLOURS[org.sector];
  const dot = el.querySelector(".org-pin-dot") as HTMLElement | null;
  const isSelected = selectedOrgId === org.id || (popupTarget?.kind === "org" && popupTarget.id === org.id);
  if (dot) {
    dot.style.background = colour;
    dot.style.boxShadow = isSelected
      ? "0 0 0 3px #ffffff, 0 0 0 5px " + colour + ", 0 2px 6px rgba(0,0,0,.3)"
      : "0 0 0 2px #ffffff, 0 1px 2px rgba(0,0,0,.25)";
    dot.style.transform = isSelected ? "scale(1.25)" : "scale(1)";
    dot.style.transition = "transform .15s ease, box-shadow .15s ease";
  }
}

export function makeInsightMarker(insight: CommunityInsight): HTMLElement {
  const el = document.createElement("div");
  el.className = "insight-pin";
  el.style.cssText = "width:20px;height:20px;cursor:pointer;";
  el.dataset.insightId = insight.id;
  el.title = "Community insight \u2014 " + insight.theme;
  el.innerHTML = "<span aria-hidden style=\"position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:2px;background:#f59e0b;pointer-events:none;box-shadow:0 0 0 2px #ffffff,0 1px 2px rgba(0,0,0,.3);transform:rotate(45deg);\"></span>";
  return el;
}

export function updateInsightMarker(el: HTMLElement, insight: CommunityInsight, selectedInsightId: string | null, popupTarget: any) {
  const dot = el.querySelector("span") as HTMLElement | null;
  if (!dot) return;
  const isSelected = selectedInsightId === insight.id || (popupTarget?.kind === "insight" && popupTarget.id === insight.id);
  dot.style.boxShadow = isSelected
    ? "0 0 0 3px #ffffff, 0 0 0 5px #f59e0b, 0 2px 6px rgba(0,0,0,.3)"
    : "0 0 0 2px #ffffff, 0 1px 2px rgba(0,0,0,.3)";
  dot.style.transform = isSelected ? "rotate(45deg) scale(1.25)" : "rotate(45deg)";
  dot.style.transition = "transform .15s ease, box-shadow .15s ease";
}

export function makeClusterElement(count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "org-cluster";
  const size = count >= 10 ? 40 : 34;
  el.style.cssText = "width:" + size + "px;height:" + size + "px;cursor:pointer;z-index:5;";
  el.title = count + " organisations here \u2014 click to zoom in";
  el.innerHTML = "<span aria-hidden style=\"position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;box-shadow:0 0 0 3px rgba(255,255,255,.92),0 2px 8px rgba(15,23,42,.3);\"><span class=\"cluster-count\">" + count + "</span></span>";
  return el;
}
