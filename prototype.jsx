import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, Inbox, Clock, CheckCircle2, ChevronRight, ChevronDown, ArrowLeft,
  Plus, Search, Building2, FileText, MailQuestion, Send, ShieldCheck,
  PauseCircle, User, Paperclip, CircleDot, ArrowRight, Layers, XCircle,
  BellRing, Mail, Download, X, FileCheck2, FileClock, CornerUpLeft, Link2, MoonStar, Flame,
  MailOpen, Globe, Phone, MessageSquare, Hourglass, HelpCircle, MessageCircleQuestion, Cpu, Sparkles, UserMinus, RefreshCw, SlidersHorizontal, IndianRupee, Link as LinkIcon, Landmark, RotateCcw,
  HeartHandshake, ListChecks, SquareDashedMousePointer, TextSearch, PanelLeftClose, PanelLeftOpen,
  Eye, EyeOff, Info, Loader2, LogOut, ChevronLeft, ArrowDownWideNarrow, AlertCircle, Upload,
  Check, Minus, History, SmilePlus, MoreVertical, MoreHorizontal, BadgeCheck, ChevronUp, CornerDownRight, Tags
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  BimaKavach TMS — non-financial endorsement
 *  SLA is stage-wise only. Ticket age is shown but never judged.
 * ------------------------------------------------------------------ */

const C = {
  ink: "#0E1A1F", ink2: "#3D5058", ink3: "#7C8F97",
  line: "#D2D5D8", lineSoft: "#ECECF1", subtle: "#E6E8EA",
  canvas: "#F4F5F6", white: "#FFFFFF",
  teal: "#0B6E5F", tealSoft: "#E4F0ED",
  link: "#1458D2",
  breach: "#B3261E", breachSoft: "#FBEAE8",
  warn: "#A15C00", warnSoft: "#FDF2E1",
  wait: "#4B5EAA", waitSoft: "#EAECF7",

  /* Chrome — carried across from V001.1. Semantic tones above are untouched:
     colour still means what docs/DESIGN-SYSTEM.md says it means. Purple dresses
     the shell only; it never states a ticket's condition. */
  brand: "#4100CF", brand600: "#320099", brand400: "#7A4DEB",
  brand200: "#EDE6FF", brandBg: "#F4F1FF",
  cream: "#FFF6ED",   /* brand-secondary-subtle — V001.1 used it as the page ground; unused here */
  accent: "#FF7700", greet: "#9082B3",
  figInk: "#1C1D1F", figHint: "#6F7378", figTert: "#A9ACB1", figPlaceholder: "#BEC2C6",
  figDisabled: "rgba(169,172,177,0.48)",
  /* label/semantic — the countdown colours in Stage due */
  semError: "#CF0000", semCaution: "#B38F0A",
};

/* ------------------------------------------------------------------ *
 *  CHROME PRIMITIVES — the V001.1 treatments, hand-rolled.
 *  figma-squircle, framer-motion and the /public assets are not
 *  available here, so each is reproduced inside this file.
 * ------------------------------------------------------------------ */

/* Figma corner smoothing. Ported from figma-squircle (MIT, Tien Pham) after
   figma.com/blog/desperately-seeking-squircles. Only the uniform-radius case
   is needed — every element here carries one radius on all four corners. */
const SQ_SMOOTHING = 0.6;
const rad = (deg) => (deg * Math.PI) / 180;

function squirclePath(w, h, radius, smoothing) {
  const budget = Math.min(w, h) / 2;
  const r = Math.min(radius, budget);
  let p = (1 + smoothing) * r;
  const arcMeasure = 90 * (1 - smoothing);
  const arc = Math.sin(rad(arcMeasure / 2)) * r * Math.SQRT2;
  const p3ToP4 = r * Math.tan(rad((90 - arcMeasure) / 2 / 2));
  const angleBeta = 45 * smoothing;
  const c = p3ToP4 * Math.cos(rad(angleBeta));
  const d = c * Math.tan(rad(angleBeta));
  let b = (p - arc - c - d) / 3, a = 2 * b;
  if (p > budget) {                       /* preserveSmoothing */
    const span = budget - d - arc - c;
    b = Math.min(b, span - span / 6);
    a = span - b;
    p = budget;
  }
  const n = (v) => v.toFixed(4);
  return [
    `M ${n(w - p)} 0`,
    `c ${n(a)} 0 ${n(a + b)} 0 ${n(a + b + c)} ${n(d)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(arc)} ${n(arc)}`,
    `c ${n(d)} ${n(c)} ${n(d)} ${n(b + c)} ${n(d)} ${n(a + b + c)}`,
    `L ${n(w)} ${n(h - p)}`,
    `c 0 ${n(a)} 0 ${n(a + b)} ${n(-d)} ${n(a + b + c)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(-arc)} ${n(arc)}`,
    `c ${n(-c)} ${n(d)} ${n(-(b + c))} ${n(d)} ${n(-(a + b + c))} ${n(d)}`,
    `L ${n(p)} ${n(h)}`,
    `c ${n(-a)} 0 ${n(-(a + b))} 0 ${n(-(a + b + c))} ${n(-d)}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(-arc)} ${n(-arc)}`,
    `c ${n(-d)} ${n(-c)} ${n(-d)} ${n(-(b + c))} ${n(-d)} ${n(-(a + b + c))}`,
    `L 0 ${n(p)}`,
    `c 0 ${n(-a)} 0 ${n(-(a + b))} ${n(d)} ${n(-(a + b + c))}`,
    `a ${n(r)} ${n(r)} 0 0 1 ${n(arc)} ${n(-arc)}`,
    `c ${n(c)} ${n(-d)} ${n(b + c)} ${n(-d)} ${n(a + b + c)} ${n(-d)}`,
    "Z",
  ].join(" ");
}

/* Global manager, mirroring V001.1's src/lib/squircle.ts: masks every rounded-lg
   element with its own radius, using mask-image rather than clip-path so the
   shadows survive. Skips pills, already-masked nodes, and overflow-visible
   containers holding a positioned child — masking those would clip an open
   dropdown or a tooltip. */
function useSquircle() {
  useEffect(() => {
    if (typeof window === "undefined" || !("ResizeObserver" in window)) return;
    const cache = new WeakMap();
    let raf = 0;
    const clear = (el) => {
      el.style.removeProperty("mask-image");
      el.style.removeProperty("-webkit-mask-image");
      delete el.dataset.sq;
      cache.delete(el);
    };
    const hasPositionedChild = (el) => {
      const kids = el.querySelectorAll("*");
      for (let i = 0; i < kids.length; i++) {
        const p = getComputedStyle(kids[i]).position;
        if (p === "absolute" || p === "fixed") return true;
      }
      return false;
    };
    const applyOne = (el) => {
      if (el.hasAttribute("data-no-squircle")) { if (el.dataset.sq) clear(el); return; }
      const cs = getComputedStyle(el);
      if (cs.maskImage !== "none" && !el.dataset.sq) return;   /* ikkat marks, fades */
      const r = parseFloat(cs.borderTopLeftRadius) || 0;
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width), h = Math.round(rect.height);
      if (!w || !h) return;
      if (r < 5 || r >= Math.min(w, h) / 2 - 0.5) { if (el.dataset.sq) clear(el); return; }
      if (cs.overflow === "visible" && cs.overflowX === "visible" &&
          cs.overflowY === "visible" && hasPositionedChild(el)) {
        if (el.dataset.sq) clear(el); return;
      }
      const key = `${w}x${h}x${r}`;
      if (cache.get(el) === key) return;
      cache.set(el, key);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
        `<path d='${squirclePath(w, h, r, SQ_SMOOTHING)}' fill='black'/></svg>`;
      const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      el.style.setProperty("mask-image", uri);
      el.style.setProperty("-webkit-mask-image", uri);
      el.style.setProperty("mask-size", "100% 100%");
      el.style.setProperty("-webkit-mask-size", "100% 100%");
      el.style.setProperty("mask-repeat", "no-repeat");
      el.dataset.sq = "1";
      ro.observe(el);
    };
    const scan = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        document.querySelectorAll('[class*="rounded-lg"]').forEach(applyOne));
    };
    const ro = new ResizeObserver(scan);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", scan);
    scan();
    return () => {
      mo.disconnect(); ro.disconnect();
      window.removeEventListener("resize", scan);
      cancelAnimationFrame(raf);
    };
  }, []);
}

/* Anek Latin. docs/DESIGN-SYSTEM.md previously forbade font loading; that rule
   is now an explicit exception, recorded there. The fallback stack is real, so
   an offline render degrades rather than breaks. */
function useAnek() {
  useEffect(() => {
    if (document.getElementById("bk-anek")) return;
    const l = document.createElement("link");
    l.id = "bk-anek";
    l.rel = "stylesheet";
    /* Anek Kannada rides alongside Latin so a Kannadiga user can be greeted in
       her own script. Anek covers ten Indic scripts; add the face when a user
       arrives who needs another. */
    /* Instrument Serif Italic is the display face — it sets initials on the
       participant marks and the mail avatars, and nothing else. */
    l.href = "https://fonts.googleapis.com/css2?family=Anek+Latin:wght@100..800&family=Anek+Kannada:wght@100..800&family=Anek+Devanagari:wght@100..800&family=Instrument+Serif:ital@1&display=swap";
    document.head.appendChild(l);
  }, []);
}
const FONT = '"Anek Latin", "Anek Kannada", "Anek Devanagari", system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Instrument Serif", Georgia, "Times New Roman", serif';

/* Ikkat — the block-print motif. v1 is outlined, v2 solid; the rule alternates
   them on a 20px pitch. Inlined as data URIs because /public does not exist here. */
const IKKAT_V1 = "M1.33962 1.5283C1.55845 1.5283 1.73585 1.35091 1.73585 1.13208C1.73585 0.913246 1.91325 0.735849 2.13208 0.735849H2.68868C2.89188 0.735849 3.0566 0.571124 3.0566 0.367924C3.0566 0.164725 3.22133 0 3.42453 0H4.57547C4.77867 0 4.9434 0.164725 4.9434 0.367924C4.9434 0.571124 5.10812 0.735849 5.31132 0.735849H6.01887C6.2377 0.735849 6.41509 0.913246 6.41509 1.13208C6.41509 1.35091 6.59249 1.5283 6.81132 1.5283L7.5283 1.5283C7.78881 1.5283 8 1.73949 8 2C8 2.26051 7.78881 2.4717 7.5283 2.4717H6.81132C6.59249 2.4717 6.41509 2.64909 6.41509 2.86792C6.41509 3.08675 6.2377 3.26415 6.01887 3.26415H5.31132C5.10812 3.26415 4.9434 3.42888 4.9434 3.63208C4.9434 3.83527 4.77867 4 4.57547 4L3.42453 4C3.22133 4 3.0566 3.83527 3.0566 3.63208C3.0566 3.42888 2.89188 3.26415 2.68868 3.26415H2.13208C1.91325 3.26415 1.73585 3.08675 1.73585 2.86792C1.73585 2.64909 1.55845 2.4717 1.33962 2.4717H0.471698C0.211187 2.4717 0 2.26051 0 2C0 1.73949 0.211186 1.5283 0.471698 1.5283H1.33962ZM3.24528 1.99071C3.24528 2.21467 3.42684 2.39623 3.6508 2.39623H4.38694C4.6109 2.39623 4.79245 2.21467 4.79245 1.99071C4.79245 1.76675 4.6109 1.5852 4.38694 1.5852L3.6508 1.5852C3.42684 1.5852 3.24528 1.76675 3.24528 1.99071Z";
const IKKAT_V2 = "M1.33962 1.5283C1.55845 1.5283 1.73585 1.35091 1.73585 1.13208C1.73585 0.913245 1.91325 0.735849 2.13208 0.735849H2.68868C2.89188 0.735849 3.0566 0.571124 3.0566 0.367924C3.0566 0.164725 3.22133 -7.38057e-08 3.42453 -7.38057e-08H4.57547C4.77867 -7.38057e-08 4.9434 0.164725 4.9434 0.367924C4.9434 0.571124 5.10812 0.735849 5.31132 0.735849H6.01887C6.2377 0.735849 6.41509 0.913245 6.41509 1.13208C6.41509 1.35091 6.59249 1.5283 6.81132 1.5283L7.5283 1.5283C7.78881 1.5283 8 1.73949 8 2C8 2.26051 7.78881 2.4717 7.5283 2.4717H6.81132C6.59249 2.4717 6.41509 2.64909 6.41509 2.86792C6.41509 3.08675 6.2377 3.26415 6.01887 3.26415H5.31132C5.10812 3.26415 4.9434 3.42888 4.9434 3.63208C4.9434 3.83527 4.77867 4 4.57547 4L3.42453 4C3.22133 4 3.0566 3.83527 3.0566 3.63208C3.0566 3.42888 2.89188 3.26415 2.68868 3.26415H2.13208C1.91325 3.26415 1.73585 3.08675 1.73585 2.86792C1.73585 2.64909 1.55845 2.4717 1.33962 2.4717H0.471698C0.211187 2.4717 0 2.26051 0 2C0 1.73949 0.211186 1.5283 0.471698 1.5283H1.33962Z";
const svgUri = (w, body) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='4' viewBox='0 0 ${w} 4'>${body}</svg>`)}")`;
const pathEl = (d, tx) => `<path${tx ? ` transform='translate(${tx} 0)'` : ""} fill-rule='evenodd' clip-rule='evenodd' d='${d}' fill='black'/>`;
const IKKAT_RULE_URI = svgUri(40, pathEl(IKKAT_V1) + pathEl(IKKAT_V2, 20));
const IKKAT_MARK_URI = svgUri(8, pathEl(IKKAT_V1));
/* One mark on a 32-wide canvas: masked at 16px the mark lands 4px wide with 12px
   of air, which is the trail's divider (964:119381) rather than the page rule. */
const IKKAT_TRAIL_URI = svgUri(32, pathEl(IKKAT_V1));

/* Motion. staggerChildren .06 / delayChildren .1 / fadeUp .45s, reproduced with
   keyframes and an inline delay. Every animation collapses under
   prefers-reduced-motion, exactly as V001.1's MotionConfig did. */
const stagger = (i) => ({ animationDelay: `${(0.1 + Math.min(i, 6) * 0.06).toFixed(2)}s` });

const GLOBAL_CSS = `
/* Squircle corners — Figma's "corner smoothing" as CSS. Every element that
   already carries a border-radius gets a superellipse corner (var --sq, log2 of
   the exponent; 1.8 ~ Figma 60%). True circles and pills stay perfectly round:
   a superellipse on a full-radius shape distorts it. Degrades to plain rounded
   corners where corner-shape is unsupported (Safari today). */
:root { --sq: 1.8; }
:where(*, *::before, *::after) { corner-shape: superellipse(var(--sq)); }
.rounded-full, [class*="rounded-full"],
[style*="border-radius: 999px"], [style*="border-radius: 9999px"],
[style*="border-radius: 50%"] { corner-shape: round; }
@keyframes bkFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
/* Modal entrance — the card fades in while sliding up from a lower Y; the
   backdrop just fades. Reduced-motion is neutralised by the block below. */
@keyframes bkModalIn { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: none; } }
@keyframes bkScrimIn { from { opacity: 0; } to { opacity: 1; } }
.bk-modal { animation: bkModalIn .6s cubic-bezier(.5,0,.5,1) both; }
.bk-scrim { animation: bkScrimIn .6s cubic-bezier(.5,0,.5,1) both; }
@keyframes bkReveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.bk-reveal { animation: bkReveal .45s cubic-bezier(.5,0,.5,1) both; }
@keyframes bkRoute  { from { opacity: 0; transform: translateY(8px); }  to { opacity: 1; transform: none; } }
.bk-item  { animation: bkFadeUp .45s cubic-bezier(.22,1,.36,1) backwards; }
.bk-route { animation: bkRoute .4s cubic-bezier(.22,1,.36,1) .05s backwards; }
.bk-num   { font-variant-numeric: tabular-nums; }
.bk-opt:hover { background: #F4F1FF; }
/* Scope pill hover (Figma 914:103545) — an inactive pill goes brand on hover;
   overrides the inline default colours, so !important is required. */
.bk-pill:hover { border-color: #4100CF !important; color: #4100CF !important; }
.bk-pill:hover .bk-pill-dot { background: #4100CF !important; }
/* Detail tab hover (Figma 1126:41615) — an inactive tab gets a subtle lavender
   underline and brand text; overrides the inline default, so !important. */
.bk-tab:hover { border-bottom-color: #D1C6FF !important; color: #4100CF !important; }
/* Primary button interaction (Peetal 4128:8511) — hover darkens to #3800B4,
   press to #2C0091 (brightness reproduces both brand tokens and works for any
   tone); a fill button darkens, an outline one tints lavender; focus shows the
   #E8E2FF ring. */
.bk-btn { transition: filter .12s ease-out, background-color .12s ease-out, box-shadow .12s ease-out; }
.bk-btn:focus-visible { outline: none; box-shadow: 0 0 0 2.5px #E8E2FF; }
.bk-btn-fill:not(:disabled):hover  { filter: brightness(0.86); }
.bk-btn-fill:not(:disabled):active { filter: brightness(0.69); }
.bk-btn-ghost:not(:disabled):hover  { background-color: #F4F1FF !important; }
.bk-btn-ghost:not(:disabled):active { background-color: #E8E2FF !important; }
/* Secondary button (manual-log twin) — a soft grey glow on hover, like Back to Login. */
.bk-btn-secondary:not(:disabled):hover  { box-shadow: 0 0 16px rgba(169,172,177,0.48); }
.bk-btn-secondary:not(:disabled):active { box-shadow: 0 0 16px rgba(169,172,177,0.48); background-color: #F4F5F6 !important; }
/* Simulate pill hover — deepen the lavender fill. */
.bk-sim { transition: background-color .12s ease-out, box-shadow .12s ease-out; }
.bk-sim:not(:disabled):hover { background-color: #EDE6FF !important; }
/* Soft in-panel buttons (View / Download / etc.) — a gentle darken on hover. */
.bk-soft { transition: filter .12s ease-out; }
.bk-soft:not(:disabled):hover  { filter: brightness(0.95); }
.bk-soft:not(:disabled):active { filter: brightness(0.9); }
/* Plain text / small icon buttons — deepen to ink on hover. */
.bk-dim { transition: color .12s ease-out; }
.bk-dim:not(:disabled):hover { color: #1C1D1F !important; }
/* Placeholders read as label/neutral/disabled (A9ACB1 @ 60%), not the browser
   default grey — matched by empty <select>s so every unfilled field looks alike. */
input::placeholder, textarea::placeholder { color: rgba(169,172,177,0.6); opacity: 1; }
/* Sidebar profile card hover (Figma 437:2239) — lavender border + soft brand glow. */
.bk-profile { transition: border-color .12s ease-out, box-shadow .12s ease-out; }
.bk-profile:hover { border-color: #D1C6FF !important; box-shadow: 0 0 12px rgba(65,0,207,0.12); }
/* Your Desk cards — hover lifts with a brand tint; pressing shows the firmer
   neutral stroke + soft elevation from the old selected look (Figma 1249:89610). */
.bk-desk { transition: box-shadow .18s ease, border-color .18s ease; }
.bk-desk:hover { border-color: #D1C6FF !important; box-shadow: 0 0 12px rgba(65,0,207,0.10); }
.bk-desk:active { border-color: #D2D5D8 !important; box-shadow: 0 0 2px rgba(169,172,177,0.24); }
/* BimaClaim under-construction buttons hover (Figma 1172:72883/72884) — a soft glow. */
.bk-uc-btn { transition: box-shadow .12s ease-out, border-color .12s ease-out; }
.bk-uc-secondary:hover { box-shadow: 0 0 16px rgba(169,172,177,0.48); }
.bk-uc-primary:hover { box-shadow: 0 0 8px rgba(65,0,207,0.24); border-color: #F4F1FF !important; }
/* Square icon controls — chevron.controls / close (Figma 3583:8881). Default is
   a grey (hint) glyph; hover tints lavender with a brand glyph; focus sinks with
   a thicker lavender ring. Overrides the inline base, so !important. */
.bk-iconctrl { transition: background-color .12s ease-out, border-color .12s ease-out, color .12s ease-out; }
.bk-iconctrl:not(:disabled):hover { background-color: #F4F1FF !important; border-color: #D1C6FF !important; color: #4100CF !important; }
.bk-iconctrl:not(:disabled):focus-visible { outline: none; background-color: #F4F5F6 !important; border-color: #D1C6FF !important; border-width: 1.5px; color: #4100CF !important; }
/* Sidebar nav item hover (Figma 1214:79971) — an inactive tab lifts to a white
   fill with ink text. Only applied to inactive, enabled items. */
.bk-navitem { transition: background-color .12s ease-out, color .12s ease-out; }
.bk-navitem:hover { background-color: #FFFFFF !important; color: #1C1D1F !important; }
.bk-rule  { height: 4px; width: 100%; flex: none; background-color: ${"#4100CF"};
            -webkit-mask: ${IKKAT_RULE_URI} repeat-x left center / auto 4px;
            mask: ${IKKAT_RULE_URI} repeat-x left center / auto 4px; }
.bk-trail { height: 2px; width: 100%; flex: none; background-color: ${"#D2D5D8"};
            -webkit-mask: ${IKKAT_TRAIL_URI} repeat-x left center / 16px 2px;
            mask: ${IKKAT_TRAIL_URI} repeat-x left center / 16px 2px; }
.bk-mark  { flex: none; width: 12px; height: 6px; background-color: ${"#FF7700"};
            -webkit-mask: ${IKKAT_MARK_URI} no-repeat center / contain;
            mask: ${IKKAT_MARK_URI} no-repeat center / contain; }
.bk-fade  { position: absolute; left: 0; right: 0; bottom: 0; height: 40px; pointer-events: none;
            background: linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF); }
.scroll-slim { scrollbar-width: thin; scrollbar-color: ${"#D2D5D8"} transparent; }
.scroll-slim::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-slim::-webkit-scrollbar-thumb { background: ${"#ECECF1"}; border-radius: 999px; }
.scroll-slim::-webkit-scrollbar-track { background: transparent; }
@keyframes bkSpin { to { transform: rotate(360deg); } }
.bk-spin { animation: bkSpin .7s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-delay: 0s !important; transition-duration: .001ms !important; }
  /* the spinner still has to read as "working" — slow it, do not freeze it */
  .bk-spin { animation-duration: 1.6s !important; }
}
`;


/* ------------------------------------------------------------------ *
 *  MASTERS — mirrors the tabs of Endorsement_master.
 *  Everything below is configuration, not code. When the sheet is
 *  filled, these blocks are what gets replaced (or fetched at runtime).
 * ------------------------------------------------------------------ */

/* Tab: Insurer list — endorsement desk contact + working calendar owner */
const INSURERS = {
  "ICICI Lombard": { desk: "endorsement@icicilombard.com", pod: "Pod A", payMode: "Email", linkExpiryH: 48 },
  "Bajaj Allianz": { desk: "corp.endo@bajajallianz.co.in", pod: "Pod A", payMode: "Email", linkExpiryH: 48 },
  "HDFC ERGO": { desk: "endorsements@hdfcergo.com", pod: "Pod A", payMode: "Portal", linkExpiryH: 24 },
  "TATA AIG": { desk: "endorsements@tataaig.com", pod: "Pod B", payMode: "Email", linkExpiryH: 48 },
  "Chola MS": { desk: "servicing@cholams.murugappa.com", pod: "Pod B", payMode: "Portal", linkExpiryH: 72 },
  "New India": { desk: "endorsement@newindia.co.in", pod: "Pod B", payMode: "Email", linkExpiryH: 48 },
  "IFFCO Tokio": { desk: "endo.desk@iffcotokio.co.in", pod: "Pod C", payMode: "Email", linkExpiryH: 48 },
  "Kotak General": { desk: "endo@kotakgi.com", pod: "Pod C", payMode: "Portal", linkExpiryH: 24 },
  "Future Generali": { desk: "endo@futuregenerali.in", pod: "Pod C", payMode: "Email", linkExpiryH: 48 },
};

/* Tab: User role Master */
const ROLES = {
  "Nanditha P": { role: "Servicing executive", pod: "Pod A" },
  "Rahul K": { role: "Servicing executive", pod: "Pod B" },
  "Anil S": { role: "Relationship manager", pod: null },
};
const ESCALATION = { podLead: "Service Manager Head", serviceHead: "Service Head", insurerHead: "Insurer Head + Service Head", opsHead: "Operations Head", rm: "Relationship manager" };

/* Manual review escalation. Taken from Figma 917:106299 — "1 Que over 8Hrs ·
   Escalated to Endorsements Head" and the Status column's "Endorsements Manager
   Notified". The 8-hour threshold and the Endorsements Head / Manager roles are
   NOT in the master workbook; they come from the design and need confirming. */
const MR_ESCALATION = { overH: 8, to: "Endorsements Head", by: "Umesh Bagri", label: "Endorsements Manager Notified" };

/* Tab: Ticket Assignment parameters */
const ASSIGNMENT = { rule: "By insurer → pod, then round-robin within pod", podOf: (insurer) => INSURERS[insurer]?.pod || "Unassigned" };

/* Tab: Reminder Schedule Master + Escalation Matrix (Appendix E #6, #7).
   Values are working hours into the stage. */
/* Keyed to the SLA Master's status names — the Reminder Schedule tab labels the
   same statuses differently, and one vocabulary has to win. Not yet wired:
   remindersOf() derives from ALL_STAGES.followUp. */
const REMINDERS = {
  "New / Unassigned": { at: [0.5], escalateAfter: 1 },
  "Under Verification": { at: [1, 1.5], escalateAfter: 2 },
  "Submitted to Insurer": { at: [8, 16, 24], escalateAfter: 3 },
  "Awaiting Quote": { at: [8, 16, 24], escalateAfter: 3 },
  "Awaiting Payment Link": { at: [0.5, 1], escalateAfter: 2 },
  "Awaiting Payment": { at: [6, 12, 18], escalateAfter: 3 },
  "Awaiting Endorsement Copy": { at: [9, 18, 27], escalateAfter: 3 },
};

/* Tab: Notification event Map */
const NOTIFY = {
  ticket_raised: ["Client", "RM"],
  sent_to_insurer: ["Insurer desk"],
  stage_breached: [ESCALATION.podLead],
  no_action_15d: [ESCALATION.serviceHead, ESCALATION.rm],
  endorsement_delivered: ["Client", "RM"],
};

/* Tab: SLA Master and breach behaviour — verbatim from the master.
   unit: BH = business hours (10:00–19:00 Mon–Fri) · WD = working days, same
   clock time on the Nth working day · CD = calendar days 24×7 · MIN = minutes. */
const ALL_STAGES = {
  "New / Unassigned": {
    code: "SLA-01", label: "New / unassigned", sla: 1, unit: "MIN", owner: "system", verb: null, system: true, ind: "neutral",
    followUp: null, escalate: ["Service Head"], terminal: "Assign to fallback owner at +5 min",
  },
  "Under Verification": {
    code: "SLA-02", label: "Under verification", sla: 4, unit: "BH", owner: "Service Manager", verb: "Verify & submit to insurer", ind: "caution",
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Owning SM + Service Head", "+2 BH", "+4 BH", "+1 WD"],
    terminal: "Remains open - no auto-termination",
  },
  "Awaiting Customer Information": {
    code: "SLA-04", label: "Awaiting customer information", sla: 24, unit: "CD", owner: "customer", verb: null, awaited: true, ind: "error",
    followUp: { every: 48, unit: "CD", max: 4 }, escalate: ["Customer + RM + Service Head", "+2 CD", "+4 CD", "+10 CD"],
    terminal: "Auto-close as Cancelled at 30 CD from clock start, if unpaid. Cannot be reopened.", cancelAtCD: 30,
  },
  "Submitted to Insurer": {
    code: "SLA-05", label: "Submitted to insurer", sla: 1, unit: "WD", owner: "insurer", verb: "Log insurer acceptance", ind: "info",
    followUp: { every: 1, unit: "WD", max: 3 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+1 WD", "+1 WD"],
    terminal: "Remains open - no auto-termination insurer-side",
  },
  "Awaiting Quote": {
    code: "SLA-06", label: "Awaiting quote", sla: 2, unit: "WD", owner: "insurer", verb: "Log quote received", ind: "info",
    followUp: { every: 1, unit: "WD", max: 3 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+1 WD", "+1 WD"],
    terminal: "Remains open - no auto-termination insurer-side",
  },
  "Awaiting Payment Link": {
    code: "SLA-07", label: "Awaiting payment link", sla: 1, unit: "BH", owner: "operations", verb: null, awaited: true, ind: "info",
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Operations + Ops head + Service Head", "+1 BH", "+4 BH", "+1 WD"],
    terminal: "Remains open",
  },
  "Awaiting Payment": {
    code: "SLA-08", label: "Awaiting payment", sla: 24, unit: "CD", owner: "customer", verb: "Log payment confirmed", ind: "caution",
    followUp: { every: 24, unit: "CD", max: 3 }, escalate: ["Customer + RM + Service Head", "+2 CD", "+4 CD", "+12 CD"],
    terminal: "Terminate as Cancelled at 30 CD from clock start", cancelAtCD: 30,
  },
  "Awaiting Endorsement Copy": {
    code: "SLA-09", label: "Awaiting endorsement copy", sla: 3, unit: "WD", owner: "insurer", verb: null, awaited: true, ind: "caution",
    followUp: { every: 1, unit: "WD", max: 2 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+2 WD", "+2 WD"],
    terminal: "Remains open - no auto-termination insurer-side",
  },
  "Copy Received": {
    code: "SLA-11", label: "Copy received", sla: 1, unit: "BH", owner: "Service Manager", verb: "Publish & close", ind: "success",
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Owning SM + Service Head", "+30 min BH", "+2 BH", "+4 BH"],
    terminal: "Remains open",
  },
  "Closed": { label: "Closed", sla: null, unit: null, owner: null, verb: null, terminal: true, ind: "muted" },
};

const FLOW = {
  "Non-Financial": ["New / Unassigned", "Under Verification", "Submitted to Insurer", "Awaiting Endorsement Copy", "Copy Received", "Closed"],
  "Financial": ["New / Unassigned", "Under Verification", "Submitted to Insurer", "Awaiting Quote",
                "Awaiting Payment Link", "Awaiting Payment", "Awaiting Endorsement Copy", "Copy Received", "Closed"],
};

const stageOf = (k) => ALL_STAGES[k] || ALL_STAGES["Closed"];
const seqOf = (t) => FLOW[t.kind] || FLOW["Non-Financial"];
const posOf = (t, k) => seqOf(t).indexOf(k || t.stage);
const nextOf = (t) => seqOf(t)[(posOf(t) >= 0 ? posOf(t) : posOf(t, t.priorStage || "Under Verification")) + 1];
const atOrPast = (t, k) => (posOf(t) >= 0 ? posOf(t) : posOf(t, t.priorStage || "Under Verification")) >= posOf(t, k);

const TERMINAL = {
  "Customer Withdrawn": { label: "Customer withdrawn", color: C.ink2 },
  "Cancelled": { label: "Cancelled", color: C.ink2 },
};
const isTerminal = (t) => t.stage === "Closed" || !!t.terminal;
const readOnly = (t) => isTerminal(t);
/* A chase only makes sense while the ball is in the insurer's court — the three
   stages the master gives owner:"insurer" (Submitted / Awaiting Quote / Awaiting
   Endorsement Copy). Once the copy lands (Copy Received / Closed) there is nothing
   to chase, so the Mail Trail hides the control. */
const awaitingInsurer = (t) => stageOf(t.stage).owner === "insurer";

/* One deadline function, four units. inStage is CALENDAR hours in the stage. */
function dueFrom(entered, sla, unit) {
  if (unit === "BH") return addBiz(entered, sla);
  if (unit === "WD") return addWD(entered, sla);
  if (unit === "CD") return new Date(entered.getTime() + sla * 3600000);
  return new Date(entered.getTime() + (sla / 60) * 3600000);      // MIN
}
const unitLabel = (n, u) => u === "BH" ? `${n} BH` : u === "WD" ? `${n} WD` : u === "CD" ? `${n} CD Hrs` : `${n} Min`;

const PRIORITY = {
  Critical: { rank: 0, color: C.breach, bg: C.breachSoft },
  High: { rank: 1, color: C.warn, bg: C.warnSoft },
  Medium: { rank: 2, color: C.ink2, bg: C.lineSoft },
  Low: { rank: 3, color: C.ink3, bg: C.lineSoft },
};

/* Tab: Product x Endorsement list — 32 canonical endorsement types.
   Mandatory fields and documents depend on the TYPE only (verified against
   the master: no type's requirements differ by product). Product decides
   which types are offered. Classification is not a column in the sheet —
   the values below are assumed and need confirming. */
const TYPES = {
  "Hypothecation - Addition": { kind: "Non-Financial", fields: ["Bank name"], docs: [] },
  "Address Change / Correction / Update": { kind: "Non-Financial", fields: ["Complete address with PIN code"], docs: ["GST certificate"] },
  "Location Addition / Deletion": { kind: "Financial", fields: ["Location details", "PIN code"], docs: [] },
  "Sum Insured / Limit Enhancement": { kind: "Financial", fields: ["Amount of sum insured to be enhanced"], docs: [] },
  "Asset Addition": { kind: "Financial", fields: ["Asset category / type", "Value of asset"], docs: [] },
  "Contact Details Update (Email / Mobile)": { kind: "Non-Financial", fields: ["Email ID", "Contact number"], docs: [] },
  "Name / Entity Change": { kind: "Non-Financial", fields: ["Name"], docs: ["GST certificate", "Certificate of Incorporation"] },
  "Tax Invoice / Invoice Request": { kind: "Non-Financial", fields: ["Policy Number"], docs: [] },
  "Hypothecation - Removal": { kind: "Non-Financial", fields: [], docs: ["NOC from financier"] },
  "Refund - Excess Premium": { kind: "Return-Premium", fields: [], docs: ["Cancelled cheque", "Payment screenshot"] },
  "Business Description Correction": { kind: "Non-Financial", fields: ["Exact business description to be added in the policy"], docs: [] },
  "GST Details Update": { kind: "Non-Financial", fields: [], docs: ["GST certificate"] },
  "Policy Cancellation": { kind: "Return-Premium", fields: ["Reason for cancellation"], docs: ["Cancelled cheque"] },
  "Policy Cancellation + Refund": { kind: "Return-Premium", fields: ["Reason for cancellation"], docs: ["Cancelled cheque"] },
  "Correction in Policy": { kind: "Non-Financial", fields: ["Provide exact wording of the correction/changes to be added"], docs: [] },
  "Retrieve Policy document": { kind: "Non-Financial", fields: ["Policy Number"], docs: [] },
  "Policy Genuineness Verification": { kind: "Non-Financial", fields: ["Mail confirmation from insurer to client"], docs: [] },
  "Policy Period Extension / Reinstatement": { kind: "Financial", fields: ["Number of months"], docs: [] },
  "Risk Location Addition / Deletion / Change": { kind: "Financial", fields: ["Complete address with PIN code"], docs: [] },
  "Marine Certificate Issuance": { kind: "Financial", fields: ["Draft number"], docs: ["Commercial invoice"] },
  "Balance Transfer / Ledger Statement": { kind: "Non-Financial", fields: [], docs: ["Declaration till date"] },
  "Portal Access / Credentials / Training": { kind: "Non-Financial", fields: ["Email ID", "Mobile number"], docs: [] },
  "Declaration Submission": { kind: "Non-Financial", fields: [], docs: ["Declaration till date"] },
  "Trade Credit - Buyer Addition / Limit Assessment": { kind: "Financial", fields: ["Buyer details with address", "Buyer limits"], docs: [] },
  "Vendor Registration / Audit Documentation": { kind: "Non-Financial", fields: [], docs: [] },
  "Certificate of Insurance (COI) / Certificate": { kind: "Non-Financial", fields: ["Certificate holder name", "Certificate holder address"], docs: [] },
  "Coverage Wording / Policy Clause Addition or Correction": { kind: "Financial", fields: ["Exact wording of the coverage / clause to be added"], docs: [] },
  "Subsidiary Addition / Change": { kind: "Financial", fields: ["Ownership %", "Nature of work"], docs: [] },
  "Employee / Headcount Addition": { kind: "Financial", fields: ["Count of employees", "Monthly average salary", "Skilled and unskilled split"], docs: [] },
  "Annexure Update": { kind: "Non-Financial", fields: ["Name", "Age and monthly wages"], docs: [] },
  "Employee / Headcount Deletion": { kind: "Return-Premium", fields: ["Count of employees", "Skilled and unskilled split"], docs: [] },
  "Asset Deletion": { kind: "Return-Premium", fields: ["Asset category / type", "Value of asset"], docs: [] },
  "Others": { kind: "Non-Financial", fields: ["Describe the change required"], docs: [] },
};

const PRODUCTS = {
  "Fire & Burglary": ["Hypothecation - Addition", "Address Change / Correction / Update", "Location Addition / Deletion", "Sum Insured / Limit Enhancement", "Asset Addition", "Contact Details Update (Email / Mobile)", "Name / Entity Change", "Tax Invoice / Invoice Request", "Hypothecation - Removal", "Refund - Excess Premium", "Business Description Correction", "GST Details Update", "Policy Cancellation", "Policy Cancellation + Refund", "Correction in Policy", "Retrieve Policy document", "Policy Genuineness Verification", "Policy Period Extension / Reinstatement", "Risk Location Addition / Deletion / Change", "Others"],
  "Marine Cargo": ["Marine Certificate Issuance", "Sum Insured / Limit Enhancement", "Balance Transfer / Ledger Statement", "Portal Access / Credentials / Training", "Declaration Submission", "Address Change / Correction / Update", "GST Details Update", "Refund - Excess Premium", "Tax Invoice / Invoice Request", "Asset Addition", "Business Description Correction", "Hypothecation - Addition", "Location Addition / Deletion", "Name / Entity Change", "Policy Cancellation", "Correction in Policy", "Retrieve Policy document", "Policy Period Extension / Reinstatement", "Trade Credit - Buyer Addition / Limit Assessment", "Vendor Registration / Audit Documentation", "Others"],
  "Professional Indemnity (PI)": ["Certificate of Insurance (COI) / Certificate", "Sum Insured / Limit Enhancement", "Address Change / Correction / Update", "Coverage Wording / Policy Clause Addition or Correction", "Contact Details Update (Email / Mobile)", "Name / Entity Change", "Business Description Correction", "GST Details Update", "Location Addition / Deletion", "Tax Invoice / Invoice Request", "Policy Cancellation + Refund", "Correction in Policy", "Retrieve Policy document", "Refund - Excess Premium", "Risk Location Addition / Deletion / Change", "Subsidiary Addition / Change", "Vendor Registration / Audit Documentation", "Others"],
  "Commercial General Liability (CGL)": ["Certificate of Insurance (COI) / Certificate", "Sum Insured / Limit Enhancement", "Address Change / Correction / Update", "Coverage Wording / Policy Clause Addition or Correction", "Location Addition / Deletion", "Policy Cancellation + Refund", "Contact Details Update (Email / Mobile)", "Hypothecation - Addition", "Name / Entity Change", "Subsidiary Addition / Change", "Correction in Policy", "Policy Genuineness Verification", "Retrieve Policy document", "Refund - Excess Premium", "Risk Location Addition / Deletion / Change", "Tax Invoice / Invoice Request", "Others"],
  "Workmen Compensation (WC)": ["Address Change / Correction / Update", "Employee / Headcount Addition", "Annexure Update", "Policy Cancellation", "Correction in Policy", "Retrieve Policy document", "Risk Location Addition / Deletion / Change", "Contact Details Update (Email / Mobile)", "Coverage Wording / Policy Clause Addition or Correction", "Employee / Headcount Deletion", "Business Description Correction", "GST Details Update", "Name / Entity Change", "Policy Period Extension / Reinstatement", "Sum Insured / Limit Enhancement", "Refund - Excess Premium", "Others"],
  "Directors & Officers (D&O)": ["Address Change / Correction / Update", "Subsidiary Addition / Change", "Sum Insured / Limit Enhancement", "GST Details Update", "Tax Invoice / Invoice Request", "Contact Details Update (Email / Mobile)", "Policy Cancellation", "Correction in Policy", "Retrieve Policy document", "Business Description Correction", "Certificate of Insurance (COI) / Certificate", "Coverage Wording / Policy Clause Addition or Correction", "Employee / Headcount Addition", "Hypothecation - Addition", "Name / Entity Change", "Others"],
  "Cyber": ["Certificate of Insurance (COI) / Certificate", "Address Change / Correction / Update", "Sum Insured / Limit Enhancement", "Subsidiary Addition / Change", "Contact Details Update (Email / Mobile)", "Coverage Wording / Policy Clause Addition or Correction", "Name / Entity Change", "Policy Cancellation", "Refund - Excess Premium", "Tax Invoice / Invoice Request", "Others"],
  "Trade Credit": ["Trade Credit - Buyer Addition / Limit Assessment", "Correction in Policy", "Retrieve Policy document", "Sum Insured / Limit Enhancement", "Others"],
  "Errors & Omissions (E&O)": ["Sum Insured / Limit Enhancement", "Coverage Wording / Policy Clause Addition or Correction", "Address Change / Correction / Update", "Certificate of Insurance (COI) / Certificate", "Correction in Policy", "Retrieve Policy document", "Subsidiary Addition / Change", "Tax Invoice / Invoice Request", "Others"],
  "Crime": ["Address Change / Correction / Update", "Location Addition / Deletion", "Certificate of Insurance (COI) / Certificate", "GST Details Update", "Others"],
  "Engineering (CAR / EAR / CPM)": ["Policy Period Extension / Reinstatement", "GST Details Update", "Policy Cancellation", "Others"],
  "Office / Package Policy": ["Hypothecation - Addition", "Address Change / Correction / Update", "Asset Addition", "Asset Deletion", "Tax Invoice / Invoice Request", "Others"],
  "Public Liability": ["Sum Insured / Limit Enhancement", "Certificate of Insurance (COI) / Certificate", "Others"],
  "Motor": ["Address Change / Correction / Update", "Others"],
};

/* Tab: brand assets — the client's own marks, from Public/. */
/* Insurer wordmarks — Public/Insurance.Comp, downscaled and inlined because the
   artifact has no /public. Keys are the INSURERS master; an insurer with no mark
   on file falls back to the shield glyph rather than a stand-in. */
const INSURER_LOGO = {
  "ICICI Lombard": "data:image/webp;base64,UklGRuoPAABXRUJQVlA4WAoAAAAQAAAAiwAALwAAQUxQSEsIAAAB8Ib9//lG/v/dHs/nM2lqjN1BNbZt2/asxp5Z2/buaG3btjW2u3abvPJ6XEiaDt5+X4mICeD/UsU6I9b+SyCW+PIvgIW0ETe/+u59oxD5Z+dIXr5b424w5p+cpdtXql7E8yJhPQ33T82yMKoRX2O96HdW/plZLtNoVOP7Wlobc8KJddY584/AcbFGfE206YlniW/kpLPM0bCvZfsazT/hDBljr7l/w7ImnPSWFmHP14SKM5ATSgyz92ps5L6qIieVmMAX6mminv8aBhGReCIST0TKEJE4IiJguUHVi0QiJerXPE5izbETK+BYpBFNOKLLcJRpnAGMExK0TgBjKdOyXMNRVdXwGT0w4txxOO4iWUei0YR8/+/aGNIzM9MQC7jkACBIZkZmCCNAMNkQG8jMyApSr8TzVT1ftXpOJ46noe0z1x4ry/BnRuKYrxFNOKJ3E6D+wcPFa3A0vuDlbXu3v7E63TCy+MD3fQR63PD2rj2bn52B46rio7uqcYlGVH1Vz6/XZjqt199eCTk2lmG6/Vg5VusqRD71vYR8rzRfgsxQXwcQuCqs8V8LyTrVv6tS7Ukt81LcVtUPkI98L6JvrChRrd90EqNU62EAa40zYJ111opzLsBA7xPjnIBY55wgzlpnEBuyi73FkO9p4hG9EGu5y4/+mGMeU//PC7sP2qGqHdnm+29SbbPqvgVdppeoejbPC0cvIOOQanH72jR+xavcYjJDIr/lxgixhoRloH4OYCinACzSJTBRvYQ8/SzJCsFdqq+yUksiA4Gpr73wan4dP+Kfz3NaeqQBcNlrrz4hM7VUe5N1VCM6xE6ChnSYyFD9KxcjwrDbbrukDkxYM+2Jp4amr3nk0toM1I/brpxZGQlMv+GmSSEqnz+71xXjSBp3ychVMWdrJJGo/0sBxtDMj+jypF883UiSdcTO01Jt2URL9VRC1hF7v/o/ZmG/Ve/nLoy8rCd0KcvIOp1b8NZPrXhWDy5/T/fcv0x3p/bV0lcW7j3ak2ffH/6Y3kkzVdV1WZ/puXOLdTlckVDUj/TB4pivYS0YrKXa01jiygPq/2Su9aN/VjOGuKG9qi8QZIMf9j7qQfqCc2oUTmSg/p1LgN56C1TV97k7MpRa/g64Vbu216MVaKQ7gh2ToLiYwlLdOKP1On0O7tQlsMZPIKKlw3FgeVz1KFf70dJaNmCpX79+1cB+1Wf5SPUbsc4EG9TLT2uuYV1JEl00oqo3ZtJ81fXj4wW5PNrXOLMzGtykLV0V/wlxZ0d7t9UNBO1ObQi5Y/48RL4eCpBUHL3A2sG6FPpqGdGIHu2JAyH1sOqTbIyGo42B+ZHfdUCehnUp3/r+fgE2Rv7yqp+mYW2PNTyopV707+4B6JFPf/27ngmZW/1WWL7W9A3ahmr6DJyvvdrqBTbA51o05L3Xry05RJ5+jKvxo64V6aTLkKQtWhqNepGo6sv1cIClo1/iL+AM/cv7YFjPS0o8fYkl0VK/HffrX/79vfvfrb5eyLPR6MFkREzWZxoumQxUv3UmA/0/qwArtT8u8MPP3OO3pmr0aTg32qutdyfWff9TD30pmZ+LTZ7/sRDa7d0Oo3QJljbfa9wvp4MFcJyvqk1Ie1PLvC+d11UPJUvefo1fci45v6k+gQUh5xFV/7bmV/m/tmeQ+v0bty3IDb8FM/UcHtI2VNUX4ELt3UkjTZmvi4fo1TTQg+TrFzhu0SPV7Xu6DAx1r/9k89vX9bWIIdawaefO1wOQtODlzbs3v3Z1F0j9cMfO63FUv/i9bbu/fvbsIqTNri07p+EAgX53byvZ/cmKDOh+eP+BPUfW0fvzTcu/PMdyy/ctqLL/Hlh2sFvr91e/eNPmtdTYrHe/tu2vKbWKX8GYCq/oj5/v1hWAAQyApexgICAggA0ZwIgJugBggGAIwOICLkB8MWBSUwCDTU1JTU0NCeQ3SgJSMhwmORkCKQEgUDuAIbXvxLpJTepIRpog0GpU+/SmFQGMA3FWKL84AxhnSVCcAMYZymstYJyQoAWwlFccYBESF8oplFNEhLgiQlwRiQFEhLgikgCICHElLiAigAggAgiAiABirYgRRIg11oiRMo6zxPyjFU5WC1KWSEIiICLlkxgDkogIiEiMxBiQE0cSBdIFIJRMgmkBIJnjm+pIMET5U4lNCSIJH6tyTrv+9nzh/PWnC50+yzkvm+zHruwqnHf7+spCtc/zoNqNcSyL+sCtlxQsQ3pcc2Md4caM4VNh5br1NaDi500g9EmnSb1gxL2bckXW3TiMEzG3oOzClJy30kc1Fe6/sKNlwJ65t1Wj+icTa1ruO/WxhsLE9+ZB7itWAMc142D92zMvgdMeHpwjvFxx7kq4c9GDLYWx7yyGip9dde4o3Gt1GtVE3jytkdQozC+Im1+Yc6xaduncJW7nrpk1Xw08Ohw2ndPKMvasG1/Iotq7Y6oY1m96IsvwxMbnIfcpYh2Xj4Yr57+1Ctto3HN9hFeD01bC9Xc/W9nw2Lo3DLlXLf24O0lvBG0G8tLcPGnYpXOXuJ271DxWicv1lz88Gu64ZZphwqxRhx2V31nd1bC+1rXdKHqo3zNFVPv4ik4YHBePhFvqfHg5zL9s0wA4d91j7YSb8i7tT4Mn+j3bntrX1vitE5x93b0txDx/0TBORJOoQMsiIKtJPiSnUVWQmi2rQIWk7FTSU8lIw9RsWgEBslIgWzKygea5CLSohZAdykonLZ20TGw2VUJA8xoIVZrXxiQqx6qcwvG1HGMBAQGhbEusAAgIJ6kxgBgBEQQQIyCIgCCAGIkjAoIIYATACCCIgCACggAYAcTISfA/zABWUDggeAcAAJAdAJ0BKowAMAA+XSSORSOiIRqrHcQ4BcS2AGYM7SrfHv7N5qlc/vG8Kkgrv+oD9DeiP0gP5//vPUB+xH7b+79+M3uK/wHqAf2j+oes36iH7VewB5Y/7mfBH/Xv9h+4fwFfsj/++sA4E3tdx0a5ne7K2YEcXffCGQs4v1t7AfTF9F/9eDfH36cYs6tldrP/Nn4NHvijP6bB7bwIB+t5NsCsgNBUocz4Qjz4o0V9jevneETu446sg1SVJviFOqNBuByMUW6GL71E/jHqbOsdtTfIq911KbsG0adKJ/dqQHRG00gfMuxVIrp50B/iEPBeSgpIrgqYAP750gPGed8sZq/Fd/8dd/WtjPU8BLUaG2YbTSP1yQ/GA1OtZuYHMvswg3xBtZ2AL/Zj/hN3MN01/BYfcb3DfDyptd/5gzbKReR9bUfnHzYYt6wMX++Zuju028clh2ewpuZ7cLm/JnxV467RQYuy9YPqmHiDhwiz5058EGeB/3vt1Bh7gyZMPza7735RP6YjsVpAA29gunoAZsr0G7vpRewNQfUXHw5j0mF2UQUIEd4wRIcenGKRppkuCrzvywtypi5pkTsAjIn8p2Y3dIpU6UQQFFwAFYesKXEWDkgW9TfqDzx+bdrVk24j0CWQhjKMUu59yD53lbFOfaUeyf6onzZZDEjRRfLbK3uw+SYkzm1O0tyDW7qMyG1P27zmzN0zucAnS62gdWJ12A4rbPUrTmGDglTcUhR35/+yCnHm3eaNHnbOu++xcc3A5WYKmYXz83huZwi9nHikjijeX/L0ifpi/yAYfgCd4yFjKKpWQTdbfmaR6afiZ987mTbPReYVvaaR+2L6yqXoMKfYvC4GsZBiGKwS4CATONQyuF8uzEgRoDSmJfOiv4bg5/5anUzKWjqxr1K9t7OvP/iouDYwvjjqb5wF5zd1yHGHao6PRapuJSxLDb0hNM7Fcc69nM8F1eoH6f/ChbT9esLH3QlmQCem9vkYKyzl5VAC2GR+I3879AUfnVchKmIVRY+NkYtGJx68VqtoirI5jxjNfwxpXdkqzpvIunzyY57K/mTqzah2rEtQ1rLSjfZSaAcTOn523pMLZfFFI9li+ZLV+B9fRUqbumoGvFf9WkNiuBbSN92zFtuNjNr81nz+KzM2BLF1v4ItnBdaRcVHU3+F5AnAcZ1WAt3H656FmNTWacjAwUxE/HIKDdJvKCQGWwehDFoFRFxP9TqSOErNu8pDoTcMYL3sRc1sWOh2jmpQq3670iJESGuIoRk7s2u3ldA0YgcnYDbXoA7sV5PnxhOLLcO4/GHiWybtB5I1sr8lcQr+40qKsa4A2Zk+atJc5H9UNELQzbWGgL2SGSDrW9j3r3QWi4BId1r0DR20s2v4i2PK0BBGoQQH4e1Cs5u0SGEwYE294FWB8xa7NIJuXD0/VUB58WsiS3ftofl9FfFiVKrYkSdN4kPzus8RlriyPyhQ+LaPw/yBufWuJkoKx951Liz0vehpGk5ZyXsF/mbr9l5Yv+ywnrwcHnAnJJcO4azyjhKsxmpTJmEMpLDh1PP+teFnnYlZcg38ShfAKJYf76UOOtxyGLHkm7sYnZzf5KpOai6mSy+DXzA8AMnTUuxh25HH7+kBVfD3mwmf/Auf/+QPf/4/w//+PguPB0kuhguq0/PURLwhxrZr8QTCF5GSg4oeEiRfgRXRmTm7bn2MB/uwf9mzDG3fqTvM3/2DBe34KMQTx0dtlvPIP6O74JxR2Ec1yfI3Ra59eAnnmb2LisBx/q4UWyKneuxcPXFx2QTYryBhftfVWUm2vci5XqDJJTfAT9MFkMRCB8SIHLga7kpVVZAfvZJeVqKtW3iFELd4j6NcQt2+gg3enJNzA38dAO/fxxNHUpopFDAI6erqNrjsXdREeSVeqgdMy5mkM348Fl6BywK6b6ezMMMN72Z3S0VHD/hdyIcpq7RmG8fosRuB/gtQW5x2CAT+q8394wuVPMTMdkD3k0kuBn5+PRZLO0N9sSllLdLof5j2MO+Pufdj9ffeqH/Y5QZDMbPuOgPUw7UuKHcnHwze4bc1GAanwAQXlB6wR5s/oEylJuWpYbDsOxDOJqHZkHsjVxr2p8UjSl1XCwha1f+11qwWowKvKseptmwXt4INH220T2js3Ku3WXBrhc41jG069CIn7m9Cz/Roubqogy77lhDSDqevX0AqLzU33OZU6GotQ8uWRWzuJuA6TtiWjDLqJ+3UbmsH06VmavIAE0kKSwGSZKusV+kBTXDHQ1OjHPUdS9kQqwoygKzURwo8GVWXQBWGFjOpZOYPATa/mviL+4oOqDMX3wxxT4K3BmfIxz8b2gPvk/lMG3L7Cuke/JWxy+Ul0yuhBmjren/v1PHGgq+Y8LJt9yulxtrVeehknJIwzNB/hNQy8LKPwzb3X41nFYk2OxGJ7h4WAZaFs2BAGO8mHCbTFBmIKA0+PDe++piK3/gga5RLsH7VlxiYOyOqZ5/yhACyu1ULvevRFAp3/8BIoniRWPQ1iBepNTd9Mt5/ssE3jhEBeGoQAAA=",
  "Bajaj Allianz": "data:image/webp;base64,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",
  "HDFC ERGO": "data:image/webp;base64,UklGRlQEAABXRUJQVlA4WAoAAAAQAAAANAAALwAAQUxQSFQAAAABYNxGkqJaSHqD2D0KjjJhfk2/T4oIBWkbMLsWqgHA2Rqpnbf15wJp6ic791MiQKQ7bd0RX+V93u087/mrcq6nndez/D4lAwQRioigR4FXQpLTICNWUDgg2gMAABAXAJ0BKjUAMAA+YSiQRaQioZVcBnxABgS2AFqQ4H8A/ADrhrn+O/GDBvtBG2vVHtnfMB/AP5R/xv9L76voa9AD+7ecV7DHoAfrN6Z/7Y/Bv+5H7Aezz/96bb9C/IrJn/mNtJ8jn98/iGUa/Ov619tPOB8wHqI/l/+q45KPjzoO0D2ofRn/U9wX+Tf2XfK0LSl7zYiDTIHi4BhzEpJfj6ALZnKV9UtDcJIvRN7PUUXIGnaeMRYQNaPCbGBtbwoztAAA/vuEpGMzqNyglu3hnukVnPILSkuOLf2KSk26U9FY++zUJqSg43Wkbnqt2XfXB/AMQZmiayNutGM3244kZtf9PZV4Tk7t4h9/DLanAfUDys+Nb/9DMIR5uOCLGN4mIO9+bFhd7nurrgPP8bXjY1ooQ3bFpmp81Yy0Z+oNHEV3egPFp7MB9pIaOLRwWzQ2JZI+zlu9EqPKeIbkHnEp/+bl68M3KlK4wy8Lbkmw9s/M+9ogS/NY/xSTim3gVbsn4TVkMp/576oHjfi6NWepiyn/jVv9BMEgXh2m7/q6+v7PEJurlOTWfuRJsVccp15t/CQD+X3W4DWlBGsXyIXz8pcXRpCgEnjtRSlti8sKHp0Kpp1LrI/g+Ya8iC944R4bEnokkHjdPN5n1PEC75uh5kEhVzL9Ktfj8shumeJ5+cUVAttkUymsM0bKlFJiDLNzvq8v/XEV0rtK1E9/Of8x0xRnKKsQ/7XQ4EZ9TAN8XpFHGRPwp0PEMStH2bXqv8sQRkW+flFnh/+U62YfJmKAFlaIeevBv6lLXxJlZ1GOL+Ai46cd0XLMnxHlqIev3qjmJ9V+zHs0MDzXfV81BY39dGgpcGLvPCEy2gHr7Wo670eL4F+i8QDyQ8oc46HgHO/gsNWaqWP0WpMsDC9qqXx4f8eWa2k4eczc1LtnwFSLrsS5LXzv4sXfThe2aPjbdlh9yZdY69WvT2OZRhm4F7+Pra1liyNl+5eAfuQPRg+1VvKx0XhQsWZxO0lCxP7nzS1rxtTpCMcAHsLmt2Svr6xBG+c3flIym/8Ry7pn2Jke0JmZBl+pp53jry3sRyIsFIqJy+BO47ib/fVG3U25/tmbCSc+uzO0Vk/GIprMpBapuBMff+tY7c1HhHu2HfvkMwt8XMwIKIcjuaTQG+dxg32U/wezkq4B1RFmxw4CUmWIWlrJPIs5c/0w/+uLtZxCdgHtzA17GGQTvfHnWC648QzWoVxoBEFhezIB1VQ+3Kxs41p1hMylNhU3OaagGb1Hwxt5c/PSZGl1OvdupFtkR+LvW5YKmMspt2EgqsAA",
  "TATA AIG": "data:image/webp;base64,UklGRtoDAABXRUJQVlA4WAoAAAAQAAAAKQAALwAAQUxQSC4AAAABYBvJVhug/9q8pxEvKf8mUxAREyABC8AKcIebPsAP3PHBXX9vD9zxAQ5wtWAeVlA4IIYDAAAQFACdASoqADAAPmEskkakIiGhJzgKSIAMCWwAnTLoPxek8lpzO5mcvNk/pT7gNtF5ifPA9DO8H/wD/gewB5XH/O/1XwUf33/ofq7YROUKPlfuPgk7bjJGvlndB/wHGN/2zWDf5t/s/Sjzs/SP/U9wz9U/+LwGf7ACi3Xhv8vkFnlIVBCU9ff5oecsxlEkzpGELlmrNW7KrC5e7sP4szDi9D3oewoKH1xkAP7Qn7f/ALeS7/mNWbT42k8Hi5WtyEfTdV6ACVavfWL1Ne0nVcGJvlVko//tXCEjzF2Yf/6gMRqfchIYPYB5a6xHvWl8Gx//FJe16rc/p2fx+kv5dweX/uhb7OyWnOH/AgFnBnjcgL5eaST/0OZdsm9lsivf11uxL6HL3TTBxZC/+CB42LDc/eCCB4IRwHIQS38i49Q0grex5uEAxFfH+Qyidz+8fOf4/DTpiWSv3aO/lMqkhRtPeejNyyZgpPG8jaroSZTug46bQRtsWAEFMeny1P/1IL4FPv+tQEg4H7ojlEY+XVxGZ409BfXubH/gpsQdDwno7opeWNG5UtDSydNW65IjECHnuzTMNxL866Ttf3VQO9FFV90hblnNzQ/VpCngkVE3df2Y4tsvxlAtPfY9cYHr3cAjIhOQqWHh7ec1GbV/p6htT29IUqgTIzWjD4F/V+pBa1dK/aJpiJu4dvCRXG1cYVKdIyXhhya0u17PjZ8f/BqVNGNz6ZwOIcJy1tAI422EiEjvJaDXkYTSTP3M31KBtacWGBbUAvu1m/a/mwV6Fm5Mbm7aGw7ssCOrgUCmtaH17NDVQ3GAYa+BJOe7yqfvXG04OncGYMvFUvdVrZgP4OHXpGvt2heS1Mb1wHt8VLpJjEKyDOJ/eum+KKaDTt/xfBWWlwQPyY0m4WUyCNIrvH2fNW1mXj7pyvsn8e7RN687/OEVXiQeo0CZ9CzVt+/YVbc2W8+wO9NOwIoQ75jV9V3S8QJ23DJlijHzQy+HyYkJLfErh5tGWwDiGzOngWlCOGOhc7x5NxO2U27GRjL//4ZExAjAirE3/h9mnR/ngI38dL43XEK3wbUyIpwo8a+hFsB95QAJ2QBBhgJc9aSjnqPNKTIDr9/5lH7HHj8Wnva/gWh42e44EpigCmwNOdjBTLI2YdHSFGlVEE5f8RoL/6zMOKyfuKRppX/OaUaOOgEOP/ZEiwAAAA==",
  "Chola MS": "data:image/webp;base64,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",
  "New India": "data:image/webp;base64,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",
  "IFFCO Tokio": "data:image/webp;base64,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",
  "Future Generali": "data:image/webp;base64,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",
};

/* Product marks — Public/Prod.Icon. Keys are the PRODUCTS master. Four products
   have no mark on file (Trade Credit, E&O, Public Liability, Motor); they render
   the layers glyph instead — the near-matches in the folder are different covers. */
const PRODUCT_ICON = {
  "Fire & Burglary": "data:image/webp;base64,UklGRoIHAABXRUJQVlA4WAoAAAAQAAAAOAAAPwAAQUxQSDUDAAABb+WgjSRHelfvB/6U8zOIiLz4f3mW3/MhTIyd0PXqWTzW5Nw9Q+jcPDevhzIZTI6XAOO2bSSNY+2d9F9wZua1BUT0fwLG1CxbpiHzPGHYkgySgGMy5+Z4dmK6lz9We08UbNhRnJKwpKrGxJqCcrVti5vnft5vpJHCzMzM2EVWqSAdpIM0lh0zM7OZJNsz833PQmD7+xuIiAng/NNlN7z6zs58oPpCyW/1ykW1RVc2dl7f3siFuhVTH+xzCzu5C1yFQBCpbduecNCVdtQM2MgXEaO2DSlSau++EikE19xx+TUnvV2KMzoXKabX3nDrPViTy26+esAsv+PBF3b3BsgDCZ9HuuzGu5557Y03Y0RuZn9+y5rTZy4P2/lkr4fss4Tay29/8f47piwvWkOFlcd///DV/5en9dyM24eefBBsgwjWVhQMkuCvT8dNs4ZEuvzGW7AlLtSW8g1XpbJGKb4i2UGFRenKiLKCvjuliDpd6I+TtKB2voOoeUvFS0Y/7oYrctruvSTiM6o/HgzQnVLq8u2XjYGscFC3rr1eQOnzoLrEuAktdF1l0FzWCEBUb+EFVF9nIYyrU7KxCVVnBDhRH0MRpJJdXbQJcOESHLSQcHVO2QinqI4SAsqg6hyNsTyh/r4TkLgEmwTgoVQXZrGEqjMZcNIlkBIgneTqMAvDJNWXM1BG2dVJyUB2fSYLJKs6HAYnu74UArLqExmQIlVXHAY8lOpisIBCfZYBx6mrG076hW44xlWZ0zkG8myjun93s0Hkv4iqxLUhgKKv/1GpqMQ/J8s0/PF+xtWY4YPBXnA5/ejdsCtxiXc/sLUAqWkawlWUYNwGq6VoTjsgLqoQ3WmkkVaBy2xnAygLQmcxBivgj4+OhmLWct/99PXDdzQLYEurbIml/T8/fv5XXzijFZ7d8tCNN03bNJpOwCtKwOms5/RoY/PH3TY4Rw+MR+10cvlodM0tt93Hyuh++Xtj9yD1+ye5sTlnNRFNchq31z7xD1ryy+df7s882B4GiwsUSBpNrvhtFxsO3/5rf97LtqlSaeRjUSh9f9wVU7EEV1zNNWMbU3vSdddcF8nUL+cZTeL8AQBWUDggJgQAAFATAJ0BKjkAQAA+KQ6GQiGFQ5miBgChKAKwzUMeclSvf378N8jqZXMz7Zn2zb8jvQPdc5wDgOek6/cvCL/5z9AHAjWJtPjhZdWndmj+QGOlFKH2pfFqHYv7V1m7h54xUsHod5iX3ckqkDOyqlS2yvdUNjMEXebRPskCOwFatHFyCCyrQqz81KrP4j+9KU5sgUbIeVEdvPeiuutT3hx5sNDfiYAA/vrXQ/50zUU8XgEH9dNeDZ3Vhqb3+fqZx+o3sSNIDMkCJaafoow9qsXH50pUIY+MwU2cj8X6GVfjvAH0ZkuvsGhVMvlQx81z65wMod+LuB3DBYFW9U6xQ3QEkQ3JNc1NLRlfvi954JeqWEh8nOQAjPgs63SwxmFOP/GV+/6IBIpeVvSh+F0OKIWhqXZNvIvP3QT/vjTlvHFuJPdsgThnnI5sCwmoySwtLXzol7SWq5pitVLTxQtyDr1eWEQg9M7652ZF1y0DW/aF78RT9S9V5kUSWKoXMMDmX58Zqa0zm+X7F54ee4FFj/pjkCpncR3raDzKm0SlNRb3dp8eiyZXhppo52lmFWTdFQ2BgEYaj9Ja6b/i60MBTDTRpbg25VqrBeqQskrv6Ijximy58zYT23iDNN2z0VY/nZCWf6Hiq4yK+GeZcVB0RuUtAUUm5sMTGWI5nM5vOqR57++KhKTfFFcmYvb8cFqDY5hSNyqg8iVT9ZYuy9zfnjoV5ZPp51gD/yyfX5ai/lpsriKnf/nLs96u/Ld3xlLnj/TSKMKEicGbK6aeT2U475BxK9AqU2mlgaMLE6moi3BZAKqJvDKRD6CUI667nyiXP//u9bDJGroUQJwEzBvyrmLa9fEktI6uv/q4WTBPLTDJNw9kMbMllypRgRMXBUxN0wD0Cexk1JcfpYDwCZcNCgoZbS50D+vnA1t92FQs6L6gHeqWRrZrfxgusuoRUO1tyHGZmnbUv1InMGWkdN58LGgKZ3Fjzz50W7ZTvmdeNZwcDoWh5anDIrsqX4cYq0Ns5xXaTRFhphE813imEZ2raBtCOIlXQsYiMBz98y+H2RS09U6YOOYOHP43tgxBwyfgXQKsFq8Pck9KozkF4PErX2D5EiDIlwctT28KlmE2i6bBI+7E7/0l9cZe3+3huu8ayRMorX8sToGv/nxK2Vilvj1SBFHn7NHnk21J+3ZaP5U/YW8dLLR2VFcfkyIGy6H+R1BR0ybiYnEI/kHbmZAc6m+q9mNf3Qa5DAVO48uS1HJpRDCW0LrmQZuosy2rFFqY04fEzIZGc4bzP8Na4u1Vy1XLvRGVY/HQYKOUVonw+TOG+lspTPXkLlw3YGwsC9XddvamYX+ZLUCNmuY7C+z/i0C/XfZ/Zsfi/apu66pBZSxhWwVz8KS0GcQeZYBf/0A9OFA+xcIXlsAAAA==",
  "Marine Cargo": "data:image/webp;base64,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",
  "Professional Indemnity (PI)": "data:image/webp;base64,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",
  "Commercial General Liability (CGL)": "data:image/webp;base64,UklGRj4IAABXRUJQVlA4WAoAAAAQAAAAOQAAPwAAQUxQSCYCAAABoLT/nyEx+tW/eia2nZzsvAHb9tG85ck5b8A2T7ad7PYsb7Zt73bV/3eY7klXz/IWEROAgBaz+oqgHkUafrQF5TowJeAkfxuBkpiCSGSttSIAWp9iwu/GAxBrrYiNTBBBdvc179JR6XcOiZBtAgj6b7169crVa9df+pl0JJXUV29du3b12rXzG1vA5CaY+guznWe1Otb4SncjORnT/hv+4VK9Mlu9S/+dF2FzirCICUOq/6UTJCfZoGFI7W/yMWUcYSDHOSg/nbXGYNhPqoH05QYwYm1NBkB52qdUBva8NQgAJMsYzDn96E1SGdzTvfzg2ARIhmAPSaqygJ7VmyEpERbwz8R5FlO9SxynwFZZXPcJC534i2kGMV2xHGOY/zwq/5riOqrUUVxHlf8p4r+lyj+suI4qf2/PFi/OirVoWkmLcIp/FusP7kNUJRjumCSJFsMnScJfe0OqIJj7OUn6IjiSfHcsBOmC9ks3Hf6ePpzn+zs2zmsGQbYFgF7P0ofyPNICAAS1migqoeNXqmEcHwNRZA2euoQdTELNQgm5RmadhlFqfyM5YRFdGP21C3Iy6PyTJppem6b/ztsQ5GyxjNku0TTnmP3NQJMbBHPib3+pdiQ9SfUkf0n9/HQ/CPIXoH3Xrt26du0z4+jvdFTy0YpBXbt17dK1W0tAENIaZA98QqfJatQogsBGUm2EBrfo58JGkm5QXIvmXx1A2aAeIywcKIKAVlA4IPIFAAAQGgCdASo6AEAAPikQhkIhoQx8ctoMAUJaAC/az3D551x+PBsUV23y76HvRNts/MB+0H7Ae8x6E95A/Yr2IP1u9Nr9t/gf/cb9yfaduZvgr5NgGxtBzst7TE41f+V9gHyVf7Xlo+lf/D7hH8t/qH/H9cD2ReiF+thQSgkr3MAMkwiF8kJfRlbZ3isbjnqddn8/MUYvjp+e+0AGm16HUQzHrPGv3ieFN7hp5FOKdh8Crpd0jApT0tF/ylbq4B5bNFuacqt7Toy05+M476E+vB11yk/qAPopF/sAAP7//oO0/+GdTGaUaXVSdgoCsMLia0Vt/9d4nsokRH/8HTV/Br/g1/JB3vQRPyGgFpeQf2zL/w+gf59Y0+R+rEVoOy4bIDrPyOfZ0D/CMmaJUi1k48V8kmIBlAH6cn/JWj7/PlaQ4EPw9Cnm2yYDyF113lgNN77JIU2cYblZXac6mZRrbRoHk+CfPN+3/AofZ8opOPjAXbqk3/jkefETU7z5If88I09TPzvSAsMYNZqZnXVWOaMFpP3+v7XNY9KZj86cZh8bYyvPOhpPNSkgCDkf/B/55+WKNMHxEnseZw5nhWTAHqzJ/b0+JKQoLb1Pid1mTk4oE73tkIzcXcFOWftGNi0+27RSMlci6dZ67vPr5k0H0HUb163UfkF+McHbyO/Nqexntkg8WJJhGRIzMXYe74FXhRUcSc4Z80VZn9CPD8Ztpv6ItdyLv9jQgcEhbhjz1Si2xx8vI75gRIbv8J9LkpsKMdcSc6FU/Z3EdTgnnp7CVroJYxmLRRHYSZAk9t7V//yk0XOFBCL+KLOC7yFZ/+Yiyjx8jL2kN40/dvxGf2k+6/j5pk0qvgE7U9hDHuREBf53T02idfzN1IqJ3I/NLHoR6KRCXJGM8VWFc0B0MLfwNMndpCkNr4mzUziV3HnxSzL8DBmy0Few6AxyskNwzg0pKtlkMI6kZsFVqa12dr2s3G03H47RvKf6p8mJSsG2X1s+fJgpJLCKB3o7ncMx2jwiqTe+0O09/Gi5OPT2aS+sknvKJnR/b+1luJPsbPUX3Xmbp4t7zP7XIvjdF7Ryar8Woy8rucYJaxkiYhXbPIlQxqRtnbKSGTHW61Ns5DDM2QdZ/4JvjduK64je4b5eSUFFDYPOhMCxCfCsdBCTm2N+hdZGrOG4VRIczKw4inNr6n50rl7F/DPiJXY3UlS0Y4JpZFKdakqPd1FrpQp+sSCIC+ev7bXVJ6yjKAyqsoMmEhjojBDSX8eLbtNqmMmwipzv5ZGrfo639fJZajzsevpbhFqtM0kknJm4Yujtaw3+d6ICB4MvtX9GZr/n3oQ+e96kyiONBSWAn9lUwEuHTpvAqFRGwImv3mDJRtuX3uWH0APICGSl0fGqMMSuQw/JJO6J3R4J2ViPrS3RhrcCer3XOXbQ9/TeHqLU2J6Xf4/2axRez47hPn79VxZ/DR7w2ExIaCokY5NQrvP8Dbl7Ebg72KbvGUYOvGaDc1h77Z0NtaHfXW4rWFomt1SXvfp2lO/ci8K87ibM+gnLoQZ0N9ErH456PHPv/XS3+ya1zLhJfCnj2IeJgku2Pur5T+7ssPTLPapsCA0WsQzIxRn9GwhfD4e4M76qVOQsxKZWhpKYgMImTK8j9qIoUZEaDhT2GMBBFON+x9FDtCcUNZMBmBLZg2wh7DGMtVB3Od/GjCdfev20EKFnbJ5sHyAcfIGdUCuAxaxvXiuPvFK7T/AL2U/yU/MOKCjlR4dX5zFW5wdSARy5wtdQNNdYY6SWCRkGjsURr27NNJWBD3H+tnDJn0SVlQhlBMuHjDEgQw2iK91JfoXL6+Sjl4gblbhIBKTZUnkoH577WRbI2FisvVaFFdygR2m2u+QZzFRSz3ma4NXA0hv6+i7e+/Ss2NLXSqEhEpMgerp10x1lRM1ruif+kshznLcNwGDNhpVm5/BU7BvXXcm7Dh0a87b27399ZkiSjkoo8rPHrQVRYKaqP/dAgDxm1aFM2SDjvLLyyNFa8I1zexIgAAAA",
  "Workmen Compensation (WC)": "data:image/webp;base64,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",
  "Directors & Officers (D&O)": "data:image/webp;base64,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",
  "Cyber": "data:image/webp;base64,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",
  "Crime": "data:image/webp;base64,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",
  "Engineering (CAR / EAR / CPM)": "data:image/webp;base64,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",
  "Office / Package Policy": "data:image/webp;base64,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",
};

const SEED = [
  { id: "END-1041", client: "Acme Logistics Pvt Ltd", short: "acmelogistics", policy: "FIRE/2026/00812", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Fire & Burglary", type: "Address Change / Correction / Update", kind: "Non-Financial", priority: "High", stage: "Under Verification", owner: "Nanditha P", inStage: 1.5, lastAction: 1.5, touched: false, legs: [{ s: "New / Unassigned", h: 0.2 }], missing: [] },
  { id: "END-1043", client: "Vertex Pharma Ltd", short: "vertexpharma", policy: "FIRE/2026/00947", insurer: "Bajaj Allianz", insurerMail: "corp.endo@bajajallianz.co.in", product: "Fire & Burglary", type: "Name / Entity Change", kind: "Non-Financial", priority: "Critical", stage: "Under Verification", owner: "Nanditha P", inStage: 30, lastAction: 30, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }], missing: [] },
  { id: "END-1048", client: "Sunrise Chemicals Ltd", short: "sunrisechem", policy: "MAR/2026/00655", insurer: "IFFCO Tokio", insurerMail: "endo.desk@iffcotokio.co.in", product: "Marine Cargo", type: "Business Description Correction", kind: "Non-Financial", priority: "High", stage: "Submitted to Insurer", owner: "Rahul K", inStage: 384, lastAction: 384, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }, { s: "Under Verification", h: 6 }], missing: [] },
  { id: "END-1050", client: "Pinnacle Retail Ltd", short: "pinnacleretail", policy: "PI/2026/00092", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Professional Indemnity (PI)", type: "Contact Details Update (Email / Mobile)", kind: "Non-Financial", priority: "Medium", stage: "Closed", owner: "Nanditha P", inStage: 0, lastAction: 20, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }, { s: "Under Verification", h: 6 }, { s: "Submitted to Insurer", h: 24 }, { s: "Awaiting Endorsement Copy", h: 20 }, { s: "Copy Received", h: 0.6 }], missing: [] },
  { id: "END-1062", client: "Vanguard Textiles Pvt Ltd", short: "vanguardtex", policy: "FIRE/2026/00922", insurer: "Chola MS", insurerMail: "servicing@cholams.murugappa.com", product: "Fire & Burglary", type: "Sum Insured / Limit Enhancement", kind: "Financial", priority: "Critical", stage: "Awaiting Payment Link", owner: "Nanditha P", inStage: 22, lastAction: 22, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.6 }, { s: "Under Verification", h: 1.8 }, { s: "Submitted to Insurer", h: 18 }, { s: "Awaiting Quote", h: 20 }], missing: [],
    quote: { base: 18800, gst: 3384, total: 22184, file: "quote_FIRE_2026_00922.pdf", version: 1, at: 1.4, source: "bot", confidence: 0.94 },
    payMode: "Portal", childTicket: "PAY-1062", payLink: null },
  { id: "END-1063", client: "Redwood Logistics Ltd", short: "redwoodlog", policy: "WC/2026/00744", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Workmen Compensation (WC)", type: "Employee / Headcount Addition", kind: "Financial", priority: "Medium", stage: "Awaiting Payment", owner: "Rahul K", inStage: 20, lastAction: 20, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.9 }, { s: "Under Verification", h: 1.6 }, { s: "Submitted to Insurer", h: 19 }, { s: "Awaiting Quote", h: 16 }, { s: "Awaiting Payment Link", h: 0.8 }], missing: [],
    quote: { base: 26400, gst: 4752, total: 31152, file: "quote_GMC_2026_00744.pdf", version: 2, at: 14.8, source: "bot", confidence: 0.91 },
    payMode: "Email", childTicket: null, payLink: { ref: "PL-1063-1", at: 14, expiresIn: 48, source: "bot-email", by: "Mail bot", confidence: 0.95, regens: [] } },
  { id: "END-1065", client: "Nimbus Engineering", short: "nimbuseng", policy: "OFF/2026/00390", insurer: "Bajaj Allianz", insurerMail: "corp.endo@bajajallianz.co.in", product: "Office / Package Policy", type: "Asset Addition", kind: "Financial", priority: "Medium", stage: "Awaiting Endorsement Copy", owner: "Rahul K", inStage: 40, lastAction: 40, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.8 }, { s: "Under Verification", h: 1.4 }, { s: "Submitted to Insurer", h: 17 }, { s: "Awaiting Quote", h: 15 }, { s: "Awaiting Payment Link", h: 0.7 }, { s: "Awaiting Payment", h: 11 }], missing: [],
    quote: { base: 15200, gst: 2736, total: 17936, file: "quote_GMC_2026_00390.pdf", version: 1, at: 18, source: "bot", confidence: 0.96 },
    payMode: "Email", payLink: { ref: "PL-1065-1", at: 17, expiresIn: 48, source: "bot-email", by: "Mail bot", confidence: 0.97, regens: [] },
    payment: { mode: "NEFT", utr: "UTR106588421903", date: "Fri 21 Aug, 3:40 PM", file: "payment_proof_nimbuseng.pdf", at: 6 } },
  { id: "END-1066", client: "Everest Packaging Ltd", short: "everestpack", policy: "FIRE/2026/01034", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Fire & Burglary", type: "Sum Insured / Limit Enhancement", kind: "Financial", priority: "High", stage: "Under Verification", owner: "Nanditha P", inStage: 2.4, lastAction: 2.4, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 1.2 }], missing: [] },
];

const SEED_MAILS = [
  { id: "MB-2291", from: "accounts@vertexpharma.in", subject: "Re: Fwd: kindly update the address in our policy", received: 2, reason: "No policy number in mail or thread", guess: "Vertex Pharma Ltd - 3 active policies",
    body: "Hi team,\n\nPlease update the registered address on our policy to our new office at 4th Floor, Prestige Tech Park, Bengaluru 560103. Do let me know if anything else is needed from our side.\n\nRegards,\nAccounts, Vertex Pharma" },
  { id: "MB-2284", from: "ravi.menon@gmail.com", subject: "Nominee update for my company policy", received: 19, reason: "Sender domain not linked to a client", guess: "No confident match",
    body: "Hello,\n\nI would like to update the nominee on my company's policy. Please let me know the process and the documents you need from me.\n\nThanks,\nRavi Menon" },
];

/* Clock — stage only ---------------------------------------------- */
/* Units spelled out per house style: "Mins."/"Hrs." (abbreviations take a
   period), "Days" (full word, none), with correct singular/plural. */
const tUnit = (v, s, p) => `${v} ${v === 1 ? s : p}`;
const fmtAgo = (h) => h < 1 ? `${tUnit(Math.round(h * 60), "Min.", "Mins.")} ago`
  : h < 24 ? `${tUnit(Math.round(h), "Hr.", "Hrs.")} ago`
  : `${tUnit(Math.round(h / 24), "Day", "Days")} ago`;
/* The trail spells it out — it is a record, and a record reads in words. */
const fmtAgoLong = (h) => {
  const u = (v, w) => `${v} ${w}${v === 1 ? "" : "s"} Ago`;
  if (h < 1) return u(Math.max(0, Math.round(h * 60)), "Min");
  if (h < 24) return u(Math.round(h), "Hr");
  return u(Math.round(h / 24), "Day");
};
const fmtDur = (h) => {
  const a = Math.abs(h);
  if (a < 1) return tUnit(Math.max(1, Math.round(a * 60)), "Min.", "Mins.");
  if (a < 24) { const hh = Math.floor(a), mm = Math.round((a - hh) * 60);
    return mm ? `${tUnit(hh, "Hr.", "Hrs.")} ${tUnit(mm, "Min.", "Mins.")}` : tUnit(hh, "Hr.", "Hrs."); }
  const dd = Math.floor(a / 24), hh = Math.round(a % 24);
  return hh ? `${tUnit(dd, "Day", "Days")} ${tUnit(hh, "Hr.", "Hrs.")}` : tUnit(dd, "Day", "Days");
};
const isOpen = (t) => t.stage !== "Closed" && !t.terminal;
const isRouting = (t) => stageOf(t.stage).system === true;   // not yet on anyone's desk
const ageOf = (t) => t.legs.reduce((a, l) => a + l.h, 0) + (isOpen(t) ? t.inStage : 0);
/* Ticket age in whole days — creation→now while open, frozen at creation→closure
   once closed (ageOf stops accruing once isOpen is false). Drives the Ticket Age
   column, the Overview line, and the Oldest/Newest-first sorts. */
const ageDays = (t) => Math.max(0, Math.round(ageOf(t) / 24));
const fmtAge = (t) => { const d = ageDays(t); return d === 0 ? "Today" : `${d} ${d === 1 ? "Day" : "Days"}`; };

function clock(t) {
  const st = stageOf(t.stage);
  if (!st || st.sla === null) return { state: "closed" };
  const entered = new Date(NOW.getTime() - t.inStage * 3600000);   // inStage = calendar hours
  const due = dueFrom(entered, st.sla, st.unit);
  const span = due - entered, gone = NOW - entered;
  const leftMs = due - NOW;
  const used = Math.min(100, Math.max(0, (gone / span) * 100));
  /* how much is left, expressed in the unit the SLA is written in */
  const label = st.unit === "BH"
    ? fmtBiz(leftMs >= 0 ? bizBetween(NOW, due) : bizBetween(due, NOW))
    : fmtDur(Math.abs(leftMs) / 3600000);
  const cancelAt = st.cancelAtCD ? new Date(entered.getTime() + st.cancelAtCD * 24 * 3600000) : null;
  const base = { entered, due, used, sla: st.sla, unit: st.unit, label, cancelAt,
    external: st.owner === "insurer" || st.owner === "customer" || st.owner === "operations",
    left: leftMs / 3600000 };
  if (t.manualReview) return { ...base, state: "held", heldSince: t.manualReview.at, heldCount: 1 };
  return { ...base, state: leftMs < 0 ? "breached" : used >= 75 ? "atRisk" : "ok" };
}

const breached = (t) => isOpen(t) && clock(t).state === "breached";
const atRisk = (t) => isOpen(t) && clock(t).state === "atRisk";
const isFresh = (t) => isOpen(t) && !isRouting(t) && !t.touched;
const isSilent = (t) => isOpen(t) && t.lastAction >= 360;
/* PRD §5.1 — the displayed status is the stage, overlaid with sub-states.
   Pending Customer Response and Manual Review both return the ticket to the
   status it held before, so they are derived rather than stored as stages. */
function statusOf(t) {
  if (t.terminal) return { label: TERMINAL[t.terminal].label, tone: C.ink2, bg: C.lineSoft, terminal: true };
  if (t.manualReview) return { label: "Manual review", tone: C.wait, bg: C.waitSoft, sub: true };
  if ((t.queries || []).some((q) => q.status === "open")) return { label: ALL_STAGES["Awaiting Customer Information"].label, tone: C.wait, bg: C.waitSoft, sub: true };
  const st = stageOf(t.stage);
  /* `terminal` carries a sentence on every stage but Closed, so it is only a flag
     when it is literally true. Reading it as truthy made every stage read Closed. */
  const done = st.terminal === true;
  return { label: st.label, tone: done ? C.teal : C.ink2, bg: done ? C.tealSoft : C.lineSoft, ind: st.ind };
}

/* Who is on this ticket so far. Grows as it moves: the owner from the start,
   the insurer once it has been submitted, the client once they have been asked
   something. Derived, never stored — FUNCTIONAL-SPEC §4. */
function participantsOf(t) {
  const who = [{ kind: "owner", name: t.owner }];
  if (atOrPast(t, "Submitted to Insurer")) who.push({ kind: "insurer", name: t.insurer });
  if ((t.queries || []).length) who.push({ kind: "client", name: t.client });
  return who;
}

const openQueries = (t) => (t.queries || []).filter((q) => q.status === "open");
const onHold = (t) => isOpen(t) && openQueries(t).length > 0;
const blocked = (t) => isOpen(t) && (t.missing.length + (t.missingFields || []).length) > 0;

/* Silence outranks a blown stage clock: 15 days of nothing is the worse
   failure, and it is the one no dashboard usually surfaces. */
function bucketOf(t) {
  if (isSilent(t)) return 0;
  if (breached(t)) return 1;
  if (atRisk(t)) return 2;
  if (isFresh(t)) return 3;
  return 4;
}
function riskSort(a, b) {
  const d = bucketOf(a) - bucketOf(b);
  if (d) return d;
  const p = PRIORITY[a.priority].rank - PRIORITY[b.priority].rank;
  if (p) return p;
  return (clock(a).left ?? 0) - (clock(b).left ?? 0);
}

/* Derived documents + mail trail ---------------------------------- */

/* What the client actually supplied against each mandatory field.
   Values live on the ticket; the field list comes from the type master. */
/* Sample captured values, keyed by field name so every type is covered. */
const FIELD_VALUES = {
  "Bank name": "HDFC Bank Ltd, MG Road branch, Bengaluru",
  "Complete address with PIN code": "Plot 42, Bommasandra Phase II, Bengaluru 560099",
  "Location details": "Unit 3, Bommasandra Industrial Area",
  "PIN code": "560099",
  "Amount of sum insured to be enhanced": "₹1,50,00,000",
  "Asset category / type": "Plant and machinery - CNC machining centre",
  "Value of asset": "₹1,15,00,000",
  "Email ID": "insurance@client.com",
  "Contact number": "+91 80 4471 2100",
  "Name": "Sterling Industries Limited",
  "Policy Number": "as per the policy schedule",
  "Reason for cancellation": "Asset disposed; cover no longer required",
  "Exact business description to be added in the policy": "Manufacture and export of precision engineering components",
  "Provide exact wording of the correction/changes to be added": "Insured name to read 'Pvt Ltd' in place of 'Private Limited'",
  "Number of months": "3",
  "Count of employees": "5",
  "Monthly average salary": "₹42,000",
  "Skilled and unskilled split": "3 skilled, 2 unskilled",
  "Name, Age and monthly wages": "As per the attached annexure",
  "Age and monthly wages": "As per the attached annexure",
  "Certificate holder name": "Larsen & Toubro Limited",
  "Certificate holder address": "Manapakkam, Chennai 600089",
  "Exact wording of the coverage / clause to be added": "Waiver of subrogation in favour of the principal employer",
  "Ownership %": "74%",
  "Nature of work": "Software development services",
  "Buyer details with address": "Meridian Traders, Ludhiana 141003",
  "Buyer limits": "₹50,00,000",
  "Draft number": "DRF/2026/00812",
  "Mail confirmation from insurer to client": "Received 12 Aug 2026",
  "Describe the change required": "Please refer to the attached request letter",
};

const kindOfType = (type) => TYPES[type]?.kind || "Non-Financial";

function intakeOf(t) {
  const fields = TYPES[t.type]?.fields || [];
  const gaps = t.missingFields || [];
  return fields.map((f) => ({ label: f, value: gaps.includes(f) ? null : (FIELD_VALUES[f] || "Provided by client") }));
}
const fieldGaps = (t) => (t.missingFields || []).length;
const gapCount = (t) => t.missing.length + fieldGaps(t);

/* The endorsement copy is the deliverable, so it is tracked in its own right —
   how it arrived, and every time it went out to the client. */
/* Reminder and escalation history, derived from elapsed working hours against
   the schedule — no scheduler needed to demonstrate the behaviour. */
function remindersOf(t) {
  const st = stageOf(t.stage);
  if (!st.followUp || !isOpen(t)) return { fired: [], next: null, cfg: null };
  const c = clock(t);
  const { every, unit, max } = st.followUp;
  /* Follow-ups begin on breach and repeat at the configured cadence */
  const overMs = NOW - c.due;
  const stepMs = unit === "BH" ? every * 3600000 : unit === "WD" ? every * 24 * 3600000 : every * 3600000;
  const n = overMs > 0 ? Math.min(max, Math.floor(overMs / stepMs) + 1) : 0;
  const fired = Array.from({ length: n }, (_, i) => ({ n: i + 1, at: (overMs - i * stepMs) / 3600000 }));
  const next = overMs > 0
    ? (n < max ? (n * stepMs - overMs) / 3600000 : null)
    : (c.due - NOW) / 3600000;
  return { fired, next, max, cfg: st.followUp, paused: c.state === "held",
    escalated: n >= max, ladder: st.escalate, to: st.escalate?.[0], terminal: st.terminal, cancelAt: c.cancelAt };
}

function endoOf(t) {
  if (t.endo !== undefined) return t.endo;
  if (!atOrPast(t, "Copy Received")) return null;
  const wi = t.legs.findIndex((l) => l.s === "Submitted to Insurer");
  const at = wi >= 0 ? t.legs.slice(wi + 1).reduce((a, l) => a + l.h, 0) + t.inStage : 2;
  return { file: `endorsement_${t.policy.replace(/\//g, "_")}.pdf`, size: "312 KB", source: "bot", at, by: t.insurer };
}
function sendsOf(t) {
  if (t.sends?.length) return t.sends;
  if (!isOpen(t) && endoOf(t)) return [{ mode: "manual", at: t.lastAction, by: t.owner }];
  return [];
}

/* "Summarise email" — the bot reads the whole trail and returns a précis.
   Built deterministically from the thread so the prototype needs no model call. */
function summariseThread(t) {
  const m = mailOf(t);
  const out = m.filter((x) => x.dir === "out"), inn = m.filter((x) => x.dir === "in");
  const qs = t.queries || [];
  const e = endoOf(t);
  const lines = [];
  lines.push(`${m.length} messages over ${fmtDur(ageOf(t))} - ${out.length} sent, ${inn.length} received.`);
  lines.push(`Request: ${t.type.toLowerCase()} on ${t.policy} for ${t.client}, raised by the client and routed to ${t.owner}.`);
  if (qs.length) {
    const openN = qs.filter((q) => q.status === "open").length;
    lines.push(`${qs.length} clarification cycle${qs.length > 1 ? "s" : ""} with the client${openN ? `, ${openN} still open` : ", all answered in the portal"}${qs[0].target ? ` - most recently on ${qs[0].target.toLowerCase()}` : ""}.`);
  }
  if (atOrPast(t, "Submitted to Insurer")) {
    lines.push(`Sent to ${t.insurer} at ${t.insurerMail}; acknowledged with a reference number.`);
    if (t.query) lines.push(`${t.insurer} raised a clarification on the entity name against the policy schedule.`);
  }
  if (e) lines.push(`Endorsement copy ${e.source === "bot" ? "fetched from the insurer's mail by the bot" : "uploaded manually"} - ${e.file}.`);
  if (sendsOf(t).length) lines.push("Copy delivered to the client.");
  else if (e) lines.push("Copy not yet sent to the client.");
  const st = statusOf(t);
  lines.push(`Current status: ${st.label.toLowerCase()}.`);
  return lines;
}

function docsOf(t) {
  const req = TYPES[t.type]?.docs || [];
  const start = ageOf(t);
  const out = req.map((name, i) => {
    const miss = t.missing.includes(name);
    return {
      name, kind: "Client submission",
      file: `${name.toLowerCase().replace(/[^a-z]+/g, "_")}_${t.short}.pdf`,
      status: miss ? "Awaiting" : atOrPast(t, "Under Verification") ? "Verified" : "Received",
      by: "RM · Anil S", at: miss ? null : start - 0.5 - i * 0.2, size: `${(120 + i * 47) % 900 + 100} KB`,
    };
  });
  for (const q of (t.queries || [])) {
    for (const f of (q.reply?.files || [])) {
      const i = out.findIndex((d) => d.name === f.name);
      const row = { name: f.name, kind: "Client portal", file: f.file, status: "Received", by: "Client portal", at: q.reply.at, size: f.size };
      if (i >= 0) out[i] = row; else out.push(row);
    }
  }
  const e = endoOf(t);
  if (e) out.push({ name: "Endorsement copy", kind: e.source === "bot" ? "Fetched by bot" : "Uploaded manually",
    file: e.file, status: "Verified", by: e.by, at: e.at, size: e.size });
  return out;
}

function mailOf(t) {
  const start = ageOf(t);
  let acc = 0; const at = {};
  for (const l of t.legs) { at[l.s] = { in: start - acc, out: start - acc - l.h }; acc += l.h; }
  if (isOpen(t)) at[t.stage] = { in: start - acc, out: 0 };
  const m = [];
  m.push({ dir: "in", who: `ops@${t.short}.com`, name: t.client, subject: `${t.type} - ${t.policy}`, at: start,
    body: `Hi team,\n\nPlease process a ${t.type.toLowerCase()} on the above policy. Details and supporting documents are attached.\n\nRegards,\nOperations`, att: (TYPES[t.type]?.docs || []).length, link: "auto" });
  if (at["Submitted to Insurer"]) {
    m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail, subject: `Endorsement request - ${t.policy} - ${t.type}`, at: at["Submitted to Insurer"].in,
      body: `Dear Team,\n\nRequest you to process the following endorsement:\n\nPolicy: ${t.policy}\nInsured: ${t.client}\nType: ${t.type}\n\nSupporting documents attached. Kindly share the endorsement copy at the earliest.\n\nRegards,\nServicing Desk`, att: (TYPES[t.type]?.docs || []).length, link: "auto" });
    m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `RE: Endorsement request - ${t.policy}`, at: at["Submitted to Insurer"].in - 2,
      body: `Dear Partner,\n\nYour request has been registered under reference ${t.insurer.slice(0, 3).toUpperCase()}/ENDO/${t.id.slice(4)}. Expected turnaround 3 working days.\n\nRegards,\nEndorsement Desk`, att: 0, link: "auto" });
    if (t.query) {
      m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `RE: Endorsement request - ${t.policy} - clarification needed`, at: at["Submitted to Insurer"].in - 30,
        body: `Dear Partner,\n\nThe name on the incorporation certificate does not match the policy schedule. Kindly confirm which entity name should appear on the endorsement.\n\nRegards,\nEndorsement Desk`, att: 0, link: "manual" });
    }
    if (t.inStage > 200 && t.stage === "Submitted to Insurer") {
      m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail, subject: `Reminder 2 - Endorsement request - ${t.policy}`, at: at["Submitted to Insurer"].in - 200,
        body: `Dear Team,\n\nGentle reminder on the endorsement request below, pending since our mail of ${Math.round(at["Submitted to Insurer"].in / 24)} days ago. Kindly share status.\n\nRegards,\nServicing Desk`, att: 0, link: "auto" });
    }
  }
  if (atOrPast(t, "Copy Received") && at["Submitted to Insurer"]) {
    m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Endorsement copy - ${t.policy}`, at: at["Submitted to Insurer"].out,
      body: `Dear Partner,\n\nPlease find attached the endorsement copy for the above policy. No premium impact on this endorsement.\n\nRegards,\nEndorsement Desk`, att: 1, link: "auto" });
  }
  if (!isOpen(t)) {
    m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: `ops@${t.short}.com`, subject: `Endorsement copy - ${t.policy}`, at: t.lastAction,
      body: `Dear Sir/Madam,\n\nYour requested ${t.type.toLowerCase()} has been processed. Endorsement copy attached for your records.\n\nRegards,\nServicing Desk`, att: 1, link: "auto" });
  }
  return [...m, ...(t.extraMail || [])].sort((a, b) => b.at - a.at);
}


/* ---- Financial flow state (PRD M5, M6, M7) ------------------------ *
   Side effects applied when a ticket enters each financial status. */
const money = (n) => `₹${n.toLocaleString("en-IN")}`;
const NEFT = (t) => ({
  bank: "HDFC Bank", branch: `${t.insurer} collections, Mumbai`,
  account: `00${t.id.slice(4)}0${t.policy.length}4471902`, ifsc: "HDFC0000123",
});

const FIN_ON_ENTER = {
  /* M5 FR-056/057/058 — bot reads the quote and extracts the premium */
  "Awaiting Payment Link": (t) => {
    const base = 8000 + (t.id.charCodeAt(6) % 9) * 2350;
    const gst = Math.round(base * 0.18);
    const quote = { base, gst, total: base + gst, file: `quote_${t.policy.replace(/\//g, "_")}.pdf`,
      version: 1, at: 0, source: "bot", confidence: 0.94 };
    const mode = INSURERS[t.insurer]?.payMode || "Email";
    return { quote, payLink: null, payMode: mode,
      childTicket: mode === "Portal" ? `PAY-${t.id.slice(4)}` : null,
      __log: TRAIL.quoteIn(t, quote, mode).map((l) => ({ ...l, at: 0 })) };
  },
  /* Awaiting Payment is entered by the link arriving — see receiveLink */
  /* M6 FR-083 / M7 — leaving Awaiting Payment banks the proof and clears the copy
     slot for the insurer. Non-financial tickets reach here from the insurer's
     acceptance instead, so they only get the reset. */
  "Awaiting Endorsement Copy": (t) => (t.kind !== "Financial" ? { endo: null } : {
    endo: null,
    payment: { mode: t.payMode === "Portal" ? "Payment link" : "NEFT", utr: `UTR${t.id.slice(4)}8842190`,
      date: fmtWhen(NOW), file: `payment_proof_${t.short}.pdf`, at: 0 },
    __log: TRAIL.paidIn(t).map((l) => ({ ...l, at: 0 })),
  }),
};


/* ── The audit trail — Figma 802:65143 ------------------------------ *
 *  The trail is the ticket's story, so each sentence has exactly one
 *  home. A seeded ticket replays what a driven one writes — same words,
 *  same actor — and only the timestamps differ between them.
 * ------------------------------------------------------------------ */

/* "Under verification after 36m". The destination is named only when the ticket
   lands somewhere terminal, because that is the whole point of that sentence. */
const legLine = (from, h, to) =>
  `${stageOf(from).label} after ${fmtDur(h)}${to && stageOf(to).terminal === true ? `: ${stageOf(to).label}` : ""}`;

const trailLine = (text, by, note = null) => ({ text, by, note });

const TRAIL = {
  raised: (t) => trailLine("Ticket raised from client mail", "Auto-linked by policy number", `${t.type} · ${t.policy}`),
  leg: (from, h, to, by) => trailLine(legLine(from, h, to), by),

  /* M5 FR-056/057/058 — the bot reads the quote and the link is requested */
  quoteIn: (t, quote, mode) => [
    trailLine(`Quote received - premium ${money(quote.total)} extracted by bot`, "Mail bot",
      `Confidence ${Math.round(quote.confidence * 100)}% · ${quote.file}`),
    trailLine(mode === "Portal"
      ? `Payment link child ticket PAY-${t.id.slice(4)} raised for Operations`
      : `Payment link requested from ${t.insurer} by email`, "Workflow engine", `${mode} flow (BR-030)`),
    trailLine("Premium withheld from the customer until the link is ready", "System", "BR-026 / FR-061"),
  ],
  /* M6 — the link lands from whichever source the insurer is configured for */
  linkIn: (t, confidence) => [
    t.payMode === "Portal"
      ? trailLine(`Payment link uploaded by Operations on ${t.childTicket}`, "Operations", "Portal flow · child ticket closed")
      : trailLine("Payment link extracted from insurer mail by bot and auto-filled", "Mail bot",
          `Confidence ${Math.round((confidence || 0.95) * 100)}% · Email flow`),
    trailLine("Premium and link now visible to the customer", "Notification engine", "Email + WhatsApp + BimaKendra (FR-071)"),
  ],
  /* M6 FR-083 / FR-085 / FR-086 — proof in, proof out, insurer confirms */
  paidIn: (t) => [
    trailLine("Payment proof uploaded by customer in BimaKendra", t.client, null),
    trailLine("Payment proof emailed to insurer for verification", "Workflow engine", "FR-085 / FR-086"),
    trailLine("Insurer confirmed payment - awaiting endorsement copy", "Mail bot", null),
  ],
  /* M7 FR-091/093 */
  copyIn: (t, manual, file) => [
    trailLine(manual ? "Endorsement copy uploaded manually" : "Endorsement copy fetched from insurer",
      manual ? t.owner : "Mail bot", file || null),
    trailLine("Awaiting QC before the copy goes to the client", "System", null),
  ],
  qc: (t) => trailLine("Endorsement copy passed QC", t.owner, "Checked against the request"),
  sent: (t, resend, file) => trailLine(resend ? "Endorsement copy resent to client" : "Endorsement copy sent to client", t.owner, file || null),
};

/* What the desk logs when a ticket lands in a stage. Called by the seed replay
   and, through TRAIL, written by the mutators that actually move it there. */
function onEnterTrail(t, stage) {
  const out = [];
  if (stage === "Awaiting Payment Link" && t.quote) out.push(...TRAIL.quoteIn(t, t.quote, t.payMode || INSURERS[t.insurer]?.payMode || "Email"));
  if (stage === "Awaiting Payment" && t.payLink) out.push(...TRAIL.linkIn(t, t.payLink.confidence));
  if (stage === "Awaiting Endorsement Copy" && t.kind === "Financial") out.push(...TRAIL.paidIn(t));
  if (stage === "Copy Received") out.push(...TRAIL.copyIn(t, false, endoOf(t)?.file));
  if (stage === "Closed") out.push(TRAIL.qc(t), TRAIL.sent(t, false, endoOf(t)?.file));
  return out;
}

/* Replay a seeded ticket's life from its own legs, so its trail reads like one
   that was worked rather than one that was invented. `at` is hours ago, and it
   falls out of the legs — which is why the story is honest about pace: the
   stages we own close in minutes, the ones we wait on take days. */
function seedTrail(t) {
  const out = [];
  let cursor = ageOf(t) + (isOpen(t) ? 0 : t.lastAction);
  const push = (at, l) => out.push({ ...l, at: Math.max(0, at) });
  push(cursor, TRAIL.raised(t));
  (t.legs || []).forEach((l, i) => {
    const to = (t.legs[i + 1] || {}).s || t.stage;
    const endAt = cursor - l.h;
    push(endAt, TRAIL.leg(l.s, l.h, to, t.owner));
    onEnterTrail(t, to).forEach((x) => push(endAt, x));
    cursor = endAt;
  });
  return out;
}

/* Who signed a line. A person, or one of the desk's system personas — the
   product itself, Operations, the notification engine, or the client. */
const PRODUCT_ACTOR = { name: "BimaEndorse", kind: "product" };
const ACTORS = {
  "Mail bot": PRODUCT_ACTOR, "System": PRODUCT_ACTOR, "Workflow engine": PRODUCT_ACTOR,
  "Routing rule": PRODUCT_ACTOR, "Auto-linked by policy number": PRODUCT_ACTOR,
  "Notification engine": { name: "Notifications", kind: "system" },
  "Operations": { name: "Operations", kind: "system" },
};
const actorOf = (by, t) => ACTORS[by]
  || (by === t.client ? { name: "Customer", kind: "system" }
  : { name: by, kind: ROLES[by] ? "person" : "system" });

const ActorMark = ({ a, size = 20 }) => a.kind === "person" && a.name === "Nanditha P"
  ? <img src={AVATAR} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  : <span className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: a.kind === "product" ? C.figInk : C.brand, color: C.white,
        fontFamily: SERIF, fontStyle: "italic", fontSize: Math.round(size * 0.65), lineHeight: 1 }}>{a.name[0]}</span>;

const ActorName = ({ a }) => a.kind === "product"
  ? <><span style={{ color: C.figInk }}>Bima</span><span style={{ color: C.accent }}>Endorse</span></>
  : <span style={{ color: C.figInk }}>{a.name}</span>;

/* Primitives ------------------------------------------------------ */
const Eyebrow = ({ children, right }) => (
  <div className="flex items-baseline justify-between mb-2">
    <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.figTert }}>{children}</div>{right}
  </div>
);

/* Page header — title, one line of orientation, then the ikkat rule. */
function PageHead({ title, hint, right, ruleFirst, noRule }) {
  return (
    <div className="mb-5">
      {ruleFirst && <div className="bk-rule mb-6" aria-hidden />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.8px", color: C.brand }}>{title}</h1>
          {hint && <p className="mt-1" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>{hint}</p>}
        </div>
        {right}
      </div>
      {!ruleFirst && !noRule && <div className="bk-rule mt-4" aria-hidden />}
    </div>
  );
}

/* Table controls — Figma 888:88939. Filters live in the column headings; the
   lifecycle slices are pills on the title row; sorting stands apart. */

/* The desk clock, deliberately not the wall clock. NOW is pinned to 11:00 on the
   next working day and every deadline on screen derives from it; a live clock
   here would disagree with the SLA countdowns sitting inches below. */
function Greeting({ right, user }) {
  /* The date/time line is a live wall clock (display only) — it ticks in real
     time, independent of the SLA-pinned NOW that all countdowns still use. */
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = clock.getHours();
  const word = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  /* The greeting is the user's, not the page's — see PORTAL_USERS. */
  const hello = user?.greeting || `${word}, ${user?.first || "there"}.`;
  const when = clock.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" }) +
    " · " + clock.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={user?.avatar || AVATAR} alt="" className="shrink-0 rounded-full object-cover" style={{ width: 38, height: 38 }} />
          <div>
            <p className="bk-num mb-1 leading-none" style={{ fontSize: 12, fontWeight: 500, color: C.greet }}>{when}</p>
            <h1 className="leading-none" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.6px", color: C.brand }}>{hello}</h1>
          </div>
        </div>
        {right}
      </div>
      <div className="bk-rule mt-4" aria-hidden />
    </div>
  );
}
/* Me/Team scope switch (Figma 1438:99008 / states 1438:99009). A segmented
   control whose white pill smart-animates (slides) between the two options on
   selection; the active label reads brand, the inactive muted, and hovering the
   inactive option previews it in brand — exactly the four variants in the node. */
function ScopeSwitch({ value, onChange }) {
  const opts = [["mine", "Me"], ["team", "Team"]];
  const idx = value === "team" ? 1 : 0;
  const [hover, setHover] = useState(null);
  const W = 64, H = 40, GAP = 2;
  return (
    <div className="relative flex items-center" data-no-squircle
      style={{ background: C.brandBg, border: "1px solid #D1C6FF", borderRadius: 24, gap: GAP }}>
      {/* the smart-animate pill — slides between the two seats */}
      <span aria-hidden className="pointer-events-none absolute" style={{
        top: 0, left: 0, width: W, height: H, borderRadius: 32, background: C.white,
        border: "1px solid #D1C6FF", boxShadow: "0 0 6px rgba(14,43,114,0.24)",
        transform: `translateX(${idx * (W + GAP)}px)`, transition: "transform .3s cubic-bezier(.5,0,.5,1)" }} />
      {opts.map(([v, label], i) => {
        const on = idx === i, preview = hover === v && !on;
        return (
          <button key={v} onClick={() => onChange(v)} onMouseEnter={() => setHover(v)} onMouseLeave={() => setHover(null)}
            className="relative flex items-center justify-center"
            style={{ width: W, height: H, borderRadius: 32, background: "transparent", zIndex: 1, cursor: "pointer",
              fontSize: 14, fontWeight: 500, color: on || preview ? C.brand : C.greet, transition: "color .2s ease" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
const toneOf = (s) => s === "breached" ? C.breach : s === "atRisk" ? C.warn : s === "held" ? C.wait : C.teal;
const Chip = ({ children, color, bg, mono }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg ${mono ? "bk-num" : "font-medium"}`}
    style={{ color: color || C.ink2, background: bg || C.subtle }}>{children}</span>
);

function KindTag({ kind, small }) {
  const fin = kind === "Financial";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg font-semibold uppercase tracking-wide ${small ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"}`}
      style={fin ? { background: C.warnSoft, color: C.warn } : { background: C.subtle, color: C.figHint }}>
      {fin ? <><IndianRupee size={9} />Financial</> : "Non-financial"}
    </span>
  );
}

function PriorityTag({ p, big }) {
  const c = PRIORITY[p], hot = c.rank <= 1;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-bold uppercase tracking-wider ${big ? "px-2 py-1 text-xs" : "px-2 py-0.5 text-xs"}`}
      style={{ background: hot ? c.color : C.subtle, color: hot ? C.white : C.figHint }}>
      {p === "Critical" && <AlertTriangle size={big ? 12 : 10} />}{p}
    </span>
  );
}

function SlaBar({ t }) {
  const c = clock(t);
  if (c.state === "closed") return null;
  const st = stageOf(t.stage);
  const over = c.state === "breached";
  const tone = c.state === "held" ? C.wait : c.state === "atRisk" ? C.warn : C.teal;
  const allowPct = over ? Math.max(8, 100 / (1 + Math.abs(c.left) / (c.due - c.entered) * 3600000)) : 100;
  return (
    <div>
      <div className="relative h-2 rounded-sm overflow-hidden" style={{ background: C.lineSoft }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${over ? allowPct : c.used}%`, background: tone, opacity: over ? 0.4 : 1 }} />
        {over && <div className="absolute inset-y-0" style={{ left: `${allowPct}%`, right: 0, background: C.breach }} />}
        <div className="absolute -top-0.5 -bottom-0.5 w-px" style={{ left: `${allowPct}%`, background: C.ink2 }} />
      </div>
      <div className="flex items-baseline justify-between mt-1 text-xs">
        <span style={{ color: C.ink3 }}>{st.code} · {unitLabel(st.sla, st.unit)}</span>
        {c.state === "held" ? <span style={{ color: C.wait }}>paused</span>
          : over ? <span style={{ color: C.breach }}>+{c.label} over</span>
          : <span style={{ color: tone }}>{c.label} left</span>}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone, onClick, note }) {
  const c = { breach: [C.breach, C.breachSoft], warn: [C.warn, C.warnSoft], teal: [C.teal, C.tealSoft], wait: [C.wait, C.waitSoft] }[tone || "teal"];
  return (
    <button onClick={onClick} className="text-left p-4 rounded-xl border transition-colors hover:border-slate-400" style={{ background: C.white, borderColor: C.line }}>
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0" style={{ color: c[0] }} />
        <span className="text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: C.figTert }}>{label}</span>
      </div>
      <div className="bk-num mt-2 leading-none" style={{ fontSize: 26, fontWeight: 600, color: c[0] }}>{value}</div>
      <div className="text-xs mt-2 flex items-center gap-0.5" style={{ color: C.figTert }}>{note || "open list"} <ChevronRight size={11} /></div>
    </button>
  );
}

/* Indicator — Figma 900:96152. The dot and the hairline carry the meaning; the
   label always stays basic ink. Tokens are the Peetal semantic set. */
/* `fill` is the table/type treatment; `tint` is the status treatment — a status
   pill always carries its tone as a wash (Figma 179:3672). */
const IND = {
  error:   { dot: "#F10000", line: "#FFABAB", fill: "rgba(241,0,0,0.08)",    tint: "rgba(241,0,0,0.08)" },
  caution: { dot: "#FFCF0E", line: "#FFE890", fill: "rgba(255,207,14,0.12)", tint: "rgba(255,207,14,0.12)" },
  info:    { dot: "#1869F4", line: "#B9D1FF", fill: "#FFFFFF",               tint: "rgba(24,105,244,0.08)" },
  neutral: { dot: "#6F7378", line: "#D2D5D8", fill: "#FFFFFF",               tint: "rgba(169,172,177,0.16)" },
  success: { dot: "#00B200", line: "#A9EAA2", fill: "#FFFFFF",               tint: "rgba(0,178,0,0.08)" },
  brand:   { dot: "#4100CF", line: "#D1C6FF", fill: "#FFFFFF",               tint: "rgba(65,0,207,0.08)" },
  muted:   { dot: "#A9ACB1", line: "#E6E8EA", fill: "#F4F5F6",               tint: "#F4F5F6" },
};
const PRIO_IND = { Critical: "error", High: "caution", Medium: "neutral", Low: "neutral" };
const KIND_IND = { Financial: "success", "Non-Financial": "info", "Return-Premium": "caution" };
/* One spelling of the classification. The master calls a refund "Return-Premium";
   every surface shows "Refund", and it used to be remapped in three places. */
/* A ticket raised in the app carries no `kind` at all — see OPEN-QUESTIONS —
   so the fallback keeps the pill from rendering blank until that is decided. */
const kindLabel = (k) => k === "Return-Premium" ? "Refund" : (k || "Non-Financial");
/* Stage: awaiting an outside party reads info, terminal reads neutral, anything
   still moving reads caution. Derived from statusOf so the meaning is unchanged. */
const stageInd = (t) => {
  if (t.terminal) return "muted";                                   /* withdrawn / cancelled */
  if (t.manualReview) return "error";
  if (openQueries(t).length) return ALL_STAGES["Awaiting Customer Information"].ind;
  return stageOf(t.stage).ind || "neutral";
};

/* `outline` is the desk-row / priority-card variant: white fill, a 1px hairline
   and the label in the tone itself, rather than the table's black-on-tint. */
const IND_TEXT = { error: "#CF0000", caution: "#B38F0A", info: "#1868F4", success: "#007B00",
  brand: "#4100CF", neutral: "#6F7378", muted: "#A9ACB1" };
/* Three sizes, all from the design and all deliberate:
     default — table row pill:        6px pad · r8  · 0.5px
     big     — card status pill:      8px pad · r10 · 0.5px   (874:83812)
     thick   — card type/priority:  3/6px pad · r8  · 1px     (874:83823) */
const IND_SIZE = {
  default: { padding: "6px", borderRadius: 8, bw: "0.5px" },
  big:     { padding: "8px", borderRadius: 10, bw: "0.5px" },
  thick:   { padding: "3px 6px", borderRadius: 8, bw: "1px" },
};
const Indicator = ({ label, ind, outline, big, thick, status, size = 14 }) => {
  const k = IND[ind] || IND.neutral;
  const s = IND_SIZE[big ? "big" : thick ? "thick" : "default"];
  return (
    <span title={label} className="inline-flex max-w-full items-center justify-center gap-1"
      style={{ padding: s.padding, borderRadius: s.borderRadius,
        ...(outline
          ? { background: C.white, border: `1px solid ${k.line}` }
          : { background: status ? k.tint : k.fill, border: `${s.bw} solid ${k.line}` }) }}>
      <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, background: k.dot }} />
      <span className="truncate" style={{ fontSize: size, fontWeight: 500, lineHeight: 1,
        color: outline ? (IND_TEXT[ind] || IND_TEXT.neutral) : ind === "muted" ? C.figTert : "#1C1C1C" }}>{label}</span>
    </span>
  );
};

function StagePills({ counts, active, onPick }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TABS.map((x) => {
        const on = active === x.key;
        return (
          <button key={x.key} onClick={() => onPick(x.key)}
            className={`flex items-center whitespace-nowrap rounded-full leading-none transition-colors ${on ? "" : "bk-pill"}`}
            style={{ padding: "8px 12px", gap: 6, border: `0.5px solid ${on ? C.brand : C.line}`,
              background: on ? C.brand : C.white, color: on ? C.white : C.figHint, fontSize: 16, fontWeight: 500 }}>
            <span className="bk-pill-dot shrink-0 rounded-full" style={{ width: 8, height: 8, background: on ? C.white : C.figHint }} />
            <span>{x.label}<span className="bk-num">({counts[x.key]})</span></span>
          </button>
        );
      })}
    </div>
  );
}

/* Action list item — Figma 900:97172. px-8 py-12, r8, 16/500, selected on brandBg. */
const MenuOpt = ({ label, on, onClick }) => (
  <button onClick={onClick} className="bk-opt flex w-full items-center justify-between gap-6 rounded-lg px-2 py-3 text-left"
    style={{ fontSize: 16, fontWeight: 500, color: C.figHint, background: on ? C.brandBg : "transparent", lineHeight: 1 }}>
    <span className="truncate">{label}</span>
    <CheckCircle2 size={16} className="shrink-0" fill={on ? "#1F9D6B" : C.white} color={on ? C.white : C.figPlaceholder} />
  </button>
);

const MenuCard = ({ children, right }) => (
  <div className="scroll-slim absolute top-full z-30 mt-3 max-h-80 overflow-y-auto rounded-2xl border px-2 py-3"
    style={{ [right ? "right" : "left"]: 0, minWidth: 240, background: C.white, borderColor: "#DFE0E2",
      boxShadow: "0 2px 16px rgba(169,172,177,0.24)" }}>{children}</div>
);

/* A filterable column heading. Empty selection means All. */
function HeaderFilter({ id, label, options, selected, setSelected, openKey, setOpenKey, right }) {
  const open = openKey === id;
  const allOn = selected.size === 0;
  const toggle = (v) => {
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
    setSelected(next);
  };
  return (
    <div className="relative flex min-w-0 items-center gap-1" data-menu>
      <button onClick={() => setOpenKey(open ? null : id)} className="flex min-w-0 items-center gap-1" title={`Filter by ${label.toLowerCase()}`}>
        <span className="bk-iconctrl flex shrink-0 items-center justify-center border"
          style={{ width: 20, height: 20, borderRadius: 6, background: open ? C.brandBg : C.white, borderColor: C.subtle, color: open ? C.brand : C.figHint }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </span>
        <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1C" }}>{label}</span>
      </button>
      {!allOn && (
        <span className="bk-num shrink-0 rounded-full px-1.5 text-xs font-semibold" style={{ background: C.brandBg, color: C.brand }}>{selected.size}</span>
      )}
      {open && (
        <MenuCard right={right}>
          <MenuOpt label="All" on={allOn} onClick={() => setSelected(new Set())} />
          {options.map((o) => <MenuOpt key={o.value} label={o.label} on={selected.has(o.value)} onClick={() => toggle(o.value)} />)}
        </MenuCard>
      )}
    </div>
  );
}

/* Sort — Figma 900:97172, rendered to its stated properties: 187px wide, a
   0.5px brand underline, label at 16/500 in brand, then chevron · divider ·
   sort bars. Open swaps the chevron for a cross. */
function SortControl({ sort, setSort, openKey, setOpenKey }) {
  const open = openKey === "sort";
  return (
    <div className="relative" data-menu style={{ minWidth: 187 }}>
      <button onClick={() => setOpenKey(open ? null : "sort")}
        className="flex w-full items-center gap-1 p-3"
        style={{ background: open ? "rgba(65,0,207,0.02)" : C.white, borderBottom: `1px solid ${C.brand}` }}>
        <span className="flex-1 whitespace-nowrap text-left" style={{ fontSize: 16, fontWeight: 500, color: C.brand, lineHeight: 1 }}>
          Sort by: {SORTS[sort].label}
        </span>
        <span className="flex shrink-0 items-center gap-2" style={{ color: C.figHint }}>
          {open ? <X size={16} /> : <ChevronDown size={16} />}
          <span style={{ width: 1, height: 16, background: C.line }} />
          {/* lucide 0.469 has no list-sort-descending; this is its nearest glyph */}
          <ArrowDownWideNarrow size={16} style={{ color: C.figInk }} />
        </span>
      </button>
      {open && (
        <MenuCard right>
          {["priority", "urgency", "oldest", "newest"].map((k) => (
            <MenuOpt key={k} label={SORTS[k].label} on={sort === k} onClick={() => { setSort(k); setOpenKey(null); }} />
          ))}
        </MenuCard>
      )}
    </div>
  );
}

function Pager({ page, pages, setPage }) {
  const btn = (on) => ({ width: 20, height: 20, background: on ? C.white : C.subtle,
    border: `1px solid ${C.line}`, color: on ? C.figHint : C.figPlaceholder, cursor: on ? "pointer" : "not-allowed" });
  return (
    <div className="flex items-center justify-end gap-2 px-1 text-xs" style={{ color: C.figTert }}>
      <span className="bk-num">Page {page + 1} of {pages}</span>
      <button disabled={page === 0} onClick={() => setPage(page - 1)}
        className="bk-iconctrl flex items-center justify-center rounded-md" style={btn(page > 0)}><ChevronLeft size={12} /></button>
      <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}
        className="bk-iconctrl flex items-center justify-center rounded-md" style={btn(page < pages - 1)}><ChevronRight size={12} /></button>
    </div>
  );
}

/* Queue cards, in the shape of the reference layout:
   channel icon · title · requester · meta line · assignee */
const SOURCES = [
  { icon: MailOpen, color: "#2E9E5B", label: "Email" },
  { icon: Mail, color: "#6B7B84", label: "Email" },
  { icon: Globe, color: "#2E7D9E", label: "Client portal" },
  { icon: Phone, color: "#8A6D3B", label: "Phone" },
  { icon: MessageSquare, color: "#3B7ACF", label: "RM relay" },
];
const srcOf = (t) => SOURCES[t.id.charCodeAt(t.id.length - 1) % SOURCES.length];
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function TicketCard({ t, onOpen, mode, i = 0 }) {
  const S = srcOf(t), Icon = S.icon;
  const hot = PRIORITY[t.priority].rank <= 1;
  const mailCount = mailOf(t).length;
  return (
    <button onClick={() => onOpen(t.id)} className="bk-item w-full text-left px-4 py-3 flex gap-3 border-b hover:bg-slate-50"
      style={{ ...stagger(i), borderColor: C.lineSoft }}>
      <Icon size={17} className="shrink-0 mt-0.5" style={{ color: S.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="bk-num text-sm" style={{ color: C.ink2 }}>{t.id}</span>
          <KindTag kind={t.kind} />
        </div>
        <div className="text-base leading-snug" style={{ color: C.ink }}>{t.type}</div>
        <div className="text-sm mt-1 truncate" style={{ color: C.link }}>{t.client}</div>
        <div className="mt-2"><SlaCell t={t} stacked /></div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs flex-wrap" style={{ color: C.figTert }}>
          <span>{statusOf(t).label}</span>
          {hot && <><span>·</span><span className="font-semibold uppercase tracking-wide" style={{ color: PRIORITY[t.priority].color }}>{t.priority}</span></>}
          <span>·</span>
          <span className="flex items-center gap-0.5"><MessageSquare size={11} />{mailCount}</span>
          {blocked(t) && <><span>·</span><span className="flex items-center gap-0.5" style={{ color: C.warn }}><FileClock size={11} />{gapCount(t)} pending</span></>}
          {mode === "team" && <><span>·</span><span>{t.owner}</span></>}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{ background: C.subtle, color: C.figHint }}>{initials(t.owner)}</div>
    </button>
  );
}

function Column({ title, tone, list, onOpen, mode, empty }) {
  return (
    <section className="rounded-2xl border flex flex-col shrink-0 overflow-hidden"
      style={{ background: C.white, borderColor: C.line, width: 366, maxHeight: 560 }}>
      <header className="px-4 py-3 border-b shrink-0 flex items-baseline gap-1.5" style={{ borderColor: C.lineSoft }}>
        <span className="text-sm font-semibold" style={{ color: tone || C.figInk }}>{title}</span>
        <span className="bk-num text-sm" style={{ color: C.figTert }}>({list.length})</span>
      </header>
      <div className="scroll-slim overflow-y-auto">
        {list.length ? list.map((t, i) => <TicketCard key={t.id} t={t} i={i} onOpen={onOpen} mode={mode} />) : <Empty>{empty}</Empty>}
      </div>
    </section>
  );
}

function Collapsible({ title, count, hint, badge, children, action }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border overflow-hidden" style={{ background: C.white, borderColor: C.line }}>
      <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: open ? C.lineSoft : "transparent", background: C.canvas }}>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown size={14} style={{ color: C.ink3, transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
          <span className="text-sm font-semibold" style={{ color: C.ink }}>
            {title} {count !== undefined && <span className="bk-num font-normal" style={{ color: C.ink3 }}>({count})</span>}
          </span>
          {badge}
          {!open && hint && <span className="text-xs truncate hidden sm:inline" style={{ color: C.ink3 }}>· {hint}</span>}
        </button>
        {open && action}
      </div>
      {open && children}
    </section>
  );
}

function Panel({ title, count, hint, children, action }) {
  return (
    <section className="rounded-xl border overflow-hidden" style={{ background: C.white, borderColor: C.line }}>
      <header className="px-3.5 py-3 flex items-center justify-between gap-2 border-b" style={{ borderColor: C.lineSoft, background: C.canvas }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>
            {title} {count !== undefined && <span className="bk-num font-normal" style={{ color: C.ink3 }}>({count})</span>}
          </div>
          {hint && <div className="text-xs mt-0.5" style={{ color: C.ink3 }}>{hint}</div>}
        </div>{action}
      </header>{children}
    </section>
  );
}
const Empty = ({ children }) => <div className="px-3 py-8 text-center text-sm" style={{ color: C.figTert }}>{children}</div>;

/* Home — Figma 874:83640. Two blocks: Your Desk counts what is waiting and
   links into a pre-set My Tickets; Priority Cases pages the hot ones three at a
   time. Home reads and links; it never mutates a ticket. */

const DESK_ARROW = { background: "#FFFFFF", border: "0.5px solid #E6E8EA", borderRadius: 10 };

/* Desk card — routes into My Tickets pre-filtered. Hover lifts it with a brand
   tint; pressing shows the firmer neutral stroke + soft elevation carried over
   from the old selected look (bk-desk in GLOBAL_CSS). The arrow never changes. */
function DeskCard({ count, pills, tint, onOpen }) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="bk-desk flex w-full items-end gap-3 rounded-xl border text-left" style={{
        borderColor: C.subtle, borderWidth: "0.5px", padding: 12.5, cursor: "pointer",
        backgroundImage: `linear-gradient(59.34deg, ${C.white} 49.85%, ${tint} 99.918%)` }}>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <span className="bk-num leading-none" style={{ fontSize: 18, fontWeight: 600, color: C.figInk }}>
          {count} {count === 1 ? "Ticket" : "Tickets"} in
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {pills.map((p) => <Indicator key={p.label} label={p.label} ind={p.ind} outline={p.outline} />)}
        </span>
      </span>
      <span className="flex shrink-0 items-center justify-center px-3.5 py-2.5" style={DESK_ARROW}>
        <ArrowRight size={12} style={{ color: C.figInk }} />
      </span>
    </div>
  );
}

/* One ticket, as a card. The whole card is the target — a click anywhere opens
   the ticket, so there is no separate action button. Shared by Priority Cases
   and the queue accordions (Figma 1005:121468 / 1005:122258) so both read alike.
   `style` lets the caller set the flex-basis for the Priority carousel. */
function CaseCard({ t, onOpen, style }) {
  const st = statusOf(t), c = clock(t), over = c.state === "breached";
  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="bk-item flex flex-col border p-4 text-left transition-shadow hover:shadow-sm"
      style={{ ...style, borderColor: C.subtle, borderRadius: 16, cursor: "pointer",
        background: `linear-gradient(to top, ${C.brandBg} 0%, ${C.white} 55%)` }}>
      <div className="mb-4 flex justify-end">
        <Indicator status label={st.label} ind={stageInd(t)} big />
      </div>
      <div className="bk-num" style={{ fontSize: 18, fontWeight: 600, color: C.brand }}>{t.id}</div>
      <div className="mt-0.5 flex items-center gap-1 truncate" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>
        <User size={16} className="shrink-0" style={{ color: C.figInk }} />
        <span className="truncate">{t.client}</span>
      </div>
      <div className="mt-2 truncate" style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>{t.type}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Indicator thick label={kindLabel(t.kind)} ind={KIND_IND[t.kind]} />
        <Indicator thick label={t.priority} ind={PRIO_IND[t.priority]} />
      </div>
      <div className="mt-4 flex items-end gap-4">
        <span className="flex min-w-0 flex-1 items-start gap-1">
          <Clock size={14} className="mt-px shrink-0" style={{ color: C.figHint }} />
          <span className="min-w-0" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
            <span className="bk-num" style={{ color: over ? C.semError : c.state === "atRisk" ? C.semCaution : toneOf(c.state) }}>
              {c.state === "held" ? "On hold." : over ? `${c.label} over.` : `${c.label} left.`}
            </span>
            <span className="bk-num" style={{ color: C.figHint }}>
              {` ${over ? "Was due " : "Due "}${fmtWhen(c.due)}`}
            </span>
          </span>
        </span>
        <Participants t={t} />
      </div>
    </div>
  );
}

/* A queue as an accordion: the same count-and-label header as before, but it
   opens in place to reveal its tickets rather than routing to a filtered list.
   The buckets (bucketOf 1/2/3) are unchanged — only how Home surfaces them. */
function QueueAccordion({ label, ind, list, openTicket }) {
  const [open, setOpen] = useState(true);
  const count = list.length;
  const canOpen = count > 0;
  return (
    <div className="border" style={{ borderColor: C.subtle, borderRadius: 12, background: C.white }}>
      <button onClick={() => canOpen && setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        style={{ cursor: canOpen ? "pointer" : "default" }}>
        <span className="bk-num shrink-0 leading-none" style={{ fontSize: 18, fontWeight: 600, color: C.figInk }}>
          {count} {count === 1 ? "Ticket" : "Tickets"} in
        </span>
        <Indicator label={label} ind={ind} outline />
        <span className="flex flex-1 justify-end">
          {canOpen && <ChevronDown size={16} style={{ color: C.figHint,
            transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }} />}
        </span>
      </button>
      {open && canOpen && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          {list.map((t) => <CaseCard key={t.id} t={t} onOpen={() => openTicket(t.id)} />)}
        </div>
      )}
    </div>
  );
}

/* The people on a ticket, stacked. Only Nanditha and Umesh have photographs;
   everyone else is an initials mark. */
/* One tint per role, so the stack reads without a legend. */
const MARK_BG = { owner: C.brand200, insurer: "#DDE8FF", client: "#D4F5CF" };
const MARK_FG = { owner: C.brand, insurer: "#1458D2", client: "#007B00" };

/* A participant mark. Initials are set in the display face, italic. */
const Mark = ({ kind, name, size = 20, ring = true, style, title }) => (
  <span title={title === null ? undefined : title || `${name} · ${kind}`}
    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
    style={{ width: size, height: size, background: MARK_BG[kind] || C.subtle, color: MARK_FG[kind] || C.brand,
      border: ring ? `1.5px solid ${C.white}` : undefined,
      fontFamily: SERIF, fontStyle: "italic", fontSize: Math.round(size * 0.8), lineHeight: 1, ...style }}>
    {/* Only Nanditha has a photograph. Reassign the ticket and the mark must
       change with it, not keep wearing her face. */}
    {kind === "owner" && name === "Nanditha P"
      ? <img src={AVATAR} alt="" className="h-full w-full rounded-full object-cover" />
      : initials(name).slice(0, 1)}
  </span>
);

/* Peetal tooltip 87:23267 - recessed ground, 8/4 padding, r8, arrow beneath.
   The stack sits at the right edge of its row, so the body grows leftward and
   the arrow is scrubbed to land on the mark - the same trick the frame uses. */
const Tip = ({ children, down, w }) => (
  <span className="pointer-events-none absolute flex flex-col items-end"
    style={{ [down ? "top" : "bottom"]: "calc(100% + 3px)", right: -6, zIndex: 50 }}>
    {down && <span style={{ width: 0, height: 0, marginRight: 10, borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent", borderBottom: `7px solid ${C.subtle}` }} />}
    <span className={w ? "" : "whitespace-nowrap"} style={{ background: C.subtle, borderRadius: 8, padding: "4px 8px",
      fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: C.figInk,
      ...(w ? { width: w, whiteSpace: "normal", textAlign: "left" } : {}) }}>{children}</span>
    {!down && <span style={{ width: 0, height: 0, marginRight: 10, borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent", borderTop: `7px solid ${C.subtle}` }} />}
  </span>
);
/* Info glyph with the same styled hover tooltip the avatars use (not a native
   title). Shared by the progress cards and the time-distribution widgets across
   both BimaEndorse and BimaClaim. */
function InfoTip({ tip, down = true }) {
  const [over, setOver] = useState(false);
  return (
    <span className="relative flex" style={{ cursor: "help" }}
      onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <Info size={14} style={{ color: C.link }} />
      {over && <Tip down={down} w={240}>{tip}</Tip>}
    </span>
  );
}

/* Hovering one mark isolates it: the rest fall to 10% and a tooltip above names
   the one under the cursor. Figma 968:119943. */
function Participants({ t, size = 20, down }) {
  const who = participantsOf(t);
  const [over, setOver] = useState(-1);
  return (
    <span className="flex shrink-0 items-center" onMouseLeave={() => setOver(-1)}>
      {who.map((p, i) => (
        <span key={p.kind} className="relative flex" onMouseEnter={() => setOver(i)}
          style={{ marginLeft: i ? -6 : 0, zIndex: over === i ? who.length + 1 : who.length - i }}>
          <Mark kind={p.kind} name={p.name} size={size} title={null}
            style={{ opacity: over >= 0 && over !== i ? 0.1 : 1,
              boxShadow: over === i ? "0 0 4px rgba(65,0,207,0.25)" : undefined,
              transition: "opacity .15s ease-out" }} />
          {over === i && <Tip down={down}>{p.name}</Tip>}
        </span>
      ))}
    </span>
  );
}

const PRIO_PER_PAGE = 3;
const PRIO_GAP = 16;   // px — matches gap-4 on the track
const PRIO_PEEK = 40;  // px of the next card left visible, so the queue never looks like just three

function PriorityCases({ list, openTicket }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(list.length / PRIO_PER_PAGE));
  const at = Math.min(page, pages - 1);
  const more = list.length > PRIO_PER_PAGE;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Priority Cases</h2>
        {more && <Pager page={at} pages={pages} setPage={setPage} />}
      </div>
      {more ? (
        /* A single track, not paged grids: three cards fill the width and the
           fourth is left peeking by PRIO_PEEK so it always reads as "more than
           three". The pager shifts one full page, landing the next card flush
           left (translateX(-100%) spans the container width; +PEEK keeps the
           sliver). */
        <div className="overflow-hidden">
          <div className="flex gap-4"
            style={{ transform: at ? `translateX(calc(${at} * (-100% + ${PRIO_PEEK}px)))` : "none",
              transition: "transform .35s cubic-bezier(.22,1,.36,1)" }}>
            {list.map((t, i) => (
              <CaseCard key={t.id} t={t} onOpen={() => openTicket(t.id)}
                style={{ ...stagger(i),
                  flex: `0 0 calc((100% - ${PRIO_PER_PAGE * PRIO_GAP + PRIO_PEEK}px) / ${PRIO_PER_PAGE})` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {list.map((t, i) => (
            <CaseCard key={t.id} t={t} onOpen={() => openTicket(t.id)} style={stagger(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Your Progress — the status of a metric drives an illustrative sparkline
   (Figma 1283:91535 / 1243:83339 / 1280:91518): Well Done trends up, On Track
   holds flat, Poor trends down. The shapes are fixed art, not plotted data. */
const scoreStatus = (s) => (s >= 0.7 ? "Well Done" : s >= 0.4 ? "On Track" : "Poor");
const STATUS_IND = { "Well Done": "success", "On Track": "info", "Poor": "caution" };
const SPARK = {
  "Well Done": { c: "#00B200", pts: [[0, 34], [12, 30], [24, 32], [36, 23], [48, 26], [60, 17], [72, 20], [84, 11], [96, 14], [108, 5], [120, 2]] },
  "On Track": { c: "#A9ACB1", pts: [[0, 20], [15, 18], [30, 22], [45, 19], [60, 21], [75, 18], [90, 22], [105, 19], [120, 20]] },
  "Poor": { c: "#FFCF0E", pts: [[0, 5], [12, 9], [24, 7], [36, 16], [48, 13], [60, 22], [72, 19], [84, 28], [96, 25], [108, 33], [120, 37]] },
};
function Spark({ status }) {
  const s = SPARK[status] || SPARK["On Track"];
  const line = s.pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(" ");
  const area = `M${s.pts[0][0]},40 ` + s.pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${s.pts[s.pts.length - 1][0]},40 Z`;
  return (
    <svg viewBox="0 0 120 40" width="132" height="44" preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={s.c} fillOpacity="0.1" />
      <path d={line} fill="none" stroke={s.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
    </svg>
  );
}
/* The Poor→On Track→Well Done gauge — bars fill left-to-right by the score. */
function PerfMeter({ score }) {
  const N = 24, filled = Math.max(1, Math.round(score * N));
  return (
    <div>
      <div className="flex gap-1" style={{ height: 34 }}>
        {Array.from({ length: N }).map((_, i) => (
          <span key={i} className="flex-1 rounded-sm" style={{ background: i < filled ? C.brand : "#EAEBED" }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
        <span>Poor</span><span>On Track</span><span>Well Done</span>
      </div>
    </div>
  );
}
function ProgressCard({ title, value, status, score, sub, subTone, tip }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <FileText size={14} style={{ color: C.figHint }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>{title}</span>
        </div>
        <InfoTip tip={tip} />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="bk-num" style={{ fontSize: 20, fontWeight: 700, color: C.figInk, lineHeight: 1 }}>{value}</span>
            <Indicator label={status} ind={STATUS_IND[status]} />
          </div>
          <div className="mt-2" style={{ fontSize: 12, fontWeight: 500, color: subTone }}>{sub}</div>
        </div>
        <div className="shrink-0"><Spark status={status} /></div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>Performance</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Last refreshed 4 Hrs. ago</span>
        </div>
        <div className="mt-2"><PerfMeter score={score} /></div>
      </div>
    </div>
  );
}
/* Ticket Time Distribution — a donut of hours held by each player (Figma
   1280:91430). Slices and labels come from real leg/stage time on the desk. */
const PIE_IND = { Insurer: "caution", Client: "brand", BimaKavach: "error", BimaPlacement: "info" };
const PIE_FILL = { Insurer: "#FFF9E6", Client: "#F4F1FF", BimaKavach: "#FFECEC", BimaPlacement: "#EEF4FF" };
function Donut({ segments }) {
  const total = segments.reduce((s, x) => s + x.hrs, 0) || 1;
  const W = 420, H = 340, cx = 210, cy = 170, R = 118, r = 46, GAP = 26;
  const at = (rad, deg) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)];
  let a0 = -90;
  const arcs = segments.map((s) => {
    const a1 = a0 + (s.hrs / total) * 360;
    const [ox0, oy0] = at(R, a0), [ox1, oy1] = at(R, a1);
    const [ix1, iy1] = at(r, a1), [ix0, iy0] = at(r, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    const d = `M${ox0},${oy0} A${R},${R} 0 ${large} 1 ${ox1},${oy1} L${ix1},${iy1} A${r},${r} 0 ${large} 0 ${ix0},${iy0} Z`;
    const mid = (a0 + a1) / 2, rad = (mid * Math.PI) / 180;
    const [lx, ly] = at((R + r) / 2, mid), [tx, ty] = at(R + GAP, mid);
    /* Anchor each tag by the edge nearest the pie (not its centre) so the pill
       always clears the arc by GAP, whichever way it sits. */
    const c = Math.cos(rad), sn = Math.sin(rad);
    const shift = `translate(${c > 0.3 ? "0" : c < -0.3 ? "-100%" : "-50%"}, ${sn > 0.3 ? "0" : sn < -0.3 ? "-100%" : "-50%"})`;
    a0 = a1;
    return { ...s, d, lx, ly, tx, ty, shift };
  });
  return (
    <div className="relative mx-auto" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {arcs.map((s) => <path key={s.label} d={s.d} fill={s.fill} stroke={C.white} strokeWidth="2" />)}
        {arcs.map((s) => (
          <text key={s.label + "t"} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
            className="bk-num" style={{ fontSize: 13, fontWeight: 500, fill: C.figInk }}>{Math.round(s.hrs)} Hrs.</text>
        ))}
      </svg>
      {arcs.map((s) => (
        <div key={s.label + "g"} className="absolute" style={{ left: s.tx, top: s.ty, transform: s.shift }}>
          <Indicator label={s.label} ind={s.ind} />
        </div>
      ))}
    </div>
  );
}
/* Range selector — the window the stats describe. Same pill component as the My
   Tickets filters (StagePills): bk-pill hover, brand fill when active. Last Week
   reads real data; the other windows are illustrative (no historical store). */
const RANGES = ["Last Week", "Last Month", "Last Quarter", "Custom"];
function RangePills({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGES.map((o) => {
        const on = value === o;
        return (
          <button key={o} onClick={() => onChange(o)}
            className={`flex items-center whitespace-nowrap rounded-full leading-none transition-colors ${on ? "" : "bk-pill"}`}
            style={{ padding: "8px 12px", gap: 6, border: `0.5px solid ${on ? C.brand : C.line}`,
              background: on ? C.brand : C.white, color: on ? C.white : C.figHint, fontSize: 16, fontWeight: 500 }}>
            <span className="bk-pill-dot shrink-0 rounded-full" style={{ width: 8, height: 8, background: on ? C.white : C.figHint }} />
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Home — the desk (six count-cards that route into My Tickets) over a progress
   dashboard. Home and My Tickets are separate pages again (Figma 1197:73447). */
function Home({ tickets, scope, setScope, go, user }) {
  const [range, setRange] = useState("Last Week");
  const desk = tickets.filter((t) => !isRouting(t) && (scope === "mine" ? t.owner === "Nanditha P" : true));
  const open = desk.filter(isOpen);
  const totalOpen = open.length || 1;

  const cards = [
    { count: open.filter((t) => PRIORITY[t.priority].rank <= 1).length, tint: "#FFECEC", pills: [{ label: "High", ind: "caution" }, { label: "Critical", ind: "error" }], preset: { prio: "hot" } },
    { count: open.filter(breached).length, tint: "#FFECEC", pills: [{ label: "Overdue", ind: "error" }], preset: { slice: "breached" } },
    { count: open.filter(atRisk).length, tint: "#EDE6FF", pills: [{ label: "Due Today", ind: "brand" }], preset: { slice: "risk" } },
    { count: open.filter(onHold).length, tint: "#E9F1FF", pills: [{ label: "Client Response", ind: "info" }], preset: { slice: "qClient" } },
    { count: open.filter(awaitingInsurer).length, tint: "#FFF6E0", pills: [{ label: "Insurer Response", ind: "caution" }], preset: { slice: "qInsurer" } },
    { count: open.filter(isFresh).length, tint: "#E9FBF0", pills: [{ label: "Freshly Assigned", ind: "success" }], preset: { slice: "qFresh" } },
  ];

  /* Ticket Closure — the share of open tickets still inside SLA. */
  const onTrack = open.filter((t) => !breached(t)).length;
  const overdue = open.filter(breached).length;
  const closureScore = onTrack / totalOpen;
  const closureStatus = scoreStatus(closureScore);

  /* Median Turnaround — the median share of the stage clock already spent;
     less consumed reads as a healthier turnaround. */
  const used = open.map((t) => Math.min(1, Math.max(0, clock(t).used || 0))).sort((a, b) => a - b);
  const medUsed = used.length ? used[Math.floor((used.length - 1) / 2)] : 0;
  const turnScore = 1 - medUsed;
  const turnStatus = scoreStatus(turnScore);

  /* Ticket Time Distribution — hours each player has held the ticket, from the
     stage legs + the current stage, weighted equally per ticket then scaled to a
     typical ticket's lifetime so one stuck ticket cannot swamp the picture. */
  /* Player = who holds the ticket at each stage. BimaKavach = the service
     executives' own work (verification, QC); BimaPlacement = the payment-link
     team (SLA-07 Awaiting Payment Link); Insurer / Client are the counterparties. */
  const PLAYER = { insurer: "Insurer", customer: "Client", "Service Manager": "BimaKavach", system: "BimaKavach", operations: "BimaPlacement" };
  const acc = { Insurer: 0, Client: 0, BimaKavach: 0, BimaPlacement: 0 };
  const lives = [];
  open.forEach((t) => {
    const tb = { Insurer: 0, Client: 0, BimaKavach: 0, BimaPlacement: 0 };
    (t.legs || []).forEach((l) => { const p = PLAYER[stageOf(l.s).owner]; if (p) tb[p] += Math.max(0, l.h); });
    const cp = PLAYER[stageOf(t.stage).owner]; if (cp) tb[cp] += Math.max(0, t.inStage);
    const tot = tb.Insurer + tb.Client + tb.BimaKavach + tb.BimaPlacement;
    lives.push(tot);
    if (tot > 0) Object.keys(tb).forEach((p) => { acc[p] += tb[p] / tot; });
  });
  const sortedLives = lives.slice().sort((a, b) => a - b);
  const medLife = sortedLives.length ? sortedLives[Math.floor((sortedLives.length - 1) / 2)] : 0;
  const nShare = open.length || 1;
  const segments = ["Insurer", "Client", "BimaKavach", "BimaPlacement"]
    .map((p) => ({ label: p, ind: PIE_IND[p], fill: PIE_FILL[p], hrs: (acc[p] / nShare) * medLife }))
    .filter((s) => s.hrs >= 0.5);

  /* Last Week reads the live desk; the wider windows are illustrative — our
     oldest ticket is under a month old, so month/quarter figures are stand-ins. */
  const seg = (i, cl, b, p) => ["Insurer", "Client", "BimaKavach", "BimaPlacement"]
    .map((label, k) => ({ label, ind: PIE_IND[label], fill: PIE_FILL[label], hrs: [i, cl, b, p][k] }));
  const green = "#007B00";
  const PROG = {
    "Last Week": {
      count: open.length,
      closure: { value: `${onTrack}/${totalOpen}`, status: closureStatus, score: closureScore, sub: overdue ? `${overdue} overdue right now` : "None overdue — on top of it", subTone: overdue ? C.semCaution : green },
      turn: { value: `${Math.round(medUsed * 100)}%`, status: turnStatus, score: turnScore, sub: `${Math.round(medUsed * 100)}% of stage SLA used (median)`, subTone: turnStatus === "Poor" ? C.semCaution : green },
      segments,
    },
    "Last Month": {
      count: 23,
      closure: { value: "18/23", status: "On Track", score: 0.62, sub: "3 overdue this month", subTone: C.semCaution },
      turn: { value: "44%", status: "On Track", score: 0.56, sub: "44% of stage SLA used (median)", subTone: green },
      segments: seg(41, 17, 29, 9),
    },
    "Last Quarter": {
      count: 61,
      closure: { value: "54/61", status: "Well Done", score: 0.88, sub: "11% above the desk average", subTone: green },
      turn: { value: "29%", status: "Well Done", score: 0.71, sub: "29% of stage SLA used (median)", subTone: green },
      segments: seg(46, 15, 31, 8),
    },
    "Custom": {
      count: 12,
      closure: { value: "7/12", status: "Poor", score: 0.34, sub: "5 overdue in range", subTone: C.semCaution },
      turn: { value: "63%", status: "Poor", score: 0.37, sub: "63% of stage SLA used (median)", subTone: C.semCaution },
      segments: seg(33, 19, 22, 6),
    },
  };
  const prog = PROG[range] || PROG["Last Week"];
  const pie = prog.segments.filter((s) => s.hrs >= 0.5);

  return (
    <div className="space-y-6">
      <Greeting user={user} right={
        /* Mine/Team is a supervisor control. A Servicing Executive owns a single
           desk — she sees only her own queue and never the toggle. A manager's
           view (e.g. Umesh) keeps it. Gated on the user-role master (ROLES). */
        ROLES[user?.name]?.role === "Servicing executive" ? null : (
          <ScopeSwitch value={scope} onChange={setScope} />
        )
      } />

      {/* Your Desk — the six count-cards; each routes into My Tickets pre-filtered. */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Your Desk</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {cards.map((c, i) => (
            <DeskCard key={i} count={c.count} tint={c.tint} pills={c.pills}
              onOpen={() => go("list", "open", c.preset)} />
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.subtle }} aria-hidden />

      {/* Your Progress — two metric cards over an SLA time-distribution donut.
          Switching the range morphs the whole block (fade + slide, keyed on range). */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Your Progress</h2>
          <RangePills value={range} onChange={setRange} />
        </div>
        <div key={range} className="bk-reveal grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <ProgressCard title="Ticket Closure" value={prog.closure.value} status={prog.closure.status} score={prog.closure.score}
              sub={prog.closure.sub} subTone={prog.closure.subTone}
              tip="Open tickets still inside SLA — on-track over total open." />
            <ProgressCard title="Median Turnaround" value={prog.turn.value} status={prog.turn.status} score={prog.turn.score}
              sub={prog.turn.sub} subTone={prog.turn.subTone}
              tip="Median share of the stage clock used; lower is faster." />
          </div>
          <div className="rounded-xl border p-5 lg:col-span-2" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <FileText size={14} style={{ color: C.figHint }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Ticket Time Distribution</span>
                </div>
                <div className="mt-1 bk-num" style={{ fontSize: 18, fontWeight: 700, color: C.figInk }}>{prog.count} Tickets</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <InfoTip tip="Hours each party held your tickets: you, insurer, client, placements." />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Last refreshed 4 Hrs. ago</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center">
              {pie.length ? <Donut segments={pie} /> : <Empty>No time recorded yet.</Empty>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

const TABS = [
  { key: "attention", label: "Needs Attention", test: (t) => isOpen(t) && bucketOf(t) <= 2 },
  { key: "open", label: "All Open", test: isOpen },
  { key: "closed", label: "Closed & Terminal", test: (t) => !isOpen(t) },
  { key: "recent", label: "Recently Worked", test: () => true },
];

const SORTS = {
  urgency: { label: "Urgency", fn: riskSort },
  priority: { label: "Priority", fn: (a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || riskSort(a, b) },
  oldest: { label: "Oldest First", fn: (a, b) => ageOf(b) - ageOf(a) },
  newest: { label: "Newest First", fn: (a, b) => ageOf(a) - ageOf(b) },
  touched: { label: "Last worked", fn: (a, b) => a.lastAction - b.lastAction },
};

const SLICES = {
  all: { label: "Everything", fn: () => true },
  breached: { label: "Overdue only", fn: breached },
  risk: { label: "Due today only", fn: atRisk },
  silent: { label: "Pending 15d+ only", fn: isSilent },
  blocked: { label: "Intake gaps only", fn: blocked },
  held: { label: "Awaiting client only", fn: onHold },
  /* Queue slices — the three collapsed rows on Home. They mirror bucketOf, which
     is a mutually exclusive cascade (silent outranks breached), so a row's count
     always equals what clicking it opens. Not due-date slices, so `queue: true`
     keeps them out of the Stage due menu. */
  /* Desk-card queues. Each mirrors its card's plain meaning DIRECTLY, not the
     mutually-exclusive bucketOf cascade — the cascade lets "silent" (15d idle)
     outrank a live breach, so a breached-but-silent ticket would vanish from the
     Overdue card. So the count always equals what clicking the card opens.
     Overdue/Due today route to the visible breached/risk slices; these three are
     card-only (queue:true, hidden from the Stage-due menu). */
  qFresh: { label: "Freshly assigned", queue: true, fn: isFresh },
  qClient: { label: "Awaiting client queue", queue: true, fn: onHold },
  qInsurer: { label: "Awaiting insurer queue", queue: true, fn: awaitingInsurer },
};

/* Tab: Working hours and holidays — the stage clock only runs inside these
   hours, so a ticket raised 6 PM Saturday is not late by Monday morning. */
const BIZ = {
  days: [1, 2, 3, 4, 5],             // Mon–Fri (PRD §8.1)
  startH: 10, endH: 19,              // 10:00–19:00 → 9 working hours/day
  // Tab: Working hours and holidays — Keka 2026 list
  holidays: ["2026-01-01", "2026-01-14", "2026-01-26", "2026-03-04", "2026-03-31",
             "2026-05-28", "2026-09-14", "2026-10-02", "2026-10-20", "2026-11-09", "2026-12-25"],
};
const DAY_LEN = BIZ.endH - BIZ.startH;
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isWorkday = (d) => BIZ.days.includes(d.getDay()) && !BIZ.holidays.includes(keyOf(d));
/* Inside working hours (Mon–Fri 10:00–19:00, minus holidays)? Drives desk presence. */
const isWorkingNow = (d) => { const h = d.getHours() + d.getMinutes() / 60; return isWorkday(d) && h >= BIZ.startH && h < BIZ.endH; };
const atH = (d, h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h), Math.round((h % 1) * 60), 0, 0);

/* Working hours between two instants */
function bizBetween(a, b) {
  if (b <= a) return 0;
  let total = 0, cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  for (let i = 0; i < 400 && cur <= b; i++) {
    if (isWorkday(cur)) {
      const s = atH(cur, BIZ.startH), e = atH(cur, BIZ.endH);
      const from = a > s ? a : s, to = b < e ? b : e;
      if (to > from) total += (to - from) / 3600000;
    }
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return total;
}
/* The instant reached after adding N working hours */
function addBiz(from, hours) {
  let left = hours, cur = new Date(from);
  for (let i = 0; i < 400; i++) {
    if (isWorkday(cur)) {
      const s = atH(cur, BIZ.startH), e = atH(cur, BIZ.endH);
      const pos = cur > s ? cur : s;
      if (pos < e) {
        const avail = (e - pos) / 3600000;
        if (left <= avail) return new Date(pos.getTime() + left * 3600000);
        left -= avail;
      }
    }
    cur = atH(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1), BIZ.startH);
  }
  return cur;
}

/* WD — "firing at the same clock time on the next working day" */
function addWD(from, days) {
  let left = days, cur = new Date(from);
  for (let i = 0; i < 400 && left > 0; i++) {
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1, cur.getHours(), cur.getMinutes());
    if (isWorkday(cur)) left -= 1;
  }
  return cur;
}

/* The instant N working hours before a given one */
function subBiz(from, hours) {
  let left = hours, cur = new Date(from);
  for (let i = 0; i < 400; i++) {
    if (isWorkday(cur)) {
      const s = atH(cur, BIZ.startH), e = atH(cur, BIZ.endH);
      const pos = cur < e ? cur : e;
      if (pos > s) {
        const avail = (pos - s) / 3600000;
        if (left <= avail) return new Date(pos.getTime() - left * 3600000);
        left -= avail;
      }
    }
    cur = atH(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1), BIZ.endH);
  }
  return cur;
}

/* Fixed demo clock: 11:00 on the next working day, so the prototype reads the
   same whenever it is opened. Production would use the live time. */
const NOW = (() => {
  let d = new Date();
  for (let i = 0; i < 10 && !isWorkday(d); i++) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return atH(d, 11);
})();
const dueAt = (h) => new Date(NOW.getTime() + h * 3600000);
function fmtWhen(d) {
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((day(d) - day(NOW)) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday"
    : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${label} ${time}`;
}
/* Working hours read badly past a day — 27h means nothing, 3 working days does */
const fmtBiz = (h) => {
  const a = Math.abs(h);
  if (a < 1) return tUnit(Math.max(1, Math.round(a * 60)), "Min.", "Mins.");   // under an hour reads in minutes
  if (a < DAY_LEN) {
    const hh = Math.floor(a), mm = Math.round((a - hh) * 60);
    return mm ? `${tUnit(hh, "Hr.", "Hrs.")} ${tUnit(mm, "Min.", "Mins.")}` : tUnit(hh, "Hr.", "Hrs.");
  }
  const d = Math.floor(a / DAY_LEN), r = Math.round(a % DAY_LEN);
  return r ? `${d} WD ${tUnit(r, "Hr.", "Hrs.")}` : `${d} WD`;
};

/* The SLA cell: state pill first, absolute deadline second.
   A countdown says how long; a deadline says when — the second is what you
   can actually plan a day around. Proportion moves to the ticket detail. */
function SlaCell({ t, stacked }) {
  const c = clock(t);
  if (c.state === "closed") return <span className="text-xs" style={{ color: C.teal }}>closed</span>;
  const over = c.state === "breached", held = c.state === "held";
  const tone = toneOf(c.state);
  const soft = over ? C.breachSoft : c.state === "atRisk" ? C.warnSoft : held ? C.waitSoft : C.tealSoft;
  return (
    <div title={held
      ? "Clock paused - item in manual review"
      : `${stageOf(t.stage).code} · ${unitLabel(c.sla, c.unit)} allowed in ${stageOf(t.stage).label}`}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bk-num text-xs font-medium"
        style={{ background: soft, color: tone }}>
        {held ? <PauseCircle size={10} /> : over ? <AlertTriangle size={10} /> : <Clock size={10} />}
        {held ? `on hold · ${c.label} left` : over ? `${c.label} over` : `${c.label} left`}
      </span>
      {stacked && (
        <div className="text-xs mt-1 truncate" style={{ color: C.figTert }}>
          {held ? `awaiting client · asked ${fmtAgo(c.heldSince)}` : `${over ? "was due " : "due "}${fmtWhen(c.due)}${c.external ? " · insurer" : ""}`}
        </div>
      )}
    </div>
  );
}

/* Column widths, verbatim from Figma 900:96152. Stage due takes the remainder —
   it holds the longest string, Client the shortest. They shrink rather than drop,
   so every column stays on screen at laptop widths. */
const COLS = {
  id:     { w: 100 },
  prio:   { w: 100 },
  stage:  { w: 200 },
  kind:   { w: 120, pr: 8 },
  age:    { w: 110 },
  client: { w: 200, pl: 8 },
  req:    { w: 250 },
};
const cell = (c, extra) => ({ width: c.w, flex: "0 1 auto", minWidth: 0,
  paddingLeft: c.pl, paddingRight: c.pr, ...extra });
const dueCell = { flex: "1 1 0", minWidth: 130 };

/* Stage due, as one line: the countdown in its tone, the deadline behind it.
   All five clock states still render — ok, at risk, breached, held, closed. */
function StageDue({ t }) {
  const c = clock(t);
  if (c.state === "closed") return <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Closed</span>;
  const over = c.state === "breached", held = c.state === "held";
  const tone = toneOf(c.state);
  return (
    <p className="leading-snug" style={{ fontSize: 14, fontWeight: 500 }}>
      <span className="bk-num" style={{ color: over ? C.semError : c.state === "atRisk" ? C.semCaution : tone }}>
        {held ? "On hold" : over ? `${c.label} over` : `${c.label} left`}
      </span>
    </p>
  );
}

function TableRow({ t, onOpen, showOwner, i = 0, last }) {
  return (
    <div>
      <button onClick={() => onOpen(t.id)} className="bk-item flex w-full items-center rounded-xl px-2 py-3 text-left hover:bg-slate-50"
        style={stagger(i)}>
        <span className="bk-num truncate" style={cell(COLS.id, { fontSize: 14, fontWeight: 500, color: C.brand })}>{t.id}</span>
        <span className="flex" style={cell(COLS.prio)}><Indicator label={t.priority} ind={PRIO_IND[t.priority]} /></span>
        <span className="flex" style={cell(COLS.stage)}><Indicator status label={statusOf(t).label} ind={stageInd(t)} /></span>
        <span className="flex" style={cell(COLS.kind)}>
          <Indicator label={kindLabel(t.kind)} ind={KIND_IND[t.kind]} />
        </span>
        <span className="bk-num truncate" style={cell(COLS.age, { fontSize: 14, fontWeight: 500, color: C.figInk })}>{fmtAge(t)}</span>
        <span className="truncate" style={cell(COLS.client, { fontSize: 14, fontWeight: 500, color: "#1C1C1C" })}>{t.client}</span>
        <span className="flex" style={cell(COLS.req)}><Indicator label={t.type} ind="neutral" /></span>
        <span style={dueCell}><StageDue t={t} /></span>
        {showOwner && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: C.subtle, color: C.figHint }} title={t.owner}>{initials(t.owner)}</span>
        )}
      </button>
      {!last && <div style={{ height: 1, background: C.lineSoft }} />}
    </div>
  );
}

function ListView({ tickets, filter, setFilter, scope, openTicket, go, preset }) {
  const [sort, setSort] = useState("urgency");
  /* Empty set means All — the same thing the old "All priorities" option meant. */
  const [prio, setPrio] = useState(() =>
    preset?.prio === "hot" ? new Set(["Critical", "High"]) : preset?.prio ? new Set([preset.prio]) : new Set());
  const [stage, setStage] = useState(new Set());
  const [slice, setSlice] = useState(() =>
    preset?.slice && preset.slice !== "all" ? new Set([preset.slice]) : new Set());
  const [kind, setKind] = useState(() => (preset?.kind ? new Set([preset.kind]) : new Set()));
  const [req, setReq] = useState(new Set());
  const [win, setWin] = useState(168);
  const [page, setPage] = useState(0);
  const [openKey, setOpenKey] = useState(null);

  const tab = TABS.find((x) => x.key === filter) ? filter : "attention";

  /* One menu open at a time; click-away and Escape close it. */
  useEffect(() => {
    if (!openKey) return;
    const away = (e) => { if (!e.target.closest("[data-menu]")) setOpenKey(null); };
    const esc = (e) => { if (e.key === "Escape") setOpenKey(null); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [openKey]);

  /* A filter change must not leave you stranded on a page that no longer exists. */
  useEffect(() => { setPage(0); }, [tab, prio, stage, slice, kind, req, win]);

  const scoped = tickets.filter((t) => !isRouting(t) && (scope === "mine" ? t.owner === "Nanditha P" : true));
  const counts = Object.fromEntries(TABS.map((x) => [x.key, scoped.filter(x.key === "recent" ? (t) => t.lastAction <= win : x.test).length]));

  const has = (s, v) => s.size === 0 || s.has(v);
  const rows = scoped
    .filter(tab === "recent" ? (t) => t.lastAction <= win : TABS.find((x) => x.key === tab).test)
    .filter((t) => slice.size === 0 || [...slice].some((k) => SLICES[k].fn(t)))
    .filter((t) => has(kind, t.kind))
    .filter((t) => has(prio, t.priority))
    .filter((t) => has(stage, statusOf(t).label))
    .filter((t) => has(req, t.type))
    .sort(SORTS[tab === "recent" ? "touched" : sort].fn);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const at = Math.min(page, pages - 1);
  const view = rows.slice(at * PAGE_SIZE, at * PAGE_SIZE + PAGE_SIZE);
  const filtered = prio.size || stage.size || slice.size || kind.size || req.size;

  const PRIO_OPTS = Object.keys(PRIORITY).map((p) => ({ value: p, label: p }));
  const KIND_OPTS = [
    { value: "Financial", label: "Financial" },
    { value: "Non-Financial", label: "Non-Financial" },
    { value: "Return-Premium", label: "Refund" },
  ];
  /* Filter on what the column actually prints, so the derived statuses — awaiting
     customer information, manual review, the terminal ones — are selectable. */
  const STAGE_OPTS = [...new Set(scoped.map((t) => statusOf(t).label))].sort().map((v) => ({ value: v, label: v }));
  const SLICE_OPTS = Object.entries(SLICES).filter(([k, v]) => k !== "all" && !v.queue)
    .map(([k, v]) => ({ value: k, label: v.label.replace(" only", "") }));
  /* Only the endorsement types actually present — nothing invented. */
  const REQ_OPTS = [...new Set(scoped.map((t) => t.type))].sort().map((v) => ({ value: v, label: v }));

  const hf = { openKey, setOpenKey };
  const head = { fontSize: 14, fontWeight: 600, color: "#1C1C1C" };

  return (
    <div className="space-y-4">
      <PageHead title="My Tickets"
        right={<StagePills counts={counts} active={tab} onPick={setFilter} />} />

      <div className="flex justify-end">
        {tab === "recent" ? (
          <div className="flex items-center gap-2 p-3" style={{ minWidth: 187, borderBottom: `1px solid ${C.brand}` }}>
            <select value={win} onChange={(e) => setWin(+e.target.value)}
              className="w-full bg-transparent outline-none" style={{ fontSize: 16, fontWeight: 500, color: C.brand }}>
              <option value={24}>Worked: Yesterday</option><option value={168}>Worked: Last week</option><option value={720}>Worked: Last month</option>
            </select>
          </div>
        ) : (
          <SortControl sort={sort} setSort={setSort} {...hf} />
        )}
      </div>

      <section className="flex flex-col gap-1">
        <div className="flex items-center rounded-xl px-2 py-3" style={{ background: C.canvas }}>
          <span style={cell(COLS.id, head)}>ID</span>
          <span style={cell(COLS.prio)}>
            <HeaderFilter id="prio" label="Priority" options={PRIO_OPTS} selected={prio} setSelected={setPrio} {...hf} />
          </span>
          <span style={cell(COLS.stage)}>
            <HeaderFilter id="stage" label="Stage" options={STAGE_OPTS} selected={stage} setSelected={setStage} {...hf} />
          </span>
          <span style={cell(COLS.kind)}>
            <HeaderFilter id="kind" label="Type" options={KIND_OPTS} selected={kind} setSelected={setKind} {...hf} />
          </span>
          <span style={cell(COLS.age, head)}>Ticket Age</span>
          <span className="truncate" style={cell(COLS.client, head)}>Client</span>
          <span style={cell(COLS.req)}>
            <HeaderFilter id="req" label="Request" options={REQ_OPTS} selected={req} setSelected={setReq} right {...hf} />
          </span>
          <span style={dueCell}>
            <HeaderFilter id="slice" label="Stage due" options={SLICE_OPTS} selected={slice} setSelected={setSlice} right {...hf} />
          </span>
          {scope === "team" && <span className="w-8 shrink-0" />}
        </div>
        {view.length
          ? view.map((t, i) => <TableRow key={t.id} t={t} i={i} last={i === view.length - 1} onOpen={openTicket} showOwner={scope === "team"} />)
          : <Empty>No tickets match these filters.</Empty>}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs" style={{ color: C.figTert }}>
        <span>
          <span className="bk-num">{rows.length}</span> of <span className="bk-num">{scoped.length}</span> tickets
          {filtered ? " · filters applied" : ""}
        </span>
        {rows.length > PAGE_SIZE && <Pager page={at} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

/* Modals ----------------------------------------------------------- *
 *  Chrome only. Portalled to <body>: the shell card carries a squircle
 *  mask, which establishes a stacking context and would otherwise clip a
 *  fixed overlay. V001.1 solves this the same way, with createPortal.
 *  The portal also supplies the font, which does not cross into <body>.
 * ------------------------------------------------------------------ */
const Overlay = ({ children, style, ...rest }) => createPortal(
  <div style={{ fontFamily: FONT, ...style }} {...rest}>{children}</div>, document.body);

/* One shell for all five: title row with a close cross (900:100703), a
   scrolling body, and a footer strip on the sunken ground. */
function ModalShell({ icon: Icon, tint = C.brand, title, sub, onClose, children, footer, width = 520, z = 40 }) {
  return (
    <Overlay className="bk-scrim fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: z, background: "rgba(28,29,31,0.45)" }} onClick={onClose}>
      <div className="bk-modal w-full overflow-hidden" style={{ maxWidth: width, background: C.white, borderRadius: 16 }}
        onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.subtle}` }}>
          {Icon && <Icon size={18} style={{ color: tint }} className="shrink-0" />}
          <div className="min-w-0 flex-1">
            <div style={{ fontSize: 18, fontWeight: 600, color: C.brand }}>{title}</div>
            {sub && <div className="mt-0.5" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: C.figTert }}>{sub}</div>}
          </div>
          <button onClick={onClose} title="Close" className="bk-iconctrl flex shrink-0 items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 8, border: `0.5px solid ${C.subtle}`, background: C.white, color: C.figHint }}><X size={18} /></button>
        </header>
        <div className="scroll-slim overflow-y-auto p-5" style={{ maxHeight: "68vh" }}>{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 px-5 py-4"
            style={{ background: C.canvas, borderTop: `1px solid ${C.subtle}` }}>{footer}</footer>
        )}
      </div>
    </Overlay>
  );
}

const FIELD = { background: C.white, border: `0.5px solid ${C.line}`, borderRadius: 10,
  padding: "10px 12px", fontSize: 14, fontWeight: 500, color: C.figInk, outline: "none" };
const FieldLabel = ({ children }) => (
  <span className="block" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{children}</span>
);
/* A tinted note that says what the action will do before it is taken. */
const Note = ({ icon: Icon, tone, bg, children }) => (
  <div className="flex items-start gap-2" style={{ background: bg, borderRadius: 10, padding: "10px 12px",
    fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: tone }}>
    <Icon size={13} className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);
const Cancel = ({ onClick }) => (
  <button onClick={onClick} className="bk-dim" style={{ padding: "12px 20px", fontSize: 14, fontWeight: 600, color: C.figHint }}>Cancel</button>
);
/* The completion tick beside a field — blue when satisfied, muted otherwise. */
const CheckDot = ({ on }) => (
  <span className="flex shrink-0 items-center justify-center rounded-full"
    style={{ width: 14, height: 14, background: on ? "#1458D2" : C.subtle }}>
    <Check size={9} strokeWidth={3} style={{ color: C.white }} />
  </span>
);
/* The corner grabber that marks a field as multi-line / resizable — the "bottom
   icon" in the DS input anatomy (TMS 1128:42313), two diagonal strokes pinned
   into the field's bottom-right. Decorative: it signifies a longer-form field. */
const ResizeGrip = ({ color = C.figTert }) => (
  <svg width={8} height={8} viewBox="0 0 8 8" fill="none" aria-hidden style={{ display: "block" }}>
    <path d="M7.5 0.5 1 7 M7.5 3.5 4 7" stroke={color} strokeWidth={1} strokeLinecap="round" />
  </svg>
);
/* A multi-line question field built to the DS multiline-input spec (Peetal
   3313:24451): a padded wrapper with a 0.5px underline that goes brand once
   filled, top-aligned so text fills downward, the tick at the top-right, and
   the resize grabber in the corner — not merely a taller single-line row. */
const MultilineField = ({ value, onChange, placeholder, rows = 2 }) => (
  <div className="relative" style={{ background: C.white, padding: 12,
    borderBottom: `0.5px solid ${value.trim() ? C.brand : C.line}` }}>
    <div className="flex items-start justify-between gap-2.5">
      <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder}
        className="min-w-0 flex-1 resize-none bg-transparent outline-none"
        style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: C.figInk }} />
      <CheckDot on={!!value.trim()} />
    </div>
    <span className="absolute" style={{ right: 0, bottom: 0, padding: 6, lineHeight: 0 }}>
      <ResizeGrip />
    </span>
  </div>
);
/* A modal footer that carries a completion bar (Figma 1032:147858 / 1040:157200):
   an orange progress line, the percent, and the commit button on the right. */
const ProgressFooter = ({ pct, onClose, onConfirm, disabled, label }) => (
  <div className="flex w-full flex-col gap-2.5">
    <div className="overflow-hidden" style={{ height: 3, borderRadius: 999, background: C.subtle }}>
      <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width .2s ease-out" }} />
    </div>
    <div className="flex items-center justify-between gap-3">
      <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{pct}% Complete</span>
      <div className="flex items-center gap-2">
        <Cancel onClick={onClose} />
        <Btn onClick={onConfirm} disabled={disabled}>{label}</Btn>
      </div>
    </div>
  </div>
);

/* Document preview. The design for this screen is not drawn yet — it keeps the
   page treatment so the sheet reads as the file it stands for. */
function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  return (
    <ModalShell z={30} width={720} icon={FileText} title={doc.name} sub={`${doc.file} · ${doc.size} · ${doc.by}`}
      onClose={onClose}
      footer={<>
        <span className="mr-auto" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>{doc.kind}</span>
        <Btn variant="outline" icon={Download} title="Download is not wired up in this prototype">Download</Btn>
      </>}>
      <div style={{ background: C.canvas, borderRadius: 12, padding: 24 }}>
        <div className="mx-auto" style={{ background: C.white, borderRadius: 10, padding: 24, maxWidth: 460, minHeight: 300,
          boxShadow: "0 1px 3px rgba(28,29,31,0.08)" }}>
          <div className="mb-4" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.figTert }}>{doc.kind}</div>
          <div className="mb-4" style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{doc.name}</div>
          {[100, 92, 96, 60, 88, 94, 70, 84, 40].map((w, i) => (
            <div key={i} className="mb-2" style={{ height: 8, width: `${w}%`, borderRadius: 4, background: C.canvas }} />
          ))}
          <div className="mt-6 flex justify-between pt-3" style={{ borderTop: `1px solid ${C.subtle}`, fontSize: 12, fontWeight: 500, color: C.figTert }}>
            <span>Preview placeholder</span><span className="bk-num">page 1 of 2</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}


/* Raise a query with the client. Three entry points, one composer:
   a fresh question, a challenge on a captured field, or a challenge on a
   document already shared. */
function QueryModal({ ctx, t, onSend, onClose }) {
  const suggested = {
    field: `The ${String(ctx.target).toLowerCase()} you shared does not match the policy schedule. Could you confirm the correct value?`,
    doc: `The ${String(ctx.target).toLowerCase()} shared is not legible / appears incomplete. Could you re-share a clear copy?`,
    missing: `We still need the ${String(ctx.target).toLowerCase()} to process this endorsement. Could you share it?`,
    new: "",
  }[ctx.kind];
  const initialDoc = ctx.kind === "doc" || ctx.kind === "missing" ? ctx.target : "";
  const [stacks, setStacks] = useState([{ text: suggested, doc: initialDoc }]);
  const options = [...new Set([...(TYPES[t.type]?.docs || []), ...t.missing, ...(ctx.target && ctx.kind !== "field" ? [ctx.target] : [])])];
  const title = { field: "Query a captured detail", doc: "Query a shared document", missing: "Request a missing item", new: "Ask the client a question" }[ctx.kind];

  const patch = (i, p) => setStacks((ss) => ss.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const addStack = () => setStacks((ss) => [...ss, { text: "", doc: "" }]);
  const dropStack = (i) => setStacks((ss) => ss.filter((_, j) => j !== i));

  const ready = stacks.every((s) => s.text.trim());
  const filled = stacks.reduce((n, s) => n + (s.text.trim() ? 1 : 0) + (s.doc ? 1 : 0), 0);
  const pct = Math.round((filled / (stacks.length * 2)) * 100);
  const send = () => onSend({ ...ctx, items: stacks.filter((s) => s.text.trim()).map((s) => ({ text: s.text.trim(), docs: s.doc ? [s.doc] : [] })) });

  return (
    <ModalShell title={title} width={560}
      sub="This will be sent to the customer's BimaKendra account."
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2.5">
          <div className="overflow-hidden" style={{ height: 3, borderRadius: 999, background: C.subtle }}>
            <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width .2s ease-out" }} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{pct}% Complete</span>
            <div className="flex items-center gap-2">
              <Btn variant="outline" onClick={addStack}>Add Another</Btn>
              <Btn onClick={send} disabled={!ready}>Create Query</Btn>
            </div>
          </div>
        </div>
      }>
      <div className="space-y-6">
        {stacks.map((s, i) => (
          <div key={i} className="space-y-5">
            {i > 0 && (
              <>
                <div className="bk-rule" aria-hidden />
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.figTert }}>Question {i + 1}</span>
                  <button onClick={() => dropStack(i)} style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>Remove</button>
                </div>
              </>
            )}
            <label className="block">
              <FieldLabel>Question to the client <span style={{ color: C.semError }}>*</span></FieldLabel>
              <div className="mt-1.5">
                <MultilineField value={s.text} onChange={(e) => patch(i, { text: e.target.value })}
                  placeholder="Example: Could you confirm the correct value against the policy schedule?" />
              </div>
            </label>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel>Documents to request <span style={{ color: C.semError }}>*</span></FieldLabel>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{options.length} Available for This Product</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.subtle}`, paddingBottom: 8 }}>
                <select value={s.doc} onChange={(e) => patch(i, { doc: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent outline-none" style={{ fontSize: 14, fontWeight: 500, color: s.doc ? C.figInk : C.figPlaceholder }}>
                  <option value="">Select Document Type</option>
                  {options.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <CheckDot on={!!s.doc} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}


/* Logging receipt manually requires the copy itself — otherwise the stage moves
   forward with nothing to send the client. */
function UploadModal({ t, onConfirm, onClose }) {
  const [file, setFile] = useState("");
  const suggested = `endorsement_${t.policy.replace(/\//g, "_")}.pdf`;
  return (
    <ModalShell icon={FileCheck2} title="Upload endorsement copy" sub={`${t.policy} · ${t.insurer}`} onClose={onClose}
      footer={<>
        <Cancel onClick={onClose} />
        <Btn disabled={!file} onClick={() => onConfirm(file)}>Log receipt</Btn>
      </>}>
      <div className="space-y-4">
        <button onClick={() => setFile(suggested)}
          className="flex w-full items-center justify-center gap-2"
          style={{ padding: "28px 12px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            border: `2px dashed ${file ? C.brand : C.line}`,
            color: file ? C.brand : C.figTert, background: file ? C.brandBg : C.white }}>
          {file ? <><FileCheck2 size={16} /> {file}</> : <><Paperclip size={16} /> Choose the endorsement copy</>}
        </button>
        <Note icon={Send} tone={C.brand} bg={C.brandBg}>
          On confirm the copy is attached to the ticket and queued for QC. Nothing is sent to the client until you send it.
        </Note>
      </div>
    </ModalShell>
  );
}


/* Customer Withdrawn (M3 FR-036/037, BR-017) — terminal, and blocked until the
   customer's withdrawal email is on file. */
function WithdrawModal({ t, onConfirm, onClose }) {
  const [file, setFile] = useState("");
  const [reason, setReason] = useState("");
  const ready = !!file && !!reason.trim();
  return (
    <ModalShell icon={XCircle} tint={C.semError} title="Mark customer withdrawn" sub={`${t.id} · ${t.client}`} onClose={onClose}
      footer={<>
        <Cancel onClick={onClose} />
        <Btn tone={C.semError} disabled={!ready} onClick={() => onConfirm({ file, reason: reason.trim() })}>Mark withdrawn</Btn>
      </>}>
      <div className="space-y-4">
        <label className="block">
          <FieldLabel>Reason recorded on the ticket</FieldLabel>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            placeholder="What did the customer ask for?" className="mt-1.5 w-full resize-none" style={FIELD} />
        </label>
        <button onClick={() => setFile(`withdrawal_request_${t.short}.eml`)}
          className="flex w-full items-center justify-center gap-2"
          style={{ padding: "22px 12px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            border: `2px dashed ${file ? C.brand : C.line}`,
            color: file ? C.brand : C.figTert, background: file ? C.brandBg : C.white }}>
          {file ? <><FileCheck2 size={16} /> {file}</> : <><Paperclip size={16} /> Upload the customer's withdrawal email</>}
        </button>
        <Note icon={AlertTriangle} tone={C.semError} bg={C.breachSoft}>
          Terminal status. Insurer communication stops, the ticket becomes read-only and cannot be reopened.
        </Note>
      </div>
    </ModalShell>
  );
}

/* Reassignment (M2 FR-020/021, BR-008/010) — reason mandatory, SLA continues. */
function ReassignModal({ t, onConfirm, onClose }) {
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const targets = Object.keys(ROLES).filter((r) => r !== t.owner && ROLES[r].role === "Servicing executive").concat([ESCALATION.serviceHead]);
  return (
    <ModalShell icon={User} title="Reassign ticket" sub={`currently ${t.owner}`} onClose={onClose}
      footer={<>
        <Cancel onClick={onClose} />
        <Btn disabled={!to || !reason} onClick={() => onConfirm({ to, reason })}>Reassign</Btn>
      </>}>
      <div className="space-y-4">
        <label className="block">
          <FieldLabel>New owner</FieldLabel>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5 w-full bg-white" style={FIELD}>
            <option value="">Select…</option>
            {targets.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <FieldLabel>Reason (mandatory, audited)</FieldLabel>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 w-full bg-white" style={FIELD}>
            <option value="">Select…</option>
            {["Out of office", "Urgent - owner unavailable", "Workload rebalancing", "Escalated to Service Head"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <Note icon={Clock} tone={C.figHint} bg={C.canvas}>
          The stage SLA continues from where it is - reassignment does not reset the clock.
        </Note>
      </div>
    </ModalShell>
  );
}


/* ------------------------------------------------------------------ *
 *  TICKET SCREEN — Figma 917:106239
 *  Two panels. The left one is the clock and the record of who did what;
 *  the right one is the work. Neither stores anything: every figure is
 *  read off the ticket by the derived functions above.
 * ------------------------------------------------------------------ */

/* 10px metadata pill — Verified, v1, a filename, a stage owner. */
const MiniTag = ({ children, tone, bg, line, title }) => (
  <span title={title} className="inline-flex shrink-0 items-center whitespace-nowrap"
    style={{ padding: "1px 4px", borderRadius: 4, fontSize: 10, fontWeight: 500, lineHeight: "14px",
      color: tone || C.figHint, background: bg || C.canvas, border: `0.5px solid ${line || C.subtle}` }}>
    {children}
  </span>
);

/* Quiet control — View, Upload, Download. */
const SoftBtn = ({ children, onClick, disabled, title, tone, bg, line }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className="bk-soft flex shrink-0 items-center gap-1.5 whitespace-nowrap"
    style={{ padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      color: disabled ? C.figDisabled : tone || C.figInk,
      background: disabled ? C.canvas : bg || C.canvas,
      border: `0.5px solid ${disabled ? C.subtle : line || C.subtle}`,
      cursor: disabled ? "not-allowed" : "pointer" }}>
    {children}
  </button>
);

/* Demo control — a dashed lavender pill (Figma), deliberately unlike a real
   action, standing in for the insurer / client / Operations. */
/* Simulate / demo control — the DS "simulation" button (Figma 1126:41654):
   a full-size dashed brand pill on a lavender fill, plus the leading dot. */
const SimBtn = ({ children, onClick, title }) => (
  <button onClick={onClick} title={title}
    className="bk-sim flex shrink-0 items-center gap-2 whitespace-nowrap"
    style={{ padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
      color: C.brand, background: C.brandBg, border: `1.5px dashed ${C.brand}` }}>
    <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, background: C.brand }} />
    {children}
  </button>
);

const IconBtn = ({ icon: Icon, onClick, title, size = 16, tone, disabled }) => (
  <button onClick={onClick} disabled={disabled} title={title} className="shrink-0"
    style={{ color: disabled ? C.figDisabled : tone || C.figTert, cursor: disabled ? "not-allowed" : "pointer" }}>
    <Icon size={size} />
  </button>
);

/* The two button weights this screen uses: a filled brand action and its
   outline twin. A blocked action keeps its place and states why on hover. */
const Btn = ({ children, onClick, disabled, title, variant = "fill", tone = C.brand, icon: Icon, trailing, size = "lg" }) => {
  const fill = variant === "fill";
  /* secondary = the neutral twin (subtle border, ink label) that glows on hover,
     like the "Back to Login" control (Figma 1172:72883). */
  const secondary = variant === "secondary";
  const xs = size === "xs";   /* matches SoftBtn — the in-panel, non-primary action size */
  const sm = size === "sm";
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`bk-btn ${fill ? "bk-btn-fill" : secondary ? "bk-btn-secondary" : "bk-btn-ghost"} flex shrink-0 items-center justify-center whitespace-nowrap ${xs ? "gap-1.5" : "gap-2"}`}
      style={{ padding: xs ? "4px 8px" : sm ? "10px 14px" : "12px 20px", borderRadius: xs ? 8 : sm ? 10 : 12,
        fontSize: xs || sm ? 12 : 14, fontWeight: 600,
        background: disabled ? C.canvas : fill ? tone : C.white,
        color: disabled ? C.figDisabled : fill ? C.white : secondary ? C.figInk : tone,
        border: `0.5px solid ${disabled ? C.subtle : secondary ? C.subtle : tone}`,
        cursor: disabled ? "not-allowed" : "pointer" }}>
      {Icon && !trailing && <Icon size={12} className="shrink-0" />}
      {children}
      {Icon && trailing && <Icon size={12} className="shrink-0" />}
    </button>
  );
};

/* lucide `clock-fading` (ISC). Not in lucide-react 0.469, so the paths are
   inlined rather than moving the whole icon package. */
const ClockFading = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
    <path d="M12 2a10 10 0 0 1 7.38 16.75" />
    <path d="M12 6v6l4 2" />
    <path d="M2.5 8.875a10 10 0 0 0-.5 3" />
    <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />
    <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />
    <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" />
  </svg>
);

/* Whose clock it is, as a person or a party rather than a role name — the same
   vocabulary the audit trail signs its lines with. */
const stageActor = (t, k) => {
  const o = stageOf(k).owner;
  return o === "insurer" ? t.insurer
    : o === "customer" ? t.client
    : o === "operations" ? "Operations"
    : o === "system" ? "Workflow engine"
    : t.owner;
};
const clockActor = (t) => stageActor(t, t.stage);

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between gap-3">
    <h3 style={{ fontSize: 18, fontWeight: 600, color: C.figInk, letterSpacing: "-0.2px" }}>{children}</h3>
    {right}
  </div>
);

/* A drawer: tinted icon, title, and a chevron that becomes a close cross once
   open. Audit trail and Workflow Stages are the same object in two places. */
function Drawer({ icon: Icon, tint = C.accent, title, open, setOpen, badge, children }) {
  return (
    <section className="w-full" style={{ background: C.white, border: `1px solid ${C.subtle}`, borderRadius: 12 }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2"
        style={{ padding: "12px 16px", borderBottom: open ? `1px solid ${C.subtle}` : "none" }}>
        <Icon size={14} style={{ color: tint }} className="shrink-0" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.figInk }}>{title}</span>
        {badge}
        <span className="flex-1" />
        {open ? <X size={14} style={{ color: C.figHint }} /> : <ChevronDown size={14} style={{ color: C.figHint }} />}
      </button>
      {open && children}
    </section>
  );
}

/* Stage marker — closed, running, not yet reached. */
const StageCheck = ({ state }) => {
  const box = { width: 18, height: 18, borderRadius: 6 };
  if (state === "done") return (
    <span className="flex shrink-0 items-center justify-center" style={{ ...box, background: C.brand }}>
      <Check size={12} strokeWidth={3} color={C.white} />
    </span>
  );
  if (state === "now") return (
    <span className="flex shrink-0 items-center justify-center" style={{ ...box, background: C.brand600 }}>
      <Minus size={12} strokeWidth={3} color={C.white} />
    </span>
  );
  return <span className="block shrink-0" style={{ ...box, background: C.white, border: `1px solid ${C.brand400}` }} />;
};

/* Eleven statuses do not fit on a strip. Group them into the phases a person
   actually thinks in, show where the ticket is, and keep the full stage-by-stage
   detail one click away. A flow that never reaches Payment loses that phase. */
const PHASES = [
  { label: "Ticket Intake",  stages: ["New / Unassigned"] },
  { label: "Verification",   stages: ["Under Verification"] },
  { label: "Insurer",        stages: ["Submitted to Insurer", "Awaiting Quote"] },
  { label: "Payment",        stages: ["Awaiting Payment Link", "Awaiting Payment"] },
  { label: "Ticket Closure", stages: ["Awaiting Endorsement Copy", "Copy Received", "Closed"] },
];

/* A stage ran over if the leg it actually took exceeds a generous calendar
   allowance for its SLA. Same conversion the strip has always used. */
function overStage(t, k) {
  const l = (t.legs || []).find((x) => x.s === k), sg = stageOf(k);
  /* System routing (SLA-01, 1 min) is not on anyone's desk; a 12-min route is
     not a servicing breach, so it never colours the phase bar. */
  if (!l || sg.sla === null || sg.system) return false;
  const cap = sg.unit === "BH" ? sg.sla * 2.7 : sg.unit === "WD" ? sg.sla * 24 : sg.unit === "CD" ? sg.sla : sg.sla / 60;
  return l.h > cap;
}

const hereOf = (t) => Math.max(0, posOf(t) >= 0 ? posOf(t) : posOf(t, t.priorStage || "Under Verification"));
const phasesOf = (t) => {
  const seq = seqOf(t);
  return PHASES.map((p) => ({ ...p, stages: p.stages.filter((k) => seq.includes(k)) })).filter((p) => p.stages.length);
};

function PhaseBar({ t }) {
  const seq = seqOf(t), here = hereOf(t);
  return (
    <div className="flex gap-3">
      {phasesOf(t).map((p) => {
        const idxs = p.stages.map((k) => seq.indexOf(k));
        const done = Math.max(...idxs) < here;
        const current = idxs.some((i) => i === here);
        const anyOver = p.stages.some((k) => overStage(t, k));
        const fill = current ? ((here - Math.min(...idxs) + 1) / p.stages.length) * 100 : done ? 100 : 0;
        const tone = anyOver ? IND.error.dot : current ? IND.caution.dot : IND.success.dot;
        return (
          <div key={p.label} className="min-w-0 flex-1">
            <div style={{ height: 3, borderRadius: 999, background: C.subtle, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${fill}%`, borderRadius: 999, background: tone }} />
            </div>
            <div className="mt-2 truncate" title={p.stages.map((k) => stageOf(k).label).join(" → ")}
              style={{ fontSize: 14, fontWeight: current ? 600 : 500, color: current ? C.figInk : C.figHint }}>
              {p.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Every stage of this ticket's flow, in order. Struck through once closed,
   LIVE while it runs. Owner, SLA code and allowance sit on the row so the
   countdown in the left panel is traceable to a rule. */
function StageList({ t }) {
  const seq = seqOf(t), here = hereOf(t);
  return (
    <div className="flex flex-col gap-2 p-3">
      {seq.map((k, i) => {
        const sg = stageOf(k), leg = (t.legs || []).find((x) => x.s === k);
        const done = i < here, now = i === here, over = overStage(t, k);
        return (
          <div key={k} className="flex items-stretch gap-3">
            <span className="relative flex shrink-0 items-center justify-center"
              style={{ width: 28, height: 40, borderRadius: 8, background: "transparent" }}>
              <span className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 8, background: now ? C.brandBg : C.canvas }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: now ? C.brand : C.figTert }} />
              </span>
              {i < seq.length - 1 && (
                <span className="absolute" style={{ top: 34, bottom: -8, left: 13.5, width: 0, borderLeft: `1px dashed ${C.line}` }} />
              )}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2"
              style={{ padding: "10px 12px", borderRadius: 8,
                background: done ? C.canvas : now ? C.brand200 : C.white,
                border: `1px solid ${done || now ? "transparent" : C.subtle}` }}>
              <span className="truncate" style={{ fontSize: 14, fontWeight: now ? 600 : 500,
                color: over ? C.semError : done ? C.figHint : C.figInk,
                textDecoration: done ? "line-through" : "none" }}>{sg.label}</span>
              <span className="flex-1" />
              {sg.owner && (() => {
                const a = actorOf(stageActor(t, k), t);
                return (
                  <span className="flex shrink-0 items-center gap-1">
                    <ActorMark a={a} size={16} />
                    <span className="whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500 }}><ActorName a={a} /></span>
                  </span>
                );
              })()}
              <span className="bk-num whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
                {sg.sla !== null ? `${sg.code} · ${unitLabel(sg.sla, sg.unit)}` : "no clock"}
              </span>
              <span className="bk-num w-20 shrink-0 whitespace-nowrap text-right"
                style={{ fontSize: 13, fontWeight: 500, color: over ? C.semError : now ? C.figInk : C.figHint }}>
                {leg ? fmtDur(leg.h) : now && isOpen(t) ? `LIVE · ${fmtDur(t.inStage)}` : "-"}
              </span>
              <StageCheck state={done ? "done" : now ? "now" : "next"} />
            </div>
          </div>
        );
      })}
      <p className="px-1 pt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>
        The middle figure is the SLA in its own unit (BH / WD / CD / min); the right one is calendar time actually taken.
        A dash means the ticket has not reached that stage.
      </p>
    </div>
  );
}

/* The stage clock, in the unit its SLA is written in. Renders ok, at risk,
   breached, held, and stages that carry no clock at all. */
function SlaCard({ t }) {
  const st = stageOf(t.stage), s = clock(t);
  const tone = toneOf(s.state);
  const held = s.state === "held" || onHold(t);
  const noClock = st.sla === null || s.state === "closed";
  const head = noClock ? (isTerminal(t) ? "Clock stopped" : "No clock on this stage")
    : held ? "On hold"
    : s.state === "breached" ? `${s.label} over` : `${s.label} left`;
  /* Fill + colours, verbatim from Figma 1040:158796: a white→semantic-subtle
     gradient card with a matching subtle border, and the brighter solid
     semantics for the head text and the remaining-time bar. */
  const sk = noClock ? { grad: C.canvas, border: C.subtle, head: C.figHint, remain: C.subtle }
    : held ? { grad: C.waitSoft, border: "#C7CCEB", head: C.wait, remain: C.wait }
    : s.state === "breached" ? { grad: "#FFECEC", border: "#FFABAB", head: "#CF0000", remain: "#F10000" }
    : s.state === "atRisk" ? { grad: "#FFF9E6", border: "#FFE890", head: "#B38F0A", remain: "#FFCF0E" }
    : { grad: "#ECFBEA", border: "#A9EAA2", head: "#007B00", remain: "#00B200" };
  return (
    <div style={{ background: `linear-gradient(180deg, ${C.white} 50%, ${sk.grad} 100%)`,
      border: `0.5px solid ${sk.border}`, borderRadius: 12, padding: "14px 16px 20px" }}>
      <div className="flex items-baseline justify-between gap-2">
        <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert, lineHeight: 1.2 }}>Ticket Stage Timeline</span>
        {st.code && (() => {
          const a = actorOf(clockActor(t), t);
          return (
            <span className="flex items-center gap-1.5" title={`${st.code} · ${unitLabel(st.sla, st.unit)}`}>
              <ActorMark a={a} />
              <span style={{ fontSize: 12, fontWeight: 500 }}><ActorName a={a} /></span>
            </span>
          );
        })()}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, color: sk.head }}>{head}</div>
      {!noClock && (() => {
        /* The bar reads REMAINING time and drains right-to-left: a state-toned
           segment on the LEFT (green when ok, amber at-risk) for what's left,
           over a red track that shows through on the right for what's gone. A
           breached clock has no remaining segment — the track is all red, no bar
           left, just the red container (Figma 1040:158796). */
        const usedPct = s.state === "breached" ? 100 : Math.max(0, Math.min(100, s.used));
        const leftPct = Math.max(0, 100 - usedPct);
        return (
        <>
          <div className="mt-2 overflow-hidden" style={{ height: 3, borderRadius: 999, background: "#F10000",
            boxShadow: "0px 2px 8px 0px rgba(169,172,177,0.24)" }}>
            <div style={{ height: "100%", background: sk.remain, width: `${leftPct}%`,
              opacity: held ? 0.5 : 1, transition: "width .3s ease-out" }} />
          </div>
          <p className="mt-2" style={{ fontSize: 14, fontWeight: 500, color: C.figPlaceholder }}>
            <span style={{ color: held ? C.wait : tone }}>{unitLabel(s.sla, s.unit)} total</span>
            {` • ${fmtDur(Math.max(0, (NOW - s.entered) / 3600000))} elapsed`}
          </p>
          <div className="mt-2 flex items-start gap-1.5 py-1" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>
            <span className="mt-0.5"><ClockFading size={14} color={C.figInk} /></span>
            <span>{s.state === "breached" ? "Was due" : "Due"} {fmtWhen(s.due)}</span>
          </div>
          {held && (
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 500, color: C.wait }}>
              <PauseCircle size={12} className="shrink-0" />
              {t.manualReview ? "Paused for manual review" : "Paused while the client answers an open query"}
            </div>
          )}
        </>
        );
      })()}
    </div>
  );
}

/* Three counters beside the clock. Each is derived from the ticket — the
   prototype holds no bot-confidence figure for a non-financial endorsement,
   so intake completeness takes that slot instead of an invented number. */
function StatCard({ label, value, tone, icon: Icon, grow, dense, stack, title }) {
  return (
    <div className="min-w-0" title={title}
      style={{ flex: stack ? "0 0 auto" : grow ? "1 1 40%" : "1 1 0", minWidth: dense || stack ? 0 : 132,
        background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: dense ? "10px 12px" : stack ? "14px 16px" : "11px 17px" }}>
      <div className={`flex ${dense || stack ? "items-start" : "items-center"} justify-between gap-2`}>
        <div className="min-w-0 flex-1">
          <div className={dense ? "" : "truncate"} style={{ fontSize: dense ? 11 : 12, fontWeight: 500, color: C.figTert, lineHeight: 1.25 }}>{label}</div>
          <div className="bk-num truncate" style={{ fontSize: dense ? 16 : 18, fontWeight: tone ? 600 : 500, lineHeight: 1.2, color: tone || C.figHint, marginTop: dense || stack ? 6 : 0 }}>{value}</div>
        </div>
        {Icon && <Icon size={dense ? 14 : 16} className="shrink-0" style={{ color: C.figTert }} />}
      </div>
    </div>
  );
}

/* Insurer round-trips: how many times this ticket has sat on an insurer clock.
   Derived from the legs, never stored. Customer cycles are the query count. */
const insurerCycles = (t) =>
  (t.legs || []).filter((l) => stageOf(l.s).owner === "insurer").length +
  (isOpen(t) && stageOf(t.stage).owner === "insurer" ? 1 : 0);

/* Tabs sit above the panel and share its top edge. */
function TabBar({ tabs, tab, setTab }) {
  return (
    /* Right-aligned when they fit; when they do not, `ml-auto` collapses to zero
       and the row scrolls from the left, so the active tab is never hidden. */
    <div className="scroll-slim flex min-w-0 overflow-x-auto px-3">
      <div className="ml-auto flex items-center gap-1">
      {tabs.map(([k, label, off]) => {
        const on = tab === k;
        return (
          <button key={k} disabled={off} onClick={off ? undefined : () => setTab(k)}
            title={off ? "Nothing to manage on a closed ticket" : undefined}
            className={`flex h-10 shrink-0 items-center justify-center whitespace-nowrap transition-colors ${!on && !off ? "bk-tab" : ""}`}
            style={{ background: on ? "rgba(65,0,207,0.08)" : "transparent",
              borderBottom: `2px solid ${on ? C.brand : "transparent"}`,
              borderTopLeftRadius: 8, borderTopRightRadius: 8,
              /* six tabs only appear on a financial ticket; give them room */
              padding: tabs.length > 5 ? "0 8px" : "0 12px",
              fontSize: 14, fontWeight: 500,
              color: off ? C.figDisabled : on ? C.brand : C.figInk,
              cursor: off ? "not-allowed" : "pointer" }}>
            {label}
          </button>
        );
      })}
      </div>
    </div>
  );
}

/* The work panel: a scrolling body between a fixed top edge and a footer
   strip that carries this tab's actions. */
function PanelCard({ children, footer }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.brand200}`, borderRadius: 12 }}>
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      {footer && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 p-3"
          style={{ background: C.canvas, borderTop: `1px solid ${C.subtle}` }}>{footer}</div>
      )}
    </div>
  );
}

/* One line of the story: what happened, its evidence beneath, then who signed
   it and how long ago. Figma 802:65143. */
function TrailRow({ h, t, last }) {
  const a = actorOf(h.by, t);
  return (
    <div>
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="bk-mark shrink-0" style={{ marginTop: 7 }} aria-hidden />
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: C.figInk }}>{h.text}</span>
          </div>
          {h.note && (
            <div style={{ paddingLeft: 20, fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: C.figTert }}>{h.note}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <ActorMark a={a} />
          <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 500 }}><ActorName a={a} /></span>
          <span className="hidden sm:inline" style={{ fontSize: 13, color: C.figTert }}>·</span>
          <span className="bk-num whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>{fmtAgoLong(h.at)}</span>
        </div>
      </div>
      {!last && <div className="bk-trail" aria-hidden />}
    </div>
  );
}

/* Update Quote (M5) — the SM revises the premium; every update is stored as a
   new version, nothing overwritten. Ported from prototype2 onto the BimaEndorse
   modal shell. The handler (onRevise) keeps the prior versions. */
function UpdateQuoteModal({ t, onConfirm, onClose }) {
  const q = t.quote;
  const [base, setBase] = useState(String(q.base));
  const [gst, setGst] = useState(String(q.gst));
  const [gstTouched, setGstTouched] = useState(false);
  const [file, setFile] = useState("");
  const [reason, setReason] = useState("");
  const b = Number(base) || 0, g = Number(gst) || 0;
  const setBaseAnd = (v) => { setBase(v); if (!gstTouched) setGst(String(Math.round((Number(v) || 0) * 0.18))); };
  const changed = b !== q.base || g !== q.gst || !!file;
  const ready = changed && b > 0 && reason.trim();

  const pct = Math.round((((b > 0 && changed) ? 1 : 0) + (reason.trim() ? 1 : 0)) / 2 * 100);
  const numField = (label, value, onChange, on) => (
    <label className="block">
      <FieldLabel>{label} <span style={{ color: C.semError }}>*</span></FieldLabel>
      <div className="mt-1 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.subtle}`, paddingBottom: 8 }}>
        <span style={{ fontSize: 14, color: C.figTert }}>₹</span>
        <span style={{ width: 1, height: 14, background: C.subtle }} />
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          className="bk-num min-w-0 flex-1 bg-transparent outline-none" style={{ fontSize: 15, fontWeight: 500, color: C.figInk }} />
        <CheckDot on={on} />
      </div>
    </label>
  );

  return (
    <ModalShell tint={C.brand} title="Update Quote" width={560}
      sub={`Saving as v${q.version + 1}. The previous version is kept and remains viewable.`}
      onClose={onClose}
      footer={<ProgressFooter pct={pct} onClose={onClose} disabled={!ready} label={`Save v${q.version + 1}`}
        onConfirm={() => onConfirm({ base: b, gst: g, file: file || q.file, reason: reason.trim() })} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-5">
          {numField("Base premium", base, setBaseAnd, b > 0 && changed)}
          {numField("GST", gst, (v) => { setGstTouched(true); setGst(v); }, false)}
        </div>
        <div className="flex items-baseline justify-between" style={{ background: C.brandBg, borderRadius: 10, padding: "12px 14px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>Revised total payable</span>
          <span className="bk-num" style={{ fontSize: 18, fontWeight: 600, color: C.brand }}>{money(b + g)}</span>
        </div>
        <label className="block">
          <FieldLabel>Reason for Update <span style={{ color: C.semError }}>*</span></FieldLabel>
          <div className="mt-1 flex items-start gap-2.5" style={{ borderBottom: `1px solid ${C.subtle}`, paddingBottom: 8 }}>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Why is the quote being updated?"
              className="min-w-0 flex-1 resize-none bg-transparent outline-none" style={{ fontSize: 14, fontWeight: 500, color: C.figInk }} />
            <CheckDot on={!!reason.trim()} />
          </div>
        </label>
        <div>
          <FieldLabel>Replace Quote Copy</FieldLabel>
          <button onClick={() => setFile(`quote_${t.policy.replace(/\//g, "_")}_v${q.version + 1}.pdf`)}
            className="mt-1 flex w-full flex-col items-center justify-center gap-1 border-2 border-dashed"
            style={{ borderColor: file ? C.brand : C.brand200, borderRadius: 12, padding: "22px 12px",
              background: file ? C.brandBg : "#FBFAFF", color: C.brand }}>
            {file
              ? <><FileCheck2 size={18} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{file}</span></>
              : <><Upload size={18} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Revised Quote Copy</span>
                  <span style={{ fontSize: 12, color: C.figTert }}>click to browse or drag and drop the file here</span></>}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* Ticket — Figma 1040:158792 --------------------------------------- *
 *  Header (id + chips, no action button), an ikkat rule, then a narrow left
 *  stack — the stage-timeline clock and three metric counters — and a wide
 *  Action Panel: tabs of work (Overview, Documents, Query Line, Mail Trail,
 *  Ticket Trail, Payment, Manage) over ONE persistent footer that carries the
 *  audit note and the primary stage action on every tab.
 * ------------------------------------------------------------------ */
function Detail({ t, onAdvance, onAttachCopy, onChase, onQuery, onAnswer, onSendCopy, onWithdraw, onReassign, onManualReview, onChangeType, onRemind, onQc, onReceiveLink, onRevise, onRegenerate, onRevertPayment }) {
  const [tab, setTab] = useState("overview");
  const [ask, setAsk] = useState(null);
  const [upload, setUpload] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(null);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [updatingQuote, setUpdatingQuote] = useState(false);
  const [quoteHistOpen, setQuoteHistOpen] = useState(false);
  const st = stageOf(t.stage);
  const s = clock(t);
  const docs = useMemo(() => docsOf(t), [t]);
  const intake = useMemo(() => intakeOf(t), [t]);
  const queries = t.queries || [];
  const endo = endoOf(t);
  const sends = sendsOf(t);
  const qcDone = !!t.qcPassed;
  const openQ = queries.filter((q) => q.status === "open");
  /* A captured value or document can be challenged with the client only while
     the desk still holds the ticket — i.e. before it is submitted to the insurer.
     Once it goes to the insurer the intake is locked, so the Query controls
     disappear. A query routes it to Awaiting Customer Information and returns to
     the prior stage once answered. */
  const canAsk = !readOnly(t) && !atOrPast(t, "Submitted to Insurer");
  const rem = remindersOf(t);
  const payLeft = t.payLink ? t.payLink.expiresIn - (t.stage === "Awaiting Payment" ? t.inStage : 0) : 0;
  const payExpired = !!t.payLink && payLeft <= 0;
  const thread = useMemo(() => mailOf(t), [t]);
  const pendingDocs = docs.filter((d) => d.status === "Awaiting").length;
  const pendingAll = pendingDocs + fieldGaps(t);

  /* Mandatory intake, straight off the type master — the figure the Intake
     counter reports and the thing that blocks submission to the insurer. */
  const mandTotal = (TYPES[t.type]?.fields || []).length + (TYPES[t.type]?.docs || []).length;
  const mandGaps = gapCount(t);

  /* The next action, resolved once and used in both the header and the footer
     so the two can never disagree. Predicates unchanged. */
  /* Intake is complete at creation (the bot collects everything first), so
     submission is never blocked on intake — only on an open client query. */
  const advBlocked = (t.stage === "Under Verification" && openQ.length > 0) ||
    (t.stage === "Copy Received" && (!endo || !qcDone || !sends.length));
  const advLabel = st.verb;
  const advHint = t.stage === "Copy Received" && (!endo || !qcDone || !sends.length)
    ? "Blocked: send the endorsement copy to the client before closing."
    : t.stage === "Under Verification" && openQ.length > 0
    ? "Blocked: waiting on the client to answer an open query."
    : "Advancing closes this stage's clock and stamps its duration on the ticket.";
  const doAdvance = () => { onAdvance(t.id, note); setNote(""); };
  const showAdvance = st.verb && !readOnly(t);

  /* Stages the desk cannot leave on its own: an outside party has to act first.
     The prototype has no insurer and no Operations, so it offers a ▶ stand-in. */
  const simulate = readOnly(t) ? null
    : t.stage === "Awaiting Endorsement Copy"
      ? { label: `Simulate ${t.insurer} sending the copy`, run: () => onAttachCopy(t.id, {}) }
    : t.stage === "Awaiting Payment Link"
      ? { label: `Simulate the link arriving ${t.payMode === "Portal" ? `from ${t.childTicket}` : "in the insurer's mail"}`, run: () => onReceiveLink(t.id) }
    : null;

  const TABS_T = [
    ["overview", "Overview"],
    ["docs", "Document Vault"],
    ["queries", "Client Channel"],
    ["mail", "Mail Trail"],
    ["trail", "Ticket History"],
    ...(t.kind === "Financial" ? [["payment", "Premium & Payment"]] : []),
    ["manage", "Manage Ticket", readOnly(t)],
  ];
  const live = TABS_T.some(([k, , off]) => k === tab && !off) ? tab : "overview";

  /* The client's own marks where we hold them: the product rosette and the
     insurer's wordmark, then the owner's photograph. Anything not on file
     falls back to a glyph rather than a stand-in logo. */
  const meta = [
    { text: t.client, icon: User },
    { text: t.policy, icon: FileText, num: true },
    { text: t.product, icon: Layers, img: PRODUCT_ICON[t.product], imgH: 24 },
    { text: t.insurer, icon: ShieldCheck, img: INSURER_LOGO[t.insurer], imgH: 22 },
  ];

  /* Row chrome shared by Captured at intake and the Document Vault. */
  const FileTile = ({ icon: Icon = FileText }) => (
    <span className="flex shrink-0 items-center justify-center"
      style={{ width: 32, height: 32, borderRadius: 8, background: C.cream, border: "0.5px solid #FFD2A8" }}>
      <Icon size={16} style={{ color: C.brand }} />
    </span>
  );
  const OK = { tone: "#007B00", bg: "rgba(0,178,0,0.08)", line: "#A9EAA2" };
  const PEND = { tone: C.warn, bg: "rgba(255,119,0,0.08)", line: "#FFD2A8" };

  const noteField = (
    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional Note for Audit Trail"
      className="min-w-0 flex-1 outline-none"
      style={{ maxWidth: 420, background: C.white, border: `0.5px solid ${C.subtle}`, borderRadius: 10,
        padding: "12px", fontSize: 14, fontWeight: 500, color: C.figInk }} />
  );

  /* One persistent footer for the whole Action Panel: the audit note plus the
     stage's primary action, shown on every tab. Secondary, tab-scoped actions
     (Ask the client, Upload, Chase, Reassign) live inside their own tabs. */
  const stageAction = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {simulate && (
        <SimBtn onClick={simulate.run} title="Demo control - stands in for the outside party">{simulate.label}</SimBtn>
      )}
      {t.stage === "Awaiting Endorsement Copy" && !endo && !readOnly(t) && (
        <Btn variant="secondary" onClick={() => setUpload(true)}>Log manually - upload copy</Btn>
      )}
      {showAdvance && (
        <Btn onClick={doAdvance} disabled={advBlocked} title={advBlocked ? advHint : undefined}>{advLabel}</Btn>
      )}
    </div>
  );
  const panelFooter = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {!readOnly(t) && noteField}
      </div>
      {!readOnly(t) && stageAction}
    </>
  );

  return (
    <div>
      {/* header — id + status on the left; classification chips and the people
          on the right. No action button here: the primary action lives at the
          bottom of the Action Panel, reachable from every tab. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="bk-num" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, color: C.brand }}>{t.id}</span>
          <Indicator status big label={statusOf(t).label} ind={stageInd(t)} size={16} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Indicator thick label={t.priority} ind={PRIO_IND[t.priority]} />
          <Indicator thick label={kindLabel(t.kind)} ind={KIND_IND[t.kind]} />
          <Indicator thick label={t.type} ind="neutral" />
          <Participants t={t} down />
        </div>
      </div>

      {/* a 0.5px hairline separates the identity row from the contract meta */}
      <div className="my-4" style={{ height: 0.5, background: C.subtle }} aria-hidden />

      {/* meta row: client · policy · product · insurer */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {meta.map((m) => (
          <span key={m.text} title={m.title} className="flex items-center gap-1.5">
            <span className={m.num ? "bk-num" : ""} style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>{m.text}</span>
            {m.img
              ? <img src={m.img} alt="" className="shrink-0" style={{ height: m.imgH, width: "auto" }} />
              : <m.icon size={16} style={{ color: C.figInk }} className="shrink-0" />}
          </span>
        ))}
      </div>

      <div className="bk-rule my-5" aria-hidden />

      {/* Two panels: a narrow left rail — the stage-timeline clock and three
          metric counters — beside the wide Action Panel where the work happens. */}
      <div className="flex" style={{ gap: 28, height: "calc(100vh - 264px)", minHeight: 480 }}>

        {/* left - the stage timeline and the metrics */}
        <div className="scroll-slim flex min-h-0 shrink-0 flex-col gap-4 overflow-y-auto pr-1"
          style={{ flex: "0 0 340px", minWidth: 300, paddingTop: 40 }}>
          <SlaCard t={t} />
        </div>

        {/* right - the Action Panel: tabs of work over one persistent footer */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TabBar tabs={TABS_T} tab={live} setTab={setTab} />

          <PanelCard footer={panelFooter}>
            {live === "overview" && (
              <div className="space-y-5">
                <SectionTitle right={<span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Ticket Age: <span className="bk-num" style={{ color: C.figInk }}>{fmtAge(t)}</span></span>}>Ticket Workflow</SectionTitle>
                <PhaseBar t={t} />
                <Drawer icon={ListChecks} title="Workflow Stages" open={stagesOpen} setOpen={setStagesOpen}
                  badge={<MiniTag>{seqOf(t).length} stages</MiniTag>}>
                  <StageList t={t} />
                </Drawer>

                <div className="bk-rule" aria-hidden />

                <SectionTitle right={<MiniTag {...OK}>complete</MiniTag>}>Captured at Ticket Intake</SectionTitle>
                <div className="grid gap-y-5">
                  {intake.map((f) => (
                    <div key={f.label} className="min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{f.label}</div>
                      <div className="mt-1 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.subtle}`, paddingBottom: 8 }}>
                        <span className="min-w-0 flex-1 truncate" style={{ fontSize: 15, fontWeight: 500, color: C.figInk }}>{f.value}</span>
                        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 14, height: 14, background: "#1458D2" }}>
                          <Check size={9} strokeWidth={3} style={{ color: C.white }} />
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-end gap-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>
                        <span>Captured at Ticket Intake</span>
                        {canAsk && (
                          <button onClick={() => setAsk({ kind: "field", target: f.label })} style={{ fontSize: 12, fontWeight: 600, color: C.link }}>Query</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!intake.length && <Empty>This endorsement type has no mandatory fields.</Empty>}
                </div>

                {endo && (
                  <>
                    <div className="bk-rule" aria-hidden />
                    <SectionTitle right={qcDone ? <MiniTag {...OK}>QC passed</MiniTag> : <MiniTag {...PEND}>awaiting QC</MiniTag>}>
                      Endorsement copy
                    </SectionTitle>
                    <div className="flex flex-wrap items-start gap-3" style={{ borderRadius: 8, padding: 8 }}>
                      <FileTile icon={FileCheck2} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.figInk }}>Endorsement copy</span>
                          <MiniTag>{endo.file}</MiniTag>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>
                          {endo.size} · {endo.source === "bot" ? `fetched from ${t.insurer}'s mail by the bot` : `uploaded by ${endo.by}`} · {fmtAgo(endo.at)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <SoftBtn onClick={() => setPreview({ name: "Endorsement copy", kind: endo.source === "bot" ? "Fetched by bot" : "Uploaded manually", file: endo.file, size: endo.size, by: endo.by, status: "Verified", at: endo.at })}>View</SoftBtn>
                        <IconBtn icon={Download} title="Download is not wired up in this prototype" />
                        {!qcDone && !readOnly(t) && (
                          <SoftBtn onClick={() => onQc(t.id)} tone={C.warn} bg={C.warnSoft} line={C.warnSoft}>Pass QC</SoftBtn>
                        )}
                        <Btn size="xs" onClick={() => onSendCopy(t.id)} disabled={!qcDone || readOnly(t)}
                          title={qcDone ? "Mails the copy to the client" : "Pass QC first - the client should not receive an unchecked copy"}>
                          Send to customer
                        </Btn>
                      </div>
                    </div>
                    <div className="px-2">
                      {sends.map((x, i) => (
                        <div key={i} className="flex items-center gap-2 py-1" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>
                          {i === 0 ? <Send size={12} style={{ color: C.teal }} /> : <CornerUpLeft size={12} style={{ color: C.wait }} />}
                          {i === 0 ? `Sent by ${x.by}` : `Resent by ${x.by}`}
                          <span style={{ color: C.figTert }}>· {fmtAgo(x.at)}</span>
                        </div>
                      ))}
                      {!sends.length && (
                        <div className="flex items-center gap-1.5" style={{ fontSize: 14, fontWeight: 500, color: qcDone ? C.warn : C.figTert }}>
                          <FileClock size={12} /> {qcDone ? "Passed QC but not sent - the client is still waiting." : "Not sent - awaiting QC."}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {live === "docs" && (
              <div className="flex min-h-full flex-col gap-4">
              <div className="space-y-4">
                <SectionTitle right={<MiniTag {...OK}>all received</MiniTag>}>Documents</SectionTitle>
                <div className="flex flex-col gap-1">
                  {docs.map((d, i) => (
                    <div key={i} className="flex items-start gap-3" style={{ borderRadius: 8, padding: 8 }}>
                      <FileTile icon={FileCheck2} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.figInk }}>{d.name}</span>
                          <MiniTag {...OK}>{d.status} · {d.kind.toLowerCase()}</MiniTag>
                          <MiniTag>{d.file}</MiniTag>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>{`${d.size} · ${d.by} · ${fmtAgo(d.at)}`}</div>
                        {d.status === "Verified" && (
                          <div className="flex items-center gap-1" style={{ fontSize: 14, fontWeight: 500, color: C.brand }}>
                            <BadgeCheck size={14} className="shrink-0" />
                            {{ "Client submission": "Verified against the request",
                               "Client portal": "Answered in the client portal",
                               "Fetched by bot": `Fetched from ${t.insurer}'s mail by the bot`,
                               "Uploaded manually": "Logged manually by the owner" }[d.kind] || d.kind}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {canAsk && (
                          <SoftBtn onClick={() => setAsk({ kind: "doc", target: d.name })} tone={C.figInk}>Query</SoftBtn>
                        )}
                        <SoftBtn onClick={() => setPreview(d)}>View</SoftBtn>
                        <IconBtn icon={Eye} title="Quick look" onClick={() => setPreview(d)} />
                        <IconBtn icon={Download} title="Download is not wired up in this prototype" />
                      </div>
                    </div>
                  ))}
                  {!docs.length && <Empty>No documents on this ticket.</Empty>}
                </div>
              </div>
            </div>
          )}

          {live === "queries" && (
            <div className="flex min-h-full flex-col gap-4">
              <div className="space-y-4">
                <SectionTitle right={openQ.length > 0 ? <MiniTag tone={C.wait} bg={C.waitSoft} line={C.waitSoft}>{openQ.length} open</MiniTag> : null}>
                  Client Channel
                </SectionTitle>
                {queries.length ? (
                  <div className="flex flex-col gap-1">
                    {queries.map((q) => (
                      <div key={q.id} style={{ borderRadius: 8, padding: 8 }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              {q.status === "open"
                                ? <MiniTag tone={C.wait} bg={C.waitSoft} line={C.waitSoft}>Awaiting client</MiniTag>
                                : <MiniTag {...OK}>Answered</MiniTag>}
                              <MiniTag>{{ field: "On a captured detail", doc: "On a shared document", missing: "Missing item", new: "New question" }[q.kind]}</MiniTag>
                              {q.target && <MiniTag>{q.target}</MiniTag>}
                            </div>
                            {(q.items && q.items.length ? q.items : [{ text: q.text, docs: q.docs || [] }]).map((it, ix, arr) => (
                              <div key={ix} className={ix > 0 ? "mt-2" : ""}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>{arr.length > 1 ? `${ix + 1}. ` : ""}{it.text}</div>
                                {it.docs?.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {it.docs.map((d) => <MiniTag key={d}><Paperclip size={9} /> {d}</MiniTag>)}
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="mt-1.5" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>
                              {q.by} · asked {fmtAgo(q.at)}{q.status === "answered" ? ` · answered ${fmtAgo(q.answeredAt)}` : ""}
                            </div>
                          </div>
                          {q.status === "open" && (
                            <SimBtn onClick={() => onAnswer(t.id, q.id)}
                              title="Demo control - the client answers this query in the portal">Simulate portal response</SimBtn>
                          )}
                        </div>

                        {q.reply && (
                          <div className="mt-3 pl-3" style={{ borderLeft: `2px solid ${C.brand200}` }}>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Globe size={12} style={{ color: C.brand }} />
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.figInk }}>Client portal response</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>{q.reply.by} · {fmtAgo(q.reply.at)}</span>
                              <MiniTag tone={C.brand} bg={C.brandBg} line={C.brand200}><Link2 size={9} /> against {q.id}</MiniTag>
                            </div>
                            {Object.entries(q.reply.values || {}).map(([k, v]) => (
                              <div key={k} className="mb-2">
                                <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{k}</div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>{v}</div>
                              </div>
                            ))}
                            {q.reply.note && (
                              <div className="mb-2" style={{ background: C.canvas, borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, color: C.figInk }}>{q.reply.note}</div>
                            )}
                            {q.reply.files?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {q.reply.files.map((f) => (
                                  <SoftBtn key={f.name} onClick={() => setPreview({ name: f.name, kind: "Client portal upload", file: f.file, size: f.size, by: q.reply.by, status: "Received", at: q.reply.at })}>
                                    <Paperclip size={10} style={{ color: C.brand }} /> {f.file}
                                  </SoftBtn>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{ background: C.canvas, borderRadius: 8, minHeight: 260, padding: 24 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>No queries raised. The client has given us everything we asked for.</span>
                  </div>
                )}
              </div>
              <div className="mt-auto flex justify-end pt-1">
                <Btn size="xs" onClick={() => setAsk({ kind: "new", target: null })} disabled={!canAsk}
                  title={canAsk ? "Raise a query with the client" : "Intake can only be queried before the ticket goes to the insurer"}>
                  Ask Client
                </Btn>
              </div>
            </div>
          )}

          {live === "mail" && (
            <div className="flex min-h-full flex-col gap-4">
              {summary ? (
                <div className="space-y-4">
                  <SectionTitle>Mail Trail Summary</SectionTitle>
                  <div className="flex items-start gap-3">
                    <span className="flex shrink-0 items-center justify-center"
                      style={{ width: 40, height: 40, borderRadius: 999, background: C.brand200 }}>
                      <Sparkles size={16} style={{ color: C.brand }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>Endorsement workflow bot</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Summary generated {fmtWhen(NOW)}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>Internal · ticket log</div>
                      <div className="mt-3 space-y-2">
                        {summary.map((l, i) => (
                          <p key={i} style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: C.figInk }}>{l}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <SectionTitle>Mail Trail</SectionTitle>
                  <div>
                    {thread.map((m, i) => {
                      const kind = m.dir === "out" ? "owner" : m.name === t.insurer ? "insurer" : "client";
                      return (
                        <div key={i}>
                          <div className="flex items-start gap-3">
                            <Mark kind={kind} name={m.name} size={40} ring={false} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{m.name}</span>
                                <span className="bk-num shrink-0" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{fmtAgo(m.at)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5" style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>
                                {m.dir === "out" ? `to ${m.to}` : m.who}
                                {m.link === "manual" && <MiniTag tone={C.wait} bg={C.waitSoft} line={C.waitSoft}><Link2 size={9} /> linked manually</MiniTag>}
                                {m.queryRef && <MiniTag tone={C.brand} bg={C.brandBg} line={C.brand200}><Globe size={9} /> portal · {m.queryRef}</MiniTag>}
                              </div>
                              <div className="mt-2" style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{m.subject}</div>
                              <div className="mt-1 whitespace-pre-line" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: C.figInk }}>{m.body}</div>
                              {m.att > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {docs.slice(0, m.att).map((d, j) => (
                                    <SoftBtn key={j} onClick={() => setPreview(d)}>
                                      <Paperclip size={10} style={{ color: C.figTert }} /> {d.file}
                                    </SoftBtn>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {i < thread.length - 1 && <div className="bk-rule my-4 opacity-40" aria-hidden />}
                        </div>
                      );
                    })}
                    {!thread.length && <Empty>Nothing on the mail trail yet.</Empty>}
                  </div>
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
                {awaitingInsurer(t) && (
                  <Btn size="xs" variant="outline" tone={C.figHint} onClick={() => onChase(t.id)}>Chase insurer</Btn>
                )}
                <Btn size="xs" variant="outline"
                  onClick={() => setSummary(summary ? null : summariseThread(t))}>
                  {summary ? "Read mail trail" : "Summarise this trail"}
                </Btn>
              </div>
            </div>
          )}

          {/* Ticket Trail — the audit history, relocated from the left rail into
              its own tab. Reverse-chronological, actor + timestamp on the right. */}
          {live === "trail" && (
            <div className="space-y-1">
              <SectionTitle right={<MiniTag>{(t.history || []).length} entries</MiniTag>}>Ticket History</SectionTitle>
              <div>
                {(t.history || []).slice().reverse().map((h, i, all) => (
                  <TrailRow key={i} h={h} t={t} last={i === all.length - 1} />
                ))}
                {!(t.history || []).length && <Empty>Nothing logged yet.</Empty>}
              </div>
            </div>
          )}

          {live === "payment" && (
            <div className="space-y-3">
                {/* M5 — quote & premium */}
                <div className="space-y-4">
                  <SectionTitle right={t.quote && <MiniTag {...OK}><FileCheck2 size={10} /> {t.quote.file}</MiniTag>}>Quote &amp; premium</SectionTitle>
                  {t.quote ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        {[["Base premium", money(t.quote.base)], ["GST (18%)", money(t.quote.gst)],
                          ["Total payable", money(t.quote.total), true], ["Quote version", `v${t.quote.version}`]].map(([k, v, big]) => (
                          <div key={k}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{k}</div>
                            <div className="bk-num mt-0.5" style={{ fontSize: big ? 18 : 14, fontWeight: big ? 600 : 500, color: big ? C.brand : C.figInk }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <Drawer icon={ListChecks} title="Version history" open={quoteHistOpen} setOpen={setQuoteHistOpen}
                        badge={<MiniTag>{(t.quoteVersions || [t.quote]).length}</MiniTag>}>
                        <div className="flex flex-col px-3 py-1">
                          {[...(t.quoteVersions || [t.quote])].reverse().map((v) => (
                            <div key={v.version} className="flex items-center gap-2 py-1.5" style={{ fontSize: 14, fontWeight: 500 }}>
                              <span className="bk-num shrink-0" style={{ width: 26, color: C.figTert }}>v{v.version}</span>
                              <span className="bk-num" style={{ color: v.version === t.quote.version ? C.figInk : C.figTert }}>{money(v.total)}</span>
                              <span style={{ fontSize: 13, color: C.figTert }}>· {v.source === "manual" ? `updated by ${v.by || t.owner}` : "mail bot"} · {fmtAgo(Math.max(v.at, 0.02))}</span>
                              <span className="ml-auto"><SoftBtn onClick={() => setPreview({ name: `Quote v${v.version}`, kind: "Insurer issued", file: v.file, size: "184 KB", by: t.insurer, status: "Verified", at: v.at })}>View</SoftBtn></span>
                            </div>
                          ))}
                        </div>
                      </Drawer>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* Update Quote is hidden globally — the quote is issued by the insurer;
                            the desk's only action here is to View it. */}
                        <SoftBtn onClick={() => setPreview({ name: "Insurer quote", kind: "Insurer issued", file: t.quote.file, size: "184 KB", by: t.insurer, status: "Verified", at: t.quote.at })}>View Quote</SoftBtn>
                      </div>
                      {!atOrPast(t, "Awaiting Payment") && (
                        <Note icon={AlertTriangle} tone={C.warn} bg={C.warnSoft}>
                          Premium is withheld from the customer until the payment link is ready (BR-026, FR-061).
                        </Note>
                      )}
                    </>
                  ) : <Empty>Waiting on the insurer's quote.</Empty>}
                </div>

                {/* M6 — payment link */}
                {t.quote && (
                  <>
                    <div className="bk-rule" aria-hidden />
                    <div className="space-y-4">
                      <SectionTitle right={
                        <span className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1.5" title="Payment links are issued through BimaPlacement">
                            <span className="flex shrink-0 items-center justify-center rounded-full"
                              style={{ width: 18, height: 18, background: C.ink, color: C.white, fontFamily: SERIF, fontStyle: "italic", fontSize: 11, lineHeight: 1 }}>P</span>
                            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>
                              <span style={{ color: C.figInk }}>Bima</span><span style={{ color: "#1458D2" }}>Placement</span>
                            </span>
                          </span>
                          {t.payLink
                            ? <MiniTag tone={payExpired ? C.breach : C.warn} bg={payExpired ? C.breachSoft : C.warnSoft} line={payExpired ? C.breachSoft : "#FFD2A8"}>
                                <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, marginRight: 5, background: payExpired ? C.breach : C.warn }} />{payExpired ? "Expired" : `Expires in ${fmtDur(payLeft)}`}
                              </MiniTag>
                            : <MiniTag tone={C.warn} bg={C.warnSoft} line="#FFD2A8">
                                <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, marginRight: 5, background: C.warn }} />Being generated
                              </MiniTag>}
                        </span>
                      }>Payment link</SectionTitle>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Mode</div>
                          <div className="mt-0.5" style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>Payment link via {t.payMode.toLowerCase()}</div>
                        </div>
                        {t.childTicket && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Operations child ticket</div>
                            <div className="bk-num mt-0.5" style={{ fontSize: 14, color: C.link }}>{t.childTicket}</div>
                            <div style={{ fontSize: 12, color: t.payLink ? C.teal : C.warn }}>{t.payLink ? "closed - link uploaded" : "open with Operations"}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Link reference</div>
                          <div className="bk-num mt-0.5" style={{ fontSize: 14, color: t.payLink ? C.link : C.figTert }}>{t.payLink ? t.payLink.ref : "not yet received"}</div>
                          {t.payLink && (
                            <div className="mt-0.5 flex items-center gap-1" style={{ fontSize: 12, color: C.figTert }}>
                              {t.payLink.source === "child-ticket" ? <Globe size={10} /> : <Sparkles size={10} />}
                              {t.payLink.source === "child-ticket" ? `auto-attached from ${t.childTicket}` : `auto-filled by bot${t.payLink.confidence ? ` · ${Math.round(t.payLink.confidence * 100)}%` : ""}`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ background: C.canvas, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.figTert, marginBottom: 6 }}>NEFT alternative shown to the customer</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {Object.entries(NEFT(t)).map(([k, v]) => (
                            <div key={k} style={{ fontSize: 12, color: C.figHint }}><span style={{ color: C.figTert }}>{k}: </span><span className="bk-num">{v}</span></div>
                          ))}
                        </div>
                      </div>
                      {t.payLink && (t.payLink.regens || []).map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.figTert }}>
                          <RotateCcw size={11} /> Regenerated {fmtAgo(r.at)} by {r.by} - {r.reason}
                        </div>
                      ))}
                      {t.payLink && !readOnly(t) && !atOrPast(t, "Awaiting Endorsement Copy") && (
                        <div className="flex justify-end">
                          <Btn size="xs" variant={payExpired ? "fill" : "outline"} tone={payExpired ? C.semError : C.figInk} onClick={() => onRegenerate(t.id)}>Regenerate Payment Link</Btn>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {t.stage === "Awaiting Payment Link" && (
                  <>
                    <div className="bk-rule" aria-hidden />
                    <div className="space-y-3">
                      <SectionTitle>Awaiting the link</SectionTitle>
                      <div className="flex items-start gap-3">
                        <span className="flex shrink-0 items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: C.brandBg }}>
                          {t.payMode === "Portal" ? <Globe size={16} style={{ color: C.brand }} /> : <Mail size={16} style={{ color: C.brand }} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{t.payMode === "Portal" ? `Operations to upload the link on ${t.childTicket}` : `Bot watching ${t.insurerMail} for the link`}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>{t.payMode === "Portal" ? "Uploading it on the child ticket auto-attaches it here and closes the child." : "The bot extracts the link from the insurer's reply and auto-fills it here."}</div>
                        </div>
                      </div>
                      {!readOnly(t) && (
                        <div className="flex justify-end">
                          <SimBtn onClick={() => onReceiveLink(t.id)} title="Demo control - simulates the link arriving from its configured source">
                            Simulate {t.payMode === "Portal" ? "Operations upload" : "bot fetch from insurer mail"}
                          </SimBtn>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* M6 FR-075 / FR-157 — proof and the revert path */}
                {t.payment && (
                  <>
                    <div className="bk-rule" aria-hidden />
                    <div className="space-y-3">
                      <SectionTitle right={!readOnly(t) && <SoftBtn tone={C.warn} bg={C.warnSoft} line={C.warnSoft} onClick={() => onRevertPayment(t.id)}>Revert to payment pending</SoftBtn>}>Payment received</SectionTitle>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        {[["Mode", t.payment.mode], ["Transaction / UTR", t.payment.utr], ["Payment date", t.payment.date], ["Amount", money(t.quote.total)]].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{k}</div>
                            <div className="bk-num mt-0.5" style={{ fontSize: 14, color: C.figInk }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-start">
                        <SoftBtn onClick={() => setPreview({ name: "Payment proof", kind: "Customer upload", file: t.payment.file, size: "96 KB", by: t.client, status: "Received", at: t.payment.at })}>View proof</SoftBtn>
                      </div>
                    </div>
                  </>
                )}
              </div>
          )}

          {live === "manage" && (
            <div className="flex min-h-full flex-col gap-3">
              <div className="space-y-3">

              {t.manualReview && (
                <div className="rounded-xl border p-3 flex flex-wrap items-center gap-3 text-sm" style={{ background: C.waitSoft, borderColor: C.line, color: C.wait }}>
                  <RefreshCw size={14} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div>Raised by the email bot - {t.manualReview.reason}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.ink3 }}>Returns to “{t.manualReview.priorStatus}” once resolved.</div>
                  </div>
                  {!readOnly(t) && (
                    <button onClick={() => onManualReview(t.id)} className="px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
                      style={{ background: C.brand, color: C.white }}>Resolve &amp; resume</button>
                  )}
                </div>
              )}

              {rem.cfg && (
                <Collapsible title="Reminders &amp; escalation" count={rem.fired.length}
                  badge={rem.escalated
                    ? <Chip color={C.breach} bg={C.breachSoft}><AlertTriangle size={10} /> escalated</Chip>
                    : rem.paused
                      ? <Chip color={C.wait} bg={C.waitSoft}><PauseCircle size={10} /> paused</Chip>
                      : rem.next !== null ? <Chip>next in {fmtDur(rem.next)}</Chip> : null}
                  hint={`${stageOf(t.stage).code} · follow-up every ${unitLabel(rem.cfg.every, rem.cfg.unit)} after breach, max ${rem.max}, then escalation to ${rem.to}`}
                  action={!readOnly(t) && <button onClick={() => onRemind(t.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ background: C.tealSoft, color: C.teal }}><BellRing size={12} /> Send reminder now</button>}>
                  <div className="p-3">
                    {rem.paused && <div className="text-xs mb-2 px-2 py-1 rounded-lg inline-flex items-center gap-1.5" style={{ background: C.waitSoft, color: C.wait }}>
                      <PauseCircle size={11} /> Schedule paused while the clock is on hold</div>}
                    {rem.fired.length ? rem.fired.map((f) => (
                      <div key={f.n} className="flex items-center gap-2 py-1 text-sm" style={{ color: C.ink2 }}>
                        <BellRing size={12} style={{ color: C.warn }} /> Follow-up {f.n} of {rem.max}
                        <span className="text-xs" style={{ color: C.ink3 }}>· {fmtAgo(Math.max(f.at, 0.02))}</span>
                      </div>
                    )) : <div className="text-sm" style={{ color: C.ink3 }}>Inside SLA - follow-ups start on breach.</div>}
                    {rem.next !== null && (
                      <div className="flex items-center gap-2 py-1 text-sm" style={{ color: C.ink3 }}>
                        <Clock size={12} /> {rem.fired.length ? "Next follow-up" : "SLA due"} in {fmtDur(rem.next)}
                      </div>
                    )}
                    {rem.escalated && (
                      <div className="mt-2 space-y-1">
                        {(rem.ladder || []).slice(1).map((step, i) => (
                          <div key={i} className="text-sm flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: C.breachSoft, color: C.breach }}>
                            <AlertTriangle size={12} /> ESC-{i + 1} to {rem.to} · {step} after the previous step
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: C.lineSoft, color: C.ink3 }}>
                      Terminal action: {rem.terminal}
                      {rem.cancelAt && <> · auto-cancels {fmtWhen(rem.cancelAt)}</>}
                    </div>
                  </div>
                </Collapsible>
              )}

                </div>
              {!readOnly(t) && (
                <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
                  <Btn size="xs" variant="outline" onClick={() => setReassigning(true)}>Reassign Ticket</Btn>
                  <Btn size="xs" variant="outline" tone={C.semError} onClick={() => setWithdrawing(true)}>Mark Customer Withdrawn</Btn>
                </div>
              )}
            </div>
          )}
          </PanelCard>
        </div>
      </div>

      <DocViewer doc={preview} onClose={() => setPreview(null)} />
      {updatingQuote && t.quote && <UpdateQuoteModal t={t} onClose={() => setUpdatingQuote(false)} onConfirm={(x) => { onRevise(t.id, x); setUpdatingQuote(false); }} />}
      {ask && <QueryModal ctx={ask} t={t} onClose={() => setAsk(null)} onSend={(q) => { onQuery(t.id, q); setAsk(null); setTab("queries"); }} />}
      {withdrawing && <WithdrawModal t={t} onClose={() => setWithdrawing(false)} onConfirm={(x) => { onWithdraw(t.id, x); setWithdrawing(false); }} />}
      {reassigning && <ReassignModal t={t} onClose={() => setReassigning(false)} onConfirm={(x) => { onReassign(t.id, x); setReassigning(false); }} />}
      {upload && <UploadModal t={t} onClose={() => setUpload(false)} onConfirm={(file) => { onAttachCopy(t.id, { source: "manual", file }); setUpload(false); setNote(""); }} />}
    </div>
  );
}

/* Review + Create ------------------------------------------------- */
/* Manual review queue — Figma 917:106299 / 917:107326. Same table treatment as
   My Tickets: no border, no outer padding, 14px, header on a canvas strip. This
   queue is not filterable, so the headings carry no chevrons. */
const MR_COLS = {
  id:     { w: 120 },
  guess:  { w: 150 },
  age:    { w: 100 },
  action: { w: 150 },
};

function Review({ mails, onClaim }) {
  const [open, setOpen] = useState(null);
  const over = mails.filter((m) => m.received >= MR_ESCALATION.overH).length;
  const head = { fontSize: 14, fontWeight: 600, color: "#1C1C1C" };
  const body = { fontSize: 14, fontWeight: 500, color: C.figHint };
  const flexCell = { flex: "1 1 0", minWidth: 0 };

  return (
    <div className="space-y-4">
      <PageHead title="Manual Review Queue" right={
        over > 0 ? (
          <span className="rounded-lg px-2 py-0.5" style={{ background: C.breachSoft, color: C.breach, fontSize: 12, fontWeight: 600 }}>
            <span className="bk-num">{over}</span> Que over {MR_ESCALATION.overH} Hrs.
          </span>
        ) : null
      } />

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2 rounded-xl px-2 py-3" style={{ background: C.canvas }}>
          <span style={cell(MR_COLS.id, head)}>ID</span>
          <span className="truncate" style={{ ...flexCell, ...head }}>From</span>
          <span style={cell(MR_COLS.guess, head)}>Bot guess</span>
          <span className="truncate" style={{ ...flexCell, ...head }}>Review Condition</span>
          <span style={cell(MR_COLS.age, head)}>Age</span>
          <span className="truncate" style={{ ...flexCell, ...head }}>Status</span>
          <span style={cell(MR_COLS.action, head)}>Actions</span>
        </div>

        {mails.length ? mails.map((m, i) => {
          const matched = m.guess && m.guess !== "No confident match";
          const late = m.received >= MR_ESCALATION.overH;
          return (
            <div key={m.id} className="bk-item" style={stagger(i)}>
              <div onClick={() => setOpen(m)} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-3">
                <span className="bk-num truncate" style={cell(MR_COLS.id, { fontSize: 14, fontWeight: 500, color: C.figInk })}>{m.id}</span>
                <span className="truncate" style={{ ...flexCell, ...body }} title={m.subject}>{m.from}</span>
                <span style={cell(MR_COLS.guess)}>
                  <span title={m.guess} className="inline-flex max-w-full items-center justify-center rounded-lg px-2 py-1"
                    style={matched
                      ? { background: "rgba(65,0,207,0.08)", border: "1px solid #E8E2FF", color: C.brand }
                      : { background: "rgba(169,172,177,0.48)", border: "1px solid rgba(169,172,177,0.56)", color: C.figInk }}>
                    <span className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>
                      {matched ? m.guess.split(" - ")[0] : "N/A"}
                    </span>
                  </span>
                </span>
                <span className="truncate" style={{ ...flexCell, ...body }}>{m.reason}</span>
                <span className="bk-num truncate" style={cell(MR_COLS.age, { fontSize: 14, fontWeight: 500, color: late ? C.semError : C.figHint })}>
                  {fmtAgo(m.received)}
                </span>
                <span className="flex min-w-0 items-center gap-2" style={flexCell}>
                  {late ? (
                    <>
                      <img src={AVATAR_UMESH} alt="" className="shrink-0 rounded-full object-cover" style={{ width: 20, height: 20 }} title={MR_ESCALATION.by} />
                      <span className="truncate" style={body}>{MR_ESCALATION.label}</span>
                    </>
                  ) : <span style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>-</span>}
                </span>
                <span style={cell(MR_COLS.action)}>
                  <button onClick={(e) => { e.stopPropagation(); onClaim(m.id); }}
                    className="bk-btn bk-btn-secondary inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5"
                    style={{ background: C.white, borderColor: C.subtle, fontSize: 12, fontWeight: 600, color: C.figInk }}>
                    Create Ticket <ArrowRight size={12} />
                  </button>
                </span>
              </div>
              {i < mails.length - 1 && <div style={{ height: 1, background: C.lineSoft }} />}
            </div>
          );
        }) : <Empty>Queue empty. Every inbound mail matched a policy.</Empty>}
      </section>

      {open && (() => {
        const matched = open.guess && open.guess !== "No confident match";
        const late = open.received >= MR_ESCALATION.overH;
        return (
          <ModalShell icon={SquareDashedMousePointer} title={`Manual review · ${open.id}`}
            sub="The bot could not match this mail to a policy on its own — review it and create the ticket."
            width={760} onClose={() => setOpen(null)}
            footer={<Btn onClick={() => { onClaim(open.id); setOpen(null); }}>Create Ticket</Btn>}>
            <div className="grid gap-6" style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}>
              {/* left — the bot's read of the mail */}
              <div className="space-y-5">
                <div>
                  <FieldLabel>Bot guess</FieldLabel>
                  <div className="mt-1.5">
                    {matched
                      ? <MiniTag tone={C.brand} bg="rgba(65,0,207,0.08)" line="#E8E2FF">{open.guess}</MiniTag>
                      : <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>No confident match</span>}
                  </div>
                </div>
                <div>
                  <FieldLabel>Review condition</FieldLabel>
                  <div className="mt-1.5" style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>{open.reason}</div>
                </div>
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <div className="mt-1.5 bk-num" style={{ fontSize: 14, fontWeight: 500, color: late ? C.semError : C.figInk }}>{fmtAgo(open.received)}</div>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <div className="mt-1.5 flex items-center gap-2">
                    {late
                      ? <><img src={AVATAR_UMESH} alt="" className="shrink-0 rounded-full object-cover" style={{ width: 20, height: 20 }} /><span style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}>{MR_ESCALATION.label}</span></>
                      : <span style={{ fontSize: 14, fontWeight: 500, color: C.figTert }}>Awaiting review</span>}
                  </div>
                </div>
              </div>
              {/* right — the mail itself */}
              <div style={{ borderLeft: `1px solid ${C.subtle}`, paddingLeft: 24 }}>
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 40, height: 40, background: C.brandBg, color: C.brand }}><Mail size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{open.from}</span>
                      <span className="bk-num shrink-0" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{fmtAgo(open.received)}</span>
                    </div>
                    <div className="mt-2" style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>{open.subject}</div>
                    <div className="mt-1 whitespace-pre-line" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: C.figInk }}>{open.body}</div>
                  </div>
                </div>
              </div>
            </div>
          </ModalShell>
        );
      })()}
    </div>
  );
}

/* Upload field — Peetal 3316:80930, four states. The illustrations are the
   design's own, inlined. The disabled art exported blank from Figma, so it is
   the error art desaturated — same drawing, which is what the spec shows. */
const UP_ART = {
  default: "data:image/webp;base64,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",
  success: "data:image/webp;base64,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",
  error:   "data:image/webp;base64,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",
};
const UP_STATE = {
  default:  { line: "#1869F4", dash: "dashed", to: "#EEF4FF", art: "default", tone: "#1869F4" },
  disabled: { line: "#D2D5D8", dash: "dashed", to: "#F4F5F6", art: "error",   tone: "rgba(169,172,177,0.48)", grey: true },
  success:  { line: "#00B200", dash: "solid",  to: "#ECFBEA", art: "success", tone: "#007B00" },
  error:    { line: "#F10000", dash: "solid",  to: "#FFECEC", art: "error",   tone: "#CF0000" },
};

function UploadField({ label, doc, state = "default", file, onPick, onReset }) {
  const s = UP_STATE[state];
  const dead = state === "disabled";
  return (
    <div className="min-w-0">
      <div className="flex items-center px-2 py-3 text-sm font-medium leading-none">
        <span style={{ color: C.figHint }}>{label}</span><span style={{ color: "#F10000" }}>*</span>
      </div>
      <div onClick={dead || state === "success" ? undefined : onPick}
        className="flex flex-col items-center justify-center gap-2 rounded-3xl px-6 py-4 text-center"
        style={{ border: `1px ${s.dash} ${s.line}`, minHeight: 168,
          background: `linear-gradient(to bottom, ${C.white}, ${s.to})`,
          cursor: dead || state === "success" ? "default" : "pointer" }}>
        <img src={UP_ART[s.art]} alt="" style={{ width: 64, height: 64, filter: s.grey ? "grayscale(1) opacity(.55)" : undefined }} />
        <div>
          <div className="flex items-center justify-center gap-1" style={{ fontSize: 14, fontWeight: 600, color: s.tone }}>
            {state === "default" && <Upload size={13} />}
            {state === "default" ? `Upload ${doc}`
              : state === "disabled" ? `Unable to Upload ${doc}`
              : state === "success" ? "Successfully Uploaded!" : "Upload Failed"}
          </div>
          <p className="mt-0.5" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12px",
            color: dead ? s.tone : C.figInk }}>
            {state === "default" ? "click to browse or drag and drop the file here"
              : state === "disabled" ? "Please Refresh or Try Again Later"
              : <><span style={{ color: state === "success" ? C.brand : C.figPlaceholder }}>{file}</span>
                  {state === "success" ? " has been uploaded." : " is larger than 2MB"}</>}
          </p>
        </div>
        {(state === "success" || state === "error") && (
          <button onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="rounded-xl border px-4 py-2" style={{ borderColor: "#DFE0E2", background: C.white,
              fontSize: 12, fontWeight: 600, letterSpacing: "0.12px", color: "#1C1C1C" }}>
            {state === "success" ? "Cancel and Upload again" : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}

/* Create endorsement ticket — Figma 900:99062 / 917:104341. A modal over the
   list, not a page. Type is chosen here and drives the classification, the
   mandatory fields and the documents beneath it. */
/* No policy master exists in the workbook yet (see OPEN-QUESTIONS), so the Create
   form SIMULATES the "fetch from policy" step: a couple of sample policies plus a
   match against the SEED book, with a generic fallback for anything else. Client /
   Insurer / Product come back read-only. This is a stub, not real lookup. */
const POLICY_BOOK = {
  "BK-PROP-D&O-B-1968": { client: "Rahul Badoni", insurer: "ICICI Lombard", product: "Directors & Officers (D&O)" },
  "BK-WC-2026-0092":    { client: "Redwood Logistics Ltd", insurer: "ICICI Lombard", product: "Workmen Compensation (WC)" },
};
const DEMO_CLIENTS = ["Acme Logistics Pvt Ltd", "Vertex Pharma Ltd", "Nimbus Engineering", "Pinnacle Retail Ltd",
  "Redwood Logistics Ltd", "Sunrise Chemicals Ltd", "Vanguard Textiles Pvt Ltd", "Meridian Foods Ltd"];
const fetchPolicy = (policy) => {
  const key = String(policy || "").trim().toUpperCase();
  if (!key) return { client: "", insurer: "", product: "" };
  const seed = SEED.find((t) => t.policy.toUpperCase() === key);
  if (seed) return { client: seed.client, insurer: seed.insurer, product: seed.product };
  if (POLICY_BOOK[key]) return POLICY_BOOK[key];
  /* Any other policy number gets a deterministic demo record — the same string
     always resolves the same way, but different sample numbers (Example1,
     Example2, …) return different client / insurer / product. Prototype only. */
  const h = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const insurers = Object.keys(INSURERS), products = Object.keys(PRODUCTS);
  return { client: DEMO_CLIENTS[h % DEMO_CLIENTS.length],
    insurer: insurers[h % insurers.length], product: products[(h * 7) % products.length] };
};

/* Create-form field: label, a bottom-ruled control, and a trailing tick. Kept at
   MODULE scope so it is not recreated on every Create render — an inline component
   would remount the input each keystroke and steal focus. `locked` = read-only grey. */
const okFieldStyle = (v) => ({ borderBottom: `1px solid ${v ? C.brand : C.line}`,
  background: v ? "rgba(65,0,207,0.02)" : "transparent" });
function Field({ label, hint, value, onClear, trail, children, locked, required = true }) {
  return (
    <div className="min-w-0 pb-3">
      <div className="flex items-center px-2 pb-1.5 text-sm font-medium leading-none">
        <span style={{ color: C.figHint }}>{label}</span>{required && <span style={{ color: "#F10000" }}>*</span>}
      </div>
      <div className="flex items-center gap-2 px-2 py-2.5"
        style={locked ? { background: C.canvas, borderBottom: `1px solid ${C.line}` } : okFieldStyle(value)}>
        {children}
        {trail}
        {hint && <span className="shrink-0" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{hint}</span>}
        <span className="flex shrink-0 items-center gap-2" style={{ color: C.figHint }}>
          {value && !locked ? <button onClick={onClear} title={`Clear ${label.toLowerCase()}`}><X size={13} /></button> : null}
          <CheckCircle2 size={15} fill={value && !locked ? "#1F9D6B" : C.figPlaceholder} color={C.white} />
        </span>
      </div>
    </div>
  );
}

function Create({ onCreate, back, prefill }) {
  const [f, setF] = useState({ client: prefill?.client || "", policy: "", insurer: "",
    product: "", type: "", priority: "" });
  const [vals, setVals] = useState({});
  const [ups, setUps] = useState({});
  const meta = TYPES[f.type] || { fields: [], docs: [] };
  const offered = PRODUCTS[f.product] || [];
  const refund = meta.kind === "Return-Premium";
  const ready = f.client && f.policy && f.insurer && f.product && f.priority && f.type && !refund;

  /* Everything the form asks for, and how much of it is answered. */
  const core = ["client", "policy", "insurer", "product", "priority", "type"];
  const wanted = core.length + meta.fields.length + meta.docs.length;
  const done = core.filter((k) => f[k]).length
    + meta.fields.filter((x) => (vals[x] || "").trim()).length
    + meta.docs.filter((d) => ups[d]?.state === "success").length;
  const pct = Math.round((done / wanted) * 100);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  /* The three inputs the SM fills; entering the policy auto-fetches (and locks)
     Client / Insurer / Product, and resets the type since its list is per-product. */
  const onPolicyChange = (e) => setF((prev) => ({ ...prev, policy: e.target.value }));
  /* Fetch ONLY when the SM commits the policy with Enter — never on keystroke,
     so partial input like "E" doesn't populate the trio or steal focus. */
  const onPolicyKey = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const rec = fetchPolicy(f.policy);
    if (rec.product !== f.product) { setVals({}); setUps({}); }
    setF((prev) => ({ ...prev, ...rec, type: rec.product !== prev.product ? "" : prev.type }));
  };
  const inputCls = "min-w-0 flex-1 bg-transparent outline-none";
  const selCls = "min-w-0 flex-1 appearance-none bg-transparent outline-none";
  const inputSt = { fontSize: 16, fontWeight: 500, color: C.brand };
  const ph = (label) => <option value="" disabled>{`Select ${label}`}</option>;

  return (
    <Overlay className="bk-scrim fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-6"
      style={{ background: "rgba(14,26,31,0.45)" }} onClick={back}>
      <div onClick={(e) => e.stopPropagation()} className="bk-modal scroll-slim my-auto w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{ background: C.white, boxShadow: "0 24px 64px rgba(28,27,31,0.24)" }}>

        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand, lineHeight: 1.2 }}>Create endorsement ticket</h2>
            <p className="mt-1 whitespace-nowrap" style={{ fontSize: 14, fontWeight: 500, color: C.figTert, lineHeight: 1.4 }}>
              Endorsement Type is what lets the form demand the right fields and documents upfront and cannot be changed.
            </p>
          </div>
          <button onClick={back} title="Close" className="bk-iconctrl flex shrink-0 items-center justify-center rounded-md border"
            style={{ width: 24, height: 24, background: C.white, borderColor: C.subtle, color: C.figHint }}><X size={12} /></button>
        </div>

        <div className="border-t px-6 py-2" style={{ borderColor: C.lineSoft }}>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {/* Left — the three inputs, then the read-only trio fetched from the policy */}
            <div className="min-w-0">
              <Field label="Policy Number" value={f.policy}
                onClear={() => { setF({ ...f, policy: "", client: "", insurer: "", product: "", type: "" }); setVals({}); setUps({}); }}>
                <input value={f.policy} onChange={onPolicyChange} onKeyDown={onPolicyKey}
                  placeholder="Enter Policy Number" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Priority" value={f.priority} onClear={() => setF({ ...f, priority: "" })}>
                <select value={f.priority} onChange={set("priority")} className={selCls}
                  style={{ ...inputSt, color: f.priority ? C.brand : "rgba(169,172,177,0.6)" }}>
                  {ph("Priority")}
                  {Object.keys(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Endorsement Type" value={f.type} onClear={() => { setF({ ...f, type: "" }); setVals({}); setUps({}); }}
                hint={f.type ? <>Classification: <span style={{ color: refund ? C.warn : C.figInk }}>{meta.kind}</span></> : null}>
                <select value={f.type} onChange={(e) => { setF({ ...f, type: e.target.value }); setVals({}); setUps({}); }}
                  className={selCls} style={{ ...inputSt, color: f.type ? C.brand : "rgba(169,172,177,0.6)" }}>
                  {ph("Endorsement Type")}
                  {offered.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
              </Field>
              <Field label="Client" locked required={false} value={f.client}>
                <span className={inputCls} style={{ ...inputSt, color: f.client ? C.figHint : C.figPlaceholder }}>{f.client || "Auto-filled from policy"}</span>
              </Field>
              <Field label="Insurer" locked required={false} value={f.insurer}
                trail={INSURER_LOGO[f.insurer] && <img src={INSURER_LOGO[f.insurer]} alt="" className="shrink-0" style={{ height: 18, width: "auto" }} />}>
                <span className={inputCls} style={{ ...inputSt, color: f.insurer ? C.figHint : C.figPlaceholder }}>{f.insurer || "Auto-filled from policy"}</span>
              </Field>
              <Field label="Product" locked required={false} value={f.product}
                trail={PRODUCT_ICON[f.product] && <img src={PRODUCT_ICON[f.product]} alt="" className="shrink-0" style={{ height: 22, width: 22 }} />}>
                <span className={inputCls} style={{ ...inputSt, color: f.product ? C.figHint : C.figPlaceholder }}>{f.product || "Auto-filled from policy"}</span>
              </Field>
            </div>

            {/* Right — the endorsement type's own fields and document uploads, kept
                beside the core so the form stays on one screen (empty until a type
                that has such fields is chosen) */}
            <div className="min-w-0">
              {meta.fields.map((x) => (
                <Field key={x} label={x} value={vals[x]} onClear={() => setVals({ ...vals, [x]: "" })}>
                  <input value={vals[x] || ""} onChange={(e) => setVals({ ...vals, [x]: e.target.value })}
                    placeholder={x} className={inputCls} style={inputSt} />
                </Field>
              ))}
              {meta.docs.map((d) => (
                <div key={d} className="pb-3">
                  <UploadField label={d} doc={d} state={ups[d]?.state || "default"} file={ups[d]?.file}
                    onPick={() => setUps({ ...ups, [d]: { state: "success", file: `${d.toLowerCase().replace(/[^a-z]+/g, "_")}.pdf` } })}
                    onReset={() => setUps({ ...ups, [d]: undefined })} />
                </div>
              ))}
            </div>
          </div>

          {refund && (
            <div className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: C.warnSoft, color: C.warn, fontSize: 13 }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Return-premium endorsements are offered but not yet built - the refund path has no stages behind it.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t px-6 py-4" style={{ borderColor: C.lineSoft }}>
          <div className="min-w-0 flex-1">
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: C.subtle }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.accent, transition: "width .2s" }} />
            </div>
            <div className="mt-1.5 bk-num" style={{ fontSize: 13, fontWeight: 500, color: C.accent }}>{pct}% Complete</div>
          </div>
          <button disabled={!ready} onClick={() => onCreate(f)}
            className="shrink-0 rounded-xl px-7 py-3.5" style={{ fontSize: 16, fontWeight: 600,
              background: ready ? C.brand : "rgba(169,172,177,0.24)", color: ready ? C.white : C.figPlaceholder,
              cursor: ready ? "pointer" : "not-allowed" }}>
            Create Ticket
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* Login ------------------------------------------------------------ *
 *  BI-Admin login (Figma 900:95161). The console is reached through the
 *  BimaKavach admin portal, so the address is recognised rather than
 *  registered: typing a known one names the user and their environment.
 * ------------------------------------------------------------------ */

/* Admin portal access — TOOLS, PORTAL_USERS and PORTAL_PASSWORD are defined
   just below, after the avatar assets the user records reference. */
const AVATAR = "data:image/webp;base64,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";
const AVATAR_UMESH = "data:image/webp;base64,UklGRnADAABXRUJQVlA4IGQDAACwEgCdASpAAEAAPlEijUQjoiEY+q5IOAUEtgBgErZ/APxA7Oa9XKfxA/KrpluEO+vILHC69f0n3Hdq3bb+YD9d+pN6AH9Q6i30APLY9lT9ufSeu/D1R01TOaODpYrVrpB6HiMTKKUL1eK3CIOuP9EQEdbs4meOCKBazb5Sr4xlzR2S2Xvvuyh9aC5yPjskIJUFbEnJ6S0logVXi3Z/AAD+8CoPU+Ch8FD8M0h/ljffxcSuVcVHy2VtjYz+juzkM+oDWOzfFP/pj5ZYbarr/AxRn9LumdXBoylFbOvssh+Qwt9rG2n6qGFpUiR6tEkl4GF79975mfv4mTCnacuN675eOWQeQP3dlwq3QeUk5lKmOzqZw7AuKrW5Kp5XNQtQm+yHZk1/3+grmirzL3JKR54EZm9dRgFsBU1wBj3MnTyfnNPhB56HmC2RTi6qlFbt1L2dttq9rpb6CUQFwvO95Y1cHeMXnne+jVZnNFqQY1u2dL5e9fET5ry/HQf8xJC/Ar36QtCO1Zii1aL63M8dUsLt9F2nI4W0O7JIEYQ3Jyh5pLYLxSoYfTAAnuNLtW9f2Khp7GOrsUxWCediahIAP/zZef2R+/sB2xeAm9x037wyAq/qje/H2LFo/Cf8W4AIgom50nlem9O6VGcxc7TQZ+cz0xzlUMg76itKZQLBnXOYvQsKn2cd0y+QcDwphiqgdNvQVvj2zo8ZLo9cjQ555M2vZgo8iS8wS6pbrMD1duGCyx8imRKw3PrijvgZoiXv7bli6OhigTNTEu9xeZTc5/rLJcIZ5/erFV+v1HUwVqHzOg7/y6oRE9nYCrVm9gUGIsP8lgNJWaxlF/YTjo1mLeubJT+lXwbwFM2jRdxi4LpmObOKQLdBxKFrO4zwbn8DIL5O43YetbuJmiK7bhk9g+MksZWdaGVVHXVY9fJbEO/FHJ70MfnCLp6mOkPjJmdsGC4Xj/md1voGPXlIh+RLUL00Q0E3cTA06dzi4GI82t8FaVaqZIpejz+zWlk2WmocRn6AEEXe3U3FdbDhzv0DioJKjveq7B69romRkVFizJO6Syaxfrgdws5T+Xmrf3dnpwyMYKsh/td6ToCB8s3Fm9e78Q0OcWyHCdF2jcXkDu/ZfpV1cys34u2/7H2+m50xxuUnHoAA";
const AVATAR_RUKSANA = "data:image/webp;base64,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";

/* The internal tools reachable from the shared admin login. Only BimaEndorse is
   built; anything else renders an "under construction" page. Each entry drives
   its wordmark lockup (Bima + a tinted suffix) and whether an app sits behind it. */
const TOOLS = {
  BimaEndorse: { split: ["Bima", "Endorse"], color: C.accent, built: true },
  BimaClaim:   { split: ["Bima", "Claim"],   color: C.brand,  built: true },   /* Claim = Primary 500 (#4100CF), not Info */
};

/* Presence shown as a 6px dot beside the name on the sidebar profile card
   (Figma 1206:79887): online / offline / out-of-office. */
const STATUS = {
  online:  { dot: "#00B200",               label: "Online" },
  offline: { dot: "rgba(169,172,177,0.48)", label: "Offline" },
  ooo:     { dot: "#FFCF0E",               label: "Out of office" },
};

/* Admin portal access. Only these addresses may sign in; each is recognised
   (not registered) and routed to the tool(s) it holds. `envs` lists tool keys —
   one entry locks the environment chevron, several turn it into a picker. */
const PORTAL_USERS = {
  /* `status` omitted → presence is derived from working hours (online in-hours,
     offline otherwise). A fixed `status` overrides that — Ruksana is OOO. */
  "nanditha.p@bimakavach.com": {
    name: "Nanditha P", first: "Nanditha", role: "Servicing executive",
    avatar: AVATAR, envs: ["BimaEndorse"],
    /* Nanditha is Kannadiga, so she is greeted in Kannada — "Welcome, Nanditha." */
    greeting: "ಸ್ವಾಗತ, ನಂದಿತಾ.", lang: "kn",
  },
  "ruksana.khan@bimakavach.com": {
    name: "Ruksana Khan", first: "Ruksana", role: "Claims executive", status: "ooo",
    avatar: AVATAR_RUKSANA, envs: ["BimaClaim"],
    /* Greeted in Devanagari — "Welcome, Ruksana." */
    greeting: "स्वागत है, रुख़्साना", lang: "hi",
  },
  "umesh.bagri@bimakavach.com": {
    name: "Umesh Bagri", first: "Umesh", role: "Claims & Endorsements Head",
    avatar: AVATAR_UMESH, envs: ["BimaEndorse", "BimaClaim"],
  },
};
const PORTAL_PASSWORD = "pass-word";

/* Peetal interactive.input/alphanumeric — label, a bottom-ruled field, a suffix
   stack, and a right-aligned help line. Three states: idle · success · error. */
function LoginField({ label, value, onChange, placeholder, masked, reveal, onReveal, state, help, onSubmit, autoFocus }) {
  const ok = state === "ok", bad = state === "error";
  const rule = bad ? "#F10000" : ok ? C.brand : C.line;
  const fill = bad ? "rgba(241,0,0,0.02)" : ok ? "rgba(65,0,207,0.02)" : "transparent";
  const tick = bad ? ["#CF0000", XCircle] : ok ? ["#1F9D6B", CheckCircle2] : [C.figPlaceholder, CheckCircle2];
  const Tick = tick[1];
  return (
    <div className="w-full">
      <div className="flex items-center px-2 py-3 text-sm font-medium leading-none">
        <span style={{ color: "#1C1C1C" }}>{label}</span>
        <span style={{ color: "#CF0000" }}>*</span>
      </div>
      <div className="flex w-full items-center gap-2 p-3" style={{ background: fill, borderBottom: `1px solid ${rule}` }}>
        <input
          value={value}
          autoFocus={autoFocus}
          type={masked && !reveal ? "password" : "text"}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit?.(); }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent leading-none outline-none"
          style={{ fontSize: 18, fontWeight: 500, color: ok && !masked ? C.brand : C.figInk }}
        />
        <div className="flex shrink-0 items-center gap-2">
          {value && (
            <button onClick={() => onChange("")} title="Clear" className="bk-dim" style={{ color: C.figHint }}><X size={12} /></button>
          )}
          <span title={masked ? "The demo password is pass-word" : "Only registered admin addresses can sign in"}>
            <Info size={12} style={{ color: bad ? "#CF0000" : C.link }} />
          </span>
          <span className="w-px self-stretch" style={{ background: C.line }} />
          {masked && (
            <button onClick={onReveal} title={reveal ? "Hide password" : "Show password"} className="bk-dim" style={{ color: reveal ? C.figInk : C.figTert }}>
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <Tick size={14} fill={tick[0]} color={C.white} />
        </div>
      </div>
      <div className="flex h-7 items-center justify-end px-2">
        {help && <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12px", color: "#CF0000" }}>{help}</span>}
      </div>
    </div>
  );
}

function Login({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [reveal, setReveal] = useState(false);
  const [pwErr, setPwErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState(null);   /* the environment chosen from the chevron */
  const [envOpen, setEnvOpen] = useState(false);
  const [verified, setVerified] = useState(false);   /* email confirmed → reveal identity, tool and password */

  const user = PORTAL_USERS[email.trim().toLowerCase()] || null;
  /* Only judge the address once it looks finished — no shouting mid-keystroke. */
  const looksDone = /@.+\..+/.test(email.trim());
  const emailState = user ? "ok" : looksDone ? "error" : "idle";
  const canVerify = !!user;
  const ready = !!user && verified && pw.length > 0;

  /* Editing the address after verifying drops back to step one — the password
     was for that address, so it cannot carry over to another. */
  const editEmail = (v) => { setEmail(v); if (verified) { setVerified(false); setPw(""); setPwErr(null); setEnvOpen(false); } };
  const verify = () => { if (canVerify) { setVerified(true); setPwErr(null); } };
  /* Which tool this login will open. A held choice wins; otherwise the first the
     user holds. Recomputed on render, so switching accounts never strands it. */
  const selTool = (tool && user?.envs?.includes(tool)) ? tool : (user?.envs?.[0] || null);
  const multiEnv = (user?.envs?.length || 0) > 1;

  const submit = () => {
    if (!ready || busy) return;
    if (pw !== PORTAL_PASSWORD) { setPwErr("Incorrect Password"); return; }
    setPwErr(null);
    setBusy(true);
    setTimeout(() => onSignIn(user, selTool), 900);
  };

  return (
    <div className="h-screen overflow-hidden p-7" style={{ background: C.canvas }}>
      <div className="flex h-full w-full items-center justify-center rounded-3xl" style={{ background: C.brand }}>
        <div className="bk-route w-full max-w-2xl rounded-2xl border p-6"
          style={{ background: C.white, borderColor: C.subtle, boxShadow: "0 8px 24px rgba(28,27,31,0.10)" }}>

          <div className="flex items-center justify-between gap-3">
            <h1 className="leading-none" style={{ fontSize: 30, fontWeight: 600, color: C.brand }}>Log in</h1>
            {verified && user && (
              <div className="bk-reveal bk-item flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-xl border p-1.5" style={{ borderColor: C.subtle, background: C.white }}>
                  <img src={user.avatar} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
                  <span className="text-sm font-medium leading-none" style={{ color: C.figInk }}>{user.name}</span>
                  <span className="text-xs font-medium leading-none" style={{ color: C.figHint }}>{email.trim().toLowerCase()}</span>
                </div>
                <div className="relative flex items-center gap-2">
                  <span className="leading-none" style={{ fontSize: 16, fontWeight: 500 }}>
                    <span style={{ color: C.figInk }}>{TOOLS[selTool].split[0]}</span>
                    <span style={{ color: TOOLS[selTool].color }}>{TOOLS[selTool].split[1]}</span>
                  </span>
                  {multiEnv ? (
                    /* Holds more than one tool — the chevron opens a picker. */
                    <button onClick={() => setEnvOpen((o) => !o)} title="Switch environment"
                      className="bk-iconctrl flex h-4 w-4 items-center justify-center rounded-md border"
                      style={{ background: envOpen ? C.brandBg : C.white, borderColor: C.subtle, color: envOpen ? C.brand : C.figHint }}>
                      <ChevronDown size={12} />
                    </button>
                  ) : (
                    /* One tool only — the control is inert and says why. */
                    <span className="flex h-4 w-4 items-center justify-center rounded-md border"
                      title={`${selTool} is your only environment`}
                      style={{ background: "rgba(169,172,177,0.24)", borderColor: "rgba(169,172,177,0.56)", color: C.figTert }}>
                      <ChevronDown size={12} />
                    </span>
                  )}
                  {multiEnv && envOpen && (
                    <div className="absolute right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border"
                      style={{ background: C.white, borderColor: C.subtle, boxShadow: "0 8px 24px rgba(28,27,31,0.12)", minWidth: 168 }}>
                      {user.envs.map((k) => (
                        <button key={k} onClick={() => { setTool(k); setEnvOpen(false); }}
                          className="bk-opt flex w-full items-center justify-between gap-6 px-3 py-2 text-left leading-none"
                          style={{ fontSize: 15, fontWeight: 500 }}>
                          <span>
                            <span style={{ color: C.figInk }}>{TOOLS[k].split[0]}</span>
                            <span style={{ color: TOOLS[k].color }}>{TOOLS[k].split[1]}</span>
                          </span>
                          {k === selTool && <Check size={14} strokeWidth={3} style={{ color: C.brand }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="pt-4" style={{ fontSize: 18, fontWeight: 500, lineHeight: "28px", color: C.figHint }}>
            Welcome to Bimakavach Admin panel
          </p>

          <div className="pt-4">
            <LoginField label="Email Address" value={email} autoFocus
              onChange={editEmail} onSubmit={verified ? submit : verify}
              placeholder="Enter Email Address" state={emailState}
              help={emailState === "error" ? "Not a registered admin address" : null} />

            {/* Step two: the address is confirmed, so the password appears. */}
            {verified && (
              <LoginField label="Password" value={pw} masked autoFocus reveal={reveal} onReveal={() => setReveal(!reveal)}
                onChange={(v) => { setPw(v); if (pwErr) setPwErr(null); }} onSubmit={submit}
                placeholder="Enter Password" state={pwErr ? "error" : pw ? "ok" : "idle"} help={pwErr} />
            )}

            <div className={verified ? "bk-reveal pt-2" : "pt-2"}>
              {verified ? (
                <button onClick={submit} disabled={!ready || busy}
                  className="bk-btn bk-btn-fill flex w-full items-center justify-center rounded-2xl px-7 py-4 leading-none transition-colors"
                  style={busy
                    ? { background: C.brandBg, color: C.brand }
                    : ready
                      ? { background: C.brand, color: C.white, fontSize: 16, fontWeight: 600 }
                      : { background: "rgba(169,172,177,0.24)", color: C.figPlaceholder, fontSize: 16, fontWeight: 600 }}>
                  {busy ? <Loader2 size={18} className="bk-spin" /> : "Login"}
                </button>
              ) : (
                <button onClick={verify} disabled={!canVerify}
                  className="bk-btn bk-btn-fill flex w-full items-center justify-center rounded-2xl px-7 py-4 leading-none transition-colors"
                  style={canVerify
                    ? { background: C.brand, color: C.white, fontSize: 16, fontWeight: 600 }
                    : { background: "rgba(169,172,177,0.24)", color: C.figPlaceholder, fontSize: 16, fontWeight: 600 }}>
                  Verify
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Shell ------------------------------------------------------------ *
 *  V001.1's app frame: a cream page with the whole console inside one
 *  floating white card. Nav and identity live in the sidebar; the
 *  actions live in the breadcrumb's right slot.
 * ------------------------------------------------------------------ */

const ROUTES = { home: "/", list: "/tickets", review: "/review", create: "/tickets/new" };
const pathOf = (view, openId) => view === "ticket" ? `/tickets/${openId || ""}` : ROUTES[view] || "/";
/* END is redundant on the sidebar rail — we are already inside BimaEndorse — so
   the collapsed/nested caption shows just the "-NNNN" suffix. Full id kept as the
   hover title and everywhere else. */
const shortId = (id) => (id || "").replace(/^(END|CLM)/, "");
function routeOf(path) {
  const m = /^\/tickets\/(END-\d+)\/?$/.exec(path || "");
  if (m) return { view: "ticket", openId: m[1] };
  if (/^\/tickets\/new\/?$/.test(path)) return { view: "create" };
  if (/^\/tickets\/?$/.test(path)) return { view: "list" };
  if (/^\/review\/?$/.test(path)) return { view: "review" };
  return { view: "home" };
}
/* Reading the address bar can throw in a sandboxed frame; the app must not. */
const readRoute = () => { try { return routeOf(window.location.pathname); } catch { return { view: "home" }; } };

/* Session survives a refresh via the URL hash — no browser storage is available.
   The code is short and non-identifying (a letter per admin, a letter per tool),
   so a reload restores who is signed in and which tool they entered, while every
   ticket / mail mutation re-seeds from scratch (that state is never persisted). */
const SESS_USER = { n: "nanditha.p@bimakavach.com", r: "ruksana.khan@bimakavach.com", u: "umesh.bagri@bimakavach.com" };
const SESS_ENV  = { e: "BimaEndorse", c: "BimaClaim" };
const emailOf   = (u) => Object.keys(PORTAL_USERS).find((k) => PORTAL_USERS[k] === u) || "";
const codeOf    = (m, v) => Object.keys(m).find((k) => m[k] === v) || "";
const sessHash  = (u, env) => { const uc = codeOf(SESS_USER, emailOf(u)), ec = codeOf(SESS_ENV, env); return uc && ec ? `#s=${uc}${ec}` : ""; };
const readSession = () => {
  try {
    const m = /^#s=([nru])([ec])$/.exec(window.location.hash || "");
    if (!m) return null;
    const user = PORTAL_USERS[SESS_USER[m[1]]], env = SESS_ENV[m[2]];
    return user && env ? { user, env } : null;
  } catch { return null; }
};

const NAV = [
  /* Home (the desk + progress dashboard) and My Tickets (the queue) are separate
     pages again; the desk cards on Home route into My Tickets (Figma 1197:73447). */
  ["home",    "Home",          HeartHandshake],
  ["list",    "My Tickets",    ListChecks],
  ["review",  "Manual Review", SquareDashedMousePointer],
  ["reports", "Reports",       TextSearch, true],   /* shown, never reachable */
];

/* Wrap the first case-insensitive occurrence of `q` in a brand highlight — the
   "match" chip the search results carry (Figma 1292:92846). */
function Highlight({ text, q }) {
  const s = String(text ?? ""), query = (q || "").trim();
  const i = query ? s.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{s}</>;
  return <>{s.slice(0, i)}<span style={{ background: C.brand, color: C.white, borderRadius: 3, padding: "0 2px" }}>{s.slice(i, i + query.length)}</span>{s.slice(i + query.length)}</>;
}

/* A ticket as a search result — the case card plus a Take Action button; the
   query is highlighted wherever it lands (Figma 1249:86386 / 1292:92457). */
function SearchCard({ t, q, onOpen }) {
  const st = statusOf(t), c = clock(t), over = c.state === "breached";
  return (
    <div className="flex flex-col border p-4" style={{ borderColor: C.subtle, borderRadius: 16, background: `linear-gradient(to top, ${C.brandBg} 0%, ${C.white} 55%)` }}>
      <div className="mb-4 flex justify-end"><Indicator status label={st.label} ind={stageInd(t)} big /></div>
      <div className="bk-num" style={{ fontSize: 18, fontWeight: 600, color: C.brand }}><Highlight text={t.id} q={q} /></div>
      <div className="mt-0.5 flex items-center gap-1 truncate" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>
        <User size={16} className="shrink-0" style={{ color: C.figInk }} />
        <span className="truncate"><Highlight text={t.client} q={q} /></span>
      </div>
      <div className="mt-2 truncate" style={{ fontSize: 14, fontWeight: 500, color: C.figInk }}><Highlight text={t.type} q={q} /></div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Indicator thick label={kindLabel(t.kind)} ind={KIND_IND[t.kind]} />
        <Indicator thick label={t.priority} ind={PRIO_IND[t.priority]} />
      </div>
      <div className="mt-4 flex items-end gap-4">
        <span className="flex min-w-0 flex-1 items-start gap-1">
          <Clock size={14} className="mt-px shrink-0" style={{ color: C.figHint }} />
          <span className="min-w-0" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
            {isOpen(t) && c.due ? (
              <>
                <span className="bk-num" style={{ color: over ? C.semError : c.state === "atRisk" ? C.semCaution : toneOf(c.state) }}>
                  {c.state === "held" ? "On hold." : over ? `${c.label} over.` : `${c.label} left.`}
                </span>
                <span className="bk-num" style={{ color: C.figHint }}>{` ${over ? "Was due " : "Due "}${fmtWhen(c.due)}`}</span>
              </>
            ) : (
              <span style={{ color: C.figHint }}>{isOpen(t) ? "No live clock" : "Closed"}</span>
            )}
          </span>
        </span>
        <Participants t={t} />
      </div>
      <button onClick={onOpen} className="bk-btn bk-btn-secondary mt-4 flex items-center justify-between rounded-xl border px-4 py-3"
        style={{ borderColor: C.subtle, background: C.white, fontSize: 14, fontWeight: 600, color: C.figInk }}>
        <span>Take Action</span><ArrowRight size={14} style={{ color: C.figInk }} />
      </button>
    </div>
  );
}

/* The search lightbox — a modal over a blurred scrim (Figma 1249:86383). Empty,
   it shows Recent Tickets; typed, it filters across the active scopes and
   highlights the match. No index — it reads the live ticket list. */
const SEARCH_SCOPES = ["Tickets", "Clients", "Insurers"];
function SearchModal({ open, onClose, tickets, openTicket }) {
  const [q, setQ] = useState("");
  const [scopes, setScopes] = useState(SEARCH_SCOPES);
  useEffect(() => { if (open) { setQ(""); setScopes(SEARCH_SCOPES); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;

  const active = new Set(scopes);
  const ql = q.trim().toLowerCase();
  const pool = tickets.filter((t) => !isRouting(t));
  const matches = (t) => {
    const fields = [];
    if (active.has("Tickets")) fields.push(t.id, t.type, statusOf(t).label);
    if (active.has("Clients")) fields.push(t.client);
    if (active.has("Insurers")) fields.push(t.insurer);
    return fields.some((v) => String(v || "").toLowerCase().includes(ql));
  };
  const list = ql ? pool.filter(matches) : pool.slice().sort((a, b) => a.lastAction - b.lastAction).slice(0, 3);

  return createPortal(
    <div className="bk-scrim fixed inset-0 z-50 flex items-start justify-center p-6"
      style={{ background: "rgba(28,27,31,0.32)", backdropFilter: "blur(2px)", fontFamily: FONT, color: C.ink }} onClick={onClose}>
      <div className="bk-modal scroll-slim mt-6 w-full overflow-y-auto rounded-2xl"
        style={{ background: C.white, boxShadow: "0 24px 60px rgba(28,27,31,0.24)", maxWidth: 1000, maxHeight: "86vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: C.subtle }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search Tickets, Clients, And Documents"
              className="min-w-0 flex-1 bg-transparent outline-none" style={{ fontSize: 16, fontWeight: 500, color: q ? C.brand : C.figInk }} />
            <button onClick={q ? () => setQ("") : onClose} className="bk-dim" title={q ? "Clear" : "Close"} style={{ color: C.figHint }}><X size={18} /></button>
          </div>

          <div className="mt-4" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Searching For</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {scopes.map((s) => (
              <span key={s} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5" style={{ borderColor: C.subtle, fontSize: 13, fontWeight: 500, color: C.figInk }}>
                {s}<button onClick={() => setScopes(scopes.filter((x) => x !== s))} className="bk-dim" style={{ color: C.figHint }}><X size={12} /></button>
              </span>
            ))}
          </div>

          <div className="my-4" style={{ height: 1, background: C.subtle }} aria-hidden />
          <div style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>{ql ? "Results" : "Recent Tickets"}</div>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {list.length
              ? list.map((t) => <SearchCard key={t.id} t={t} q={q} onOpen={() => { onClose(); openTicket(t.id); }} />)
              : <div className="md:col-span-3"><Empty>No tickets match “{q.trim()}”.</Empty></div>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* Sidebar — Figma 900:101884 / 900:102387. Neutral ground, not the cream page:
   the rail reads as chrome and the content area keeps the warmth. 237px open,
   92px collapsed; the collapse state is React state, since storage is unavailable. */
function Sidebar({ view, go, mails, openId, openTicket, collapsed, setCollapsed, onSignOut, onSearch, nav = NAV,
  tool = "BimaEndorse", envs, onSwitchEnv = () => {}, identity = { avatar: AVATAR, name: "Nanditha P", role: ROLES["Nanditha P"].role } }) {
  const presence = identity.status || (isWorkingNow(new Date()) ? "online" : "offline");
  /* Environment switcher: a user with admin over more than one tool (Umesh holds
     BimaClaim + BimaEndorse) swaps between them from the chevron; everyone else
     keeps the inert lockup. */
  const envList = envs && envs.length ? envs : [tool];
  const multiEnv = envList.length > 1;
  const [envOpen, setEnvOpen] = useState(false);
  const [envPos, setEnvPos] = useState(null);   /* fixed-position anchor for the portaled menu */
  useEffect(() => {
    if (!envOpen) return;
    const away = (e) => { if (!e.target.closest("[data-envmenu]")) setEnvOpen(false); };
    const close = () => setEnvOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("resize", close); };
  }, [envOpen]);
  const row = collapsed ? "justify-center" : "gap-2";
  return (
    <aside className="relative flex h-full shrink-0 flex-col justify-between border-r"
      style={{ width: collapsed ? 92 : 237, background: C.canvas, borderColor: C.lineSoft, transition: "width .2s ease-out" }}>

      <div className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-7 ${collapsed ? "items-center px-7" : "items-end pl-8 pr-3"}`}>

        {/* BimaEndorse + environment, the same lockup the login uses */}
        <div className={`flex w-full items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="leading-none" style={{ fontSize: 20, fontWeight: 500 }}>
                <span style={{ color: C.figInk }}>{TOOLS[tool].split[0]}</span><span style={{ color: TOOLS[tool].color }}>{TOOLS[tool].split[1]}</span>
              </span>
              {/* environment lockup — a live picker for multi-env admins, else inert */}
              <div className="relative" data-envmenu>
                {multiEnv ? (
                  <button data-envmenu title="Switch environment"
                    onClick={(e) => { if (envOpen) { setEnvOpen(false); } else { const r = e.currentTarget.getBoundingClientRect(); setEnvPos({ top: r.bottom + 6, left: r.left }); setEnvOpen(true); } }}
                    className="bk-iconctrl flex items-center justify-center rounded-md border"
                    style={{ width: 18, height: 18, background: envOpen ? C.brandBg : C.white, borderColor: C.subtle, color: envOpen ? C.brand : C.figTert }}>
                    <ChevronDown size={12} style={{ transform: envOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                  </button>
                ) : (
                  <span className="flex items-center justify-center rounded-md border" title={`${tool} is your only environment`}
                    style={{ width: 18, height: 18, background: C.white, borderColor: C.subtle, color: C.figTert }}>
                    <ChevronDown size={12} />
                  </span>
                )}
                {/* Portaled to the body so the sidebar's overflow-hidden can't clip it. */}
                {multiEnv && envOpen && envPos && createPortal(
                  <div data-envmenu className="bk-reveal fixed z-50 flex flex-col gap-0.5 rounded-xl border p-1"
                    style={{ top: envPos.top, left: envPos.left, minWidth: 168, background: C.white, borderColor: C.subtle, boxShadow: "0 8px 24px rgba(28,27,31,0.12)", fontFamily: FONT, color: C.ink }}>
                    {envList.map((k) => (
                      <button key={k} onClick={() => { setEnvOpen(false); if (k !== tool) onSwitchEnv(k); }}
                        className="bk-opt flex items-center gap-2 rounded-lg px-2.5 py-2 text-left" style={{ background: k === tool ? C.brandBg : "transparent" }}>
                        <span className="leading-none" style={{ fontSize: 14, fontWeight: 500 }}>
                          <span style={{ color: C.figInk }}>{TOOLS[k].split[0]}</span><span style={{ color: TOOLS[k].color }}>{TOOLS[k].split[1]}</span>
                        </span>
                        {k === tool && <Check size={12} style={{ color: C.brand, marginLeft: "auto" }} />}
                      </button>
                    ))}
                  </div>, document.body)}
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="bk-dim" style={{ color: C.figTert }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Opens the search lightbox (Figma 1249:86383 / 1249:86386). */}
        <button onClick={onSearch} title="Search"
          className={`bk-navitem flex items-center ${collapsed ? "justify-center" : "w-full justify-between"}`}
          style={{ width: collapsed ? 36 : undefined, height: collapsed ? 36 : undefined, borderRadius: 10,
            border: "0.5px solid #D5D5D5", padding: collapsed ? 0 : 8, background: C.white, cursor: "pointer" }}>
          {!collapsed && <span style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>Search Anything</span>}
          <Search size={12} style={{ color: C.figHint }} />
        </button>

        <div className="flex w-full flex-col gap-1">
          {!collapsed && <div className="px-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Menu</div>}
          <nav className={`flex flex-col gap-3 ${collapsed ? "items-center" : ""}`}>
            {nav.map(([k, label, Icon, off], i) => {
              const on = view === k || (k === "list" && view === "ticket");
              return (
                <div key={k} className={collapsed ? "" : "w-full"}>
                  <button
                    disabled={off}
                    onClick={off ? undefined : () => go(k, k === "list" ? "attention" : undefined)}
                    title={off ? (k === "review" ? "Manual Review is turned off for now" : "Reports is not built in this prototype") : collapsed ? label : undefined}
                    className={`bk-item flex items-center rounded-lg ${row} ${collapsed ? "" : "w-full"} ${!on && !off ? "bk-navitem" : ""}`}
                    style={{ ...stagger(i),
                      width: collapsed ? 36 : undefined, height: collapsed ? 36 : undefined,
                      padding: collapsed ? 0 : "6px 8px",
                      background: on ? C.subtle : "transparent",
                      color: off ? "rgba(169,172,177,0.48)" : on ? C.figInk : C.figHint,
                      cursor: off ? "not-allowed" : "pointer" }}>
                    <span className="relative shrink-0">
                      <Icon size={collapsed ? 20 : 24} className="shrink-0" />
                      {/* unread manual-review mails — a dot on the icon corner, not a count (Figma 917:106812) */}
                      {k === "review" && !off && mails.length > 0 && (
                        <span className="absolute rounded-full" style={{ top: -1, right: -1, width: 6, height: 6, background: "#F10000" }} />
                      )}
                    </span>
                    {!collapsed && <span className="flex-1 text-left text-sm font-semibold">{label}</span>}
                  </button>
                  {/* collapsed, the open ticket is a caption under its icon — the
                      design's sidebar/ticket variant */}
                  {collapsed && k === "list" && view === "ticket" && openId && (
                    <button onClick={() => openTicket(openId)} title={openId}
                      className="bk-num mt-1 block w-full truncate text-center"
                      style={{ fontSize: 11, fontWeight: 600, color: C.brand }}>{shortId(openId)}</button>
                  )}
                  {/* the open ticket, nested under its list */}
                  {!collapsed && k === "list" && view === "ticket" && openId && (
                    <button onClick={() => openTicket(openId)}
                      className="mt-1 flex w-full items-center gap-1.5 rounded-lg py-1.5 pl-9 pr-2 text-left text-xs font-medium"
                      style={{ color: C.figInk }}>
                      <CornerDownRight size={11} className="shrink-0" />
                      <span className="bk-num truncate">{shortId(openId)}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className={`flex flex-col gap-3 pb-8 pt-7 ${collapsed ? "items-center px-5" : "pl-8 pr-3"}`}>
        <div className={`bk-profile flex shrink-0 items-start rounded-xl border ${collapsed ? "justify-center p-1.5" : "w-full justify-between p-2"}`}
          style={{ background: C.white, borderColor: C.subtle, borderWidth: "0.5px" }}>
          <div className="flex shrink-0 flex-col gap-3">
            <img src={identity.avatar} alt="" className="shrink-0 rounded-full object-cover" style={{ width: 36, height: 36, minWidth: 36 }} />
            {!collapsed && (
              <div className="leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium" style={{ color: C.figInk }}>{identity.name}</span>
                  {STATUS[presence] && (
                    <span className="shrink-0 rounded-full" title={STATUS[presence].label}
                      style={{ width: 6, height: 6, background: STATUS[presence].dot }} />
                  )}
                </div>
                <div className="mt-1 text-xs font-medium" style={{ color: C.figHint }}>{identity.role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={onSignOut} title="Sign out" style={{ color: C.figInk }} className="shrink-0"><LogOut size={12} /></button>
          )}
        </div>
      </div>
    </aside>
  );
}

/* Breadcrumb — the way back out of a ticket, so the screen needs no Back
   button of its own. A segment with an onClick is a link; the last is not. */
/* The top bar itself — a sunken rounded card (Figma 1249:87244 / 1197:73452 /
   917:107508): bg card-sunken, 12px radius, 12px padding, crumb left, action right. */
function Breadcrumb({ segments, right }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl px-3" style={{ background: C.canvas, height: 48 }}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase" style={{ letterSpacing: "0.12px" }}>
        {segments.map((s, i) => {
          const last = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: C.figDisabled }}>/</span>}
              {s.onClick && !last
                ? <button onClick={s.onClick} className="uppercase" style={{ color: C.figTert }}>{s.label}</button>
                : <span style={{ color: last ? C.figInk : C.figTert }}>{s.label}</span>}
            </span>
          );
        })}
      </div>
      {right}
    </div>
  );
}

/* Step through the desk in the order the queues use, without going back to the
   list. Reads only — the ticket it lands on is unchanged. */
function TicketPager({ id, list, onOpen }) {
  const i = list.findIndex((x) => x.id === id);
  const box = { width: 18, height: 18, borderRadius: 6, background: C.white, border: `0.5px solid ${C.subtle}` };
  const step = (d) => list[i + d] && onOpen(list[i + d].id);
  return (
    <div className="flex items-center gap-2">
      <span className="bk-num" style={{ fontSize: 12, fontWeight: 600, color: C.figInk }}>{id}</span>
      <div className="flex items-center gap-2">
        <button disabled={i <= 0} onClick={() => step(-1)} title="Previous ticket, in urgency order"
          className="bk-iconctrl flex items-center justify-center" style={{ ...box, color: i <= 0 ? C.figDisabled : C.figHint, cursor: i <= 0 ? "not-allowed" : "pointer" }}>
          <ChevronUp size={12} />
        </button>
        <button disabled={i < 0 || i >= list.length - 1} onClick={() => step(1)} title="Next ticket, in urgency order"
          className="bk-iconctrl flex items-center justify-center" style={{ ...box, color: i >= list.length - 1 ? C.figDisabled : C.figHint, cursor: i >= list.length - 1 ? "not-allowed" : "pointer" }}>
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   ===================  BIMACLAIM — CLAIMS TMS DOMAIN LAYER  ================
   A sibling ticketing environment. Behaviour is ported verbatim from the
   BimaClaim reference prototype + 01-behaviour-contract.md; it reuses the
   Endorsement design system and the shared BIZ/addBiz/addWD/NOW calendar.
   All symbols are namespaced CL_/cl so they never collide with Endorsement.
   ========================================================================= */

const CL_HOUR = 36e5, CL_DAY = 864e5;
/* Deterministic demo clock — reuse the shared pinned NOW (11:00 next working day). */
const CL_NOW = NOW.getTime();
const clAgo = (h) => CL_NOW - h * CL_HOUR;
const clAddBH = (ts, hours) => addBiz(new Date(ts), hours).getTime();
const clAddWD = (ts, days) => addWD(new Date(ts), days).getTime();
const clAddTat = (ts, v, unit) => (unit === "BH" ? clAddBH(ts, v) : clAddWD(ts, v));
/* Working days elapsed — ageing buckets and ending thresholds (C-3). */
function clWdBetween(a, b) {
  if (b <= a) return 0;
  const d = new Date(a); let n = 0;
  while (d.getTime() < b) { d.setDate(d.getDate() + 1); if (isWorkday(d)) n++; }
  return n;
}
const clInr = (n) => (n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"));
/* Present a 10-digit Indian mobile grouped 4-3-3, e.g. 9007 296 854. */
const clFmtMob = (m) => { const d = String(m || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : (m || ""); };
function clDur(ms) {
  const a = Math.abs(ms);
  if (a < CL_HOUR) return Math.max(1, Math.round(a / 6e4)) + " min";
  if (a < CL_DAY) return Math.round(a / CL_HOUR) + " hrs";
  return Math.round(a / CL_DAY) + " days";
}
const clFdate = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const clFdt = (ts) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* ---------- masters (Claims_TMS_Masters_List_v4.xlsx) ---------- */
const CL_INSURERS = {
  "ICICI Lombard": { mode: "Portal", medianDays: 6 },
  "TATA AIG": { mode: "Portal", medianDays: 3 },
  "Bajaj": { mode: "Portal", medianDays: 5 },
  "HDFC Ergo": { mode: "Mail", medianDays: 14, poc: "samruddhi.thorat@hdfcergo.com" },
  "New India": { mode: "Mail", medianDays: 11, poc: "arun.venugopal@newindia.co.in" },
  "Digit": { mode: "Mail", medianDays: 19 },
  "Iffco Tokio": { mode: "Mail", medianDays: 9, poc: "Nisha.Borade@iffcotokio.co.in" },
  "Zurich Kotak": { mode: "Mail", medianDays: 8, poc: "arun.thomas1@zurichkotak.com" },
  "Generali Central": { mode: "Mail", medianDays: 12 },
};
const CL_FIELDS = {
  Fire: ["Policy No", "Insured Name", "Date & Time of Incident", "Brief description about the incident", "Cause of Loss",
    "Location of loss: full address", "Photos", "Estimated Loss Amount", "Contact Person Name & No"],
  Marine: ["Policy No", "Insured Name", "Damage Item Name", "Date of loss", "Cause of Loss", "Photos of damage", "Transit route",
    "LR No.", "Truck No.", "Delivery challan / Invoice No.", "Packing list", "Location details (damage/loss)",
    "Survey location", "Contact person name", "Contact person mobile", "Estimated loss amount", "Loss description"],
  MBD: ["Policy No", "Insured Name", "Damaged Item Name", "Annexure No", "Date of Loss", "Cause of Loss", "Estimated Loss Amount",
    "Location of Loss", "Contact person name", "Contact person mobile", "Loss description"],
  WC: ["Policy No.", "Insured Name", "Injured Worker Name", "Date of Accident", "Cause of the Accident", "Location of accident",
    "Contact person name", "Contact person mobile", "Estimated loss amount", "Loss description"],
  CGL: ["Policy No", "Insured Name", "Date the claim or notice was received", "Claimant name", "Nature of the allegation",
    "Description of the claim", "Estimated loss amount", "Contact person name", "Contact person mobile"],
  PI: ["Policy No", "Insured Name", "Date the claim or notice was received", "Claimant name", "Nature of the allegation",
    "Description of the claim", "Estimated loss amount", "Contact person name", "Contact person mobile"],
  "D&O": ["Policy No", "Insured Name", "Date the claim or notice was received", "Claimant name", "Nature of the allegation",
    "Description of the claim", "Estimated loss amount", "Contact person name", "Contact person mobile"],
};
const CL_DOCS = {
  Fire: ["Claim Form", "Claim Bill", "Policy Copy with annexure", "Repair quotation",
    "Repair/Replacement Bill with payment proof", "Stock register", "Incident note"],
  Marine: ["Claim form duly sealed and signed", "Claim bill on letterhead", "NEFT with cancelled cheque", "LR/courier copy",
    "Invoice copy", "Packaging list", "Letter of notice to transporter", "Damage certificate issued by the transporter"],
  MBD: ["Claim Form", "Claim Bill", "Policy Copy with annexure", "Repair quotation", "Log book", "Incident note"],
  CGL: ["Claim Form", "Legal notice or summons copy", "Policy Copy with annexure", "Correspondence with the claimant", "Contract or agreement"],
  PI: ["Claim Form", "Legal notice or summons copy", "Policy Copy with annexure", "Engagement letter or scope of work", "Correspondence with the claimant"],
  "D&O": ["Claim Form", "Legal notice or summons copy", "Policy Copy with annexure", "Board minutes or resolution", "Correspondence with the claimant"],
  WC: ["Claim Form", "FIR / accident report", "Wage records", "Medical papers"],
};
/* Intimation photographs by product (C-8.2): Fire & MBD four, Marine six, liability none. */
const CL_PHOTOS = { Fire: 4, MBD: 4, Marine: 6, WC: 0, CGL: 0, PI: 0, "D&O": 0 };
const CL_LIABILITY = ["CGL", "PI", "D&O"];
const clLossOptional = (prod) => CL_LIABILITY.includes(prod);
const CL_MOBILE = /^[6-9][0-9]{9}$/;
const clCleanMob = (v) => String(v || "").replace(/[^0-9]/g, "").replace(/^(0|91)(?=[6-9][0-9]{9}$)/, "");
/* Ruksana Khan is the BimaClaim Claims Manager (the operator); Umesh Bagri is
   the Claims & Endorsements Head, who sees both environments. Both hold real
   avatars in PORTAL_USERS. First names drive the greeting and the role toggle. */
const CL_CMS = ["Ruksana", "Shruthi", "Mahendra", "Amogh"];
const CL_ME = "Ruksana";
const CL_HEAD = "Umesh";
const CL_SURVEYOR_THRESHOLD = 100000;

/* ---------- state machine (C-1) ---------- */
const CL_PHASES = ["Intake", "BK Review", "Insurer", "Assessment & Consent", "Settlement & Closure"];
const CL_FLOW = {
  S0: { status: "Draft", label: "Draft — intake incomplete", client: "Details Required", phase: 0, owner: "Client", tat: { v: 2, unit: "WD" }, act: { label: "Mark intake complete", to: "S1" } },
  S1: { status: "Under Review", label: "Under Review – BimaKavach", client: "Under Review", phase: 1, owner: "BimaKavach", tat: { v: 2, unit: "BH" }, act: { label: "Record admissibility assessment", to: "S2", form: "admiss" } },
  S2: { status: "Under Review", label: "Ready for insurer intimation", client: "Under Review", phase: 1, owner: "BimaKavach", tat: { v: 1, unit: "BH" }, act: { label: "Submit to insurer", to: "S3" } },
  S3: { status: "With Insurer", label: "Awaiting claim number", client: "Submitted to Insurer", phase: 2, owner: "Insurer", tat: { v: 1, unit: "WD" }, act: { src: "auto", label: "Record insurer claim number", to: "S4", form: "claimno" } },
  S4: { status: "With Insurer", label: "Awaiting admissibility decision", client: "Submitted to Insurer", phase: 2, owner: "Insurer", tat: { v: 2, unit: "WD" }, act: { src: "bot", label: "Log insurer decision", to: "BRANCH" } },
  S5: { tab: "survey", status: "Survey & Assessment", label: "Surveyor appointment awaited", client: "Survey in Progress", phase: 3, owner: "Insurer", tat: { v: 2, unit: "WD" }, act: { src: "bot", label: "Record surveyor appointment", to: "S6", form: "surveyor" } },
  S6: { tab: "survey", status: "Survey & Assessment", label: "Inspection & assessment report", client: "Assessment in Progress", phase: 3, owner: "Insurer", tat: { v: 2, unit: "WD" }, act: { src: "bot", label: "Record inspection & assessment report", to: "S9", form: "report" } },
  S8: { tab: "survey", status: "Report Awaited", label: "Insurer assessing internally", client: "Assessment in Progress", phase: 3, owner: "Insurer", tat: { v: 2, unit: "WD" }, act: { src: "bot", label: "Record assessment report", to: "S9", form: "report" } },
  S9: { status: "Consent", label: "Consent Pending", client: "Consent", phase: 3, owner: "Client", tat: { v: 3, unit: "WD" }, sub: "Awaiting client", act: { src: "client", label: "Record client consent", to: "S10" } },
  S10: { tab: "payment", status: "Bank Details Pending", label: "Bank Details Pending", client: "Bank Details Required", phase: 4, owner: "Client", tat: { v: 3, unit: "WD" }, act: { src: "client", label: "Record bank details", to: "S11", form: "bank" } },
  S11: { tab: "payment", status: "Payment in Progress", label: "Payment in Progress", client: "Payment in Progress", phase: 4, owner: "Insurer", tat: { v: 2, unit: "WD" }, act: { src: "bot", label: "Record payment", to: "S12", form: "payment" } },
  S12: { tab: "payment", status: "Payment Confirmation", label: "Awaiting Client Confirmation", client: "Payment Released", phase: 4, owner: "Client", tat: { v: 5, unit: "WD" }, act: { src: "client", label: "Record client confirmation of receipt", to: "S13" } },
  S13: { status: "Closed", label: "Closed – Settled", client: "Claim Settled", phase: 4, owner: "—", terminal: true },
  R1: { status: "Rejected", label: "Rejection shared", client: "Claim Rejected", phase: 2, owner: "Client", tat: { v: 3, unit: "WD" }, sub: "Awaiting client", act: { src: "client", label: "Record the client's response", to: "R2" } },
  R2: { status: "Rejected", label: "Challenge with insurer", client: "Claim Rejected", phase: 2, owner: "Insurer", tat: { v: 2, unit: "WD" }, sub: "Awaiting insurer", act: { src: "bot", label: "Record the insurer's detailed reply", to: "R1" } },
  R3: { status: "Rejected", label: "Challenges exhausted", client: "Claim Rejected", phase: 2, owner: "Client", tat: { v: 3, unit: "WD" }, sub: "Awaiting client", act: { src: "client", label: "Record the client's acceptance", to: "RX" } },
  RX: { status: "Closed", label: "Closed – Rejection accepted", client: "Claim Closed", phase: 4, owner: "—", terminal: true },
  SX: { status: "Closed", label: "Closed", client: "Claim Closed", phase: 4, owner: "—", terminal: true },
  ST: { status: "Terminated", label: "Terminated – Inactivity", client: "Claim Closed – No Response", phase: 4, owner: "—", terminal: true },
};
const CL_ORDER = ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S8", "S9", "S10", "S11", "S12", "S13"];
const CL_REJ = ["S0", "S1", "S2", "S3", "S4", "R1", "R2", "R3", "RX"];
const clIsRej = (t) => ["R1", "R2", "R3", "RX"].includes(t.state) || (t.rejection && CL_FLOW[t.state].terminal);
const clPathBase = (t) => CL_ORDER.filter((c) => ((t.loss || 0) > CL_SURVEYOR_THRESHOLD ? c !== "S8" : !["S5", "S6"].includes(c)));
const clPath = (t) => (clIsRej(t) ? CL_REJ : clPathBase(t));
const clStageIndex = (t) => { const p = clPath(t); const i = p.indexOf(t.state); return i > -1 ? i : (CL_FLOW[t.state].terminal ? p.length : CL_ORDER.indexOf(t.state)); };
const clTatLabel = (t) => { const T = CL_FLOW[t.state].tat; if (!T) return "—"; return T.v + " " + (T.unit === "BH" ? (T.v === 1 ? "business hour" : "business hours") : (T.v === 1 ? "working day" : "working days")); };

/* ---------- chase loops (C-4) ---------- */
const CL_LOOPS = {
  A: { name: "Intimation details chase", who: "Client", reminders: 3, interval: 2, basis: "WD", escalations: 3, escInterval: 2, ending: "Terminate the Draft at day 15.", kind: "terminate", threshold: 15 },
  B: { name: "Document chase", who: "Client", reminders: 3, interval: 5, basis: "WD", escalations: 3, escInterval: 5, ending: "Terminate at day 30.", kind: "terminate", threshold: 30 },
  C: { name: "Document chase", who: "Client", reminders: 3, interval: 5, basis: "WD", escalations: 3, escInterval: 5, ending: "Terminate at day 30, and email the insurer to close their claim.", kind: "terminate-insurer", threshold: 30 },
  D: { name: "Document chase", who: "Client", reminders: 3, interval: 5, basis: "WD", escalations: 3, escInterval: 5, ending: "Terminate at day 30.", kind: "terminate", threshold: 30 },
  E: { name: "Decision chase", who: "Client", reminders: 3, interval: 3, basis: "WD", escalations: 3, escInterval: 3, ending: "Parks dormant — client unresponsive.", kind: "dormant" },
  G: { name: "Bank details chase", who: "Client", reminders: 3, interval: 3, basis: "WD", escalations: 3, escInterval: 3, ending: "Parks dormant — awaiting bank details. Never terminates.", kind: "dormant" },
  H: { name: "Insurer chase", who: "Insurer", reminders: 3, interval: 2, basis: "WD", escalations: 3, escInterval: 1, ending: "Escalates and stays open. A claim never terminates while the insurer owes the action.", kind: "hold" },
  I: { name: "Internal chase", who: "BimaKavach", reminders: 0, interval: null, basis: "BH", escalations: 3, escInterval: 1, ending: "Escalates and stays open. Never terminates — parking it is how work disappears.", kind: "hold" },
};
const CL_RULES = { resetOnStateChange: true, loopINoReminder: true, stateChaseContinues: true, remindDuringAutoAdvance: false };
function clLoopForState(c) {
  if (!CL_FLOW[c] || CL_FLOW[c].terminal) return null;
  if (c === "R1" || c === "R3") return "E";
  if (c === "R2") return "H";
  if (c === "S0") return "A";
  if (["S1", "S2"].includes(c)) return "I";
  if (c === "S9") return "E";
  if (c === "S10") return "G";
  return "H";
}
const clLoop = (t) => (t.dormant || CL_FLOW[t.state].terminal ? null : clLoopForState(t.state));

/* ---------- derived per-ticket helpers ---------- */
function clDue(t) { const T = CL_FLOW[t.state].tat; return T ? clAddTat(t.stageAt, T.v, T.unit) : CL_NOW; }
const clOverdueBy = (t) => CL_NOW - clDue(t);
function clHealth(t) {
  if (CL_FLOW[t.state].terminal) return "done";
  if (t.dormant || t.subStatus === "Awaiting Court") return "parked";
  const o = clOverdueBy(t);
  if (o > 0) return "red";
  if (o > -6 * CL_HOUR) return "amber";
  return "green";
}
const clOwner = (t) => (t.dormant ? "Client" : CL_FLOW[t.state].owner);
function clStageLabel(t) {
  if (t.dormant) return "Dormant – " + t.dormant.sub;
  if (t.state === "ST") return "Terminated – Inactivity";
  if (t.state === "RX") return "Closed – Rejection accepted";
  if (t.closureReason) return "Closed – " + t.closureReason;
  return CL_FLOW[t.state].label;
}
function clClientLabel(t) {
  if (t.dormant) return CL_FLOW[t.dormant.fromState].client;
  if (t.state === "ST") return "Claim Closed – No Response";
  if (t.state === "RX") return "Claim Closed";
  if (t.closureReason) return ({ Withdrawn: "Claim Withdrawn", Duplicate: "Duplicate Claim", "Dormancy closure": "Claim Closed" }[t.closureReason]) || "Claim Closed";
  return CL_FLOW[t.state].client;
}
function clDueText(t) {
  if (CL_FLOW[t.state].terminal) return { cls: "fine", txt: "—" };
  if (t.dormant) return { cls: "fine", txt: "No chase" };
  if (t.subStatus === "Awaiting Court") return { cls: "fine", txt: "Held" };
  const o = clOverdueBy(t);
  if (o > 0) return { cls: "over", txt: clDur(o) + " over" };
  return { cls: o > -6 * CL_HOUR ? "soon" : "fine", txt: clDur(-o) + " left" };
}
/* Chase ladder position — for the Head escalation matrix and Manage tab. */
function clLadder(t) {
  const L = CL_LOOPS[clLoop(t)] || {};
  const r = t.chase.reminders, n = t.chase.escalations;
  if (L.reminders && r < L.reminders) return { rung: "Reminder " + r + " of " + L.reminders + " sent", next: "Reminder " + (r + 1), cadence: "Every " + L.interval + " " + (L.basis === "BH" ? "business hours" : "working days") };
  if (n === 0) return { rung: "Reminders done", next: "Escalation 1 to " + CL_HEAD, cadence: "Daily" };
  if (n < (L.escalations || 3)) return { rung: "Escalation " + n + " of " + (L.escalations || 3), next: "Escalation " + (n + 1), cadence: "Every " + L.escInterval + " working day" + (L.escInterval === 1 ? "" : "s") };
  return { rung: "Top rung held", next: "No further escalation", cadence: "Weekly" };
}

/* ---------- role-scoped buckets (C-5) ---------- */
const clVisible = (tickets, role) => (role === "head" ? tickets : tickets.filter((t) => t.cm === CL_ME));
const clLive = (tickets, role) => clVisible(tickets, role).filter((t) => !CL_FLOW[t.state].terminal);
const clDormantList = (tickets, role) => clVisible(tickets, role).filter((t) => t.dormant);
function clBuckets(tickets, role) {
  const live = clLive(tickets, role);
  return {
    attention: live.filter((t) => clHealth(t) !== "green"),
    open: live,
    closed: clVisible(tickets, role).filter((t) => CL_FLOW[t.state].terminal),
    escalated: live.filter((t) => t.escalated),
    critical: live.filter((t) => t.priority === "Critical" || t.priority === "High"),
    overdue: live.filter((t) => clOverdueBy(t) > 0),
    today: live.filter((t) => { const o = clOverdueBy(t); return o <= 0 && o > -12 * CL_HOUR; }),
    client: live.filter((t) => clOwner(t) === "Client"),
    insurer: live.filter((t) => clOwner(t) === "Insurer"),
    fresh: live.filter((t) => CL_NOW - t.createdAt < 24 * CL_HOUR),
    dormant: live.filter((t) => t.dormant),
  };
}

/* ---------- seed factory (React state only, rebuilt on mount) ---------- */
function clMake(o, i) {
  const f = CL_FLOW[o.state];
  return Object.assign({
    id: "CLM-" +(1067 + i),
    priority: "Medium", cm: CL_ME, flagged: false, subStatus: null,
    claimNo: null, surveyor: null, inspection: null, assessedLoss: null, bank: null,
    payments: [], admissibility: null, docs: {}, escalated: false,
    createdAt: clAgo(o.ageH || 24),
    stageAt: clAgo(o.stageH != null ? o.stageH : (o.ageH || 24)),
    ownerLog: [], audit: [], mail: [], requests: [], queries: [], uploads: {}, botLog: [], inbox: [],
    rejection: null, challenges: 0, dormant: null, closureReason: null,
    chase: { reminders: 0, escalations: 0, events: [] },
  }, o, { status: f.status, contact: (o.contactName || "") + " · " + (o.contactMobile || "") });
}
const CL_SEED = [
  { state: "S1", client: "Sunrise Chemicals Ltd", product: "Fire", insurer: "Iffco Tokio", policy: "FIR/2026/00812", dol: clAgo(30), loss: 1450000, priority: "Critical", ageH: 5, stageH: 4.2, desc: "Short-circuit fire in the finished-goods store at the Bhiwandi unit. Racking and packed stock damaged.", cause: "Electrical short circuit", location: "Plot 42, MIDC Bhiwandi, Thane 421302", contactName: "Rajesh Patil", contactMobile: "9820144120", channel: "Email" },
  { state: "S3", client: "Vertex Pharma Ltd", cm: "Shruthi", product: "Marine", insurer: "TATA AIG", policy: "MAR/2026/00655", dol: clAgo(96), loss: 320000, priority: "High", ageH: 52, stageH: 31, desc: "Consignment of API drums damaged in transit between Hyderabad and Ankleshwar. 6 of 40 drums breached.", cause: "Rough handling in transit", location: "NH-48, near Solapur", contactName: "Priya Nair", contactMobile: "9945022118", channel: "BimaKendra" },
  { state: "S4", client: "Vanguard Textiles Pvt Ltd", cm: "Mahendra", product: "Fire", insurer: "HDFC Ergo", policy: "FIR/2025/04417", dol: clAgo(30 * 24), loss: 2850000, priority: "Critical", ageH: 26 * 24, stageH: 9 * 24, desc: "Fire in the dyeing section spread to adjacent godown. Machinery and grey fabric stock affected.", cause: "Boiler overheating", location: "Survey 118, Pandesara, Surat 394221", contactName: "Amit Shah", contactMobile: "9825071144", channel: "RM Interface", claimNo: "HE/FIR/26/44120", escalated: true },
  { state: "S6", client: "Redwood Logistics Ltd", product: "MBD", insurer: "Bajaj", policy: "MBD/2026/00218", dol: clAgo(21 * 24), loss: 640000, priority: "Medium", ageH: 19 * 24, stageH: 3 * 24, desc: "Forklift hydraulic failure at the Chakan warehouse; mast assembly damaged beyond field repair.", cause: "Hydraulic ram failure", location: "Chakan MIDC Phase II, Pune", contactName: "Sunil Gowda", contactMobile: "9008433127", channel: "BimaKendra", claimNo: "BJ/MBD/26/00871", surveyor: { name: "K. Venkatesh", mobile: "98450 11902", visit: "Fri, 28 Aug" } },
  { state: "S9", client: "Acme Manufacturing", cm: "Shruthi", product: "Marine", insurer: "ICICI Lombard", policy: "MAR/2026/00901", dol: clAgo(34 * 24), loss: 185000, priority: "Medium", ageH: 31 * 24, stageH: 2.6 * 24, desc: "Water ingress into a container of precision components at Nhava Sheva. Corrosion on 12 cartons.", cause: "Container seal failure", location: "JNPT Nhava Sheva", contactName: "Rajesh Kumar", contactMobile: "9833055221", channel: "Email", claimNo: "IL/MAR/26/33418", assessedLoss: 162000 },
  { state: "S11", client: "Meridian Foods Pvt Ltd", product: "Fire", insurer: "New India", policy: "FIR/2025/03390", dol: clAgo(58 * 24), loss: 920000, priority: "High", ageH: 54 * 24, stageH: 5 * 24, desc: "Cold-store compressor fire; ammonia line damage and spoilage of stored produce.", cause: "Compressor motor failure", location: "Bidadi Industrial Area, Ramanagara", contactName: "Latha Rao", contactMobile: "9901240088", channel: "BimaKendra", claimNo: "NI/FIR/26/11204", assessedLoss: 874000, bank: { acc: "XXXXXX4471", ifsc: "SBIN0004432", cheque: "cancelled-cheque.pdf" }, payments: [{ type: "Instalment", n: 1, date: "18 Aug 2026", amt: 500000, utr: "UTR2608180114" }] },
  { state: "S13", client: "Kaveri Steel Works", cm: "Amogh", product: "MBD", insurer: "TATA AIG", policy: "MBD/2025/00074", dol: clAgo(96 * 24), loss: 410000, priority: "Medium", ageH: 92 * 24, stageH: 11 * 24, desc: "Rolling-mill gearbox seizure during the night shift.", cause: "Lubrication failure", location: "Ginigera, Koppal", contactName: "Mahesh B", contactMobile: "9448012007", channel: "RM Interface", claimNo: "TA/MBD/25/98811", assessedLoss: 388000, bank: { acc: "XXXXXX9903", ifsc: "HDFC0001188", cheque: "cancelled-cheque.pdf" }, payments: [{ type: "Full and final", n: null, date: "12 Aug 2026", amt: 388000, utr: "UTR2608120441" }] },
  { state: "S1", client: "Northgate Advisory LLP", cm: "Mahendra", product: "PI", insurer: "HDFC Ergo", policy: "PI/2026/00214", dol: clAgo(11 * 24), loss: null, priority: "High", ageH: 9 * 24, stageH: 3, desc: "Legal notice received from a former client alleging negligent advice on a 2024 transaction structuring engagement. No quantum pleaded in the notice.", cause: "Alleged professional negligence", location: "Notice served at the registered office, Bengaluru", contactName: "Ashwin Rao", contactMobile: "9845011277", channel: "Email", claimant: "Trident Capital Partners" },
  { state: "R1", client: "Orchid Hospitality Pvt Ltd", cm: "Shruthi", product: "Fire", insurer: "New India", policy: "FIR/2025/02218", dol: clAgo(47 * 24), loss: 1180000, priority: "Critical", ageH: 44 * 24, stageH: 4 * 24, desc: "Fire in the kitchen extraction duct at the Whitefield property spread to the false ceiling of the banquet hall.", cause: "Grease build-up in the extraction duct ignited", location: "Whitefield Main Road, Bengaluru 560066", contactName: "Deepa Iyer", contactMobile: "9880114402", channel: "BimaKendra", claimNo: "NI/FIR/26/07734", admissibility: "Within policy terms" },
  { state: "S0", client: "Sharma Textiles", product: "Fire", insurer: "Digit", policy: "FIR/2026/01120", dol: clAgo(20), loss: null, priority: "High", ageH: 16, stageH: 16, desc: "Break-in and fire at the godown reported by email. Estimated loss figure not stated.", cause: "Under investigation", location: "Not stated", contactName: "Priya Sharma", contactMobile: "9811033221", channel: "Email", missing: ["Estimated Loss Amount", "Photos", "Location of loss: full address"] },
];
function makeCLTickets() {
  const TICKETS = CL_SEED.map((o, i) => clMake(o, i));
  /* One completed round of rejection argument, so the to-and-fro shows on load (C-1). */
  const rj = TICKETS.find((x) => x.state === "R1");
  if (rj) {
    const poc = (CL_INSURERS[rj.insurer] || {}).poc || "claims@newindia.co.in";
    rj.rejection = {
      reason: "Repudiated under the warranty requiring six-monthly cleaning of kitchen extraction ductwork. The last cleaning certificate on file predates the loss by fourteen months.",
      at: rj.createdAt + 21 * CL_DAY,
      responses: [
        { kind: "challenge", n: 1, at: rj.createdAt + 24 * CL_DAY, text: "The duct was cleaned in March by a contractor who did not issue a certificate. The invoice and the contractor's confirmation are attached. The warranty speaks to cleaning, not to certification." },
        { kind: "reply", n: 1, at: rj.createdAt + 27 * CL_DAY, text: "We have re-examined the file against the challenge raised. The invoice is noted, but the warranty is expressed as a condition precedent and requires documentary evidence of each cleaning. The repudiation is maintained, with the fuller reasoning set out below." },
      ],
    };
    rj.challenges = 1;
    rj.subStatus = "Awaiting client";
    rj.botLog.unshift({ at: rj.rejection.at, state: "S4", type: "Insurer rejection", conf: 96, from: poc, extract: { Outcome: "Repudiated", Reason: "Warranty breach — duct cleaning" } });
    rj.audit.unshift(
      { at: rj.rejection.at, actor: "Email bot", role: "", what: "Insurer rejection classified and extracted", detail: "Warranty breach — duct cleaning · 96% confidence, from " + poc },
      { at: rj.rejection.responses[0].at, actor: rj.client, role: "Client", what: "Challenge 1 of 2 raised by the client", detail: rj.rejection.responses[0].text },
      { at: rj.rejection.responses[1].at, actor: "Email bot", role: "", what: "Insurer's detailed reply to challenge 1", detail: "Rejection upheld — warranty treated as a condition precedent · 96% confidence, from " + poc },
    );
    rj.audit.sort((a, b) => b.at - a.at);
  }
  /* A ticket past its stage TAT has already been chased — seed the reminder count. */
  TICKETS.forEach((t) => {
    if (CL_FLOW[t.state].terminal) return;
    const L = CL_LOOPS[clLoop(t)];
    if (!L || !L.reminders) return;
    const over = CL_NOW - clDue(t);
    if (over <= 0) return;
    const gap = L.basis === "BH" ? L.interval * CL_HOUR : L.interval * CL_DAY;
    t.chase.reminders = Math.min(L.reminders, 1 + Math.floor(over / gap));
    t.chase.events = Array.from({ length: t.chase.reminders }, (_, i) => ({ at: clDue(t) + gap * i, kind: "reminder", text: "Reminder " + (i + 1) + " of " + L.reminders + " sent to " + L.who.toLowerCase() })).reverse();
    if (t.escalated) {
      t.chase.escalations = 1;
      t.chase.events.unshift({ at: CL_NOW - 2 * CL_HOUR, kind: "escalation", text: "Escalation 1 of " + L.escalations + " — " + CL_HEAD + " notified" });
    }
  });
  /* Seed owner history + intimation audit so ageing has something real to show. */
  TICKETS.forEach((t) => {
    const idx = CL_ORDER.indexOf(t.state);
    let ts = t.createdAt;
    for (let i = 0; i < idx; i++) {
      const c = CL_ORDER[i], f = CL_FLOW[c];
      const dur = (t.stageAt - t.createdAt) / Math.max(idx, 1);
      t.ownerLog.push({ owner: f.owner, from: ts, to: ts + dur, state: c });
      ts += dur;
    }
    t.audit.push({ at: t.createdAt, actor: "System", role: "Bot", what: "Claim intimated via " + t.channel, detail: "Ticket created and routed to " + t.cm });
  });
  return TICKETS;
}

/* ---------- manual review queue (C-11) ---------- */
const CL_REASONS = { R1: "Low confidence, no linkage", R2: "Ambiguous linkage", R3: "Classification failed outright", R4: "Policy not found", R5: "Policy not active", R6: "Sender unrecognised", R7: "Critical extraction failed", R8: "Out of scope" };
function makeCLMRQ() {
  return [
    { id: "MB-2291", from: "accounts@vertexpharma.in", fromName: "Priya Nair, Vertex Pharma Ltd", to: "claims@bimakavach.com", at: clAgo(2), subject: "Regarding our claim — please advise", body: "Hi team,\n\nFollowing up on the matter we discussed with your office last week. The transporter has now come back to us and is disputing the damage certificate. Please advise how you want us to proceed, and whether this changes anything on the survey side.\n\nAlso attaching the revised packing list as promised.\n\nRegards,\nPriya", att: ["revised-packing-list.pdf"], headers: { "In-Reply-To": "none", References: "none", "Return-Path": "accounts@vertexpharma.in" }, guess: "Client additional data", conf: 63, reason: "R1", cand: "Vertex Pharma Ltd", note: "No policy number in the mail or the thread. Sender domain matches a client with more than one live claim." },
    { id: "MB-2284", from: "ravi.menon@gmail.com", fromName: "Ravi Menon", to: "claims@bimakavach.com", at: clAgo(19), subject: "Fire at our unit last night", body: "Sir,\n\nThere was a fire at our unit at Peenya last night around 11pm. Fire brigade attended. Machinery in the assembly shed is damaged. We have insurance through your office. Kindly start the claim.\n\nRavi Menon\n9845000000", att: ["IMG-20260901-0043.jpg", "IMG-20260901-0044.jpg"], headers: { "In-Reply-To": "none", References: "none", "Return-Path": "ravi.menon@gmail.com" }, guess: "New claim intimation", conf: 71, reason: "R6", cand: null, note: "Sender domain is not linked to any client, agent, insurer or surveyor record. A personal address on a commercial claim." },
    { id: "MB-2279", from: "claims.blr@iffcotokio.co.in", fromName: "Iffco Tokio, Bengaluru claims", to: "claims@bimakavach.com", at: clAgo(27), subject: "Surveyor appointment — loss reported", body: "Dear Partner,\n\nWe have appointed a surveyor for the loss reported by Sunrise Chemicals Ltd. Details will follow by separate mail. The insured may be advised to keep the site undisturbed until the visit.\n\nRegards,\nClaims desk", att: [], headers: { "In-Reply-To": "none", References: "none", "Return-Path": "claims.blr@iffcotokio.co.in" }, guess: "Surveyor appointment", conf: 89, reason: "R2", cand: "Sunrise Chemicals Ltd", note: "Above the classification threshold, but no claim number is quoted and the client has more than one live claim. Attaching a surveyor to the wrong claim would send them to the wrong site." },
    { id: "MB-2272", from: "ops@northstarpackaging.co.in", fromName: "Northstar Packaging", to: "claims@bimakavach.com", at: clAgo(6), subject: "Claim intimation — policy FIR/2024/00119", body: "Please register a claim under policy FIR/2024/00119 for water damage to stored cartons following heavy rain on the 28th. Estimated loss around 3.5 lakh. Documents to follow.", att: [], headers: { "In-Reply-To": "none", References: "none", "Return-Path": "ops@northstarpackaging.co.in" }, guess: "New claim intimation", conf: 93, reason: "R5", cand: null, note: "Policy matched but expired on 31 March 2026. A claim cannot be raised on an expired policy." },
  ];
}
/* Ranked candidates for linking (C-11.3) — by reliability of the match basis. */
function clCandidatesFor(m, tickets) {
  const out = [];
  tickets.filter((t) => !CL_FLOW[t.state].terminal).forEach((t) => {
    let score = 0; const basis = [];
    if (m.body.indexOf(t.id) > -1) { score += 100; basis.push("ticket reference in the body"); }
    if (t.claimNo && m.body.indexOf(t.claimNo) > -1) { score += 80; basis.push("insurer claim number"); }
    if (m.headers["In-Reply-To"] !== "none") { score += 60; basis.push("thread header"); }
    if (m.body.indexOf(t.policy) > -1 || m.subject.indexOf(t.policy) > -1) { score += 70; basis.push("policy number"); }
    if (m.cand && t.client === m.cand) { score += 40; basis.push("sender domain matches the client"); }
    const dom = m.from.split("@")[1] || "";
    if (dom && t.client.toLowerCase().replace(/[^a-z]/g, "").indexOf(dom.split(".")[0].toLowerCase()) > -1) { score += 30; basis.push("sender domain"); }
    if (score) out.push({ t, score, basis });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}
const CL_MRQ_LATE = (m) => CL_NOW - m.at > 24 * CL_HOUR;

/* =========================================================================
   ===================  BIMACLAIM — CLAIMS TMS UI  =========================
   Screens composed from the shared Endorsement design system. Behaviour
   read from the CL_ domain layer; state mutated in ClaimsApp (React only).
   ========================================================================= */

/* Owner → indicator token. Client reads info (blue), insurer caution (amber),
   our side brand (violet) — the "whose fault is the delay" signal (C-2). */
const CL_OWNER_IND = { Client: "info", Insurer: "caution", BimaKavach: "brand" };
const CL_HEALTH_IND = { red: "error", amber: "caution", green: "success", parked: "neutral", done: "muted" };
const CL_TINT = { error: C.breachSoft, caution: C.warnSoft, info: C.waitSoft, success: C.tealSoft, brand: C.brandBg, neutral: C.brandBg, muted: C.canvas };
const clOwnerInd = (t) => CL_OWNER_IND[clOwner(t)] || "neutral";
const clPrioInd = (p) => PRIO_IND[p] || "neutral";
const clStageInd = (t) => (CL_FLOW[t.state].terminal ? "muted" : t.escalated ? "error" : CL_HEALTH_IND[clHealth(t)] || "neutral");

/* Stage-due cell — the state pill then the deadline, mirroring the Endorsement
   SlaCell idiom. Never abbreviates BH/WD (C-3.2). */
function ClDue({ t }) {
  if (CL_FLOW[t.state].terminal) return <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>—</span>;
  if (t.dormant) return <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>No chase</span>;
  const d = clDueText(t);
  const tone = d.cls === "over" ? C.semError : d.cls === "soon" ? C.semCaution : C.figHint;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bk-num" style={{ fontSize: 13, fontWeight: 600, color: tone }}>{d.txt}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: C.figTert }}>{clTatLabel(t)}</span>
    </span>
  );
}

/* One claim as a table row — the whole row opens the ticket. Shared by the
   list and the home "needs you first" strip. `showCM` adds the manager column. */
function ClaimsRow({ t, onOpen, showCM, last }) {
  return (
    <button onClick={() => onOpen(t.id)}
      className="bk-item flex w-full items-center gap-3 px-2 py-3 text-left"
      style={{ borderBottom: last ? "none" : `0.5px solid ${C.lineSoft}`, cursor: "pointer" }}>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="bk-num" style={{ fontSize: 13, fontWeight: 700, color: C.figInk }}>{t.id}</span>
          {t.escalated && <Indicator label="Escalated" ind="error" outline />}
        </span>
        <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>
          {t.client} · {clProductLabel(t.product)} · {t.insurer}
        </span>
      </span>
      <span className="hidden min-w-0 flex-col gap-1 sm:flex" style={{ flexBasis: 180 }}>
        <span className="truncate" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>{clStageLabel(t)}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.figTert }}>{clDur(CL_NOW - t.createdAt)} old</span>
      </span>
      {showCM && <span className="hidden w-20 shrink-0 md:block" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{t.cm}</span>}
      <span className="hidden w-28 shrink-0 md:flex"><Indicator label={clOwner(t)} ind={clOwnerInd(t)} outline /></span>
      <span className="w-20 shrink-0"><Indicator label={t.priority} ind={clPrioInd(t.priority)} outline /></span>
      <span className="w-24 shrink-0 text-right"><ClDue t={t} /></span>
    </button>
  );
}
function ClaimsTable({ rows, onOpen, showCM, empty }) {
  if (!rows.length) return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border py-12 text-center"
      style={{ borderColor: C.subtle, borderWidth: "0.5px", borderStyle: "dashed" }}>
      <ListChecks size={18} style={{ color: C.figTert }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: C.figHint }}>{empty || "Nothing here right now."}</span>
    </div>
  );
  return (
    <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
      {rows.map((t, i) => <ClaimsRow key={t.id} t={t} onOpen={onOpen} showCM={showCM} last={i === rows.length - 1} />)}
    </div>
  );
}

/* Filter pills — the StagePills idiom over the Claims lifecycle slices. */
const CL_FILTERS = [
  ["attention", "Needs attention"], ["open", "All open"], ["critical", "High & critical"],
  ["overdue", "Overdue"], ["today", "Due today"], ["client", "Awaiting client"],
  ["insurer", "Awaiting insurer"], ["escalated", "Escalated"], ["fresh", "Freshly assigned"],
  ["closed", "Closed & terminal"],
];
function ClaimsFilterPills({ counts, active, onPick }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CL_FILTERS.map(([k, label]) => {
        const on = active === k;
        return (
          <button key={k} onClick={() => onPick(k)}
            className={`flex items-center whitespace-nowrap rounded-full leading-none transition-colors ${on ? "" : "bk-pill"}`}
            style={{ padding: "8px 12px", gap: 6, border: `0.5px solid ${on ? C.brand : C.line}`,
              background: on ? C.brand : C.white, color: on ? C.white : C.figHint, fontSize: 14, fontWeight: 500 }}>
            <span className="bk-pill-dot shrink-0 rounded-full" style={{ width: 8, height: 8, background: on ? C.white : C.figHint }} />
            <span>{label} <span className="bk-num">({counts[k] || 0})</span></span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Home (C-5) ---------- */
function ClaimsHome({ tickets, role, mrq, go, openTicket, user, isAdmin, onRole }) {
  const [range, setRange] = useState("Last Week");
  const B = clBuckets(tickets, role);
  const isHead = role === "head";
  const mrqLate = mrq.filter(CL_MRQ_LATE);

  /* desk cells */
  const cmCells = [
    { n: B.critical.length, lb: "High & critical", ind: "error", f: "critical" },
    { n: B.overdue.length, lb: "Overdue", ind: "error", f: "overdue" },
    { n: B.today.length, lb: "Due today", ind: "caution", f: "today" },
    { n: B.client.length, lb: "Awaiting client", ind: "info", f: "client" },
    { n: B.insurer.length, lb: "Awaiting insurer", ind: "caution", f: "insurer" },
    /* Escalated is an admin-only lens — visible to Umesh, hidden from Ruksana's desk. */
    ...(isAdmin ? [{ n: B.escalated.length, lb: "Escalated", ind: "error", f: "escalated" }] : []),
    { n: B.fresh.length, lb: "Freshly assigned", ind: "success", f: "fresh" },
  ];
  const headCells = [
    { n: B.open.length, lb: "Open across the team", ind: "brand", f: "open" },
    { n: B.overdue.length, lb: "Overdue", ind: "error", f: "overdue" },
    { n: B.escalated.length, lb: "Escalated to you", ind: "error", f: "escalated" },
    { n: B.dormant.length, lb: "Dormant", ind: "caution", f: "open" },
    { n: B.insurer.length, lb: "With insurers", ind: "caution", f: "insurer" },
    { n: mrqLate.length, lb: "Queue past SLA", ind: "error", f: "__mrq" },
  ];
  const cells = isHead ? headCells : cmCells;

  /* progress dashboard (CM) — mirrors the Endorsement ProgressCard metrics:
     closure (on-track over open) and median stage-clock turnaround, each with a
     Spark sparkline + performance meter, over an owner time-distribution donut. */
  const totalOpen = B.open.length;
  const onTrack = B.open.filter((t) => clOverdueBy(t) <= 0).length;
  const overdue = B.overdue.length;
  const closureScore = totalOpen ? onTrack / totalOpen : 1;
  const used = B.open.map((t) => { const span = Math.max(1, clDue(t) - t.stageAt); return Math.min(1.5, (CL_NOW - t.stageAt) / span); }).sort((a, b) => a - b);
  const medUsed = used.length ? used[Math.floor(used.length / 2)] : 0;
  const turnScore = Math.max(0, 1 - medUsed);
  /* Median turnaround is shown in days (the honest unit for the title) — the
     median age of open claims — not as a % of the stage clock, which read as
     misleading. The performance meter still runs on the stage-clock score. */
  const ageDays = B.open.map((t) => (CL_NOW - t.createdAt) / CL_DAY).sort((a, b) => a - b);
  const medDays = ageDays.length ? Math.round(ageDays[Math.floor(ageDays.length / 2)]) : 0;
  const green = "#007B00";
  /* First response time — dwell in "Under Review – BimaKavach" (S1), the first
     action after a claim is assigned. That stage's TAT is 2 business hours, so
     under 2h reads Well Done, ~2h On Track, over 2h Poor. Measured on the claims
     currently under review (time elapsed so far). */
  const frLive = clVisible(tickets, role).filter((t) => t.state === "S1").map((t) => (CL_NOW - t.stageAt) / CL_HOUR).sort((a, b) => a - b);
  const medFR = frLive.length ? frLive[Math.floor(frLive.length / 2)] : 2;
  const frStatus = medFR > 2.1 ? "Poor" : medFR < 1.9 ? "Well Done" : "On Track";
  const frScore = frStatus === "Well Done" ? 0.85 : frStatus === "On Track" ? 0.55 : 0.22;
  const frSub = frStatus === "Poor" ? "Over the 2-hour first-response target"
    : frStatus === "On Track" ? "At the 2-hour first-response target" : "Inside the 2-hour first-response target";
  const medians = Object.entries(CL_INSURERS).slice(0, 6).sort((a, b) => a[1].medianDays - b[1].medianDays);
  const maxM = Math.max(...medians.map((m) => m[1].medianDays));
  /* owner time-split over live claims (real leg + current-stage time) */
  const split = { BimaKavach: 0, Insurer: 0, Client: 0 };
  clLive(tickets, role).forEach((t) => {
    t.ownerLog.forEach((o) => { if (split[o.owner] != null) split[o.owner] += (o.to - o.from); });
    split[clOwner(t)] = (split[clOwner(t)] || 0) + (CL_NOW - t.stageAt);
  });
  const segments = ["BimaKavach", "Insurer", "Client"].map((k) => ({ label: k, hrs: split[k] / CL_HOUR, ind: PIE_IND[k], fill: PIE_FILL[k] })).filter((s) => s.hrs >= 0.5);
  /* range-driven illustrative windows (our oldest claim is < a month old) */
  const PROG = {
    "Last Week": {
      count: totalOpen,
      resp: { value: `${medFR.toFixed(1)} Hrs`, status: frStatus, score: frScore, sub: frSub, subTone: frStatus === "Poor" ? C.semCaution : green },
      turn: { value: `${medDays} Days`, status: scoreStatus(turnScore), score: turnScore, sub: "10% lower than last week", subTone: green },
      segments,
    },
    "Last Month": { count: 19, resp: { value: "1.8 Hrs", status: "Well Done", score: 0.85, sub: "Inside the 2-hour first-response target", subTone: green }, turn: { value: "16 Days", status: "On Track", score: 0.56, sub: "8% lower than last month", subTone: green }, segments },
    "Last Quarter": { count: 54, resp: { value: "1.6 Hrs", status: "Well Done", score: 0.85, sub: "Comfortably inside the 2-hour target", subTone: green }, turn: { value: "11 Days", status: "Well Done", score: 0.71, sub: "14% lower than last quarter", subTone: green }, segments },
    "Custom": { count: 12, resp: { value: "2.6 Hrs", status: "Poor", score: 0.22, sub: "Over the 2-hour first-response target", subTone: C.semCaution }, turn: { value: "21 Days", status: "Poor", score: 0.37, sub: "12% higher than the prior range", subTone: C.semCaution }, segments },
  };
  const prog = PROG[range];
  const pie = prog.segments.filter((s) => s.hrs >= 0.5);

  return (
    <div>
      {/* Same structure as the Endorsement Greeting: the signed-in user's own
          avatar, the date/time line, then their greeting — Ruksana in Hindi,
          admins (Umesh) in English. The Me/Team scope switch (admins only) sits
          in the same right slot as Endorsement: Me = a manager desk, Team = all. */}
      <Greeting user={user} right={isAdmin ? (
        <ScopeSwitch value={role === "head" ? "team" : "mine"} onChange={(v) => onRole(v === "team" ? "head" : "cm")} />
      ) : null} />
      <h2 className="mt-6 mb-4" style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>{isHead ? "The Book" : "Your Desk"}</h2>
      {/* One row on desktop: the column count tracks the number of desk cells
          (6 for the CM, 6 for the head, 7 for the admin CM view), so the strip
          never wraps — the cards simply narrow to fit. */}
      <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-${cells.length}`}>
        {cells.map((c) => (
          <DeskCard key={c.lb} count={c.n} tint={CL_TINT[c.ind]}
            pills={[{ label: c.lb, ind: c.ind, outline: true }]}
            onOpen={() => (c.f === "__mrq" ? go("review") : go("list", c.f))} />
        ))}
      </div>

      {isHead ? (
        <ClaimsHeadBody tickets={tickets} mrq={mrq} go={go} openTicket={openTicket} />
      ) : (
        <>
          <div className="mt-6" style={{ height: 1, background: C.subtle }} aria-hidden />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Your Progress</h2>
            <RangePills value={range} onChange={setRange} />
          </div>
          {/* Two ProgressCards (Spark + performance meter) over the owner donut —
              the same construction as the Endorsement Your-Progress block. */}
          <div key={range} className="bk-reveal mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-1">
              <ProgressCard title="First Response Time" value={prog.resp.value} status={prog.resp.status} score={prog.resp.score}
                sub={prog.resp.sub} subTone={prog.resp.subTone}
                tip="Time in Under Review – BimaKavach — your first action after a claim is assigned. Target is 2 business hours." />
              <ProgressCard title="Median Turnaround" value={prog.turn.value} status={prog.turn.status} score={prog.turn.score}
                sub={prog.turn.sub} subTone={prog.turn.subTone}
                tip="Median age of your open claims, in days; fewer is faster." />
            </div>
            <div className="rounded-xl border p-5 lg:col-span-2" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5"><FileText size={14} style={{ color: C.figHint }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Claim Time Distribution</span></div>
                  <div className="bk-num mt-1" style={{ fontSize: 18, fontWeight: 700, color: C.figInk }}>{prog.count} {prog.count === 1 ? "Claim" : "Claims"}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <InfoTip tip="Hours each party held your claims: you, the insurer, the client." />
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Last refreshed 4 Hrs. ago</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center">
                {pie.length ? <Donut segments={pie} /> : <Empty>No live ownership time to plot yet.</Empty>}
              </div>
              <p className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft, fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figTert }}>
                Ageing is recorded per owner change, so insurer-caused delay stays separable from ours.</p>
            </div>
          </div>

          {/* Insurer median turnaround — a Claims-specific view, kept below the graphs. */}
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
            <div className="flex items-center gap-1.5"><FileText size={14} style={{ color: C.figHint }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>Insurer median turnaround</span></div>
            <p className="mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Days from intimation to decision, last 12 months.</p>
            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {medians.map(([n, d]) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate" style={{ fontSize: 12, fontWeight: 500, color: C.figInk }}>{n}</span>
                  <span className="flex-1 overflow-hidden rounded-full" style={{ height: 8, background: C.lineSoft }}>
                    <span className="block h-full rounded-full" style={{ width: `${(d.medianDays / maxM) * 100}%`, background: d.medianDays > 12 ? C.semError : d.medianDays > 7 ? C.semCaution : "#00B200" }} />
                  </span>
                  <span className="bk-num w-8 shrink-0 text-right" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{d.medianDays}d</span>
                </div>
              ))}
            </div>
          </div>

          {B.escalated.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3" style={{ background: C.breachSoft, border: `0.5px solid ${IND.error.line}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.semError }}>
                {B.escalated.length} of your claims {B.escalated.length === 1 ? "has" : "have"} been escalated to {CL_HEAD}.</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.figHint }}>They stay in your queue — escalation raises visibility, it does not move ownership.</span>
              <button onClick={() => go("list", "escalated")} className="bk-dim" style={{ fontSize: 13, fontWeight: 600, color: C.brand }}>See them →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Claims Head home body — escalation matrix + team load (C-5.2/5.3). */
function ClaimsHeadBody({ tickets, mrq, go, openTicket }) {
  const rank = (t) => (t.escalated ? 0 : clOverdueBy(t) > 0 && !t.dormant ? 1 : t.dormant ? 3 : 2);
  /* Escalated-to-you list: only claims actually escalated to the Head are shown
     here (the strip and the every-live-claim listing were dropped per request). */
  const rows = tickets.filter((t) => !CL_FLOW[t.state].terminal && t.escalated).sort((a, b) => rank(a) - rank(b) || clOverdueBy(b) - clOverdueBy(a));
  const mrqLate = mrq.filter(CL_MRQ_LATE);
  const team = CL_CMS.map((cm) => {
    const own = tickets.filter((t) => t.cm === cm);
    const open = own.filter((t) => !CL_FLOW[t.state].terminal);
    return { cm, open: open.length, overdue: open.filter((t) => clOverdueBy(t) > 0).length,
      esc: open.filter((t) => t.escalated).length, dorm: open.filter((t) => t.dormant).length,
      closed: own.filter((t) => CL_FLOW[t.state].terminal).length,
      oldest: open.length ? Math.max(...open.map((t) => CL_NOW - t.createdAt)) : 0 };
  });
  const maxLoad = Math.max(1, ...team.map((x) => x.open));
  return (
    <>
      <h2 className="mt-6 mb-3" style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Escalated to You</h2>
      <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: C.figTert }}>
          <span className="flex-1">Claim</span><span className="hidden w-20 md:block">Manager</span>
          <span className="hidden w-28 sm:block">Owed by</span><span className="w-24">Escalations</span><span className="w-24 text-right">Stage due</span>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-6 text-center" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>Nothing escalated to you right now.</div>
        )}
        {rows.map((t) => {
          const L = CL_LOOPS[clLoop(t)] || {}; const n = t.chase.escalations, max = L.escalations || 3;
          return (
            <button key={t.id} onClick={() => openTicket(t.id)} className="bk-item flex w-full items-center gap-3 px-3 py-3 text-left" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, cursor: "pointer" }}>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2"><span className="bk-num" style={{ fontSize: 13, fontWeight: 700, color: C.figInk }}>{t.id}</span>
                  {t.escalated && <Indicator label="Escalated" ind="error" outline />}</span>
                <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{clStageLabel(t)} · {t.client}</span>
              </span>
              <span className="hidden w-20 shrink-0 md:block" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{t.cm}</span>
              <span className="hidden w-28 shrink-0 sm:flex"><Indicator label={clOwner(t)} ind={clOwnerInd(t)} outline /></span>
              <span className="w-24 shrink-0">{t.dormant ? <span style={{ fontSize: 12, color: C.figTert }}>No chase</span> :
                <span className="bk-num" style={{ fontSize: 13, fontWeight: 600, color: n ? C.semError : C.figHint }}>{n} of {max}</span>}</span>
              <span className="w-24 shrink-0 text-right"><ClDue t={t} /></span>
            </button>
          );
        })}
      </div>
      <p className="mt-3" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figTert }}>
        Two rules never bend: a claim never terminates while the insurer owes the action, and never once the insurer has approved payment.</p>

      <h2 className="mt-8 mb-3" style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>Team Load</h2>
      <div className="scroll-slim overflow-x-auto rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 640 }}>
          <thead><tr style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: C.figTert }}>
            {["Claims Manager", "Open", "Load", "Overdue", "Escalated", "Dormant", "Closed", "Oldest open"].map((h) => (
              <th key={h} className="px-3 py-2 text-left" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>{h}</th>))}
          </tr></thead>
          <tbody>{team.map((x) => (
            <tr key={x.cm} style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>
              <td className="px-3 py-2.5" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, fontWeight: 600 }}>{x.cm}</td>
              <td className="bk-num px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>{x.open}</td>
              <td className="px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, minWidth: 120 }}>
                <span className="block overflow-hidden rounded-full" style={{ height: 8, background: C.lineSoft }}>
                  <span className="block h-full rounded-full" style={{ width: `${(x.open / maxLoad) * 100}%`, background: C.brand }} /></span></td>
              <td className="bk-num px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, color: x.overdue ? C.semError : C.figTert }}>{x.overdue}</td>
              <td className="bk-num px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, color: x.esc ? C.semError : C.figTert }}>{x.esc}</td>
              <td className="bk-num px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>{x.dorm}</td>
              <td className="bk-num px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>{x.closed}</td>
              <td className="px-3" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, color: C.figHint }}>{x.oldest ? clDur(x.oldest) : "—"}</td>
            </tr>))}</tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3" style={{ background: mrqLate.length ? C.breachSoft : C.brandBg, border: `0.5px solid ${(mrqLate.length ? IND.error : IND.brand).line}` }}>
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>
          <b>Manual review queue.</b> {mrq.length} item{mrq.length === 1 ? "" : "s"} with no ticket yet, so nobody is individually accountable — that is why the 24-hour queue SLA escalates to you. {mrqLate.length ? `${mrqLate.length} past it.` : "All within it."}</span>
        <button onClick={() => go("review")} className="bk-dim" style={{ fontSize: 13, fontWeight: 600, color: C.brand }}>Open the queue →</button>
      </div>
    </>
  );
}

/* ---------- My claims — column table (same idiom as the Endorsement list) ---------- */
/* Fixed columns hold their width; the two content columns (Client, Stage) share
   the leftover space equally via `clFlex`, so the row fills the width evenly and
   stays responsive — no single column runs away (mirrors the Endorsement table). */
const CL_COLS = { id: { w: 150 }, owner: { w: 116 }, prio: { w: 96 }, age: { w: 92 }, cm: { w: 84 }, due: { w: 132 } };
const clCell = (c, extra) => ({ width: c.w, flex: "0 1 auto", minWidth: 0, paddingLeft: c.pl, paddingRight: c.pr, ...extra });
const clFlex = (extra) => ({ flex: "1 1 0", minWidth: 148, paddingRight: 8, ...extra });
const CL_PAGE = 10;
function ClaimsList({ tickets, role, filter, setFilter, openTicket }) {
  const [owner, setOwner] = useState(new Set());
  const [prio, setPrio] = useState(new Set());
  const [stage, setStage] = useState(new Set());
  const [sort, setSort] = useState({ key: "urgency", dir: "desc" });
  const [openKey, setOpenKey] = useState(null);
  const [page, setPage] = useState(0);
  const head = role === "head";

  useEffect(() => {
    if (!openKey) return;
    const away = (e) => { if (!e.target.closest("[data-menu]")) setOpenKey(null); };
    const esc = (e) => { if (e.key === "Escape") setOpenKey(null); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [openKey]);
  useEffect(() => { setPage(0); }, [filter, owner, prio, stage, sort]);

  const B = clBuckets(tickets, role);
  const counts = Object.fromEntries(CL_FILTERS.map(([k]) => [k, (B[k] || []).length]));
  const has = (s, v) => s.size === 0 || s.has(v);
  const base = (B[filter] || B.attention).filter((t) => has(owner, clOwner(t))).filter((t) => has(prio, t.priority)).filter((t) => has(stage, clStageLabel(t)));
  const d = sort.dir === "asc" ? 1 : -1;
  const rows = base.slice().sort((a, b) => {
    if (sort.key === "urgency") { const rk = (t) => (t.escalated ? 0 : clOverdueBy(t) > 0 ? 1 : 2); return rk(a) - rk(b) || clOverdueBy(b) - clOverdueBy(a); }
    if (sort.key === "age") return ((CL_NOW - a.createdAt) - (CL_NOW - b.createdAt)) * d;
    if (sort.key === "due") return (clOverdueBy(a) - clOverdueBy(b)) * d;
    if (sort.key === "prio") { const pr = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return ((pr[a.priority] ?? 9) - (pr[b.priority] ?? 9)) * d; }
    if (sort.key === "id") return a.id.localeCompare(b.id) * d;
    return 0;
  });
  const pages = Math.max(1, Math.ceil(rows.length / CL_PAGE));
  const at = Math.min(page, pages - 1);
  const view = rows.slice(at * CL_PAGE, at * CL_PAGE + CL_PAGE);
  const filtered = owner.size || prio.size || stage.size;

  const OWNER_OPTS = ["Client", "Insurer", "BimaKavach"].map((v) => ({ value: v, label: v }));
  const PRIO_OPTS = ["Critical", "High", "Medium", "Low"].map((v) => ({ value: v, label: v }));
  const STAGE_OPTS = [...new Set(clVisible(tickets, role).map((t) => clStageLabel(t)))].sort().map((v) => ({ value: v, label: v }));
  const hf = { openKey, setOpenKey };
  const th = { fontSize: 14, fontWeight: 600, color: "#1C1C1C" };
  const sortBy = (k) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));
  const SortHead = ({ label, k, style }) => (
    <button onClick={() => sortBy(k)} className="flex items-center gap-1 text-left" style={style} title={`Sort by ${label.toLowerCase()}`}>
      <span style={{ fontSize: 14, fontWeight: 600, color: sort.key === k ? C.brand : "#1C1C1C" }}>{label}</span>
      {sort.key === k && (sort.dir === "asc" ? <ChevronUp size={13} style={{ color: C.brand }} /> : <ChevronDown size={13} style={{ color: C.brand }} />)}
    </button>
  );

  return (
    <div className="space-y-4">
      <PageHead title="My claims" hint={head ? "Every claim across the team." : `The claims assigned to ${CL_ME}.`} />
      <ClaimsFilterPills counts={counts} active={filter} onPick={setFilter} />

      <section className="flex flex-col gap-1">
        <div className="flex items-center rounded-xl px-2 py-3" style={{ background: C.canvas }}>
          <SortHead label="Claim" k="id" style={clCell(CL_COLS.id)} />
          <span className="truncate" style={clFlex(th)}>Client</span>
          <span style={clFlex()}><HeaderFilter id="stage" label="Stage" options={STAGE_OPTS} selected={stage} setSelected={setStage} {...hf} /></span>
          <span style={clCell(CL_COLS.owner)}><HeaderFilter id="owner" label="Owed by" options={OWNER_OPTS} selected={owner} setSelected={setOwner} {...hf} /></span>
          <span style={clCell(CL_COLS.prio)}><HeaderFilter id="prio" label="Priority" options={PRIO_OPTS} selected={prio} setSelected={setPrio} {...hf} /></span>
          <SortHead label="Ticket Age" k="age" style={clCell(CL_COLS.age)} />
          {head && <span className="truncate" style={clCell(CL_COLS.cm, th)}>Manager</span>}
          <SortHead label="Stage due" k="due" style={clCell(CL_COLS.due)} />
        </div>
        {view.length ? view.map((t) => (
          <button key={t.id} onClick={() => openTicket(t.id)} className="bk-item flex w-full items-center rounded-xl px-2 py-3 text-left hover:bg-slate-50" style={{ cursor: "pointer" }}>
            <span className="flex items-center gap-2" style={clCell(CL_COLS.id)}>
              <span className="bk-num truncate" style={{ fontSize: 13, fontWeight: 700, color: C.figInk }}>{t.id}</span>
              {t.escalated && <span className="shrink-0 rounded-full" title="Escalated" style={{ width: 6, height: 6, background: IND.error.dot }} />}
            </span>
            <span className="truncate" style={clFlex()}>
              <span className="block truncate" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>{t.client}</span>
              <span className="block truncate" style={{ fontSize: 11, fontWeight: 500, color: C.figTert }}>{clProductLabel(t.product)} · {t.insurer}</span>
            </span>
            <span style={clFlex()}><Indicator label={clStageLabel(t)} ind={clStageInd(t)} outline /></span>
            <span style={clCell(CL_COLS.owner)}><Indicator label={clOwner(t)} ind={clOwnerInd(t)} outline /></span>
            <span style={clCell(CL_COLS.prio)}><Indicator label={t.priority} ind={clPrioInd(t.priority)} outline /></span>
            <span className="bk-num" style={clCell(CL_COLS.age, { fontSize: 12, fontWeight: 500, color: C.figHint })}>{clDur(CL_NOW - t.createdAt)}</span>
            {head && <span className="truncate" style={clCell(CL_COLS.cm, { fontSize: 12, fontWeight: 600, color: C.figHint })}>{t.cm}</span>}
            <span style={clCell(CL_COLS.due)}><ClDue t={t} /></span>
          </button>
        )) : <Empty>No claims match these filters.</Empty>}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs" style={{ color: C.figTert }}>
        <span><span className="bk-num">{rows.length}</span> of <span className="bk-num">{clVisible(tickets, role).length}</span> claims{filtered ? " · filters applied" : ""}</span>
        {rows.length > CL_PAGE && <Pager page={at} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

/* ---------- Detail: transition builders (pure) + screen ---------- */
const clAudit = (t, what, detail, actor, role) => ({ ...t, audit: [{ at: CL_NOW, actor: actor || CL_ME, role: role || (actor ? "" : "Claims Manager"), what, detail: detail || "" }, ...t.audit] });
function clStep(t, to, extra = {}) {
  const next = to === "BRANCH" ? ((t.loss || 0) > CL_SURVEYOR_THRESHOLD ? "S5" : "S8") : to;
  return { ...t, ...extra,
    ownerLog: [...t.ownerLog, { owner: CL_FLOW[t.state].owner, from: t.stageAt, to: CL_NOW, state: t.state }],
    state: next, status: CL_FLOW[next].status, stageAt: CL_NOW, escalated: false,
    chase: { reminders: 0, escalations: 0, events: [] }, subStatus: CL_FLOW[next].sub || null };
}
/* Intake field → captured value (C-6 Overview). */
function clFieldVals(t) {
  return {
    "Policy No": t.policy, "Policy No.": t.policy, "Insured Name": t.client,
    "Date & Time of Incident": clFdt(t.dol), "Date of loss": clFdt(t.dol), "Date of Loss": clFdt(t.dol),
    "Date of Accident": clFdt(t.dol), "Date the claim or notice was received": clFdt(t.dol),
    "Brief description about the incident": t.desc, "Loss description": t.desc, "Description of the claim": t.desc,
    "Cause of Loss": t.cause, "Cause of the Accident": t.cause, "Nature of the allegation": t.cause,
    "Claimant name": t.claimant, "Location of loss: full address": t.location, "Location of Loss": t.location,
    "Location details (damage/loss)": t.location, "Location of accident": t.location,
    "Estimated Loss Amount": t.loss ? clInr(t.loss) : null, "Estimated loss amount": t.loss ? clInr(t.loss) : null,
    "Contact person name": t.contactName, "Contact person mobile": clFmtMob(t.contactMobile),
    "Contact Person Name & No": t.contactName ? `${t.contactName} · ${clFmtMob(t.contactMobile)}` : null,
    "Contact person name & mobile": t.contactName ? `${t.contactName} · ${clFmtMob(t.contactMobile)}` : null,
    "Photos": (CL_PHOTOS[t.product] || 0) + " images attached", "Photos of damage": (CL_PHOTOS[t.product] || 0) + " images attached",
  };
}
/* What the bot will extract at a stage — keys only, for the waiting panel (C-2). */
function clBotPreview(t) {
  const poc = (CL_INSURERS[t.insurer] || {}).poc || "claims@" + t.insurer.toLowerCase().replace(/[^a-z]/g, "") + ".co.in";
  const M = {
    S3: { type: "Claim registration", keys: ["Insurer claim number"] },
    S4: { type: "Admissibility decision", keys: ["Decision", "Next step"] },
    S5: { type: "Surveyor appointment", keys: ["Surveyor name", "Firm", "Mobile", "Proposed visit date"] },
    S6: { type: "Inspection & assessment report", keys: ["Inspection outcome", "Assessed loss", "Report arrived as"] },
    S8: { type: "Assessment report", keys: ["Inspection outcome", "Assessed loss", "Report arrived as"] },
    S11: { type: "Payment confirmation", keys: ["Amount", "Mode", "UTR"] },
    R2: { type: "Detailed rejection", keys: ["Outcome", "Grounds", "Challenges used"] },
  };
  return { from: poc, ...(M[t.state] || { type: "Inbound mail", keys: [] }) };
}
const CL_TAB_LABELS = { overview: "Overview", docs: "Document vault", client: "Client channel", mail: "Mail trail", survey: "Survey & assessment", payment: "Payment", history: "Ticket history", manage: "Manage ticket" };

/* A labelled field control used by the action-panel forms. */
function ClInput({ label, value, onChange, type = "text", placeholder, options }) {
  return (
    <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {options
        ? <select value={value} onChange={(e) => onChange(e.target.value)} style={FIELD}>{options.map((o) => <option key={o}>{o}</option>)}</select>
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={FIELD} />}
    </label>
  );
}
const ClNote = ({ tone, bg, children }) => (
  <div className="w-full" style={{ background: bg, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: tone }}>{children}</div>
);

function ClaimsDetail({ t, role, act }) {
  const [tab, setTab] = useState("overview");
  const consented = CL_ORDER.indexOf(t.state) >= CL_ORDER.indexOf("S10");
  const surveyTrack = !!t.surveyor || !!t.report || CL_ORDER.indexOf(t.state) >= CL_ORDER.indexOf("S5");
  const qOpen = t.queries.filter((q) => q.status === "open").length;
  const tabs = [["overview"], ["docs"], ["client"], ["mail"]]
    .concat(surveyTrack ? [["survey"]] : []).concat(consented ? [["payment"]] : [])
    .concat([["history"], ["manage"]])
    .map(([k]) => [k, k === "client" && qOpen ? `Client channel (${qOpen})` : CL_TAB_LABELS[k]]);
  const activeTab = (tab === "payment" && !consented) || (tab === "survey" && !surveyTrack) ? "overview" : tab;
  const f = CL_FLOW[t.state], hc = clHealth(t);

  return (
    <div>
      {/* header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="bk-num" style={{ fontSize: 24, fontWeight: 700, color: C.figInk }}>{t.id}</h1>
          <Indicator label={clStageLabel(t)} ind={clStageInd(t)} big status />
          <span className="flex-1" />
          <Indicator label={t.priority} ind={clPrioInd(t.priority)} outline />
          {/* Product chip removed — it's in the meta row below with Client and Policy. */}
          <Indicator label={`${t.channel} intake`} ind="neutral" outline />
          <Indicator label={clOwner(t)} ind={clOwnerInd(t)} outline />
          <ClParticipants t={t} down />
        </div>
        {/* meta row — same format as the Endorsement: value then its icon/logo,
            with a hover tooltip naming each field. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { key: "client", text: t.client, icon: User, label: "Client" },
            { key: "policy", text: t.policy, icon: FileText, num: true, label: "Policy number" },
            { key: "product", text: clProductLabel(t.product), icon: Layers, img: clProductIcon(t.product), imgH: 24, label: "Product" },
            { key: "insurer", text: `${t.insurer} (${CL_INSURERS[t.insurer].mode})`, icon: ShieldCheck, img: clInsurerLogo(t.insurer), imgH: 22, label: "Insurer · intimation mode" },
            { key: "claimno", text: t.claimNo || "No claim no. yet", icon: Tags, num: true, label: "Insurer claim number" },
            { key: "sees", text: `Client sees: ${clClientLabel(t)}`, icon: Eye, label: "Client's claim status on BimaKendra" },
          ].map((m) => <ClMetaItem key={m.key} m={m} />)}
        </div>
      </div>
      <div className="mb-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <TabBar tabs={tabs} tab={activeTab} setTab={setTab} />
      </div>

      {activeTab === "overview" && <ClOverview t={t} act={act} setTab={setTab} />}
      {activeTab === "docs" && <ClDocs t={t} act={act} />}
      {activeTab === "client" && <ClClient t={t} act={act} />}
      {activeTab === "mail" && <ClMail t={t} />}
      {activeTab === "survey" && <ClSurvey t={t} act={act} setTab={setTab} />}
      {activeTab === "payment" && <ClPayment t={t} act={act} setTab={setTab} />}
      {activeTab === "history" && <ClHistory t={t} />}
      {activeTab === "manage" && <ClManage t={t} role={role} act={act} setTab={setTab} />}
    </div>
  );
}

/* Claims insurer names differ slightly from the endorsement logo master keys. */
const CL_LOGO_ALIAS = { "Bajaj": "Bajaj Allianz", "HDFC Ergo": "HDFC ERGO", "Iffco Tokio": "IFFCO Tokio" };
const clInsurerLogo = (name) => INSURER_LOGO[name] || INSURER_LOGO[CL_LOGO_ALIAS[name]] || null;
/* First-name CM → portal photo (only Ruksana has one; the rest read as initials). */
const clCmAvatar = (cm) => (cm === "Ruksana" ? AVATAR_RUKSANA : null);
/* Claims short product names → the endorsement product-rosette master keys. */
const CL_PRODUCT_ALIAS = { Fire: "Fire & Burglary", Marine: "Marine Cargo", MBD: "Engineering (CAR / EAR / CPM)", WC: "Workmen Compensation (WC)", CGL: "Commercial General Liability (CGL)", PI: "Professional Indemnity (PI)", "D&O": "Directors & Officers (D&O)" };
const clProductIcon = (p) => PRODUCT_ICON[p] || PRODUCT_ICON[CL_PRODUCT_ALIAS[p]] || null;
/* Display the product in full — the short codes (MBD, WC, CGL …) are master
   keys, not what the desk should read. Icon lookups still use the short code. */
const CL_PRODUCT_FULL = { Fire: "Fire & Burglary", Marine: "Marine Cargo", MBD: "Machinery Breakdown",
  WC: "Workmen Compensation", CGL: "Commercial General Liability", PI: "Professional Indemnity", "D&O": "Directors & Officers" };
const clProductLabel = (p) => CL_PRODUCT_FULL[p] || p;

/* The people on a claim, stacked (same idiom as the Endorsement Participants):
   the Claims Manager (photo where we have one), the insurer (its logo, sized to
   fill the circle), and the client (initials). Hover isolates one + names it. */
function ClParticipants({ t, size = 20, down }) {
  const who = [
    { kind: "owner", name: t.cm, role: "Claims Manager", img: clCmAvatar(t.cm), cover: true },
    { kind: "insurer", name: t.insurer, role: "Insurer", img: clInsurerLogo(t.insurer) },
    { kind: "client", name: t.client, role: "Client" },
  ];
  const [over, setOver] = useState(-1);
  return (
    <span className="flex shrink-0 items-center" onMouseLeave={() => setOver(-1)}>
      {who.map((p, i) => (
        <span key={p.kind} className="relative flex" onMouseEnter={() => setOver(i)} style={{ marginLeft: i ? -6 : 0, zIndex: over === i ? who.length + 1 : who.length - i }}>
          <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ width: size, height: size, border: `1.5px solid ${C.white}`,
              background: p.img ? C.white : (MARK_BG[p.kind] || C.subtle), color: MARK_FG[p.kind] || C.brand,
              fontFamily: SERIF, fontStyle: "italic", fontSize: Math.round(size * 0.8), lineHeight: 1,
              opacity: over >= 0 && over !== i ? 0.1 : 1, boxShadow: over === i ? "0 0 4px rgba(65,0,207,0.25)" : undefined, transition: "opacity .15s ease-out" }}>
            {p.img
              ? <img src={p.img} alt="" className={`h-full w-full ${p.cover ? "object-cover" : "object-contain"}`} />
              : (p.name || "?").trim().charAt(0).toUpperCase()}
          </span>
          {over === i && <Tip down={down}>{p.name} · {p.role}</Tip>}
        </span>
      ))}
    </span>
  );
}

/* One meta-row entry (value + icon/logo) with a hover tooltip naming the field,
   the same recessed Tip the participant avatars use. */
function ClMetaItem({ m }) {
  const [over, setOver] = useState(false);
  return (
    <span className="relative flex items-center gap-1.5" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <span className={m.num ? "bk-num" : ""} style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>{m.text}</span>
      {m.img
        ? <img src={m.img} alt="" className="shrink-0" style={{ height: m.imgH, width: "auto" }} />
        : <m.icon size={16} style={{ color: C.figInk }} className="shrink-0" />}
      {over && <Tip down>{m.label}</Tip>}
    </span>
  );
}

/* Claim workflow phases — the Endorsement PhaseBar: a progress-line segment per
   phase (green done · amber current · red if the current phase is breached),
   with the phase label beneath. Phases group the ticket's own path stages. */
function ClPhaseBar({ t }) {
  const path = clPath(t);
  const idx = path.indexOf(t.state);
  const terminal = CL_FLOW[t.state].terminal;
  const cur = terminal ? CL_PHASES.length : CL_FLOW[t.state].phase;
  return (
    <div className="flex gap-3">
      {CL_PHASES.map((label, i) => {
        const stagesInPhase = path.filter((c) => CL_FLOW[c].phase === i);
        const done = i < cur, current = i === cur;
        let fill = done ? 100 : 0;
        if (current && stagesInPhase.length && idx > -1) {
          const first = path.indexOf(stagesInPhase[0]);
          fill = Math.max(0, Math.min(100, ((idx - first + 1) / stagesInPhase.length) * 100));
        }
        const over = current && clHealth(t) === "red";
        const tone = over ? IND.error.dot : current ? IND.caution.dot : IND.success.dot;
        return (
          <div key={label} className="min-w-0 flex-1">
            <div style={{ height: 3, borderRadius: 999, background: C.subtle, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${fill}%`, borderRadius: 999, background: tone }} />
            </div>
            <div className="mt-2 truncate" title={stagesInPhase.map((c) => CL_FLOW[c].label).join(" → ") || label}
              style={{ fontSize: 14, fontWeight: current ? 600 : 500, color: current ? C.figInk : C.figHint }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* Claim stage timeline — the Endorsement SlaCard, verbatim in structure, fed
   with Claims context (owner party badge, spelled-out TAT, BH/WD calendar). */
function ClSlaCard({ t }) {
  const f = CL_FLOW[t.state], hc = clHealth(t);
  const noClock = f.terminal || !f.tat;
  const held = hc === "parked";
  const over = hc === "red";
  const head = noClock ? (f.terminal ? "Clock stopped" : "No clock on this stage")
    : held ? "On hold"
    : over ? `${clDur(clOverdueBy(t))} over` : `${clDur(-clOverdueBy(t))} left`;
  const sk = noClock ? { grad: C.canvas, border: C.subtle, head: C.figHint, remain: C.subtle }
    : held ? { grad: C.waitSoft, border: "#C7CCEB", head: C.wait, remain: C.wait }
    : over ? { grad: "#FFECEC", border: "#FFABAB", head: "#CF0000", remain: "#F10000" }
    : hc === "amber" ? { grad: "#FFF9E6", border: "#FFE890", head: "#B38F0A", remain: "#FFCF0E" }
    : { grad: "#ECFBEA", border: "#A9EAA2", head: "#007B00", remain: "#00B200" };
  const owner = clOwner(t);
  const party = owner === "Insurer" ? t.insurer : owner === "Client" ? t.client : "BimaKavach";
  const pInd = clOwnerInd(t);
  const span = Math.max(1, clDue(t) - t.stageAt);
  const usedPct = over ? 100 : Math.max(0, Math.min(100, ((CL_NOW - t.stageAt) / span) * 100));
  const leftPct = Math.max(0, 100 - usedPct);
  return (
    <div style={{ background: `linear-gradient(180deg, ${C.white} 50%, ${sk.grad} 100%)`, border: `0.5px solid ${sk.border}`, borderRadius: 12, padding: "14px 16px 20px" }}>
      <div className="flex items-baseline justify-between gap-2">
        <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert, lineHeight: 1.2 }}>Claim Stage Timeline</span>
        {!noClock && (
          <span className="flex items-center gap-1.5" title={clTatLabel(t)}>
            <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 20, height: 20, background: IND_TEXT[pInd] || C.brand, color: C.white, fontFamily: SERIF, fontStyle: "italic", fontSize: 13, lineHeight: 1 }}>{party.charAt(0)}</span>
            <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: C.figInk, maxWidth: 150 }}>{party}</span>
          </span>
        )}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, color: sk.head }}>{head}</div>
      {!noClock && (
        <>
          <div className="mt-2 overflow-hidden" style={{ height: 3, borderRadius: 999, background: "#F10000", boxShadow: "0px 2px 8px 0px rgba(169,172,177,0.24)" }}>
            <div style={{ height: "100%", background: sk.remain, width: `${leftPct}%`, opacity: held ? 0.5 : 1, transition: "width .3s ease-out" }} />
          </div>
          <p className="mt-2" style={{ fontSize: 14, fontWeight: 500, color: C.figPlaceholder }}>
            <span style={{ color: sk.head }}>{clTatLabel(t)} total</span>
            {` • ${clDur(CL_NOW - t.stageAt)} elapsed`}
          </p>
          <div className="mt-2 flex items-start gap-1.5 py-1" style={{ fontSize: 14, fontWeight: 500, color: C.figHint }}>
            <span className="mt-0.5"><ClockFading size={14} color={C.figInk} /></span>
            <span>{over ? "Was due" : "Due"} {fmtWhen(new Date(clDue(t)))}</span>
          </div>
          {t.escalated && (
            <div className="flex items-start gap-1.5" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: C.semError }}>
              <span>Escalated to {CL_HEAD} — {owner === "Insurer" ? "the insurer" : owner === "Client" ? "the client" : "BimaKavach"} owes the action, so it stays open.</span>
            </div>
          )}
        </>
      )}
      {held && (
        <div className="mt-1 flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 500, color: C.wait }}>
          <PauseCircle size={12} className="shrink-0" />
          {t.dormant ? "Parked as dormant — no chase runs while it sits here." : "Held — awaiting court."}
        </div>
      )}
    </div>
  );
}

/* Workflow-stages list — the Endorsement StageList, verbatim in structure:
   timeline dot + connector, a per-stage card tinted by state, the stage label
   (struck through once done), the owning party, its TAT, the time spent, and a
   done/now/next check. Fed by the claim's own stage path and ownerLog. */
function ClStageList({ t }) {
  const path = clPath(t), here = path.indexOf(t.state);
  return (
    <div className="flex flex-col gap-2 p-3">
      {path.map((k, i) => {
        const sg = CL_FLOW[k], leg = (t.ownerLog || []).find((o) => o.state === k);
        const done = i < here, now = i === here, over = now && clOverdueBy(t) > 0;
        const dur = leg ? clDur(leg.to - leg.from) : now && !sg.terminal ? `LIVE · ${clDur(CL_NOW - t.stageAt)}` : "-";
        const tat = sg.tat ? `${sg.tat.v} ${sg.tat.unit === "BH" ? "business hour(s)" : "working day(s)"}` : "no clock";
        const ownInd = CL_OWNER_IND[sg.owner] || "neutral";
        return (
          <div key={k} className="flex items-stretch gap-3">
            <span className="relative flex shrink-0 items-center justify-center" style={{ width: 28, height: 40, borderRadius: 8, background: "transparent" }}>
              <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: now ? C.brandBg : C.canvas }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: now ? C.brand : C.figTert }} />
              </span>
              {i < path.length - 1 && <span className="absolute" style={{ top: 34, bottom: -8, left: 13.5, width: 0, borderLeft: `1px dashed ${C.line}` }} />}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2"
              style={{ padding: "10px 12px", borderRadius: 8, background: done ? C.canvas : now ? C.brand200 : C.white, border: `1px solid ${done || now ? "transparent" : C.subtle}` }}>
              <span className="truncate" style={{ fontSize: 14, fontWeight: now ? 600 : 500,
                color: over ? C.semError : done ? C.figHint : C.figInk, textDecoration: done ? "line-through" : "none" }}>{sg.label}</span>
              <span className="flex-1" />
              {sg.owner && sg.owner !== "—" && (
                <span className="flex shrink-0 items-center gap-1">
                  <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, background: (IND[ownInd] || IND.neutral).dot }} />
                  <span className="whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>{sg.owner}</span>
                </span>
              )}
              <span className="bk-num whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>{tat}</span>
              <span className="bk-num w-20 shrink-0 whitespace-nowrap text-right"
                style={{ fontSize: 13, fontWeight: 500, color: over ? C.semError : now ? C.figInk : C.figHint }}>{dur}</span>
              <StageCheck state={done ? "done" : now ? "now" : "next"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
function ClOverview({ t, act, setTab }) {
  const [stagesOpen, setStagesOpen] = useState(false);
  const f = CL_FLOW[t.state], hc = clHealth(t);
  if (["SX", "ST", "RX"].includes(t.state)) {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        <SectionTitle>{clStageLabel(t)}</SectionTitle>
        <p className="mt-1" style={{ fontSize: 13, fontWeight: 500, color: C.figTert }}>
          Closed {clFdt(t.stageAt)} by {t.cm}. The reason and before/after values are on the Ticket history tab.</p>
        <p className="mt-3" style={{ fontSize: 13, fontWeight: 500, color: C.figHint }}>Client sees: <b style={{ color: C.figInk }}>{clClientLabel(t)}</b> · {t.state === "ST" ? "Not reopenable — the client raises a fresh claim." : "A fresh claim would have to be raised."}</p>
      </div>
    );
  }
  const o = clOverdueBy(t), elapsed = CL_NOW - t.stageAt, budget = Math.max(1, clDue(t) - t.stageAt);
  const pct = Math.min(100, (elapsed / budget) * 100);
  const path = clPath(t), pIdx = path.indexOf(t.state);
  const vals = clFieldVals(t);
  const fields = CL_FIELDS[t.product] || [];
  const tone = hc === "red" ? C.semError : hc === "amber" ? C.semCaution : C.figHint;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* left: stage clock */}
      <div className="flex flex-col gap-4">
        <ClSlaCard t={t} />
      </div>

      {/* right: workflow + capture + action */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div className="flex items-baseline justify-between gap-3">
            <SectionTitle>Claim workflow</SectionTitle>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Claim age: {clDur(CL_NOW - t.createdAt)}</span>
          </div>
          <div className="mt-3"><ClPhaseBar t={t} /></div>
          <div className="mt-3">
            <Drawer icon={ListChecks} title="Workflow Stages" open={stagesOpen} setOpen={setStagesOpen}
              badge={<MiniTag>{path.length} stages</MiniTag>}>
              <ClStageList t={t} />
            </Drawer>
          </div>

          <div className="mt-4 border-t pt-4" style={{ borderColor: C.lineSoft }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14, fontWeight: 600, color: C.figInk }}>Captured at intake</span>
              <span className="flex-1" />
              <Indicator label={t.missing ? "Incomplete" : "Complete"} ind={t.missing ? "caution" : "success"} />
            </div>
            <p className="mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{clProductLabel(t.product)} mandatory field set, from the product × claim-intimation master.</p>
            <div className="mt-3 flex flex-col">
              {fields.map((k) => {
                const missing = (t.missing || []).includes(k);
                const optional = clLossOptional(t.product) && k.toLowerCase().startsWith("estimated loss");
                return (
                  <div key={k} className="flex items-start gap-3 py-2" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>
                    <span className="w-48 shrink-0" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{k}{optional && <span style={{ color: C.figTert, fontWeight: 500 }}> · optional</span>}</span>
                    <span className="flex-1" style={{ fontSize: 13, fontWeight: 500, color: missing ? C.semCaution : C.figInk }}>
                      {missing ? "Awaiting client" : vals[k] || (optional ? "Not declared — optional on " + clProductLabel(t.product) : "Captured")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ClExtraPanels t={t} setTab={setTab} />
          {(CL_FLOW[t.state].tab || "overview") === "overview" ? <ClActionPanel t={t} act={act} setTab={setTab} /> : <ClCtaPointer t={t} setTab={setTab} />}
        </div>
      </div>
    </div>
  );
}

function ClAgeBars({ t }) {
  const buckets = { Client: 0, Insurer: 0, BimaKavach: 0 };
  t.ownerLog.forEach((o) => { if (buckets[o.owner] != null) buckets[o.owner] += o.to - o.from; });
  /* Only attribute the current stage to one of the three real owners — a terminal
     claim's owner is "—", which has no bar (and no colour), so skip it. */
  const cur = clOwner(t); if (buckets[cur] != null) buckets[cur] += (CL_NOW - t.stageAt);
  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  const ind = { Client: "info", Insurer: "caution", BimaKavach: "brand" };
  return (
    <div className="mt-2 flex flex-col gap-2">
      {Object.entries(buckets).map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-24 shrink-0" style={{ fontSize: 12, fontWeight: 500, color: C.figInk }}>{k}</span>
          <span className="flex-1 overflow-hidden rounded-full" style={{ height: 8, background: C.lineSoft }}>
            <span className="block h-full rounded-full" style={{ width: `${(v / total) * 100}%`, background: (IND[ind[k]] || IND.neutral).dot }} /></span>
          <span className="bk-num w-10 shrink-0 text-right" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{Math.round((v / CL_DAY) * 10) / 10}d</span>
        </div>
      ))}
    </div>
  );
}

function ClExtraPanels({ t, setTab }) {
  return (
    <>
      {t.admissibility && (
        <div className="mt-4"><ClNote tone={C.link} bg={C.waitSoft}>BimaKavach admissibility: <b>{t.admissibility}</b>. Never shown to the client.{t.admissibility === "Outside policy terms" ? ` ${CL_HEAD} notified; the claim proceeded to the insurer regardless.` : ""}</ClNote></div>
      )}
      {t.assessedLoss && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: C.lineSoft }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>Assessment</div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
            <span>Declared at intimation (immutable) <b style={{ color: C.figInk }}>{clInr(t.loss)}</b></span>
            <span>Assessed loss <b style={{ color: C.figInk }}>{clInr(t.assessedLoss)}</b></span>
          </div>
        </div>
      )}
    </>
  );
}

function ClCtaPointer({ t, setTab }) {
  const tab = CL_FLOW[t.state].tab;
  const name = tab === "survey" ? "Survey & assessment" : "Payment";
  const why = tab === "survey" ? "The surveyor, site inspection and assessment report are handled there." : "Bank details, payment records and settlement figures are handled there.";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: C.waitSoft, border: `0.5px solid ${IND.info.line}` }}>
      <span className="flex-1" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}><b>{CL_FLOW[t.state].label}.</b> {why}</span>
      <Btn onClick={() => setTab(tab)} size="sm">Open {name}</Btn>
    </div>
  );
}

/* The working part — driver-distinct action panels (C-2). */
function ClActionPanel({ t, act, setTab }) {
  const f = CL_FLOW[t.state];
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({});
  const [note, setNote] = useState("");
  const [rejWhy, setRejWhy] = useState("");
  const set = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));
  useEffect(() => { setManual(false); setForm({}); setNote(""); setRejWhy(""); }, [t.state, t.id]);

  if (f.terminal) return <div className="mt-4"><ClNote tone={"#007B00"} bg={C.tealSoft}>This claim is closed. No further actions are available.</ClNote></div>;
  if (t.dormant) return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <ClNote tone={C.semCaution} bg={C.warnSoft}>Parked as dormant — {t.dormant.sub}. No chase runs while it sits here. Resume it from the Manage ticket tab, choosing which state to pick up at.</ClNote>
      <Btn variant="secondary" size="sm" onClick={() => setTab("manage")}>Open Manage ticket</Btn>
    </div>
  );

  const src = f.act.src || "cm";

  /* bot / auto waiting panel */
  if ((src === "bot" || src === "auto") && !manual) {
    const bp = clBotPreview(t);
    return (
      <div className="mt-4 rounded-xl p-4" style={{ background: C.brandBg, border: `1.5px dashed ${C.brand}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <Indicator label="Waiting on the bot" ind="brand" />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{bp.type}</span>
          <span className="flex-1" />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>from {bp.from}</span>
        </div>
        <p className="mt-2" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>
          This stage advances automatically. The bot classifies the inbound mail, extracts the fields below and moves the claim on. A Claims Manager only steps in if extraction fails.</p>
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {bp.keys.map((k) => (
            <div key={k} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ background: C.white, border: `0.5px solid ${C.lineSoft}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>awaiting mail</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <SimBtn onClick={() => act.bot(t.id)}>Simulate: {t.state === "S4" ? "an acceptance arrives" : "the mail arrives"}</SimBtn>
          {t.state === "S4" && <SimBtn onClick={() => act.botReject(t.id)}>Simulate: a rejection arrives</SimBtn>}
          <Btn variant="secondary" size="sm" onClick={() => setManual(true)}>Extraction failed — record manually</Btn>
        </div>
      </div>
    );
  }

  /* client waiting panel */
  if (src === "client") {
    const reject = t.state === "R1", rejectFinal = t.state === "R3";
    const what = { S9: "Consent to the assessed amount", S10: "Bank details and cancelled cheque", S12: "Confirmation that the money arrived", R1: "Challenge the rejection, or accept it", R3: "Accept the rejection" }[t.state];
    const detail = { S9: "The assessment report is published on BimaKendra with two actions — consent or object. Objections are capped at two rounds.", S10: "Asked for only now — after consent — so only clients who will actually be paid are ever asked. Captured on the Payment tab.", S12: "Auto-advances after 5 working days if the client does not confirm.", R1: "The rejection reason is published on BimaKendra as the insurer wrote it. The client may challenge it twice; each needs a reason. There is no withdrawal on this track.", R3: "Both challenges are used, so Accept is the only remaining action. The client stays free to approach IRDAI or a court; the platform records that, it does not offer it." }[t.state];
    return (
      <div className="mt-4 rounded-xl p-4" style={{ background: C.warnSoft, border: `1.5px dashed ${IND.caution.line}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <Indicator label="Waiting on the client" ind="caution" />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{what}</span>
          <span className="flex-1" />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>on BimaKendra</span>
        </div>
        <p className="mt-2" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>{detail}</p>
        {reject && (
          <div className="mt-3 rounded-lg border p-3" style={{ borderColor: C.lineSoft, background: C.white }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>The insurer's reason, as written</div>
            <p className="mt-1" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>{t.rejection.reason}</p>
            <div className="mt-3" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>Challenges used — {t.challenges} of 2</div>
            <textarea value={rejWhy} onChange={(e) => setRejWhy(e.target.value)} placeholder={`The client's reason for challenging. Mandatory. Goes to ${t.insurer} as written.`} className="mt-2 w-full" rows={3} style={{ ...FIELD, resize: "vertical" }} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {reject ? (
            <>
              <SimBtn onClick={() => act.challenge(t.id, rejWhy)}>Simulate: the client challenges</SimBtn>
              <Btn variant="secondary" size="sm" onClick={() => act.acceptRej(t.id)}>Simulate: the client accepts</Btn>
            </>
          ) : rejectFinal ? (
            <SimBtn onClick={() => act.acceptRej(t.id)}>Simulate: the client accepts</SimBtn>
          ) : t.state === "S10" ? (
            <Btn size="sm" onClick={() => setTab("payment")}>Open the Payment tab</Btn>
          ) : (
            <SimBtn onClick={() => act.clientRun(t.id)}>Simulate: the client acts on BimaKendra</SimBtn>
          )}
        </div>
      </div>
    );
  }

  /* CM data-entry form (and the bot manual-fallback form) */
  const hint = {
    S0: "The email bot created this in Draft. It flips to Under Review only when every mandatory item is captured.",
    S1: "Two business-hour initial-response TAT. The assessment is a checkpoint, not a gate — the claim proceeds either way.",
    S2: CL_INSURERS[t.insurer].mode === "Portal" ? "Portal insurer — a CM logs in and raises the claim. One-business-hour TAT." : "Mail insurer — TMS sends the automated mailer with all documents attached.",
    S3: "Insurer owes the claim number.", S4: `On acceptance the route splits on the declared estimate of ${clInr(t.loss)}: ${(t.loss || 0) > CL_SURVEYOR_THRESHOLD ? "above ₹1 lakh, so a surveyor is appointed." : "at or below ₹1 lakh, so the insurer assesses internally."}`,
    S5: "Surveyor name, mobile and visit date arrive by email and are bot-extracted.", S6: "Recording the report does not advance the claim; sharing it with the client does.", S8: "The insurer assesses internally below the threshold.",
    S11: "The insurer pays the client directly. TMS records the payment; it never moves money.",
  }[t.state] || "";
  const formFor = () => {
    switch (f.act.form) {
      case "admiss": return <ClInput label="Assessment against policy terms" value={form.i1 || "Within policy terms"} onChange={set("i1")} options={["Within policy terms", "Outside policy terms"]} />;
      case "claimno": return <ClInput label="Insurer claim number" value={form.i1 || ""} onChange={set("i1")} placeholder="e.g. IL/FIR/26/00000" />;
      case "surveyor": return <><ClInput label="Surveyor name" value={form.i1 || ""} onChange={set("i1")} placeholder="Name" /><ClInput label="Mobile" value={form.i2 || ""} onChange={set("i2")} placeholder="10 digits" /><ClInput label="Visit date" type="date" value={form.i3 || ""} onChange={set("i3")} /></>;
      case "report": return <><ClInput label="Inspection outcome" value={form.i0 || ""} onChange={set("i0")} placeholder="What the assessor found on site" /><ClInput label="Assessed loss (report value)" type="number" value={form.i1 || ""} onChange={set("i1")} placeholder={String(t.loss || 0)} /><ClInput label="Report arrived as" value={form.i2 || "Attached PDF"} onChange={set("i2")} options={["Attached PDF", "Email body"]} /></>;
      case "payment": return <><ClInput label="Payment type" value={form.i1 || "Full and final"} onChange={set("i1")} options={["Full and final", "Instalment", "Instalment - Final"]} /><ClInput label="Amount paid" type="number" value={form.i2 || ""} onChange={set("i2")} placeholder="Amount" /><ClInput label="Payment reference (UTR)" value={form.i3 || ""} onChange={set("i3")} placeholder="Optional" /></>;
      default: return null;
    }
  };
  return (
    <div className="mt-4 flex flex-col gap-3">
      {manual
        ? <div className="flex flex-wrap items-center gap-2"><ClNote tone={C.semCaution} bg={C.warnSoft}>Bot extraction failed. Recording manually against a one-hour TAT — the claim already has an owner, so it stays in your tray rather than the shared queue.</ClNote><Btn variant="secondary" size="sm" onClick={() => setManual(false)}>Wait for the bot instead</Btn></div>
        : hint ? <ClNote tone={C.link} bg={C.waitSoft}>{hint}</ClNote> : null}
      <div className="flex flex-wrap gap-3">{formFor()}</div>
      <ClInput label="Note for the audit trail (optional)" value={note} onChange={setNote} placeholder="Why, in your own words" />
      <div><Btn onClick={() => act.cmForm(t.id, f.act.form || "", form, note)}>{f.act.label}</Btn></div>
    </div>
  );
}

/* ---------- real document bytes (C-8.3) — minimal single-page PDF, no library ---------- */
function clPdf(lines) {
  const enc = (x) => String(x).replace(/[\\()]/g, (c) => "\\" + c);
  let y = 790, ops = "";
  lines.forEach((l) => { if (l.t) ops += "BT /F1 " + l.s + " Tf 56 " + y + " Td (" + enc(l.t) + ") Tj ET\n"; y -= (l.s >= 12 ? 22 : 16); });
  const objs = { 1: "<< /Type /Catalog /Pages 2 0 R >>", 2: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    3: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    4: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", 5: "<< /Length " + ops.length + " >>\nstream\n" + ops + "endstream" };
  let pdf = "%PDF-1.4\n"; const off = {};
  for (let i = 1; i <= 5; i++) { off[i] = pdf.length; pdf += i + " 0 obj\n" + objs[i] + "\nendobj\n"; }
  const xref = pdf.length;
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) pdf += String(off[i]).padStart(10, "0") + " 00000 n \n";
  pdf += "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
  return pdf;
}
function clDocPdf(t, key) {
  return clPdf([{ t: key.toUpperCase(), s: 16 }, { t: t.client + "  |  " + (t.claimNo || t.policy), s: 10 }, { t: "", s: 10 },
    { t: "Insured:  " + t.client, s: 11 }, { t: "Policy:  " + t.policy + "    Product:  " + t.product, s: 11 },
    { t: "Insurer:  " + t.insurer + "    Date of loss:  " + clFdate(t.dol), s: 11 }, { t: "", s: 10 },
    { t: "This is a generated placeholder standing in for the document named above.", s: 10 },
    { t: "In production this would be the actual file received from the client, insurer or surveyor.", s: 10 }]);
}
const clDataUrl = (str, type = "application/pdf") => `data:${type};base64,` + (typeof btoa === "function" ? btoa(unescape(encodeURIComponent(str))) : "");
function clDownload(name, str, type = "application/pdf") {
  try { const blob = new Blob([str], { type }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } catch { /* sandboxed */ }
}
function clPhotos(t) {
  const n = CL_PHOTOS[t.product] || 0;
  return Array.from({ length: n }, (_, i) => ({ key: "Photograph " + (i + 1), file: "IMG-" + new Date(t.dol).toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(i + 1).padStart(4, "0") + ".jpg", photo: true }));
}
function clPhotoSvg(t, i) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#ECECF1"/><text x="240" y="150" font-family="sans-serif" font-size="18" fill="#6F7378" text-anchor="middle">Damage photograph ${i}</text><text x="240" y="176" font-family="sans-serif" font-size="12" fill="#A9ACB1" text-anchor="middle">${t.location.split(",")[0]}</text></svg>`;
}

/* ---------- Document vault (C-8) ---------- */
function ClDocs({ t, act }) {
  const [view, setView] = useState(null);   // {name, url, real}
  const docs = CL_DOCS[t.product] || [];
  const photos = clPhotos(t);
  const received = (key) => !!t.uploads[key];
  const Row = ({ name, gotFile, photo, idx }) => {
    const got = photo || gotFile;
    return (
      <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: `0.5px solid ${C.lineSoft}` }}>
        <span className="min-w-0 flex-1 truncate" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>{name}</span>
        {got ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Indicator label="Received" ind="success" outline />
            <SoftBtn onClick={() => setView({ name, url: photo ? clDataUrl(clPhotoSvg(t, idx), "image/svg+xml") : clDataUrl(clDocPdf(t, name)), real: false })}>View</SoftBtn>
            <SoftBtn onClick={() => photo ? clDownload(name.replace(/\s/g, "-") + ".svg", clPhotoSvg(t, idx), "image/svg+xml") : clDownload(name.replace(/\s/g, "-") + ".pdf", clDocPdf(t, name))}>Download</SoftBtn>
            {!photo && <SoftBtn onClick={() => act.upload(t.id, name, name.replace(/\s/g, "-") + "-v2.pdf")}>Replace</SoftBtn>}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <Indicator label="Not received" ind="muted" outline />
            <SoftBtn onClick={() => act.upload(t.id, name, name.replace(/\s/g, "-") + ".pdf")}>Upload</SoftBtn>
            <SoftBtn onClick={() => act.flash(`Chase sent to the client for ${name}.`)}>Chase</SoftBtn>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      {photos.length > 0 && (
        <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div className="px-3 py-2.5" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, fontSize: 13, fontWeight: 600, color: C.figInk }}>Intimation photographs <span style={{ color: C.figTert, fontWeight: 500 }}>· {photos.length} at intake</span></div>
          {photos.map((p, i) => <Row key={p.key} name={p.key} photo idx={i + 1} />)}
        </div>
      )}
      <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        <div className="px-3 py-2.5" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, fontSize: 13, fontWeight: 600, color: C.figInk }}>{clProductLabel(t.product)} document set</div>
        {docs.map((d) => <Row key={d} name={d} gotFile={received(d)} />)}
        <div className="px-3 py-2.5" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>View and Download produce real bytes; a seeded document renders a generated placeholder PDF and the viewer says so.</div>
      </div>
      {view && (
        <ModalShell title={view.name} sub="Generated placeholder — not a real upload." onClose={() => setView(null)} width={640}>
          <iframe title={view.name} src={view.url} style={{ width: "100%", height: 420, border: `1px solid ${C.subtle}`, borderRadius: 8 }} />
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Client channel: queries (C-7) ---------- */
function ClClient({ t, act }) {
  const [ask, setAsk] = useState(false);
  const [text, setText] = useState("");
  const [target, setTarget] = useState("");
  const [src, setSrc] = useState("BimaKavach");
  const queries = t.queries;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Client channel</SectionTitle>
        <Btn size="sm" onClick={() => { setAsk(true); setText(""); setTarget(""); }}>Ask the client</Btn>
      </div>
      {queries.length === 0 && <Empty>No queries raised on this claim.</Empty>}
      {queries.map((q) => (
        <div key={q.id} className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div className="flex flex-wrap items-center gap-2">
            <Indicator label={q.status === "open" ? "Open" : q.status === "answered" ? "Answered" : "Closed"} ind={q.status === "open" ? "caution" : q.status === "answered" ? "success" : "muted"} />
            {q.target && <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{q.target}</span>}
            <span className="flex-1" />
            <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>on behalf of {q.src} · {clDur(CL_NOW - q.at)} ago</span>
          </div>
          <p className="mt-2" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>{q.text}</p>
          {q.response && <p className="mt-2 rounded-lg p-2.5" style={{ background: C.tealSoft, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>Client: {q.response}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {q.status === "open" && <SimBtn onClick={() => act.answer(t.id, q.id)}>Simulate: the client answers</SimBtn>}
            {q.status === "answered" && <Btn size="xs" onClick={() => act.closeQuery(t.id, q.id)}>Close query</Btn>}
            {q.status === "answered" && <Btn size="xs" variant="secondary" onClick={() => act.reopenQuery(t.id, q.id)}>Reopen</Btn>}
          </div>
        </div>
      ))}
      {ask && (
        <ModalShell title="Raise a query" sub="The client sees it on their surface; email and WhatsApp tell them to go and look." onClose={() => setAsk(false)}
          footer={<><Cancel onClick={() => setAsk(false)} /><Btn onClick={() => { if (!text.trim()) return act.flash("Say what you need. A query with no question is not a request."); act.ask(t.id, { target: target.trim(), text: text.trim(), src }); setAsk(false); }}>Send to client</Btn></>}>
          <div className="flex flex-col gap-3">
            <ClInput label="Detail or document (optional)" value={target} onChange={setTarget} placeholder="e.g. Repair quotation, or Date the panel was last serviced" />
            <label className="flex flex-col gap-1.5"><FieldLabel>What is wrong, or what you need clarified</FieldLabel>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="e.g. The declared estimate looks inconsistent with the repair quotation — please confirm the figure" style={{ ...FIELD, resize: "vertical" }} /></label>
            <ClInput label="Raised on behalf of" value={src} onChange={setSrc} options={["BimaKavach", t.insurer, "Surveyor"]} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Mail trail (C-11.4) ---------- */
function ClMail({ t }) {
  const items = [];
  t.audit.forEach((a) => items.push({ at: a.at, who: a.actor, what: a.what, body: a.detail, bot: a.actor === "Email bot" || a.role === "Bot" }));
  const thread = items.slice().sort((a, b) => b.at - a.at);
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Mail trail</SectionTitle>
      {thread.length === 0 && <Empty>No correspondence yet.</Empty>}
      {thread.map((m, i) => (
        <div key={i} className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: m.bot ? C.brandBg : C.white }}>
          <div className="flex flex-wrap items-center gap-2">
            {m.bot && <Indicator label="Email bot" ind="brand" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{m.what}</span>
            <span className="flex-1" />
            <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{m.who} · {clFdt(m.at)}</span>
          </div>
          {m.body && <p className="mt-1.5" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>{m.body}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Survey & assessment (C-6.1) ---------- */
function ClSurvey({ t, act, setTab }) {
  const needsAction = t.state === "S5" || (["S6", "S8"].includes(t.state) && !t.report);
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Survey &amp; assessment</SectionTitle>
      {needsAction && <ClActionPanel t={t} act={act} setTab={setTab || (() => {})} />}
      {t.surveyor ? (
        <div className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>Surveyor</div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
            <span>Name <b style={{ color: C.figInk }}>{t.surveyor.name}</b></span>
            {t.surveyor.firm && <span>Firm <b style={{ color: C.figInk }}>{t.surveyor.firm}</b></span>}
            <span>Mobile <b style={{ color: C.figInk }}>{t.surveyor.mobile}</b></span>
            <span>Visit <b style={{ color: C.figInk }}>{t.surveyor.visit}</b></span>
          </div>
          <p className="mt-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Surveyors are appointed by the insurer above ₹1 lakh. Scheduling happens offline between the client and the surveyor.</p>
        </div>
      ) : <ClNote tone={C.link} bg={C.waitSoft}>No surveyor appointed yet. At this stage the appointment arrives by email and is bot-extracted.</ClNote>}

      {t.inspection && (
        <div className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>Inspection outcome</div>
          <p className="mt-1.5" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>{t.inspection}</p>
        </div>
      )}
      {t.report && (
        <div className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>Assessment report</span>
            <Indicator label={t.report.shared ? "Shared with client" : "Not yet shared"} ind={t.report.shared ? "success" : "caution"} />
            <span className="flex-1" />
            <span style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{t.report.author} · {t.report.converted ? "generated from the mail body" : "the assessor's own PDF"}</span>
          </div>
          {t.assessedLoss && <div className="mt-2" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>Net assessed loss: <b>{clInr(t.assessedLoss)}</b> {t.loss ? <span style={{ color: C.figTert }}>against {clInr(t.loss)} declared</span> : ""}</div>}
          <div className="mt-3 flex flex-wrap gap-2">
            <SoftBtn onClick={() => clDownload(t.report.file, clDocPdf(t, "Assessment report"))}>Download report</SoftBtn>
            {!t.report.shared && ["S6", "S8"].includes(t.state) && <Btn size="sm" onClick={() => act.shareReport(t.id)}>Share with client on BimaKendra</Btn>}
          </div>
          {!t.report.shared && <p className="mt-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Recording the report did not advance the claim. Sharing it with the client starts consent.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Payment (C-6.1: only from S10) ---------- */
function ClPayment({ t, act, setTab }) {
  const [acc, setAcc] = useState(""); const [ifsc, setIfsc] = useState("");
  const base = t.assessedLoss || t.loss || 0;
  const paid = t.payments.reduce((a, p) => a + p.amt, 0);
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Payment</SectionTitle>
      {["S11", "S12"].includes(t.state) && <ClActionPanel t={t} act={act} setTab={setTab || (() => {})} />}
      {base > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Assessed loss</div><div className="bk-num" style={{ fontSize: 18, fontWeight: 700, color: C.figInk }}>{clInr(base)}</div></div>
          <span className="flex-1" />
          <Indicator label={`${clInr(paid)} of ${clInr(base)} paid`} ind={paid >= base ? "success" : "caution"} big />
        </div>
      )}
      {/* bank details */}
      <div className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>Bank details</div>
        {t.bank ? (
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
            <span>Account <b style={{ color: C.figInk }}>{t.bank.acc}</b></span>
            <span>IFSC <b style={{ color: C.figInk }}>{t.bank.ifsc}</b></span>
            <span>Cancelled cheque <b style={{ color: C.figInk }}>{t.bank.cheque}</b></span>
          </div>
        ) : t.state === "S10" ? (
          <>
            <p className="mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Asked for only now — after consent — so only clients who will be paid are ever asked. Cancelled cheque is mandatory.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <ClInput label="Account number" value={acc} onChange={setAcc} placeholder="Account number" />
              <ClInput label="IFSC" value={ifsc} onChange={setIfsc} placeholder="e.g. HDFC0001188" />
            </div>
            <div className="mt-3"><Btn size="sm" onClick={() => { if (!acc.trim() || !ifsc.trim()) return act.flash("Account number and IFSC are both required."); if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) return act.flash("IFSC format is four letters, a 0, then six characters."); act.bank(t.id, { acc: acc.trim(), ifsc: ifsc.trim().toUpperCase() }); }}>Record bank details</Btn></div>
          </>
        ) : <p className="mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Not captured yet.</p>}
      </div>
      {/* payments */}
      {t.payments.length > 0 && (
        <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          <div className="px-3 py-2.5" style={{ borderBottom: `0.5px solid ${C.lineSoft}`, fontSize: 13, fontWeight: 600, color: C.figInk }}>Payments recorded</div>
          {t.payments.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-3 py-2.5" style={{ borderBottom: i === t.payments.length - 1 ? "none" : `0.5px solid ${C.lineSoft}`, fontSize: 13, fontWeight: 500 }}>
              <span style={{ color: C.figInk }}>{p.type}{p.n ? ` ${p.n}` : ""}</span>
              <span className="bk-num" style={{ color: C.figInk, fontWeight: 700 }}>{clInr(p.amt)}</span>
              <span className="flex-1" />
              <span className="bk-num" style={{ color: C.figTert, fontSize: 12 }}>{p.utr || "UTR pending"} · {p.date}</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>The insurer pays the client directly. TMS records the payment; it never moves money.</p>
    </div>
  );
}

/* ---------- Ticket history ---------- */
function ClHistory({ t }) {
  const rows = t.audit.slice().sort((a, b) => b.at - a.at);
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Ticket history</SectionTitle>
      <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
        {rows.map((a, i) => (
          <div key={i} className="flex gap-3 px-3 py-3" style={{ borderBottom: i === rows.length - 1 ? "none" : `0.5px solid ${C.lineSoft}` }}>
            <span className="mt-1 shrink-0 rounded-full" style={{ width: 6, height: 6, background: a.actor === "Email bot" ? C.brand : a.role === "Client" ? IND.info.dot : C.figTert }} />
            <span className="min-w-0 flex-1">
              <span className="block" style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{a.what}</span>
              {a.detail && <span className="mt-0.5 block" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>{a.detail}</span>}
              <span className="mt-1 block" style={{ fontSize: 11, fontWeight: 500, color: C.figTert }}>{a.actor}{a.role ? ` · ${a.role}` : ""} · {clFdt(a.at)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Manage ticket (C-6.4: exactly five cards) ---------- */
function ManageCard({ title, available, reason, children }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: available ? C.white : C.canvas }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: available ? C.figInk : C.figTert }}>{title}</div>
      {available ? <div className="mt-2">{children}</div> : <p className="mt-1" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>{reason}</p>}
    </div>
  );
}
function ClManage({ t, role, act, setTab }) {
  const [reassignTo, setReassignTo] = useState(CL_CMS.find((c) => c !== t.cm) || CL_CMS[0]);
  const [reassignWhy, setReassignWhy] = useState("");
  const [withdrawWhy, setWithdrawWhy] = useState("");
  const [parkWhy, setParkWhy] = useState("");
  const [resumeWhy, setResumeWhy] = useState("");
  const terminal = CL_FLOW[t.state].terminal;
  const onRej = clIsRej(t);
  const owner = clOwner(t);
  const L = CL_LOOPS[clLoop(t)] || {};
  const canPark = !terminal && !t.dormant && owner === "Client";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ManageCard title="Reassign" available={!terminal} reason="A closed claim has no owner to move.">
        <div className="flex flex-wrap gap-3">
          <ClInput label="Reassign to" value={reassignTo} onChange={setReassignTo} options={CL_CMS} />
          <ClInput label="Reason" value={reassignWhy} onChange={setReassignWhy} placeholder="Why the move" />
        </div>
        <div className="mt-3"><Btn size="sm" onClick={() => { if (!reassignWhy.trim()) return act.flash("Reassignment needs a reason."); act.reassign(t.id, reassignTo, reassignWhy.trim()); }}>Reassign</Btn></div>
      </ManageCard>

      <ManageCard title="Mark as withdrawn" available={!terminal && !onRej} reason={onRej ? "Withdrawal is barred across the rejection track — the claim is already recorded as rejected." : "Already closed."}>
        <ClInput label="Reason" value={withdrawWhy} onChange={setWithdrawWhy} placeholder="Why the client is withdrawing" />
        <div className="mt-3"><Btn size="sm" tone={C.semError} onClick={() => { if (!withdrawWhy.trim()) return act.flash("Withdrawal needs a reason."); act.withdraw(t.id, withdrawWhy.trim()); }}>Mark as withdrawn</Btn></div>
      </ManageCard>

      <ManageCard title="Park as dormant" available={canPark} reason={terminal ? "Already closed." : t.dormant ? "Already parked as dormant." : `The ${owner === "Insurer" ? "insurer" : "we"} owe the next action, so this claim stays open and escalates. Parking it is how work disappears.`}>
        <ClInput label="Reason" value={parkWhy} onChange={setParkWhy} placeholder="Why it is being parked" />
        <p className="mt-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Parking is silent — no client notification, and the client-facing label does not change.</p>
        <div className="mt-3"><Btn size="sm" onClick={() => { if (!parkWhy.trim()) return act.flash("Parking needs a reason."); act.park(t.id, parkWhy.trim()); }}>Park as dormant</Btn></div>
      </ManageCard>

      <ManageCard title="Resume from dormant" available={!!t.dormant} reason="This claim is not parked.">
        <p style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>Resumes at {t.dormant ? CL_FLOW[t.dormant.fromState].label : "—"}. Preconditions are re-validated and cannot be overridden.</p>
        <ClInput label="Reason" value={resumeWhy} onChange={setResumeWhy} placeholder="Why it is being resumed" />
        <div className="mt-3"><Btn size="sm" onClick={() => { if (!resumeWhy.trim()) return act.flash("Resuming needs a reason."); act.resume(t.id, t.dormant.fromState, resumeWhy.trim()); }}>Resume</Btn></div>
      </ManageCard>

      <ManageCard title="Reminders and escalations" available={!terminal && !t.dormant} reason={terminal ? "Nothing to chase on a closed claim." : "No chase runs while parked as dormant."}>
        <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>{L.name} · owed by {L.who}. {L.ending}</p>
        <div className="mt-1 flex items-center gap-2" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>
          <span className="bk-num">{t.chase.reminders} of {L.reminders} reminders</span> · <span className="bk-num">{t.chase.escalations} of {L.escalations || 3} escalations</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" disabled={!L.reminders} title={!L.reminders ? `No reminder is sent on the internal chase — ${CL_HEAD} is alerted as soon as the time is up. There is nobody outside to remind.` : undefined} onClick={() => act.sendReminder(t.id)}>Send reminder</Btn>
          <Btn size="sm" tone={C.semError} onClick={() => act.escalate(t.id)}>Escalate to {CL_HEAD}</Btn>
        </div>
      </ManageCard>
    </div>
  );
}

/* ---------- Manual review queue (C-11) ---------- */
function ClaimsReview({ tickets, mrq, role, act }) {
  const [mail, setMail] = useState(null);   // mail being viewed
  const [link, setLink] = useState(null);   // mail being linked
  const [pick, setPick] = useState(null);
  const [why, setWhy] = useState("");
  const breach = mrq.filter(CL_MRQ_LATE).length;
  const openLink = (m) => { const c = clCandidatesFor(m, tickets); setLink(m); setPick(c[0]?.t.id || null); setWhy(""); };
  return (
    <div>
      <PageHead title="Manual review queue" hint="Claims only — separate from the endorsement queue."
        right={<Indicator label={breach ? `${breach} past the 24-hour queue SLA` : "All within SLA"} ind={breach ? "error" : "success"} big />} />
      {mrq.length === 0 ? <Empty>The queue is clear. Mail the bot could not classify or match will land here.</Empty> : (
        <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          {mrq.map((m, i) => {
            const age = CL_NOW - m.at, late = CL_MRQ_LATE(m), cands = clCandidatesFor(m, tickets);
            const reject = m.reason === "R5" || m.reason === "R8";
            return (
              <div key={m.id} className="flex flex-wrap items-start gap-3 px-3 py-3" style={{ borderBottom: i === mrq.length - 1 ? "none" : `0.5px solid ${C.lineSoft}` }}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bk-num" style={{ fontSize: 12, fontWeight: 700, color: C.figInk }}>{m.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.figInk }}>{m.fromName || m.from}</span>
                    <Indicator label={`${m.conf}%`} ind={m.conf >= 80 ? "success" : "caution"} />
                    {late ? <Indicator label={`${CL_HEAD} notified`} ind="error" outline /> : <Indicator label="Unassigned" ind="muted" outline />}
                  </div>
                  <div className="mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{m.subject}{m.att.length ? ` · ${m.att.length} attachment${m.att.length > 1 ? "s" : ""}` : ""}</div>
                  <div className="mt-1.5" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figHint }}>
                    <b style={{ color: C.figInk }}>{m.reason}</b> · {CL_REASONS[m.reason]} — {m.note}</div>
                  <div className="mt-1 flex items-center gap-2" style={{ fontSize: 11, fontWeight: 500, color: late ? C.semError : C.figTert }}>Guess: {m.guess} · {clDur(age)} in the queue</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <SoftBtn onClick={() => setMail(m)}>View email</SoftBtn>
                  {reject ? <Btn size="xs" tone={C.semError} onClick={() => act.rejectMail(m.id)}>Reject</Btn> : <Btn size="xs" onClick={() => act.createFromMail(m)}>Create claim</Btn>}
                  {cands.length > 0 && <SoftBtn onClick={() => openLink(m)}>Link</SoftBtn>}
                  <SoftBtn onClick={() => act.discardMail(m.id)}>Discard</SoftBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: C.figTert }}>
        Pooled queue — every Claims Manager and the Claims Head sees it. Items have no ticket yet, so the two-hour CM clock does not apply; the queue runs its own 24-hour SLA and turns red past it.</p>

      {mail && (
        <ModalShell title={mail.subject} sub={`${mail.id} · ${mail.conf}% confidence`} onClose={() => setMail(null)} width={720} footer={<Btn variant="secondary" onClick={() => setMail(null)}>Close</Btn>}>
          <div className="flex flex-wrap gap-x-8 gap-y-2" style={{ fontSize: 12, fontWeight: 500, color: C.figHint }}>
            <span>From <b style={{ color: C.figInk }}>{mail.fromName || mail.from}</b> · {mail.from}</span>
            <span>To <b style={{ color: C.figInk }}>{mail.to}</b></span>
            <span>Received <b style={{ color: C.figInk }}>{clFdt(mail.at)}</b></span>
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg p-3" style={{ background: C.canvas, fontFamily: FONT, fontSize: 13, lineHeight: 1.6, color: C.figInk }}>{mail.body}</pre>
          <div className="mt-3 flex flex-wrap gap-1.5">{mail.att.length ? mail.att.map((a) => <Indicator key={a} label={a} ind="neutral" outline />) : <span style={{ fontSize: 12, color: C.figTert }}>No attachments.</span>}</div>
        </ModalShell>
      )}
      {link && (() => {
        const cands = clCandidatesFor(link, tickets);
        return (
          <ModalShell title="Link to an existing claim" sub={`${link.subject} — from ${link.from}`} onClose={() => setLink(null)} width={620}
            footer={<><Cancel onClick={() => setLink(null)} /><Btn onClick={() => { if (!pick) return act.flash("Choose the claim this mail belongs to."); if (!why.trim()) return act.flash("Record how you established this is the right claim. The mapping is audited."); act.linkMail(link.id, pick, why.trim()); setLink(null); }}>Link and apply</Btn></>}>
            <ClNote tone={C.link} bg={C.waitSoft}>Linking attaches the mail and its attachments to the claim's trail and applies the bot's intended action for a <b>{link.guess.toLowerCase()}</b>. The mapping is audited; the bot never picks.</ClNote>
            <div className="mt-3 flex flex-col gap-2">
              {cands.map((c) => (
                <label key={c.t.id} className="flex cursor-pointer items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: pick === c.t.id ? C.brand : C.lineSoft, background: pick === c.t.id ? C.brandBg : C.white }}>
                  <input type="radio" checked={pick === c.t.id} onChange={() => setPick(c.t.id)} className="mt-1" />
                  <span className="min-w-0">
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.figInk }}>{c.t.id}</span> <span style={{ fontSize: 13, color: C.figInk }}>{c.t.client}</span>
                    <span className="block" style={{ fontSize: 12, color: C.figTert }}>{c.t.policy} · {CL_FLOW[c.t.state].label} · owned by {c.t.cm}<br />Matched on {c.basis.join(", ")}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-3 flex flex-col gap-1.5"><FieldLabel>Reason for the mapping</FieldLabel>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} placeholder="How you established this is the right claim" style={{ ...FIELD, resize: "vertical" }} /></label>
          </ModalShell>
        );
      })()}
    </div>
  );
}

/* ---------- Reports ---------- */
function ClaimsReports({ tickets, mrq, role }) {
  const buckets = { Client: 0, Insurer: 0, BimaKavach: 0, Dormant: 0 };
  tickets.forEach((t) => {
    t.ownerLog.forEach((o) => { if (buckets[o.owner] != null) buckets[o.owner] += o.to - o.from; });
    if (!CL_FLOW[t.state].terminal) buckets[clOwner(t)] = (buckets[clOwner(t)] || 0) + (CL_NOW - t.stageAt);
  });
  const bTotal = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  const bcol = { Client: IND.info.dot, Insurer: IND.caution.dot, BimaKavach: C.brand, Dormant: C.figTert };
  const byStatus = {}; tickets.forEach((t) => { const s = CL_FLOW[t.state].status; byStatus[s] = (byStatus[s] || 0) + 1; });
  const maxS = Math.max(1, ...Object.values(byStatus));
  const perIns = {}; tickets.forEach((t) => { (perIns[t.insurer] = perIns[t.insurer] || { n: 0 }).n++; });
  const insRows = Object.keys(perIns).map((k) => ({ k, n: perIns[k].n, d: CL_INSURERS[k].medianDays, mode: CL_INSURERS[k].mode })).sort((a, b) => b.d - a.d);
  const maxD = Math.max(...insRows.map((r) => r.d));
  const breaches = clLive(tickets, role).filter((t) => clOverdueBy(t) > 0);
  const Bar = ({ label, w, col, val }) => (
    <div className="flex items-center gap-2"><span className="w-40 shrink-0 truncate" style={{ fontSize: 12, fontWeight: 500, color: C.figInk }}>{label}</span>
      <span className="flex-1 overflow-hidden rounded-full" style={{ height: 8, background: C.lineSoft }}><span className="block h-full rounded-full" style={{ width: `${w}%`, background: col }} /></span>
      <span className="bk-num w-16 shrink-0 text-right" style={{ fontSize: 12, fontWeight: 600, color: C.figHint }}>{val}</span></div>
  );
  const Card = ({ title, hint, children }) => (
    <div className="rounded-xl border p-4" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
      <SectionTitle>{title}</SectionTitle><p className="mb-3 mt-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{hint}</p>{children}</div>
  );
  return (
    <div>
      <PageHead title="Reports" hint={`${tickets.length} claims in the book · ${clLive(tickets, role).length} live`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Where the delay sits" hint="Four ageing buckets. Dormant is separated so one parked claim cannot swamp client responsiveness.">
          <div className="flex flex-col gap-2">{Object.entries(buckets).map(([k, v]) => <Bar key={k} label={k} w={(v / bTotal) * 100} col={bcol[k]} val={Math.round(v / CL_DAY) + "d"} />)}</div>
          <p className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft, fontSize: 12, fontWeight: 500, color: C.figTert }}>{Math.round((buckets.Insurer / bTotal) * 100)}% of elapsed time sits with insurers — the figure that makes insurer delay separable from ours.</p>
        </Card>
        <Card title="Insurer turnaround" hint="Median days from intimation to decision, with claim counts.">
          <div className="flex flex-col gap-2">{insRows.map((r) => <Bar key={r.k} label={`${r.k} · ${r.mode}`} w={(r.d / maxD) * 100} col={r.d > 12 ? C.semError : r.d > 7 ? C.semCaution : "#00B200"} val={`${r.d}d · ${r.n}`} />)}</div>
        </Card>
        <Card title="Claims by status" hint={`All ${tickets.length} claims, live and closed.`}>
          <div className="flex flex-col gap-2">{Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Bar key={k} label={k} w={(v / maxS) * 100} col={C.brand} val={v} />)}</div>
        </Card>
        <Card title="Manual review queue" hint="Volume by reason code — the primary input for tuning the bot.">
          {mrq.length ? <div className="flex flex-col gap-2">{Object.entries(mrq.reduce((a, m) => ({ ...a, [m.reason]: (a[m.reason] || 0) + 1 }), {})).map(([k, v]) => <Bar key={k} label={`${k} · ${CL_REASONS[k]}`} w={(v / mrq.length) * 100} col={C.brand} val={v} />)}</div> : <Empty>Queue is empty.</Empty>}
        </Card>
      </div>
      <p className="mt-8 mb-3" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: C.figTert }}>TAT breaches right now</p>
      {breaches.length ? (
        <div className="rounded-xl border" style={{ borderColor: C.subtle, borderWidth: "0.5px", background: C.white }}>
          {breaches.map((t, i) => {
            const f = CL_FLOW[t.state];
            const end = f.owner === "Client" ? (["S10", "S12"].includes(t.state) ? "Parks dormant. Never terminates — payment is already approved." : "Reminders, then escalation, then dormant or terminated.") : `Escalates and stays open. A claim never terminates while ${f.owner === "Insurer" ? "the insurer" : "BimaKavach"} owes the action.`;
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5" style={{ borderBottom: i === breaches.length - 1 ? "none" : `0.5px solid ${C.lineSoft}` }}>
                <span className="bk-num w-28 shrink-0" style={{ fontSize: 12, fontWeight: 700, color: C.figInk }}>{t.id}</span>
                <span className="w-40 shrink-0 truncate" style={{ fontSize: 13, fontWeight: 500, color: C.figInk }}>{f.label}</span>
                <Indicator label={clOwner(t)} ind={clOwnerInd(t)} outline />
                <span className="bk-num shrink-0" style={{ fontSize: 12, fontWeight: 600, color: C.semError }}>{clDur(clOverdueBy(t))} over</span>
                <span className="min-w-0 flex-1" style={{ fontSize: 12, fontWeight: 500, color: C.figTert }}>{end}</span>
              </div>
            );
          })}
        </div>
      ) : <Empty>No breaches. Everything is inside its stage TAT.</Empty>}
    </div>
  );
}

/* ---------- Create claim (C-9) ---------- */
/* Same demo policy lookup the Endorsement Create modal uses: a known policy
   resolves from the seed, any other sample number ("Example1", …) gets a stable
   demo record. Fills Client / Insurer / Product; prototype only. */
const CL_DEMO_CLIENTS = ["Acme Manufacturing", "Sunrise Chemicals Ltd", "Redwood Logistics Ltd", "Vertex Pharma Ltd",
  "Meridian Foods Pvt Ltd", "Orchid Hospitality Pvt Ltd", "Vanguard Textiles Pvt Ltd", "Northgate Advisory LLP"];
const clFetchPolicy = (policy) => {
  const key = String(policy || "").trim().toUpperCase();
  if (!key) return { client: "", insurer: "", product: "" };
  const seed = CL_SEED.find((t) => (t.policy || "").toUpperCase() === key);
  if (seed) return { client: seed.client, insurer: seed.insurer, product: seed.product };
  const h = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const insurers = Object.keys(CL_INSURERS), products = Object.keys(CL_FIELDS);
  return { client: CL_DEMO_CLIENTS[h % CL_DEMO_CLIENTS.length], insurer: insurers[h % insurers.length], product: products[(h * 7) % products.length] };
};

/* Mirrors the Endorsement Create-ticket modal: the policy number auto-fetches
   (and locks) Client / Insurer / Product; the remaining intake is still demanded
   before submission (C-9 validation unchanged). */
function ClaimsCreate({ onCreate, back, prefill }) {
  const [f, setF] = useState({ client: prefill?.client || "", policy: "", product: "", insurer: "", dol: "", loss: "", desc: prefill?.desc || "", cause: "", loc: "", cname: "", cmob: "" });
  const [err, setErr] = useState("");
  const optional = clLossOptional(f.product);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const onPolicyChange = (e) => setF((p) => ({ ...p, policy: e.target.value }));
  /* Fetch only on Enter — never on keystroke, so partial input doesn't populate. */
  const onPolicyKey = (e) => { if (e.key !== "Enter") return; e.preventDefault(); setF((p) => ({ ...p, ...clFetchPolicy(p.policy) })); };

  const need = ["policy", "client", "product", "insurer", "dol", "desc", "cause", "loc", "cname", "cmob", ...(optional ? [] : ["loss"])];
  const done = need.filter((k) => String(f[k]).trim()).length;
  const pct = Math.round((done / need.length) * 100);
  const ready = done === need.length;

  const submit = () => {
    const req = { client: "Client", policy: "Policy number", dol: "Date of loss", desc: "Loss description", cause: "Cause of loss", loc: "Location of loss", cname: "Contact person name", cmob: "Contact mobile" };
    if (!optional) req.loss = "Estimated loss amount";
    const missing = Object.keys(req).filter((k) => !String(f[k]).trim()).map((k) => req[k]);
    if (missing.length) return setErr("Submission blocked. Still needed: " + missing.join(", ") + ".");
    const mob = clCleanMob(f.cmob);
    if (!CL_MOBILE.test(mob)) return setErr("Contact mobile must be a 10-digit Indian number starting 6, 7, 8 or 9. A +91 or 0 prefix is fine — it will be stripped.");
    const dol = new Date(f.dol).getTime();
    if (!dol || dol >= CL_NOW) return setErr("Date of loss must be earlier than the intimation date.");
    onCreate({ ...f, mob, dol, loss: f.loss ? Number(f.loss) : null });
  };

  const inputCls = "min-w-0 flex-1 bg-transparent outline-none";
  const inputSt = { fontSize: 16, fontWeight: 500, color: C.brand };

  return (
    <Overlay className="bk-scrim fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-6"
      style={{ background: "rgba(14,26,31,0.45)" }} onClick={back}>
      <div onClick={(e) => e.stopPropagation()} className="bk-modal scroll-slim my-auto w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{ background: C.white, boxShadow: "0 24px 64px rgba(28,27,31,0.24)" }}>

        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: C.brand, lineHeight: 1.2 }}>Create claim</h2>
            <p className="mt-1" style={{ fontSize: 14, fontWeight: 500, color: C.figTert, lineHeight: 1.4 }}>
              Portal intake — the policy number fills Client, Insurer and Product; submission is blocked until every mandatory field is present.
            </p>
          </div>
          <button onClick={back} title="Close" className="bk-iconctrl flex shrink-0 items-center justify-center rounded-md border"
            style={{ width: 24, height: 24, background: C.white, borderColor: C.subtle, color: C.figHint }}><X size={12} /></button>
        </div>

        <div className="border-t px-6 py-2" style={{ borderColor: C.lineSoft }}>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {/* Left — policy in, then the read-only trio it fetches */}
            <div className="min-w-0">
              <Field label="Policy Number" value={f.policy}
                onClear={() => setF({ ...f, policy: "", client: "", insurer: "", product: "" })}>
                <input value={f.policy} onChange={onPolicyChange} onKeyDown={onPolicyKey}
                  placeholder="Enter Policy Number, then press Enter" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Client" locked required={false} value={f.client}>
                <span className={inputCls} style={{ ...inputSt, color: f.client ? C.figHint : C.figPlaceholder }}>{f.client || "Auto-filled from policy"}</span>
              </Field>
              <Field label="Insurer" locked required={false} value={f.insurer}
                trail={clInsurerLogo(f.insurer) && <img src={clInsurerLogo(f.insurer)} alt="" className="shrink-0" style={{ height: 18, width: "auto" }} />}>
                <span className={inputCls} style={{ ...inputSt, color: f.insurer ? C.figHint : C.figPlaceholder }}>{f.insurer ? `${f.insurer} (${CL_INSURERS[f.insurer].mode})` : "Auto-filled from policy"}</span>
              </Field>
              <Field label="Product" locked required={false} value={f.product}
                trail={clProductIcon(f.product) && <img src={clProductIcon(f.product)} alt="" className="shrink-0" style={{ height: 22, width: "auto" }} />}>
                <span className={inputCls} style={{ ...inputSt, color: f.product ? C.figHint : C.figPlaceholder }}>{f.product ? clProductLabel(f.product) : "Auto-filled from policy"}</span>
              </Field>
              <Field label="Date of loss" value={f.dol} onClear={() => setF({ ...f, dol: "" })}>
                <input type="date" value={f.dol} onChange={set("dol")} className={inputCls} style={inputSt} />
              </Field>
              <Field label="Estimated loss amount (₹)" required={!optional} value={f.loss} onClear={() => setF({ ...f, loss: "" })}
                hint={optional ? `optional on ${clProductLabel(f.product)}` : null}>
                <input type="number" value={f.loss} onChange={set("loss")} placeholder={optional ? "Often unquantified at notice" : "Client's own estimate"} className={inputCls} style={inputSt} />
              </Field>
            </div>

            {/* Right — the rest of the intake the portal still demands */}
            <div className="min-w-0">
              <Field label="Cause of loss" value={f.cause} onClear={() => setF({ ...f, cause: "" })}>
                <input value={f.cause} onChange={set("cause")} placeholder="How the loss occurred" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Location of loss" value={f.loc} onClear={() => setF({ ...f, loc: "" })}>
                <input value={f.loc} onChange={set("loc")} placeholder="Full address" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Contact person name" value={f.cname} onClear={() => setF({ ...f, cname: "" })}>
                <input value={f.cname} onChange={set("cname")} placeholder="Who we speak to" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Contact mobile" value={f.cmob} onClear={() => setF({ ...f, cmob: "" })}>
                <input value={f.cmob} onChange={set("cmob")} placeholder="10 digits, starting 6–9" className={inputCls} style={inputSt} />
              </Field>
              <Field label="Loss description" value={f.desc} onClear={() => setF({ ...f, desc: "" })}>
                <input value={f.desc} onChange={set("desc")} placeholder="What happened, in the client's words" className={inputCls} style={inputSt} />
              </Field>
            </div>
          </div>

          {err && (
            <div className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: C.breachSoft, color: C.semError, fontSize: 13 }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />{err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t px-6 py-4" style={{ borderColor: C.lineSoft }}>
          <div className="min-w-0 flex-1">
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: C.subtle }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.accent, transition: "width .2s" }} />
            </div>
            <div className="mt-1.5 bk-num" style={{ fontSize: 13, fontWeight: 500, color: C.accent }}>{pct}% Complete</div>
          </div>
          <button disabled={!ready} onClick={submit}
            className="shrink-0 rounded-xl px-7 py-3.5" style={{ fontSize: 16, fontWeight: 600,
              background: ready ? C.brand : "rgba(169,172,177,0.24)", color: ready ? C.white : C.figPlaceholder,
              cursor: ready ? "pointer" : "not-allowed" }}>
            Create claim
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- ClaimsApp: controller + shell ---------- */
const CL_NAV = [["home", "Home", HeartHandshake], ["list", "My claims", ListChecks], ["review", "Manual Review", SquareDashedMousePointer], ["reports", "Reports", TextSearch]];
const CL_SURVEYORS = [
  { name: "K. Venkatesh", firm: "Survey Associates", mobile: "9845011902" },
  { name: "R. Deshmukh", firm: "Deshmukh & Co Surveyors", mobile: "9820447715" },
  { name: "S. Iyer", firm: "Meridian Loss Assessors", mobile: "9740228806" },
];
const CL_REJ_REASONS = [
  "Repudiated under the exclusion for unattended premises at the time of loss.",
  "Repudiated — the loss falls outside the period of insurance on the policy schedule.",
  "Repudiated — breach of warranty relating to maintenance of the affected plant.",
  "Repudiated — the cause of loss is excluded under the wear, tear and gradual deterioration clause.",
];
const CL_ROUTES = { home: "/claims", list: "/claims/tickets", review: "/claims/review", reports: "/claims/reports" };
const clPathOf = (view, id) => (view === "ticket" && id ? "/claims/tickets/" + id : CL_ROUTES[view] || "/claims");
function clReadRoute() {
  try {
    const p = window.location.pathname;
    const m = p.match(/\/claims\/tickets\/(CLM-[\d-]+)/);
    if (m) return { view: "ticket", openId: m[1] };
    if (/\/claims\/tickets/.test(p)) return { view: "list" };
    if (/\/claims\/review/.test(p)) return { view: "review" };
    if (/\/claims\/reports/.test(p)) return { view: "reports" };
  } catch { /* sandboxed */ }
  return { view: "home" };
}
function ClaimsSearch({ open, onClose, tickets, role, openTicket }) {
  const [q, setQ] = useState("");
  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const pool = clVisible(tickets, role);
  const rows = ql ? pool.filter((t) => [t.id, t.client, t.insurer, t.product, CL_FLOW[t.state].status].join(" ").toLowerCase().includes(ql)) : pool.slice().sort((a, b) => b.stageAt - a.stageAt).slice(0, 4);
  return (
    <Overlay className="bk-scrim fixed inset-0 flex items-start justify-center p-4" style={{ zIndex: 50, background: "rgba(28,27,31,0.32)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="bk-modal scroll-slim mt-6 w-full overflow-y-auto rounded-2xl" style={{ maxWidth: 1000, maxHeight: "86vh", background: C.white }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search claims by id, client, insurer, product or status" style={{ ...FIELD, width: "100%", fontSize: 16, padding: "12px 14px" }} />
          <div className="mt-2" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: C.figTert }}>{ql ? "Results" : "Recent claims"}</div>
          <div className="mt-3"><ClaimsTable rows={rows} onOpen={openTicket} showCM={role === "head"} empty="No claims match." /></div>
        </div>
      </div>
    </Overlay>
  );
}

function ClaimsApp({ user, onSignOut, setEnv, collapsed, setCollapsed }) {
  const boot = useMemo(clReadRoute, []);
  const [tickets, setTickets] = useState(makeCLTickets);
  const [mrq, setMrq] = useState(makeCLMRQ);
  /* Umesh (Claims & Endorsements Head) lands on the Head view; Ruksana on her own desk. */
  const [role, setRole] = useState(/umesh/i.test(user?.name || "") ? "head" : "cm");
  const [view, setView] = useState(boot.view);
  const [openId, setOpenId] = useState(boot.openId || null);
  const [filter, setFilter] = useState("attention");
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const go = (v, f) => { if (f) setFilter(f); setView(v); };
  const openTicket = (id) => { setOpenId(id); setView("ticket"); };
  const mut = (id, fn) => setTickets((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  const actor = () => (role === "head" ? CL_HEAD : CL_ME);
  const roleName = () => (role === "head" ? "Claims Head" : "Claims Manager");
  const nextSeq = () => Math.max(1066, ...tickets.map((t) => parseInt(String(t.id).split("-").pop(), 10) || 0)) + 1;

  useEffect(() => { try { const p = clPathOf(view, openId); if (window.location.pathname !== p) window.history.pushState({}, "", p + window.location.hash); } catch { /* sandboxed */ } }, [view, openId]);
  useEffect(() => { const back = () => { const r = clReadRoute(); setView(r.view); if (r.openId) setOpenId(r.openId); }; window.addEventListener("popstate", back); return () => window.removeEventListener("popstate", back); }, []);

  const switchRole = (r) => {
    setRole(r); setFilter("attention");
    if (view === "ticket") { const t = tickets.find((x) => x.id === openId); if (t && !clVisible(tickets, r).includes(t)) setView("home"); }
    flash(r === "head" ? `Viewing as ${CL_HEAD}, Claims & Endorsements Head. You see the whole team's claims.` : `Viewing as ${CL_ME}, Claims Manager. You see the claims assigned to you.`);
  };

  /* ---- mutation handlers (React state only) ---- */
  const cmForm = (id, form, v, note) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return;
    if (form === "claimno" && !String(v.i1 || "").trim()) return flash("Enter the insurer claim number to continue.");
    if (form === "surveyor") { if (!String(v.i1 || "").trim()) return flash("Surveyor name is required."); if (!CL_MOBILE.test(clCleanMob(v.i2))) return flash("Surveyor mobile must be a 10-digit Indian number starting 6, 7, 8 or 9."); }
    if (form === "report") { if (!String(v.i0 || "").trim()) return flash("Record what the assessor found before capturing the figure."); if (!Number(v.i1)) return flash("Enter the assessed loss from the report."); }
    if (form === "payment" && !Number(v.i2)) return flash("Amount paid is required.");
    const f = CL_FLOW[t0.state];
    let to = f.act.to; if (to === "BRANCH") to = (t0.loss || 0) > CL_SURVEYOR_THRESHOLD ? "S5" : "S8";
    const stay = form === "report" || (form === "payment" && v.i1 === "Instalment");
    let extra = {}, detail = "";
    if (form === "admiss") { extra.admissibility = v.i1; detail = "Assessment: " + v.i1; if (v.i1 === "Outside policy terms") setTimeout(() => flash(`${CL_HEAD} notified. The claim proceeds to the insurer regardless.`), 0); }
    else if (form === "claimno") { extra.claimNo = v.i1.trim(); detail = "Claim number " + extra.claimNo; }
    else if (form === "surveyor") { extra.surveyor = { name: v.i1.trim(), mobile: clCleanMob(v.i2), visit: v.i3 ? clFdate(new Date(v.i3).getTime()) : "to be confirmed" }; detail = "Surveyor " + extra.surveyor.name + " appointed"; }
    else if (form === "report") { extra.inspection = v.i0.trim(); extra.assessedLoss = Number(v.i1); extra.report = { source: v.i2, converted: v.i2 !== "Attached PDF", author: t0.surveyor ? "Surveyor" : t0.insurer, file: t0.id.toLowerCase() + "-assessment-report.pdf", at: CL_NOW, shared: false }; detail = "Inspection recorded · assessed " + clInr(extra.assessedLoss) + " · arrived as " + v.i2; }
    else if (form === "payment") { const type = v.i1, amt = Number(v.i2); const n = type.startsWith("Instalment") ? t0.payments.filter((p) => p.type.startsWith("Instalment")).length + 1 : null; extra.payments = [...t0.payments, { type, n, date: clFdate(CL_NOW), amt, utr: v.i3 || null }]; detail = type + " · " + clInr(amt); }
    if (t0.state === "S0") extra.missing = null;
    mut(id, (t) => { const t1 = clAudit({ ...t, ...extra }, f.act.label, detail + (note ? (detail ? " — " : "") + note : ""), actor(), roleName()); return stay ? t1 : clStep(t1, to); });
    flash(stay ? (form === "report" ? "Recorded. Share it on the Survey tab to start consent." : "Instalment recorded. Add another, or close with a final payment.") : CL_FLOW[to].terminal ? "Claim closed as Settled." : `Moved to “${CL_FLOW[to].label}”. Client now sees “${CL_FLOW[to].client}”.`);
  };
  const bot = (id) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return;
    const s = t0.state, poc = (CL_INSURERS[t0.insurer] || {}).poc || "claims@" + t0.insurer.toLowerCase().replace(/[^a-z]/g, "") + ".co.in";
    if (s === "S3") { const cn = t0.insurer.split(" ")[0].slice(0, 2).toUpperCase() + "/" + t0.product.slice(0, 3).toUpperCase() + "/26/" + (10000 + Math.floor(Math.random() * 89999)); mut(id, (t) => clStep(clAudit({ ...t, claimNo: cn }, "Claim registration classified and extracted", "Insurer claim number: " + cn + " · 96% confidence, from " + poc, "Email bot"), "S4")); return flash("Bot advanced the claim to “Awaiting admissibility decision”."); }
    if (s === "S4") { mut(id, (t) => clStep(clAudit(t, "Admissibility decision classified and extracted", "Decision: Admitted · 94% confidence, from " + poc, "Email bot"), "BRANCH")); return flash("Bot recorded the insurer's acceptance and routed the claim. No human touched it."); }
    if (s === "S5") { const sv = CL_SURVEYORS[t0.id.charCodeAt(t0.id.length - 1) % CL_SURVEYORS.length]; const surveyor = { name: sv.name, firm: sv.firm, mobile: sv.mobile, visit: clFdate(CL_NOW + 3 * CL_DAY), source: "Bot-extracted from insurer mail" }; mut(id, (t) => clStep(clAudit({ ...t, surveyor }, "Surveyor appointment classified and extracted", "Surveyor " + sv.name + " (" + sv.firm + ") · 93% confidence, from " + poc, "Email bot"), "S6")); return flash("Bot advanced the claim to “Inspection & assessment report”."); }
    if (s === "S6" || s === "S8") { const assessed = Math.round((t0.loss || 250000) * 0.88 / 1000) * 1000; const fromSurveyor = s === "S6"; const asPdf = fromSurveyor && (t0.id.charCodeAt(t0.id.length - 1) % 2 === 0); const report = { source: asPdf ? "Attached PDF" : "Email body", converted: !asPdf, author: fromSurveyor ? "Surveyor" : t0.insurer, file: asPdf ? "final-survey-report.pdf" : t0.id.toLowerCase() + "-assessment-report.pdf", at: CL_NOW, shared: false }; const inspection = fromSurveyor ? "Damage consistent with the reported cause; salvage segregated and photographed" : "No site inspection — assessed internally by the insurer"; mut(id, (t) => clAudit({ ...t, inspection, assessedLoss: assessed, report }, (fromSurveyor ? "Inspection & assessment report" : "Assessment report") + " classified and extracted", "Assessed loss " + clInr(assessed) + " · arrived as " + (asPdf ? "attached PDF" : "email body"), "Email bot")); return flash("Report extracted. Share it with the client on the Survey tab to start consent."); }
    if (s === "R2") { const n = t0.challenges; const body = n === 1 ? "We have re-examined the file against the challenge raised. The exclusion relied on is unchanged, but we set out below the basis on which it was applied." : "This is our final position. The file has been reviewed a second time. The repudiation stands and no further internal review is available."; mut(id, (t) => { const to = t.challenges >= 2 ? "R3" : "R1"; const rej = { ...t.rejection, responses: [...t.rejection.responses, { kind: "reply", n: t.challenges, text: body, at: CL_NOW }] }; return clStep(clAudit({ ...t, rejection: rej }, "Insurer's detailed reply to challenge " + t.challenges, "Rejection upheld · 96% confidence, from " + poc, "Email bot"), to); }); return flash("Insurer's reply recorded and published to the client."); }
    if (s === "S11") { mut(id, (t) => { const pay = { type: "Full and final", n: null, date: clFdate(CL_NOW), amt: t.assessedLoss || t.loss || 0, utr: "UTR" + String(CL_NOW).slice(2, 10), mode: "NEFT" }; return clStep(clAudit({ ...t, payments: [...t.payments, pay] }, "Payment confirmation classified and extracted", "Amount " + clInr(pay.amt) + " · UTR " + pay.utr + " · 97% confidence, from " + poc, "Email bot"), "S12"); }); return flash("Bot recorded the payment. Client now sees “Payment Released”."); }
    return flash("No inbound mail is expected at this stage.");
  };
  const botReject = (id) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return;
    const poc = (CL_INSURERS[t0.insurer] || {}).poc || "claims@" + t0.insurer.toLowerCase().replace(/[^a-z]/g, "") + ".co.in";
    const reason = CL_REJ_REASONS[t0.id.charCodeAt(t0.id.length - 1) % CL_REJ_REASONS.length];
    mut(id, (t) => clStep(clAudit({ ...t, rejection: { reason, at: CL_NOW, responses: [] }, challenges: 0 }, "Insurer rejection classified and extracted", reason + " · 96% confidence, from " + poc, "Email bot"), "R1"));
    flash("Rejection recorded and published to the client. They may challenge it twice.");
  };
  const clientRun = (id) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return;
    const to = CL_FLOW[t0.state].act.to;
    const what = { S9: "Client consented to the assessed amount on BimaKendra", S12: "Client confirmed receipt on BimaKendra" }[t0.state] || "Client acted on BimaKendra";
    mut(id, (t) => clStep(clAudit(t, what, "Recorded from BimaKendra", t.client, "Client"), to));
    flash(CL_FLOW[to].terminal ? "Claim closed as Settled." : `Moved to “${CL_FLOW[to].label}”.`);
  };
  const challenge = (id, reason) => {
    if (!String(reason || "").trim()) return flash("A challenge needs a reason from the client. It is mandatory and goes to the insurer as written.");
    mut(id, (t) => { const ch = t.challenges + 1; const rej = { ...t.rejection, responses: [...t.rejection.responses, { kind: "challenge", n: ch, text: reason.trim(), at: CL_NOW }] }; return clStep(clAudit({ ...t, challenges: ch, rejection: rej }, "Challenge " + ch + " of 2 raised by the client", reason.trim(), t.client, "Client"), "R2"); });
    flash("Challenge forwarded to the insurer. They owe a fuller explanation.");
  };
  const acceptRej = (id) => { mut(id, (t) => clStep(clAudit(t, "Client accepted the rejection", "Closed with reason Rejection accepted. The client remains free to approach IRDAI or a court — the platform records that, it does not offer it.", t.client, "Client"), "RX", { closureReason: "Rejection accepted", subStatus: null })); flash("Closed as Rejection accepted."); };
  const shareReport = (id) => { mut(id, (t) => clStep(clAudit({ ...t, report: { ...t.report, shared: true, sharedAt: CL_NOW } }, "Assessment report shared on BimaKendra", t.report.file + " · assessed loss " + clInr(t.assessedLoss), actor(), roleName()), "S9")); flash("Shared. The client can now consent or object — two rounds, same as a rejection."); };
  const ask = (id, q) => { mut(id, (t) => { const qid = "Q" + (t.queries.length + 1); return clAudit({ ...t, queries: [...t.queries, { id: qid, target: q.target, text: q.text, src: q.src, status: "open", at: CL_NOW, response: null }] }, "Query raised" + (q.target ? " on " + q.target : ""), q.text + " · on behalf of " + q.src, actor(), roleName()); }); flash("Sent to the client. They see it on their surface; the reminder cycle starts now."); };
  const answer = (id, qid) => { mut(id, (t) => ({ ...t, queries: t.queries.map((q) => (q.id === qid ? { ...q, status: "answered", response: "Sharing the requested detail from our records.", respondedAt: CL_NOW } : q)), audit: [{ at: CL_NOW, actor: t.client, role: "Client", what: "Client responded to a query", detail: "" }, ...t.audit] })); flash("Response recorded."); };
  const closeQuery = (id, qid) => { mut(id, (t) => ({ ...t, queries: t.queries.map((q) => (q.id === qid ? { ...q, status: "closed" } : q)) })); flash("Query closed."); };
  const reopenQuery = (id, qid) => { mut(id, (t) => ({ ...t, queries: t.queries.map((q) => (q.id === qid ? { ...q, status: "open" } : q)) })); flash("Query reopened."); };
  const bank = (id, b) => { mut(id, (t) => clStep(clAudit({ ...t, bank: { acc: b.acc, ifsc: b.ifsc, cheque: "cancelled-cheque.pdf" } }, "Bank details recorded", "Recorded and sent to " + t.insurer, actor(), roleName()), "S11")); flash("Bank details recorded. Moved to Payment in Progress."); };
  const upload = (id, key, name) => { mut(id, (t) => { const q = t.queries.find((x) => x.status === "open" && x.target === key); return clAudit({ ...t, uploads: { ...t.uploads, [key]: { name, at: CL_NOW, by: actor() } }, queries: q ? t.queries.map((x) => (x.id === q.id ? { ...x, status: "answered", response: "Uploaded " + name } : x)) : t.queries }, "Document received: " + key, name, actor(), roleName()); }); flash("Uploaded " + name + "."); };
  const reassign = (id, cm, reason) => { mut(id, (t) => clAudit({ ...t, cm }, "Reassigned to " + cm, reason, actor(), roleName())); flash("Reassigned to " + cm + "."); };
  const withdraw = (id, reason) => { mut(id, (t) => clStep(clAudit(t, "Marked as withdrawn", reason, actor(), roleName()), "SX", { closureReason: "Withdrawn", subStatus: null })); flash("Marked as withdrawn."); };
  const park = (id, reason) => { mut(id, (t) => clAudit({ ...t, dormant: { sub: t.state === "S10" ? "Awaiting bank details" : "Client unresponsive", fromState: t.state, note: reason, at: CL_NOW } }, "Parked as dormant", reason + " · silent, no client notification", actor(), roleName())); flash("Parked as dormant — silently, with no client notification."); };
  const resume = (id, toState, reason) => { mut(id, (t) => clAudit({ ...t, dormant: null, state: toState, status: CL_FLOW[toState].status, stageAt: CL_NOW, chase: { reminders: 0, escalations: 0, events: [] } }, "Resumed from dormant", "Resumed at " + CL_FLOW[toState].label + " · " + reason, actor(), roleName())); flash("Resumed from dormant at " + CL_FLOW[toState].label + "."); };
  const sendReminder = (id) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return; const L = CL_LOOPS[clLoop(t0)];
    if (!L || !L.reminders) return flash(`No reminder is sent on the internal chase — ${CL_HEAD} is alerted as soon as the time is up. There is nobody outside to remind.`);
    if (t0.chase.reminders >= L.reminders) return flash(`All ${L.reminders} reminders have been sent. Escalating to ${CL_HEAD} is the next step.`);
    mut(id, (t) => clAudit({ ...t, chase: { ...t.chase, reminders: t.chase.reminders + 1 } }, "Reminder sent", L.name + " · reminder " + (t0.chase.reminders + 1) + " of " + L.reminders + ", owed by " + L.who, actor(), roleName()));
    flash("Reminder sent. Ticket colour is now amber.");
  };
  const escalate = (id) => {
    const t0 = tickets.find((x) => x.id === id); if (!t0) return; const L = CL_LOOPS[clLoop(t0)] || { escalations: 3, kind: "hold" };
    mut(id, (t) => {
      const n = t.chase.escalations + 1; let x = { ...t, escalated: true, chase: { ...t.chase, escalations: n } };
      if (n >= (L.escalations || 3)) {
        if (L.kind === "dormant") x.dormant = { sub: t.state === "S10" ? "Awaiting bank details" : "Client unresponsive", fromState: t.state, note: "Auto-parked after escalations with no client response", at: CL_NOW };
        else if (L.kind && L.kind.startsWith("terminate")) { x.state = "ST"; x.status = "Terminated"; x.stageAt = CL_NOW; }
      }
      return clAudit(x, "Escalated to " + CL_HEAD, L.name + " · escalation " + n + " of " + (L.escalations || 3) + (L.kind === "hold" ? " · this claim never terminates" : ""), actor(), roleName());
    });
    flash("Escalated to " + CL_HEAD + ".");
  };
  const createClaim = (d) => {
    const seq = nextSeq(), id = "CLM-" +seq;
    const dupe = tickets.find((t) => t.policy.toLowerCase() === d.policy.toLowerCase() && new Date(t.dol).toDateString() === new Date(d.dol).toDateString());
    const audit = [{ at: CL_NOW, actor: d.client, role: "Client", what: "Claim intimated via BimaKendra", detail: "All mandatory fields validated at submission" + (clLossOptional(d.product) && !d.loss ? ". No estimate declared — optional on " + clProductLabel(d.product) + ", so the insurer will assess internally." : "") }];
    if (dupe) audit.unshift({ at: CL_NOW, actor: "System", role: "Bot", what: "Duplicate flag raised", detail: "Same policy and date of loss as " + dupe.id + ". Routed to " + dupe.cm + ", who owns the original." });
    const base = { id, client: d.client, product: d.product, insurer: d.insurer, policy: d.policy, dol: d.dol, loss: d.loss, priority: d.loss > 1000000 ? "Critical" : "Medium", cm: dupe ? dupe.cm : CL_ME, flagged: !!dupe, desc: d.desc, cause: d.cause, location: d.loc, contactName: d.cname, contactMobile: d.mob, channel: "BimaKendra", claimNo: null, surveyor: null, inspection: null, assessedLoss: null, bank: null, payments: [], admissibility: null, docs: {}, uploads: {}, escalated: false, subStatus: null, closureReason: null, missing: null, createdAt: CL_NOW, stageAt: CL_NOW, ownerLog: [], mail: [], requests: [], queries: [], botLog: [], inbox: [], rejection: null, challenges: 0, dormant: null, chase: { reminders: 0, escalations: 0, events: [] }, state: "S1", status: CL_FLOW.S1.status, contact: (d.cname || "") + " · " + (d.mob || ""), audit };
    setTickets((ts) => [base, ...ts]); setCreateOpen(false); setCreatePrefill(null); setOpenId(id); setView("ticket");
    flash(dupe ? "Created and flagged as a possible duplicate of " + dupe.id + ". Routed to " + dupe.cm + "." : "Created " + id + ". Two-business-hour initial response clock has started.");
  };
  const createFromMail = (m) => {
    const seq = nextSeq(), id = "CLM-" +seq; const uploads = {};
    m.att.forEach((a) => { uploads[a.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")] = { name: a, at: CL_NOW, by: actor() + " (from " + m.id + ")" }; });
    const base = { id, client: m.cand || "New client — to be mapped", product: "Fire", insurer: "Bajaj", policy: "FIR/2026/0" + (1200 + (seq % 99)), dol: clAgo(30 * 24), loss: null, priority: "High", cm: CL_ME, flagged: false, desc: m.subject, cause: "To be established", location: "To be captured", contactName: (m.fromName || m.from).split(",")[0], contactMobile: "", channel: "Email", claimNo: null, surveyor: null, inspection: null, assessedLoss: null, bank: null, payments: [], admissibility: null, docs: {}, uploads, escalated: false, subStatus: null, closureReason: null, missing: ["Estimated Loss Amount", "Photos", "Location of loss: full address"], createdAt: CL_NOW, stageAt: CL_NOW, ownerLog: [], mail: [], requests: [], queries: [], botLog: [], inbox: [{ at: m.at, dir: "in", from: m.from, subj: m.subject, body: m.body, queueRef: m.id }], rejection: null, challenges: 0, dormant: null, chase: { reminders: 0, escalations: 0, events: [] }, state: "S0", status: CL_FLOW.S0.status, contact: "", audit: [{ at: CL_NOW, actor: actor(), role: roleName(), what: "Claim created from the manual review queue", detail: m.id + " · reason " + m.reason + " · the bot guessed " + m.guess + " at " + m.conf + "%" }] };
    setTickets((ts) => [base, ...ts]); setMrq((q) => q.filter((x) => x.id !== m.id)); setOpenId(id); setView("ticket");
    flash("Created " + id + " in Draft. The mail is on its trail and the FNOL chase has started.");
  };
  const linkMail = (mailId, ticketId, why) => {
    const m = mrq.find((x) => x.id === mailId); if (!m) return;
    mut(ticketId, (t) => { const uploads = { ...t.uploads }; m.att.forEach((a) => { uploads[a.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")] = { name: a, at: CL_NOW, by: actor() + " (from " + m.id + ")" }; }); return clAudit({ ...t, uploads, inbox: [...t.inbox, { at: m.at, dir: "in", from: m.from, subj: m.subject, body: m.body, queueRef: m.id }] }, "Mail mapped from the review queue", m.id + " · " + m.guess + " at " + m.conf + "% · from " + m.from + (m.att.length ? " · " + m.att.length + " attachment" + (m.att.length > 1 ? "s" : "") + " filed" : "") + " — " + why, actor(), roleName()); });
    setMrq((q) => q.filter((x) => x.id !== mailId)); setOpenId(ticketId); setView("ticket");
    flash("Linked to " + ticketId + ". The mail is on its trail and the mapping is audited.");
  };
  const discardMail = (id) => { setMrq((q) => q.filter((x) => x.id !== id)); flash("Discarded and logged for threshold tuning. No reply sent."); };
  const rejectMail = (id) => { const m = mrq.find((x) => x.id === id); setMrq((q) => q.filter((x) => x.id !== id)); flash("Rejected. A reasoned reply went to " + (m ? m.from : "the sender") + " — no ticket created."); };

  const act = { cmForm, bot, botReject, clientRun, challenge, acceptRej, shareReport, ask, answer, closeQuery, reopenQuery, bank, upload, reassign, withdraw, park, resume, sendReminder, escalate, createFromMail, linkMail, discardMail, rejectMail, flash };
  const current = tickets.find((t) => t.id === openId);
  /* The order the ticket pager walks — the same urgency order the queues use. */
  const pagerList = useMemo(() => clVisible(tickets, role).slice().sort((a, b) => {
    const rk = (t) => (t.escalated ? 0 : clOverdueBy(t) > 0 ? 1 : 2);
    return rk(a) - rk(b) || clOverdueBy(b) - clOverdueBy(a);
  }), [tickets, role]);
  /* Only Umesh (the Claims & Endorsements Head) gets the admin/manager view switcher. */
  const isAdmin = /umesh/i.test(user?.name || "");
  /* Sidebar identity is always the signed-in user — the Me/Team switch changes
     the data scope, not who is logged in (so it stays put when Umesh toggles). */
  const identity = user
    ? { name: user.name, role: user.role, avatar: user.avatar, status: user.status }
    : { name: PORTAL_USERS["ruksana.khan@bimakavach.com"].name, role: "Claims executive", avatar: PORTAL_USERS["ruksana.khan@bimakavach.com"].avatar };
  const toList = () => setView("list");
  const CRUMBS = ({ home: [{ label: "Home" }], list: [{ label: "My claims" }], ticket: [{ label: "My claims", onClick: toList }, { label: openId || "" }], review: [{ label: "Manual review queue" }], reports: [{ label: "Reports" }] }[view]) || [{ label: "Home" }];

  return (
    <div className="h-screen overflow-hidden p-3" style={{ background: C.canvas, color: C.ink, fontFamily: FONT }}>
      <style>{GLOBAL_CSS}</style>
      <div className="flex h-full w-full overflow-hidden rounded-2xl border" style={{ borderRadius: 20, background: C.white, borderColor: C.lineSoft, boxShadow: "0 2px 8px rgba(28,27,31,0.06)" }}>
        <Sidebar view={view} go={go} mails={mrq} openId={openId} openTicket={openTicket} collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={onSignOut} onSearch={() => setSearchOpen(true)} tool="BimaClaim" nav={CL_NAV} identity={identity} envs={user?.envs} onSwitchEnv={setEnv} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-6 py-4">
            <Breadcrumb segments={CRUMBS} right={view === "ticket" ? (
              <TicketPager id={openId} list={pagerList} onOpen={openTicket} />
            ) : (
              <button onClick={() => setCreateOpen(true)} className="bk-btn bk-btn-fill flex items-center justify-center gap-2 font-semibold leading-none"
                style={{ background: C.brand, color: C.white, border: `0.5px solid ${C.brand}`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>Create Claim</button>
            )} />
          </div>
          <div key={view + (openId || "")} className="bk-route flex min-h-0 flex-1 flex-col px-6">
            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto pb-6">
              {view === "home" && <ClaimsHome tickets={tickets} role={role} mrq={mrq} go={go} openTicket={openTicket} user={user} isAdmin={isAdmin} onRole={switchRole} />}
              {view === "list" && <ClaimsList tickets={tickets} role={role} filter={filter} setFilter={setFilter} openTicket={openTicket} />}
              {view === "ticket" && current && <ClaimsDetail t={current} role={role} act={act} />}
              {view === "ticket" && !current && <ClaimsList tickets={tickets} role={role} filter={filter} setFilter={setFilter} openTicket={openTicket} />}
              {view === "review" && <ClaimsReview tickets={tickets} mrq={mrq} role={role} act={act} />}
              {view === "reports" && <ClaimsReports tickets={tickets} mrq={mrq} role={role} />}
            </div>
          </div>
        </main>
      </div>
      {createOpen && <ClaimsCreate onCreate={createClaim} back={() => { setCreateOpen(false); setCreatePrefill(null); }} prefill={createPrefill} />}
      <ClaimsSearch open={searchOpen} onClose={() => setSearchOpen(false)} tickets={tickets} role={role} openTicket={(id) => { setSearchOpen(false); openTicket(id); }} />
      {toast && createPortal(
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: C.figInk, color: C.white, boxShadow: "0 8px 24px rgba(28,27,31,0.18)" }}>
          <CheckCircle2 size={14} className="shrink-0" style={{ color: "#6EE7B7" }} /> {toast}
        </div>, document.body)}
    </div>
  );
}

function EndorseApp({ collapsed, setCollapsed, onSignOut, user, setEnv }) {
  const [tickets, setTickets] = useState(() =>
    SEED.map((t) => {
      return { ...t, history: seedTrail(t) };
    })
  );
  const [mails, setMails] = useState(SEED_MAILS);
  const boot = useMemo(readRoute, []);
  const [view, setView] = useState(boot.view);
  const [filter, setFilter] = useState("attention");
  const [openId, setOpenId] = useState(boot.openId || null);
  const [scope, setScope] = useState("mine");
  const [prefill, setPrefill] = useState(null);
  const [claimId, setClaimId] = useState(null);   /* the review mail being turned into a ticket, if any */
  const [preset, setPreset] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createFrom, setCreateFrom] = useState("list");   /* the view the Create modal sits over */

  const go = (v, f, p) => { if (f) setFilter(f); setPreset(p || null); setView(v); };
  const openTicket = (id) => { setOpenId(id); setView("ticket"); };
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const advance = (id, note) => {
    const t0 = tickets.find((x) => x.id === id);
    const c = clock(t0);
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const next = { key: nextOf(t), ...stageOf(nextOf(t)) };
      const extra = FIN_ON_ENTER[next.key] ? FIN_ON_ENTER[next.key](t) : {};
      return { ...t, ...extra, stage: next.key, legs: [...t.legs, { s: t.stage, h: t.inStage }], inStage: 0, lastAction: 0, touched: true,
        history: [...t.history, ...(extra.__log || []),
          { text: legLine(t.stage, t.inStage, next.key), by: t.owner, at: 0, note: note || null }] };
    }));
    flash(c.state === "breached" ? `${stageOf(t0.stage).code} closed ${c.label} over SLA.` : "Stage closed inside SLA.");
  };

  /* M7 FR-091/093 — the copy arriving IS the transition: it closes SLA-09 and
     opens SLA-11 (Copy received), where QC and delivery happen. */
  const attachCopy = (id, opts) => {
    const manual = opts?.source === "manual";
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const endo = { file: opts?.file || `endorsement_${t.policy.replace(/\//g, "_")}.pdf`, size: "312 KB",
        source: manual ? "manual" : "bot", at: 0, by: manual ? t.owner : t.insurer };
      const moved = t.stage === "Awaiting Endorsement Copy";
      return { ...t, endo, sends: [], lastAction: 0, touched: true,
        ...(moved ? { stage: "Copy Received", legs: [...t.legs, { s: t.stage, h: t.inStage }], inStage: 0 } : {}),
        extraMail: [...(t.extraMail || []),
          ...(manual ? [] : [{ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Endorsement copy - ${t.policy}`, at: 0, att: 1, link: "auto",
            body: `Dear Partner,\n\nPlease find attached the endorsement copy for the above policy.\n\nRegards,\nEndorsement Desk` }])],
        history: [...t.history,
          ...(moved ? [{ ...TRAIL.leg(t.stage, t.inStage, "Copy Received", manual ? t.owner : "Mail bot"), at: 0 }] : []),
          ...TRAIL.copyIn(t, manual, opts?.file || endo.file).map((l) => ({ ...l, at: 0 }))] };
    }));
    flash(manual ? "Copy uploaded. Check it at QC, then send to the client." : "Bot fetched and attached the copy. Check it at QC, then send.");
  };

  /* QC on the insurer's copy, now a flag rather than a stage */
  const passQc = (id) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, qcPassed: true, lastAction: 0,
      history: [...t.history, { ...TRAIL.qc(t), at: 0 }] } : t));
    flash("QC passed. You can send the copy to the customer.");
  };

  /* Manual resend, for when the client asks for the copy again */
  const sendCopy = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const e = endoOf(t);
      return { ...t, lastAction: 0, sends: [...sendsOf(t), { mode: "manual", at: 0, by: t.owner }],
        extraMail: [...(t.extraMail || []), { dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing",
          to: `ops@${t.short}.com`, subject: `Endorsement copy - ${t.policy}${sendsOf(t).length ? " (resent)" : ""}`, at: 0, att: 1, link: "auto",
          body: sendsOf(t).length
            ? `Dear Sir/Madam,\n\nAs requested, resending the endorsement copy for ${t.policy}.\n\nRegards,\nServicing Desk`
            : `Dear Sir/Madam,\n\nYour requested ${t.type.toLowerCase()} has been processed. The endorsement copy is attached and is also available on your portal.\n\nRegards,\nServicing Desk` }],
        history: [...t.history, { ...TRAIL.sent(t, sendsOf(t).length > 0, e?.file), at: 0 }] };
    }));
    flash("Endorsement copy sent to the client.");
  };

  const chase = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const awaiting = t.stage === "Awaiting Quote" ? "the premium quote"
        : t.stage === "Awaiting Endorsement Copy" ? "the endorsement copy"
        : "an update on the endorsement request";
      return { ...t, lastAction: 0,
        extraMail: [...(t.extraMail || []), {
          dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail,
          subject: `Reminder - Endorsement request - ${t.policy}`, at: 0, att: 0, link: "auto",
          body: `Dear Team,\n\nGentle reminder on the endorsement request for policy ${t.policy} (${t.type}). We are awaiting ${awaiting}. Kindly share status at the earliest.\n\nRegards,\nServicing Desk` }],
        history: [...t.history, { text: "Reminder sent to insurer", by: t.owner, at: 0, note: "Auto-drafted from the mail trail" }] };
    }));
    flash("Reminder sent. Ticket no longer counts as pending action.");
  };

  const raiseQuery = (id, q) => {
    /* A query can now carry several questions, asked as one portal form. We keep
       `text` (first question) and `docs` (union of all requested) alongside the
       full `items` list so the reply flow and legacy readers are unaffected. */
    const items = q.items && q.items.length ? q.items : [{ text: q.text, docs: q.docs || [] }];
    const allDocs = [...new Set(items.flatMap((it) => it.docs || []))];
    const multi = items.length > 1;
    const form = items.map((it, i) => `${multi ? `${i + 1}. ` : ""}${it.text}${it.docs && it.docs.length ? `\n${multi ? "   " : ""}Documents required: ${it.docs.join(", ")}` : ""}`).join("\n\n");
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const qid = `Q${(t.queries || []).length + 1}`;
      return { ...t, lastAction: 0, priorStage: t.stage, stage: "Awaiting Customer Information", inStage: 0,
        queries: [...(t.queries || []), { id: qid, kind: q.kind, target: q.target, items, text: items[0].text, docs: allDocs, status: "open", by: t.owner, at: 0 }],
        extraMail: [...(t.extraMail || []), {
          dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: `ops@${t.short}.com`,
          subject: `Action needed on ${t.type} - ${t.policy}`, at: 0, att: 0, link: "auto", queryRef: qid, portal: true,
          body: `Dear Sir/Madam,\n\nWe need the following to process this endorsement:\n\n${form}\n\nPlease respond through your BimaKavach portal - open ticket ${t.id} and answer the pending query as a single form. Uploading there attaches your response to the request directly.\n\nWe will resume processing as soon as you respond.\n\nRegards,\nServicing Desk`,
        }],
        history: [...t.history, { text: `Query ${qid} published to client portal${q.target ? ` - ${q.target}` : ""}${multi ? ` · ${items.length} questions` : ""}`, by: t.owner, at: 0, note: items.map((it) => it.text).join(" · ") }] };
    }));
    flash("Query published. Ticket moved to SLA-04 - Awaiting customer information.");
  };

  /* The client answers through the portal, against a specific query, so the
     response is structurally bound to the query — no matching, no confidence,
     no chance of it landing on the wrong one. */
  const receiveReply = (id, qid) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const q = (t.queries || []).find((x) => x.id === qid);
      if (!q) return t;
      const values = {};
      if (q.target && (t.missingFields || []).includes(q.target)) {
        values[q.target] = FIELD_VALUES[q.target] || "Provided by client";
      } else if (q.target) {
        values[q.target] = "Confirmed as correct - no change required";
      }
      const reply = {
        at: 0, via: "portal", by: `ops@${t.short}.com`,
        note: q.kind === "new" ? "Responded to your question in the portal." : null,
        values, files: q.docs.map((d) => ({ name: d, file: `${d.toLowerCase().replace(/[^a-z]+/g, "_")}_${t.short}.pdf`, size: "248 KB" })),
      };
      const back = t.priorStage || "Under Verification";
      return { ...t, lastAction: 0, stage: back, inStage: 0, priorStage: null,
        queries: t.queries.map((x) => x.id === qid ? { ...x, status: "answered", answeredAt: 0, reply } : x),
        missing: t.missing.filter((d) => !q.docs.includes(d)),
        missingFields: (t.missingFields || []).filter((f) => f !== q.target),
        history: [...t.history, { text: `Client responded to ${qid} via portal`, by: t.client, at: 0, note: null }] };
    }));
    flash("Portal response received. Back to SLA-03 - re-verification, fresh 4 BH clock.");
  };

  /* M3 FR-036/037 — terminal, blocked without the withdrawal email */
  const withdraw = (id, { file, reason }) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, terminal: "Customer Withdrawn", lastAction: 0,
      queries: (t.queries || []).map((q) => q.status === "open" ? { ...q, status: "closed" } : q),
      history: [...t.history,
        { text: "Customer Withdrawn - insurer communication halted", by: t.owner, at: 0, note: reason },
        { text: `Withdrawal email uploaded: ${file}`, by: t.owner, at: 0, note: null }] } : t));
    flash("Ticket marked Customer Withdrawn. It is now read-only.");
  };

  /* M2 FR-020/021 — reason mandatory, SLA continues (inStage untouched) */
  const reassign = (id, { to, reason }) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, owner: to, lastAction: 0,
      history: [...t.history, { text: `Reassigned from ${t.owner} to ${to}`, by: t.owner, at: 0, note: `${reason} · SLA continues, not reset` }] } : t));
    flash(`Reassigned to ${to}. SLA continues.`);
  };

  /* M8/M9 — Manual Review is raised by the email bot, never by hand. The SM can
     only resolve it, which returns the ticket to the status it held before. */
  const resolveManualReview = (id) => {
    setTickets((ts) => ts.map((t) => t.id === id && t.manualReview
      ? { ...t, manualReview: null, lastAction: 0,
          history: [...t.history, { text: `Manual review resolved - returned to ${stageOf(t.stage).label}`, by: t.owner, at: 0, note: null }] }
      : t));
    flash("Manual review resolved. Workflow resumed.");
  };

  /* M3 FR-151 / BR-058 — classification editable only before insurer submission */
  const changeType = (id, type) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, type, missing: [], missingFields: [], lastAction: 0,
      kind: kindOfType(type), history: [...t.history, { text: `Endorsement type corrected to ${type} (${kindOfType(type)})`, by: t.owner, at: 0, note: "Permitted only before insurer submission (BR-058)" }] } : t));
    flash(`Type corrected to ${type}. Mandatory fields and documents re-derived.`);
  };

  /* Manual reminder, on top of the scheduled ones */
  const sendReminder = (id) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, lastAction: 0,
      history: [...t.history, { text: `Reminder sent to ${stageOf(t.stage).owner === "insurer" ? "insurer POC" : "customer"}`, by: t.owner, at: 0, note: "Manual, outside the schedule" }] } : t));
    flash("Reminder sent.");
  };

  /* M6 FR-064/065/066 — the link never arrives by hand. Portal flow: Operations
     upload it on the child ticket and it auto-attaches. Email flow: the bot
     extracts it from the insurer's mail. Either way the customer is told
     automatically the moment it lands (FR-071). */
  const receiveLink = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const portal = t.payMode === "Portal";
      const payLink = {
        ref: `PL-${t.id.slice(4)}-1`, at: 0, expiresIn: INSURERS[t.insurer]?.linkExpiryH || 48, regens: [],
        source: portal ? "child-ticket" : "bot-email",
        by: portal ? `Operations · ${t.childTicket}` : "Mail bot",
        confidence: portal ? null : 0.95,
      };
      const next = { key: nextOf(t), ...stageOf(nextOf(t)) };
      return { ...t, payLink, childClosed: portal, stage: next.key,
        legs: [...t.legs, { s: t.stage, h: t.inStage }], inStage: 0, lastAction: 0, touched: true,
        extraMail: [
          ...(t.extraMail || []),
          ...(portal ? [] : [{ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Payment link - ${t.policy}`, at: 0, att: 0, link: "auto",
            body: `Dear Partner,\n\nPayment link for the endorsement on ${t.policy} is below. Premium payable ${money(t.quote.total)}.\n\nRegards,\nEndorsement Desk` }]),
          { dir: "out", who: "no-reply@bimakavach.com", name: "BimaKavach (automatic)", to: `ops@${t.short}.com`,
            subject: `Payment link ready - ${t.policy}`, at: 0, att: 0, link: "auto", auto: true,
            body: `Dear Sir/Madam,\n\nYour endorsement has been approved. Premium payable is ${money(t.quote.total)}.\n\nThe payment link is available on your BimaKavach portal, along with NEFT details if you prefer a bank transfer.\n\nRegards,\nServicing Desk` },
        ],
        history: [...t.history,
          ...TRAIL.linkIn(t, payLink.confidence).map((l) => ({ ...l, at: 0 })),
          { text: legLine(t.stage, t.inStage, next.key), by: "Workflow engine", at: 0, note: null }] };
    }));
    flash("Payment link attached automatically and sent to the customer.");
  };

  /* M5 — the SM revises the premium in the Update Quote modal. Every update is
     stored as a new version; nothing is overwritten in place, and the previous
     versions stay viewable in the version-history drawer. */
  const reviseQuote = (id, { base, gst, file, reason } = {}) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id || !t.quote) return t;
      const prev = t.quote;
      const b = base ?? prev.base, g = gst ?? prev.gst;
      const quote = { base: b, gst: g, total: b + g, file: file || prev.file,
        version: prev.version + 1, at: 0, source: "manual", by: t.owner, confidence: null };
      return { ...t, quote, quoteVersions: [...(t.quoteVersions || [prev]), quote].slice(-6), lastAction: 0,
        history: [...t.history, { text: `Revised quote v${quote.version} - premium now ${money(quote.total)}`, by: t.owner, at: 0,
          note: (file && file !== prev.file ? `Copy replaced with ${file} · ` : "") + `${reason || "Premium revised"} · previous ${money(prev.total)}` }] };
    }));
    flash("Quote updated and saved as a new version.");
  };

  /* M6 FR-079/080, BR-032/033 — unlimited regeneration, every attempt logged */
  const regenerateLink = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id || !t.payLink) return t;
      const n = (t.payLink.regens || []).length + 2;
      const payLink = { ref: `PL-${t.id.slice(4)}-${n}`, at: 0, expiresIn: INSURERS[t.insurer]?.linkExpiryH || 48,
        regens: [...(t.payLink.regens || []), { at: 0, by: t.owner, reason: "Regenerated by Service Manager" }] };
      return { ...t, payLink, lastAction: 0,
        extraMail: [...(t.extraMail || []), { dir: "out", who: "no-reply@bimakavach.com", name: "BimaKavach (automatic)", to: `ops@${t.short}.com`,
          subject: `New payment link - ${t.policy}`, at: 0, att: 0, link: "auto", auto: true,
          body: `Dear Sir/Madam,\n\nA fresh payment link has been generated for your endorsement request. It is available on your BimaKavach portal.\n\nRegards,\nServicing Desk` }],
        history: [...t.history,
          { text: `Payment link regenerated - ${payLink.ref}`, by: t.owner, at: 0, note: t.payMode === "Portal" ? "New Operations child ticket raised" : "Fresh request emailed to the insurer" },
          { text: "Customer notified of the new link", by: "Notification engine", at: 0, note: "Email + WhatsApp + BimaKendra" }] };
    }));
    flash("Payment link regenerated and the customer notified.");
  };

  /* M6 FR-157 — revert a mismatched payment, reason mandatory and audited */
  const revertPayment = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const legs = t.legs.filter((l) => l.s !== "Awaiting Payment");
      return { ...t, stage: "Awaiting Payment", payment: null, inStage: 0, lastAction: 0, legs,
        history: [...t.history, { text: "Reverted from Payment complete to Payment pending", by: t.owner, at: 0, note: "Payment mismatch - amount does not reconcile with the quote (FR-157)" }] };
    }));
    flash("Reverted to Payment pending. The payment workflow is open again.");
  };

  const create = (f) => {
    const id = `END-${1056 + tickets.length - SEED.length}`;
    setTickets((ts) => [{ ...f, id, short: f.client.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 12) || "client",
      insurerMail: "endorsements@" + f.insurer.toLowerCase().replace(/[^a-z]+/g, "") + ".com",
      stage: "Under Verification", owner: "Nanditha P", inStage: 0, lastAction: 0, touched: false, legs: [{ s: "New / Unassigned", h: 0.03 }],
      missing: [], missingFields: [], queries: [], extraMail: [], endo: null, sends: [],
      history: [
        { ...TRAIL.raised({ type: f.type, policy: f.policy }), at: 0 },
        { text: `Auto-assigned to ${ASSIGNMENT.podOf(f.insurer)} · Nanditha P`, by: "Routing rule", at: 0, note: ASSIGNMENT.rule },
      ] }, ...ts]);
    /* The review mail leaves the queue only now, once its ticket exists. */
    if (claimId) { setMails((ms) => ms.filter((x) => x.id !== claimId)); setClaimId(null); }
    setPrefill(null); flash(`${id} raised and auto-assigned to ${ASSIGNMENT.podOf(f.insurer)}.`); setOpenId(id); setView("ticket");
  };

  const claim = (mid) => {
    const m = mails.find((x) => x.id === mid);
    setClaimId(mid);   /* remember it; do not remove until a ticket is created */
    setPrefill({ client: m.guess.includes("-") ? m.guess.split(" - ")[0] : "", type: "Address Change" });
    setCreateFrom("review");
    setView("create");
  };

  const current = tickets.find((t) => t.id === openId);
  const bc = useMemo(() => tickets.filter((t) => t.owner === "Nanditha P" && breached(t)).length, [tickets]);

  useEffect(() => {
    try {
      const path = pathOf(view, openId);
      if (window.location.pathname !== path) window.history.pushState({}, "", path + window.location.hash);
    } catch { /* sandboxed frame - the app still works, the address bar just will not follow */ }
  }, [view, openId]);

  useEffect(() => {
    const back = () => { const r = readRoute(); setView(r.view); if (r.openId) setOpenId(r.openId); };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);

  const toList = () => setView("list");
  const CRUMBS = {
    home: [{ label: "Home" }],
    list: [{ label: "My tickets" }],
    ticket: [{ label: "My tickets", onClick: toList }, { label: openId || "" }],
    review: [{ label: "Manual review queue" }],
    create: createFrom === "review"
      ? [{ label: "Manual review queue", onClick: () => setView("review") }]
      : [{ label: "My tickets", onClick: toList }],
  }[view] || [{ label: "Home" }];

  /* The order the pager walks: the same risk order the queues use, over
     whichever scope the desk is set to. */
  const pagerList = useMemo(
    () => tickets.filter((x) => scope === "team" || x.owner === "Nanditha P").slice().sort(riskSort),
    [tickets, scope]);

  return (
    <div className="h-screen overflow-hidden p-3" style={{ background: C.canvas, color: C.ink, fontFamily: FONT }}>
      <style>{GLOBAL_CSS}</style>
      <div className="flex h-full w-full overflow-hidden rounded-2xl border"
        style={{ borderRadius: 20, background: C.white, borderColor: C.lineSoft, boxShadow: "0 2px 8px rgba(28,27,31,0.06)" }}>

        <Sidebar view={view} go={go} mails={mails} openId={openId} openTicket={openTicket}
          collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={onSignOut} onSearch={() => setSearchOpen(true)}
          envs={user?.envs} onSwitchEnv={setEnv}
          identity={user ? { name: user.name, role: user.role, avatar: user.avatar, status: user.status } : undefined} />

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Fixed top nav — the sunken breadcrumb card; 16px above and below it. */}
          <div className="shrink-0 px-6 py-4">
            <Breadcrumb segments={CRUMBS} right={view === "ticket" ? (
              <TicketPager id={openId} list={pagerList} onOpen={openTicket} />
            ) : (
              <button onClick={() => { setPrefill(null); setCreateFrom(view === "review" ? "review" : "list"); setView("create"); }}
                className="bk-btn bk-btn-fill flex items-center justify-center gap-2 font-semibold leading-none"
                style={{ background: C.brand, color: C.white, border: `0.5px solid ${C.brand}`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
                Create Ticket
              </button>
            )} />
          </div>

          <div key={view + (openId || "")} className="bk-route flex min-h-0 flex-1 flex-col px-6">
            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto pb-6">
              {/* Home — the desk and the progress dashboard. Its cards route into My Tickets. */}
              {view === "home" && <Home tickets={tickets} scope={scope} setScope={setScope} go={go} user={user || PORTAL_USERS["nanditha.p@bimakavach.com"]} />}
              {(view === "list" || (view === "create" && createFrom === "list")) && <ListView key={JSON.stringify(preset)} tickets={tickets} filter={filter} setFilter={setFilter} scope={scope} openTicket={openTicket} go={go} preset={preset} />}
              {view === "ticket" && !current && <ListView key="missing" tickets={tickets} filter={filter} setFilter={setFilter} scope={scope} openTicket={openTicket} go={go} preset={null} />}
              {view === "ticket" && current && <Detail t={current} onAdvance={advance} onAttachCopy={attachCopy} onChase={chase} onQuery={raiseQuery} onAnswer={receiveReply} onSendCopy={sendCopy} onWithdraw={withdraw} onReassign={reassign} onManualReview={resolveManualReview} onChangeType={changeType} onRemind={sendReminder} onQc={passQc} onReceiveLink={receiveLink} onRevise={reviseQuote} onRegenerate={regenerateLink} onRevertPayment={revertPayment} />}
              {(view === "review" || (view === "create" && createFrom === "review")) && <Review mails={mails} onClaim={claim} />}
              {view === "create" && <Create onCreate={create} back={() => { setClaimId(null); setPrefill(null); setView(createFrom); }} prefill={prefill} />}
            </div>
          </div>
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} tickets={tickets} openTicket={openTicket} />

      {toast && createPortal(
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
          style={{ background: C.figInk, color: C.white, boxShadow: "0 8px 24px rgba(28,27,31,0.18)" }}>
          <CheckCircle2 size={14} className="shrink-0" style={{ color: "#6EE7B7" }} /> {toast}
        </div>, document.body)}
    </div>
  );
}

/* =========================================================================
   Top-level gate: auth → environment. BimaClaim and BimaEndorse are sibling
   environments in one app; the login tool-selector switches between them and
   the session hash restores the choice on refresh.
   ========================================================================= */
export default function App() {
  const bootSess = useMemo(readSession, []);
  const [authed, setAuthed] = useState(!!bootSess);
  const [user, setUser] = useState(bootSess?.user || null);
  const [env, setEnv] = useState(bootSess?.env || null);   /* the tool the current session entered (a TOOLS key) */
  const [collapsed, setCollapsed] = useState(true);        /* Collapsed by default; React state — no browser storage */

  useAnek();
  useSquircle();

  /* Keep the session code in the hash so a refresh stays signed in. */
  useEffect(() => {
    try {
      const h = authed && user && env ? sessHash(user, env) : "";
      if ((window.location.hash || "") !== h) window.history.replaceState({}, "", window.location.pathname + h);
    } catch { /* sandboxed frame */ }
  }, [authed, user, env]);

  if (!authed) {
    return (
      <div style={{ color: C.ink, fontFamily: FONT }}>
        <style>{GLOBAL_CSS}</style>
        <Login onSignIn={(u, e) => { setUser(u); setEnv(e); setAuthed(true); }} />
      </div>
    );
  }

  /* Claims — the second built environment. */
  if (env === "BimaClaim") {
    return <ClaimsApp user={user} onSignOut={() => setAuthed(false)} setEnv={setEnv} collapsed={collapsed} setCollapsed={setCollapsed} />;
  }

  /* Any other tool the session entered that isn't built: the real shell,
     branded for that tool, under an "under construction" notice. */
  if (env && !TOOLS[env]?.built) {
    const tool = TOOLS[env];
    return (
      <div className="h-screen overflow-hidden p-3" style={{ background: C.canvas, color: C.ink, fontFamily: FONT }}>
        <style>{GLOBAL_CSS}</style>
        <div className="relative flex h-full w-full overflow-hidden rounded-2xl border"
          style={{ borderRadius: 20, background: C.white, borderColor: C.lineSoft, boxShadow: "0 2px 8px rgba(28,27,31,0.06)" }}>
          <Sidebar view="home" go={() => {}} mails={[]} openId={null} openTicket={() => {}}
            collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={() => setAuthed(false)}
            tool={env} identity={user || {}} />
          <main className="flex flex-1 flex-col overflow-hidden" />
          <div className="bk-scrim absolute inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "rgba(169,172,177,0.08)", backdropFilter: "blur(1.5px)", WebkitBackdropFilter: "blur(1.5px)" }}>
            <div className="bk-modal overflow-hidden" style={{ width: 480, maxWidth: "calc(100% - 32px)",
              background: C.white, border: `1px solid ${C.subtle}`, borderRadius: 32, boxShadow: "0 0 24px rgba(169,172,177,0.24)" }}>
              <div className="flex flex-col gap-1" style={{ padding: 24 }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="leading-none" style={{ fontSize: 28, fontWeight: 500 }}>
                    <span style={{ color: C.figInk }}>{tool.split[0]}</span><span style={{ color: tool.color }}>{tool.split[1]}</span>
                  </span>
                  <button onClick={() => setAuthed(false)} title="Back to login"
                    className="bk-iconctrl flex shrink-0 items-center justify-center"
                    style={{ width: 28, height: 28, borderRadius: 9, border: `0.5px solid ${C.subtle}`, background: C.white, color: C.figHint }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5, color: C.figInk }}>{env} is currently under construction</p>
              </div>
              <div className="flex items-center justify-end gap-3" style={{ padding: "16px 32px", borderTop: "1px solid #DFE0E2" }}>
                <button onClick={() => setAuthed(false)} className="bk-uc-btn bk-uc-secondary leading-none"
                  style={{ padding: "16px 28px", borderRadius: 16, border: `0.5px solid ${C.subtle}`, background: C.white, fontSize: 16, fontWeight: 600, color: C.figInk }}>
                  Back to Login
                </button>
                <button onClick={() => setEnv("BimaEndorse")} className="bk-uc-btn bk-uc-primary leading-none"
                  style={{ padding: "16px 28px", borderRadius: 16, border: `0.5px solid ${C.brand}`, background: C.white, fontSize: 16, fontWeight: 600, color: C.brand }}>
                  Visit BimaEndorse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <EndorseApp collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={() => setAuthed(false)} user={user} setEnv={setEnv} />;
}
