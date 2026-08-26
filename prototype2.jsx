import React, { useState, useMemo } from "react";
import {
  AlertTriangle, Inbox, Clock, CheckCircle2, ChevronRight, ChevronDown, ArrowLeft,
  Plus, Search, Building2, FileText, MailQuestion, Send, ShieldCheck,
  PauseCircle, User, Paperclip, CircleDot, ArrowRight, Layers, XCircle,
  BellRing, Mail, Download, X, FileCheck2, FileClock, CornerUpLeft, Link2, MoonStar, Flame,
  MailOpen, Globe, Phone, MessageSquare, Hourglass, HelpCircle, MessageCircleQuestion, Cpu, Sparkles, UserMinus, RefreshCw, SlidersHorizontal, IndianRupee, Link as LinkIcon, Landmark, RotateCcw
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  BimaKavach TMS — non-financial endorsement
 *  SLA is stage-wise only. Ticket age is shown but never judged.
 * ------------------------------------------------------------------ */

const C = {
  ink: "#0E1A1F", ink2: "#3D5058", ink3: "#7C8F97",
  line: "#DFE5E7", lineSoft: "#EDF1F2", canvas: "#F4F6F6", white: "#FFFFFF",
  teal: "#0B6E5F", tealSoft: "#E4F0ED",
  link: "#1668B8",
  breach: "#B3261E", breachSoft: "#FBEAE8",
  warn: "#A15C00", warnSoft: "#FDF2E1",
  wait: "#4B5EAA", waitSoft: "#EAECF7",
};


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
  "Priya N": { role: "Servicing executive", pod: "Pod A" },
  "Rahul K": { role: "Servicing executive", pod: "Pod B" },
  "Anil S": { role: "Relationship manager", pod: null },
};
const ESCALATION = { podLead: "Service Manager Head", serviceHead: "Service Head", insurerHead: "Insurer Head + Service Head", opsHead: "Operations Head", rm: "Relationship manager" };

/* Tab: Ticket Assignment parameters */
const ASSIGNMENT = { rule: "By insurer → pod, then round-robin within pod", podOf: (insurer) => INSURERS[insurer]?.pod || "Unassigned" };

/* Tab: Reminder Schedule Master + Escalation Matrix (Appendix E #6, #7).
   Values are working hours into the stage. */
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
    code: "SLA-01", label: "New / unassigned", sla: 1, unit: "MIN", owner: "system", verb: null, system: true,
    followUp: null, escalate: ["Service Head"], terminal: "Assign to fallback owner at +5 min",
  },
  "Under Verification": {
    code: "SLA-02", label: "Under verification", sla: 4, unit: "BH", owner: "Service Manager", verb: "Verify & submit to insurer",
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Owning SM + Service Head", "+2 BH", "+4 BH", "+1 WD"],
    terminal: "Remains open — no auto-termination",
  },
  "Awaiting Customer Information": {
    code: "SLA-04", label: "Awaiting customer information", sla: 24, unit: "CD", owner: "customer", verb: null, awaited: true,
    followUp: { every: 48, unit: "CD", max: 4 }, escalate: ["Customer + RM + Service Head", "+2 CD", "+4 CD", "+10 CD"],
    terminal: "Auto-close as Cancelled at 30 CD from clock start, if unpaid. Cannot be reopened.", cancelAtCD: 30,
  },
  "Submitted to Insurer": {
    code: "SLA-05", label: "Submitted to insurer", sla: 1, unit: "WD", owner: "insurer", verb: "Log insurer acceptance",
    followUp: { every: 1, unit: "WD", max: 3 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+1 WD", "+1 WD"],
    terminal: "Remains open — no auto-termination insurer-side",
  },
  "Awaiting Quote": {
    code: "SLA-06", label: "Awaiting quote", sla: 2, unit: "WD", owner: "insurer", verb: "Log quote received",
    followUp: { every: 1, unit: "WD", max: 3 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+1 WD", "+1 WD"],
    terminal: "Remains open — no auto-termination insurer-side",
  },
  "Awaiting Payment Link": {
    code: "SLA-07", label: "Awaiting payment link", sla: 1, unit: "BH", owner: "operations", verb: null, awaited: true,
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Operations + Ops head + Service Head", "+1 BH", "+4 BH", "+1 WD"],
    terminal: "Remains open",
  },
  "Awaiting Payment": {
    code: "SLA-08", label: "Awaiting payment", sla: 24, unit: "CD", owner: "customer", verb: "Log payment confirmed",
    followUp: { every: 24, unit: "CD", max: 3 }, escalate: ["Customer + RM + Service Head", "+2 CD", "+4 CD", "+12 CD"],
    terminal: "Terminate as Cancelled at 30 CD from clock start", cancelAtCD: 30,
  },
  "Awaiting Endorsement Copy": {
    code: "SLA-09", label: "Awaiting endorsement copy", sla: 3, unit: "WD", owner: "insurer", verb: null,
    followUp: { every: 1, unit: "WD", max: 2 }, escalate: ["Insurer POC + POC head + Service Head", "+1 WD", "+2 WD", "+2 WD"],
    terminal: "Remains open — no auto-termination insurer-side",
  },
  "Copy Received": {
    code: "SLA-11", label: "Copy received", sla: 1, unit: "BH", owner: "Service Manager", verb: "Approve QC — send copy & close",
    followUp: { every: 0.5, unit: "BH", max: 3 }, escalate: ["Owning SM + Service Head", "+30 min BH", "+2 BH", "+4 BH"],
    terminal: "Remains open",
  },
  "Closed": { label: "Closed", sla: null, unit: null, owner: null, verb: null, terminal: true },
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

/* One deadline function, four units. inStage is CALENDAR hours in the stage. */
function dueFrom(entered, sla, unit) {
  if (unit === "BH") return addBiz(entered, sla);
  if (unit === "WD") return addWD(entered, sla);
  if (unit === "CD") return new Date(entered.getTime() + sla * 3600000);
  return new Date(entered.getTime() + (sla / 60) * 3600000);      // MIN
}
/* User-facing wording. SLA codes and BH/WD/CD stay in the data for reference
   but are never shown — they mean nothing to a servicing executive. */
const unitLabel = (n, u) => u === "MIN" ? `${n} minute${n === 1 ? "" : "s"}`
  : u === "WD" ? `${n} day${n === 1 ? "" : "s"}`
  : `${n} hour${n === 1 ? "" : "s"}`;

/* Real elapsed / remaining clock time, spelled out */
function fmtPlain(h) {
  const a = Math.abs(h);
  if (a < 1) return `${Math.max(1, Math.round(a * 60))} min`;
  if (a < 24) {
    const hh = Math.floor(a), mm = Math.round((a - hh) * 60);
    return mm ? `${hh} hr${hh === 1 ? "" : "s"} ${mm} min` : `${hh} hr${hh === 1 ? "" : "s"}`;
  }
  const d = Math.floor(a / 24), hh = Math.round(a % 24);
  return hh ? `${d} day${d === 1 ? "" : "s"} ${hh} hr${hh === 1 ? "" : "s"}` : `${d} day${d === 1 ? "" : "s"}`;
}

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

const SEED = [
  { id: "END-1041", client: "Acme Logistics Pvt Ltd", short: "acmelogistics", policy: "FIRE/2026/00812", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Fire & Burglary", type: "Address Change / Correction / Update", kind: "Non-Financial", priority: "High", stage: "Under Verification", owner: "Priya N", inStage: 1.5, lastAction: 1.5, touched: false, legs: [{ s: "New / Unassigned", h: 0.2 }], missing: [] },
  { id: "END-1043", client: "Vertex Pharma Ltd", short: "vertexpharma", policy: "FIRE/2026/00947", insurer: "Bajaj Allianz", insurerMail: "corp.endo@bajajallianz.co.in", product: "Fire & Burglary", type: "Name / Entity Change", kind: "Non-Financial", priority: "Critical", stage: "Under Verification", owner: "Priya N", inStage: 30, lastAction: 30, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }], missing: ["Certificate of Incorporation"], missingFields: ["Name"] },
  { id: "END-1048", client: "Sunrise Chemicals Ltd", short: "sunrisechem", policy: "MAR/2026/00655", insurer: "IFFCO Tokio", insurerMail: "endo.desk@iffcotokio.co.in", product: "Marine Cargo", type: "Business Description Correction", kind: "Non-Financial", priority: "High", stage: "Submitted to Insurer", owner: "Priya N", inStage: 384, lastAction: 384, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }, { s: "Under Verification", h: 6 }], missing: [] },
  { id: "END-1050", client: "Pinnacle Retail Ltd", short: "pinnacleretail", policy: "PI/2026/00092", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Professional Indemnity (PI)", type: "Contact Details Update (Email / Mobile)", kind: "Non-Financial", priority: "Medium", stage: "Closed", owner: "Priya N", inStage: 0, lastAction: 20, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 3 }, { s: "Under Verification", h: 6 }, { s: "Submitted to Insurer", h: 24 }], missing: [] },
  { id: "END-1062", client: "Vanguard Textiles Pvt Ltd", short: "vanguardtex", policy: "FIRE/2026/00922", insurer: "Chola MS", insurerMail: "servicing@cholams.murugappa.com", product: "Fire & Burglary", type: "Sum Insured / Limit Enhancement", kind: "Financial", priority: "Critical", stage: "Awaiting Payment Link", owner: "Priya N", inStage: 22, lastAction: 22, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.6 }, { s: "Under Verification", h: 1.8 }, { s: "Submitted to Insurer", h: 18 }, { s: "Awaiting Quote", h: 20 }], missing: [],
    quote: { base: 18800, gst: 3384, total: 22184, file: "quote_FIRE_2026_00922.pdf", version: 1, at: 1.4, source: "bot", confidence: 0.94 },
    payMode: "Portal", childTicket: "PAY-1062", payLink: null },
  { id: "END-1063", client: "Redwood Logistics Ltd", short: "redwoodlog", policy: "WC/2026/00744", insurer: "ICICI Lombard", insurerMail: "endorsement@icicilombard.com", product: "Workmen Compensation (WC)", type: "Employee / Headcount Addition", kind: "Financial", priority: "Medium", stage: "Awaiting Payment", owner: "Priya N", inStage: 20, lastAction: 20, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.9 }, { s: "Under Verification", h: 1.6 }, { s: "Submitted to Insurer", h: 19 }, { s: "Awaiting Quote", h: 16 }, { s: "Awaiting Payment Link", h: 0.8 }], missing: [],
    quote: { base: 26400, gst: 4752, total: 31152, file: "quote_WC_2026_00744_v2.pdf", version: 2, at: 14.8, source: "manual", by: "Priya N", confidence: null },
    quoteVersions: [{ base: 23100, gst: 4158, total: 27258, file: "quote_WC_2026_00744.pdf", version: 1, at: 34, source: "bot", confidence: 0.91 }, { base: 26400, gst: 4752, total: 31152, file: "quote_WC_2026_00744_v2.pdf", version: 2, at: 14.8, source: "manual", by: "Priya N", confidence: null }],
    payMode: "Email", childTicket: null, payLink: { ref: "PL-1063-1", at: 14, expiresIn: 48, source: "bot-email", by: "Mail bot", confidence: 0.95, regens: [] } },
  { id: "END-1065", client: "Nimbus Engineering", short: "nimbuseng", policy: "OFF/2026/00390", insurer: "Bajaj Allianz", insurerMail: "corp.endo@bajajallianz.co.in", product: "Office / Package Policy", type: "Asset Addition", kind: "Financial", priority: "Medium", stage: "Awaiting Endorsement Copy", owner: "Priya N", inStage: 40, lastAction: 40, touched: true, legs: [{ s: "New / Unassigned", h: 0.2 }, { s: "Under Verification", h: 0.8 }, { s: "Under Verification", h: 1.4 }, { s: "Submitted to Insurer", h: 17 }, { s: "Awaiting Quote", h: 15 }, { s: "Awaiting Payment Link", h: 0.7 }, { s: "Awaiting Payment", h: 11 }], missing: [],
    quote: { base: 15200, gst: 2736, total: 17936, file: "quote_GMC_2026_00390.pdf", version: 1, at: 18, source: "bot", confidence: 0.96 },
    payMode: "Email", payLink: { ref: "PL-1065-1", at: 17, expiresIn: 48, source: "bot-email", by: "Mail bot", confidence: 0.97, regens: [] },
    payment: { mode: "NEFT", utr: "UTR106588421903", date: "Fri 21 Aug, 3:40 PM", file: "payment_proof_nimbuseng.pdf", at: 6 } },
];

const SEED_MAILS = [
  { id: "MB-2291", from: "accounts@vertexpharma.in", subject: "Re: Fwd: kindly update the address in our policy", received: 2, reason: "No policy number in mail or thread", guess: "Vertex Pharma Ltd — 3 active policies" },
  { id: "MB-2284", from: "ravi.menon@gmail.com", subject: "Nominee update for my company policy", received: 19, reason: "Sender domain not linked to a client", guess: "No confident match" },
];

/* Clock — stage only ---------------------------------------------- */
const fmtAgo = (h) => h < 1 ? `${Math.round(h * 60)}m ago` : h < 24 ? `${Math.round(h)}h ago` : (Math.round(h / 24) === 1 ? "yesterday" : `${Math.round(h / 24)}d ago`);
const fmtDur = (h) => {
  const a = Math.abs(h);
  if (a < 1) return `${Math.max(1, Math.round(a * 60))}m`;
  if (a < 24) { const hh = Math.floor(a), mm = Math.round((a - hh) * 60); return mm ? `${hh}h ${mm}m` : `${hh}h`; }
  return `${Math.floor(a / 24)}d ${Math.round(a % 24)}h`;
};
const isOpen = (t) => t.stage !== "Closed" && !t.terminal;
const isRouting = (t) => stageOf(t.stage).system === true;   // not yet on anyone's desk
const ageOf = (t) => t.legs.reduce((a, l) => a + l.h, 0) + (isOpen(t) ? t.inStage : 0);

function clock(t) {
  const st = stageOf(t.stage);
  if (!st || st.sla === null) return { state: "closed" };
  const entered = new Date(NOW.getTime() - t.inStage * 3600000);   // inStage = calendar hours
  const due = dueFrom(entered, st.sla, st.unit);
  const span = due - entered, gone = NOW - entered;
  const leftMs = due - NOW;
  const used = Math.min(100, Math.max(0, (gone / span) * 100));
  /* how much is left, expressed in the unit the SLA is written in */
  const label = fmtPlain(Math.abs(leftMs) / 3600000);
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
  return { label: st.label, tone: st.terminal ? C.teal : C.ink2, bg: st.terminal ? C.tealSoft : C.lineSoft };
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
  "Asset category / type": "Plant and machinery — CNC machining centre",
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
  lines.push(`${m.length} messages over ${fmtDur(ageOf(t))} — ${out.length} sent, ${inn.length} received.`);
  lines.push(`Request: ${t.type.toLowerCase()} on ${t.policy} for ${t.client}, raised by the client and routed to ${t.owner}.`);
  if (qs.length) {
    const openN = qs.filter((q) => q.status === "open").length;
    lines.push(`${qs.length} clarification cycle${qs.length > 1 ? "s" : ""} with the client${openN ? `, ${openN} still open` : ", all answered in the portal"}${qs[0].target ? ` — most recently on ${qs[0].target.toLowerCase()}` : ""}.`);
  }
  if (atOrPast(t, "Submitted to Insurer")) {
    lines.push(`Sent to ${t.insurer} at ${t.insurerMail}; acknowledged with a reference number.`);
    if (t.query) lines.push(`${t.insurer} raised a clarification on the entity name against the policy schedule.`);
  }
  if (e) lines.push(`Endorsement copy ${e.source === "bot" ? "fetched from the insurer's mail by the bot" : "uploaded manually"} — ${e.file}.`);
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
  m.push({ dir: "in", who: `ops@${t.short}.com`, name: t.client, subject: `${t.type} — ${t.policy}`, at: start,
    body: `Hi team,\n\nPlease process a ${t.type.toLowerCase()} on the above policy. Details and supporting documents are attached.\n\nRegards,\nOperations`, att: (TYPES[t.type]?.docs || []).length, link: "auto" });
  if (at["Submitted to Insurer"]) {
    m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail, subject: `Endorsement request — ${t.policy} — ${t.type}`, at: at["Submitted to Insurer"].in,
      body: `Dear Team,\n\nRequest you to process the following endorsement:\n\nPolicy: ${t.policy}\nInsured: ${t.client}\nType: ${t.type}\n\nSupporting documents attached. Kindly share the endorsement copy at the earliest.\n\nRegards,\nServicing Desk`, att: (TYPES[t.type]?.docs || []).length, link: "auto" });
    m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `RE: Endorsement request — ${t.policy}`, at: at["Submitted to Insurer"].in - 2,
      body: `Dear Partner,\n\nYour request has been registered under reference ${t.insurer.slice(0, 3).toUpperCase()}/ENDO/${t.id.slice(4)}. Expected turnaround 3 working days.\n\nRegards,\nEndorsement Desk`, att: 0, link: "auto" });
    if (t.query) {
      m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `RE: Endorsement request — ${t.policy} — clarification needed`, at: at["Submitted to Insurer"].in - 30,
        body: `Dear Partner,\n\nThe name on the incorporation certificate does not match the policy schedule. Kindly confirm which entity name should appear on the endorsement.\n\nRegards,\nEndorsement Desk`, att: 0, link: "manual" });
    }
    if (t.inStage > 200 && t.stage === "Submitted to Insurer") {
      m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail, subject: `Reminder 2 — Endorsement request — ${t.policy}`, at: at["Submitted to Insurer"].in - 200,
        body: `Dear Team,\n\nGentle reminder on the endorsement request below, pending since our mail of ${Math.round(at["Submitted to Insurer"].in / 24)} days ago. Kindly share status.\n\nRegards,\nServicing Desk`, att: 0, link: "auto" });
    }
  }
  if (atOrPast(t, "Copy Received") && at["Submitted to Insurer"]) {
    m.push({ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Endorsement copy — ${t.policy}`, at: at["Submitted to Insurer"].out,
      body: `Dear Partner,\n\nPlease find attached the endorsement copy for the above policy. No premium impact on this endorsement.\n\nRegards,\nEndorsement Desk`, att: 1, link: "auto" });
  }
  if (!isOpen(t)) {
    m.push({ dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: `ops@${t.short}.com`, subject: `Endorsement copy — ${t.policy}`, at: t.lastAction,
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
      __log: [
        { text: `Quote received — premium ${money(quote.total)} extracted by bot`, by: "Mail bot", at: 0, note: `Confidence ${Math.round(quote.confidence * 100)}% · ${quote.file}` },
        mode === "Portal"
          ? { text: `Payment link child ticket PAY-${t.id.slice(4)} raised for Operations`, by: "Workflow engine", at: 0, note: "Portal flow (BR-030)" }
          : { text: `Payment link requested from ${t.insurer} by email`, by: "Workflow engine", at: 0, note: "Email flow (BR-030)" },
        { text: "Premium withheld from the customer until the link is ready", by: "System", at: 0, note: "BR-026 / FR-061" },
      ] };
  },
  /* Payment Pending is entered by the link arriving — see receiveLink */
  /* M6 FR-083 — proof uploaded in the portal */
  "Awaiting Endorsement Copy": (t) => (t.kind !== "Financial" ? { endo: null } : {
    endo: null,
    payment: t.payment || { mode: t.payMode === "Portal" ? "Payment link" : "NEFT", utr: `UTR${t.id.slice(4)}8842190`,
      date: fmtWhen(NOW), file: `payment_proof_${t.short}.pdf`, at: 0 },
    __log: [
      { text: "Payment proof uploaded by customer in BimaKendra", by: t.client, at: 0, note: null },
      { text: "Payment confirmed to insurer — awaiting endorsement copy", by: "Notification engine", at: 0, note: null },
    ],
  }),
};

/* Primitives ------------------------------------------------------ */
const Eyebrow = ({ children, right }) => (
  <div className="flex items-baseline justify-between mb-2">
    <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.ink3 }}>{children}</div>{right}
  </div>
);
const Chip = ({ children, color, bg, mono }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${mono ? "font-mono" : "font-medium"}`}
    style={{ color: color || C.ink2, background: bg || C.lineSoft }}>{children}</span>
);
const toneOf = (s) => s === "breached" ? C.breach : s === "atRisk" ? C.warn : s === "held" ? C.wait : C.teal;

/* Stage SLA bar. The track is scaled to whichever is larger — the allowance or
   the time actually taken — so an overrun is shown in proportion to what was
   allowed rather than saturating the bar. The tick is the SLA boundary. */
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
        <span style={{ color: C.ink3 }}>{unitLabel(st.sla, st.unit)} allowed</span>
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
    <button onClick={onClick} className="text-left p-3 rounded-md border hover:border-slate-400" style={{ background: C.white, borderColor: C.line }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="p-1 rounded" style={{ background: c[1] }}><Icon size={13} style={{ color: c[0] }} /></span>
        <span className="text-xs font-medium leading-tight" style={{ color: C.ink2 }}>{label}</span>
      </div>
      <div className="font-mono text-2xl leading-none" style={{ color: c[0] }}>{value}</div>
      <div className="text-xs mt-1.5 flex items-center gap-0.5" style={{ color: C.ink3 }}>{note || "open list"} <ChevronRight size={11} /></div>
    </button>
  );
}

function KindTag({ kind, small }) {
  const fin = kind === "Financial";
  kind = kind || "Non-Financial";
  return (
    <span className={`inline-flex items-center gap-1 rounded font-semibold uppercase tracking-wide ${small ? "px-1 py-0.5 text-xs" : "px-1.5 py-0.5 text-xs"}`}
      style={fin ? { background: C.warnSoft, color: C.warn } : { background: C.lineSoft, color: C.ink3 }}>
      {fin ? <><IndianRupee size={9} />Financial</> : "Non-financial"}
    </span>
  );
}

function PriorityTag({ p, big }) {
  const c = PRIORITY[p], hot = c.rank <= 1;
  return (
    <span className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider ${big ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-xs"}`}
      style={{ background: hot ? c.color : C.lineSoft, color: hot ? C.white : C.ink3 }}>
      {p === "Critical" && <AlertTriangle size={big ? 12 : 10} />}{p}
    </span>
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

function TicketCard({ t, onOpen, mode }) {
  const S = srcOf(t), Icon = S.icon;
  const hot = PRIORITY[t.priority].rank <= 1;
  const mailCount = mailOf(t).length;
  return (
    <button onClick={() => onOpen(t.id)} className="w-full text-left px-4 py-3 flex gap-3 border-b hover:bg-slate-50"
      style={{ borderColor: C.lineSoft }}>
      <Icon size={17} className="shrink-0 mt-0.5" style={{ color: S.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm" style={{ color: C.ink2 }}>{t.id}</span>
          <KindTag kind={t.kind} />
        </div>
        <div className="text-base leading-snug" style={{ color: C.ink }}>{t.type}</div>
        <div className="text-sm mt-1 truncate" style={{ color: C.link }}>{t.client}</div>
        <div className="mt-2"><SlaCell t={t} stacked /></div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs flex-wrap" style={{ color: C.ink3 }}>
          <span>{statusOf(t).label}</span>
          {hot && <><span>·</span><span className="font-semibold uppercase tracking-wide" style={{ color: PRIORITY[t.priority].color }}>{t.priority}</span></>}
          <span>·</span>
          <span className="flex items-center gap-0.5"><MessageSquare size={11} />{mailCount}</span>
          {blocked(t) && <><span>·</span><span className="flex items-center gap-0.5" style={{ color: C.warn }}><FileClock size={11} />{gapCount(t)} pending</span></>}
          {mode === "team" && <><span>·</span><span>{t.owner}</span></>}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{ background: C.lineSoft, color: C.ink2 }}>{initials(t.owner)}</div>
    </button>
  );
}

function Column({ title, tone, list, onOpen, mode, empty }) {
  return (
    <section className="rounded-md border flex flex-col shrink-0"
      style={{ background: C.white, borderColor: C.line, width: 366, maxHeight: 560 }}>
      <header className="px-4 py-3 border-b shrink-0" style={{ borderColor: C.line }}>
        <span className="text-sm font-semibold" style={{ color: tone || C.ink }}>{title}</span>
        <span className="text-sm ml-1.5" style={{ color: C.ink3 }}>({list.length})</span>
      </header>
      <div className="overflow-y-auto">
        {list.length ? list.map((t) => <TicketCard key={t.id} t={t} onOpen={onOpen} mode={mode} />) : <Empty>{empty}</Empty>}
      </div>
    </section>
  );
}

function Collapsible({ title, count, hint, badge, children, action }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-md border overflow-hidden" style={{ background: C.white, borderColor: C.line }}>
      <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: open ? C.line : "transparent", background: C.canvas }}>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown size={14} style={{ color: C.ink3, transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
          <span className="text-sm font-semibold" style={{ color: C.ink }}>
            {title} {count !== undefined && <span className="font-mono font-normal" style={{ color: C.ink3 }}>({count})</span>}
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
    <section className="rounded-md border overflow-hidden" style={{ background: C.white, borderColor: C.line }}>
      <header className="px-3 py-2.5 flex items-center justify-between gap-2 border-b" style={{ borderColor: C.line, background: C.canvas }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>
            {title} {count !== undefined && <span className="font-mono font-normal" style={{ color: C.ink3 }}>({count})</span>}
          </div>
          {hint && <div className="text-xs mt-0.5" style={{ color: C.ink3 }}>{hint}</div>}
        </div>{action}
      </header>{children}
    </section>
  );
}
const Empty = ({ children }) => <div className="px-3 py-6 text-center text-sm" style={{ color: C.ink3 }}>{children}</div>;

/* Home ------------------------------------------------------------ */
function Home({ tickets, scope, setScope, go, openTicket }) {
  const mine = tickets.filter((t) => !isRouting(t) && (scope === "mine" ? t.owner === "Priya N" : true));
  const open = mine.filter(isOpen);
  const hotQ = open.filter((t) => PRIORITY[t.priority].rank <= 1).sort((a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || riskSort(a, b));
  const silentQ = open.filter((t) => bucketOf(t) === 0).sort(riskSort);
  const breachQ = open.filter((t) => bucketOf(t) === 1).sort(riskSort);
  const riskQ = open.filter((t) => bucketOf(t) === 2).sort(riskSort);
  const freshQ = open.filter((t) => bucketOf(t) === 3).sort(riskSort);

  return (
    <div className="space-y-4">
      <div>
        <Eyebrow right={
          <div className="flex rounded overflow-hidden border" style={{ borderColor: C.line }}>
            {["mine", "team"].map((s) => (
              <button key={s} onClick={() => setScope(s)} className="px-2 py-0.5 text-xs capitalize"
                style={{ background: scope === s ? C.ink : C.white, color: scope === s ? C.white : C.ink2 }}>{s}</button>
            ))}
          </div>
        }>Endorsement desk · non-financial</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Metric icon={Flame} label="Critical & High" value={hotQ.length} tone="breach" note="whatever the clock says" onClick={() => go("list", "open", { prio: "hot" })} />
          <Metric icon={AlertTriangle} label="Overdue" value={open.filter(breached).length} tone="breach" note="fix first" onClick={() => go("list", "attention", { slice: "breached" })} />
          <Metric icon={MoonStar} label="Pending action 15d+" value={silentQ.length} tone="warn" note="nobody chasing" onClick={() => go("list", "attention", { slice: "silent" })} />
          <Metric icon={Clock} label="Due today" value={riskQ.length} tone="warn" onClick={() => go("list", "attention", { slice: "risk" })} />
        </div>
      </div>

      {/* Priority is read before any clock: these stay on top whatever state they are in */}
      <Panel title="Priority cases" count={hotQ.length}
        hint="Every Critical and High ticket you own, on track or not. A lens over the queues below, not a separate list."
        action={<button onClick={() => go("list", "open", { prio: "hot" })} className="text-xs font-medium px-2 py-1 rounded" style={{ color: C.teal, background: C.tealSoft }}>See all</button>}>
        {hotQ.length ? (
          <div className="p-2 flex gap-2 overflow-x-auto">
            {hotQ.map((t) => (
                <button key={t.id} onClick={() => openTicket(t.id)} className="shrink-0 w-56 text-left p-2.5 rounded border hover:border-slate-400"
                  style={{ borderColor: t.priority === "Critical" ? PRIORITY.Critical.color : C.line, borderWidth: t.priority === "Critical" ? 2 : 1,
                    background: t.priority === "Critical" ? C.breachSoft : C.white }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <PriorityTag p={t.priority} big />
                    <span className="font-mono text-xs" style={{ color: C.ink3 }}>{t.id}</span>
                  </div>
                  <div className="mb-1.5"><KindTag kind={t.kind} small /></div>
                  <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{t.client}</div>
                  <div className="text-xs truncate mb-2" style={{ color: C.ink3 }}>{t.type}</div>
                  <div className="mb-1.5"><Chip color={statusOf(t).tone} bg={statusOf(t).bg}>{statusOf(t).label}</Chip></div>
                  <SlaCell t={t} stacked />
                </button>
            ))}
          </div>
        ) : <Empty>No Critical or High tickets open.</Empty>}
      </Panel>

      <div className="flex gap-4 overflow-x-auto pb-2 items-start">
        <Column title="Overdue" tone={C.breach} list={breachQ} onOpen={openTicket} mode={scope} empty="Nothing breached." />
        <Column title="Due today" list={riskQ} onOpen={openTicket} mode={scope} empty="Nothing due." />
        <Column title="Freshly assigned" list={freshQ} onOpen={openTicket} mode={scope} empty="Queue clear." />
      </div>

    </div>
  );
}

/* List ------------------------------------------------------------ */
/* My tickets — the inventory view.
   Home triages; this one holds everything and lets you slice it.
   One table, four tabs, three filters. No stacked panels. */
const TABS = [
  { key: "attention", label: "Needs attention", test: (t) => isOpen(t) && bucketOf(t) <= 2 },
  { key: "open", label: "All open", test: isOpen },
  { key: "closed", label: "Closed & terminal", test: (t) => !isOpen(t) },
  { key: "recent", label: "Recently worked", test: () => true },
];

const SORTS = {
  urgency: { label: "Urgency", fn: riskSort },
  priority: { label: "Priority", fn: (a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || riskSort(a, b) },
  oldest: { label: "Oldest first", fn: (a, b) => ageOf(b) - ageOf(a) },
  touched: { label: "Last worked", fn: (a, b) => a.lastAction - b.lastAction },
};

const SLICES = {
  all: { label: "Everything", fn: () => true },
  breached: { label: "Overdue only", fn: breached },
  risk: { label: "Due today only", fn: atRisk },
  silent: { label: "Pending 15d+ only", fn: isSilent },
  blocked: { label: "Intake gaps only", fn: blocked },
  held: { label: "Awaiting client only", fn: onHold },
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
  if (a < 1) return `${Math.max(1, Math.round(a * 60))}m`;   // under an hour reads in minutes
  if (a < DAY_LEN) {
    const hh = Math.floor(a), mm = Math.round((a - hh) * 60);
    return mm ? `${hh}h ${mm}m` : `${hh}h`;
  }
  const d = Math.floor(a / DAY_LEN), r = Math.round(a % DAY_LEN);
  return r ? `${d}wd ${r}h` : `${d}wd`;
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
      ? "Clock paused — item in manual review"
      : `${unitLabel(c.sla, c.unit)} allowed in ${stageOf(t.stage).label.toLowerCase()}`}>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-xs"
        style={{ background: soft, color: tone }}>
        {held ? <PauseCircle size={10} /> : over ? <AlertTriangle size={10} /> : <Clock size={10} />}
        {held ? `on hold · ${c.label} left` : over ? `${c.label} over` : `${c.label} left`}
      </span>
      {stacked && (
        <div className="text-xs mt-1 truncate" style={{ color: C.ink3 }}>
          {held ? `awaiting client · asked ${fmtAgo(c.heldSince)}` : `${over ? "was due " : "due "}${fmtWhen(c.due)}${c.external ? " · insurer" : ""}`}
        </div>
      )}
    </div>
  );
}

function HeadCell({ children, w, hide }) {
  return <div className={`${w} shrink-0 ${hide || ""} text-xs font-semibold uppercase tracking-wider`} style={{ color: C.ink3 }}>{children}</div>;
}

function TableRow({ t, onOpen, showOwner }) {
  return (
    <button onClick={() => onOpen(t.id)} className="w-full text-left px-3 py-2 flex items-center gap-3 border-b hover:bg-slate-50"
      style={{ borderColor: C.lineSoft, background: t.priority === "Critical" ? C.breachSoft : C.white }}>
      <div className="w-20 shrink-0"><PriorityTag p={t.priority} /></div>
      <div className="w-20 shrink-0 font-mono text-xs" style={{ color: C.ink2 }}>{t.id}</div>
      <div className="w-24 shrink-0 hidden md:block"><KindTag kind={t.kind} small /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: C.ink }}>{t.client}</div>
        <div className="text-xs truncate" style={{ color: C.ink3 }}>
          {t.type}
          {onHold(t) && <span style={{ color: C.wait }}> · awaiting client</span>}
          {isSilent(t) && <span style={{ color: C.wait }}> · silent {Math.round(t.lastAction / 24)}d</span>}
          {blocked(t) && <span style={{ color: C.warn }}> · {gapCount(t)} intake gap{gapCount(t) > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="w-36 shrink-0 hidden md:block text-xs" style={{ color: statusOf(t).tone }}>{statusOf(t).label}</div>
      <div className="w-36 shrink-0 hidden sm:block"><SlaCell t={t} stacked /></div>
      <div className="w-20 shrink-0 hidden lg:block font-mono text-xs" style={{ color: C.ink3 }}>{fmtDur(ageOf(t))}</div>
      {showOwner && <div className="w-8 h-8 rounded-full shrink-0 hidden lg:flex items-center justify-center text-xs font-semibold"
        style={{ background: C.lineSoft, color: C.ink2 }}>{initials(t.owner)}</div>}
      <ChevronRight size={14} className="shrink-0" style={{ color: C.ink3 }} />
    </button>
  );
}

function ListView({ tickets, filter, setFilter, scope, openTicket, go, preset }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("urgency");
  const [prio, setPrio] = useState(preset?.prio || "all");
  const [stage, setStage] = useState("all");
  const [slice, setSlice] = useState(preset?.slice || "all");
  const [kind, setKind] = useState(preset?.kind || "all");
  const [win, setWin] = useState(168);

  const tab = TABS.find((x) => x.key === filter) ? filter : "attention";
  const scoped = tickets.filter((t) => !isRouting(t) && (scope === "mine" ? t.owner === "Priya N" : true));
  const counts = Object.fromEntries(TABS.map((x) => [x.key, scoped.filter(x.key === "recent" ? (t) => t.lastAction <= win : x.test).length]));
  const prioTest = (t) => prio === "all" || (prio === "hot" ? PRIORITY[t.priority].rank <= 1 : t.priority === prio);

  const rows = scoped
    .filter(tab === "recent" ? (t) => t.lastAction <= win : TABS.find((x) => x.key === tab).test)
    .filter(tab === "attention" ? SLICES[slice].fn : () => true)
    .filter((t) => kind === "all" || t.kind === kind)
    .filter(prioTest)
    .filter((t) => stage === "all" || t.stage === stage)
    .filter((t) => q ? (t.client + t.id + t.type + t.insurer).toLowerCase().includes(q.toLowerCase()) : true)
    .sort(SORTS[tab === "recent" ? "touched" : sort].fn);

  const sel = { borderColor: C.line, color: C.ink2, background: C.white };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border flex-1 min-w-48" style={{ borderColor: C.line, background: C.white }}>
          <Search size={13} style={{ color: C.ink3 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client, ticket ID, insurer, type"
            className="text-sm outline-none flex-1 bg-transparent" style={{ color: C.ink }} />
        </div>
        <button onClick={() => go("create")} className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ background: C.teal, color: C.white }}><Plus size={14} /> Create ticket</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-4 border-b flex-1" style={{ borderColor: C.line }}>
          {TABS.map((x) => (
            <button key={x.key} onClick={() => setFilter(x.key)} className="pb-2 -mb-px border-b-2 text-sm"
              style={{ borderColor: tab === x.key ? C.teal : "transparent", color: tab === x.key ? C.teal : C.ink2, fontWeight: tab === x.key ? 600 : 400 }}>
              {x.label} <span className="font-mono text-xs" style={{ color: C.ink3 }}>{counts[x.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab === "recent" ? (
            <select value={win} onChange={(e) => setWin(+e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
              <option value={24}>Yesterday</option><option value={168}>Last week</option><option value={720}>Last month</option>
            </select>
          ) : (
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
              {Object.entries(SORTS).filter(([k]) => k !== "touched").map(([k, v]) => <option key={k} value={k}>Sort: {v.label}</option>)}
            </select>
          )}
          {tab === "attention" && (
            <select value={slice} onChange={(e) => setSlice(e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
              {Object.entries(SLICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
            <option value="all">All types</option>
            <option value="Financial">Financial</option>
            <option value="Non-Financial">Non-financial</option>
          </select>
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
            <option value="all">All priorities</option>
            <option value="hot">Critical &amp; High</option>
            {Object.keys(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="px-2 py-1 text-xs rounded border" style={sel}>
            <option value="all">All stages</option>
            {Object.entries(ALL_STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <section className="rounded-md border overflow-hidden" style={{ background: C.white, borderColor: C.line }}>
        <div className="px-3 py-2 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <HeadCell w="w-20">Priority</HeadCell>
          <HeadCell w="w-20">Ticket</HeadCell>
          <HeadCell w="w-24" hide="hidden md:block">Type</HeadCell>
          <div className="flex-1 text-xs font-semibold uppercase tracking-wider" style={{ color: C.ink3 }}>Client &amp; request</div>
          <HeadCell w="w-36" hide="hidden md:block">Stage</HeadCell>
          <HeadCell w="w-36" hide="hidden sm:block">Stage due</HeadCell>
          <HeadCell w="w-20" hide="hidden lg:block">Age</HeadCell>
          {scope === "team" && <HeadCell w="w-8" hide="hidden lg:block">Own</HeadCell>}
          <span className="w-3.5 shrink-0" />
        </div>
        {rows.length
          ? rows.map((t) => <TableRow key={t.id} t={t} onOpen={openTicket} showOwner={scope === "team"} />)
          : <Empty>No tickets match these filters.</Empty>}
      </section>

      <div className="text-xs px-1" style={{ color: C.ink3 }}>
        {rows.length} of {scoped.length} tickets{prio !== "all" || stage !== "all" || q ? " · filters applied" : ""}
      </div>
    </div>
  );
}

/* Document preview ------------------------------------------------ */
function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-3 py-2.5 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <FileText size={15} style={{ color: C.teal }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{doc.name}</div>
            <div className="font-mono text-xs truncate" style={{ color: C.ink3 }}>{doc.file} · {doc.size} · {doc.by}</div>
          </div>
          <button className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: C.tealSoft, color: C.teal }}><Download size={12} /> Download</button>
          <button onClick={onClose} className="p-1 rounded" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>
        <div className="p-6 max-h-96 overflow-y-auto" style={{ background: C.canvas }}>
          <div className="mx-auto rounded shadow-sm p-6" style={{ background: C.white, maxWidth: 460, minHeight: 300 }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.ink3 }}>{doc.kind}</div>
            <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>{doc.name}</div>
            {[100, 92, 96, 60, 88, 94, 70, 84, 40].map((w, i) => (
              <div key={i} className="h-2 rounded-sm mb-2" style={{ width: `${w}%`, background: i === 3 || i === 8 ? C.lineSoft : C.lineSoft, opacity: 0.9 }} />
            ))}
            <div className="mt-6 pt-3 border-t flex justify-between text-xs" style={{ borderColor: C.lineSoft, color: C.ink3 }}>
              <span>Preview placeholder</span><span className="font-mono">page 1 of 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const [text, setText] = useState(suggested);
  const [docs, setDocs] = useState(ctx.kind === "doc" || ctx.kind === "missing" ? [ctx.target] : []);
  const [extra, setExtra] = useState("");
  const catalogue = [...new Set([...(TYPES[t.type]?.docs || []), ...t.missing])];
  const toggle = (d) => setDocs((x) => x.includes(d) ? x.filter((y) => y !== d) : [...x, d]);
  const title = { field: "Query a captured detail", doc: "Query a shared document", missing: "Request a missing item", new: "Ask the client a question" }[ctx.kind];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <HelpCircle size={16} style={{ color: C.wait }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{title}</div>
            {ctx.target && <div className="text-xs truncate" style={{ color: C.ink3 }}>on “{ctx.target}”</div>}
          </div>
          <button onClick={onClose} className="p-1" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Question to the client</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder="What do you need from them?"
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border outline-none resize-none" style={{ borderColor: C.line, color: C.ink }} />
          </label>
          <div>
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Documents to request</span>
            <div className="mt-1.5 space-y-1">
              {catalogue.map((d) => (
                <button key={d} onClick={() => toggle(d)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded border text-sm text-left"
                  style={{ borderColor: docs.includes(d) ? C.teal : C.line, background: docs.includes(d) ? C.tealSoft : C.white, color: C.ink2 }}>
                  {docs.includes(d) ? <CheckCircle2 size={13} style={{ color: C.teal }} /> : <Paperclip size={13} style={{ color: C.ink3 }} />}
                  <span className="truncate">{d}</span>
                </button>
              ))}
              <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Other document — type to add"
                className="w-full px-2.5 py-1.5 text-sm rounded border outline-none" style={{ borderColor: C.line, color: C.ink }} />
            </div>
          </div>
          <div className="text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: C.waitSoft, color: C.wait }}>
            <PauseCircle size={12} className="shrink-0 mt-0.5" />
            The client is notified by email with a portal link and answers inside the portal, against this query. The stage clock holds until they respond, and the ticket stays visible under Awaiting client.
          </div>
        </div>
        <footer className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: C.line, background: C.canvas }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: C.ink2 }}>Cancel</button>
          <button disabled={!text.trim()} onClick={() => onSend({ ...ctx, text: text.trim(), docs: extra.trim() ? [...docs, extra.trim()] : docs })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: text.trim() ? C.teal : C.line, color: text.trim() ? C.white : C.ink3 }}>
            <Send size={13} /> Send to client
          </button>
        </footer>
      </div>
    </div>
  );
}


/* Logging receipt manually requires the copy itself — otherwise the stage moves
   forward with nothing to send the client. */
function UploadModal({ t, onConfirm, onClose }) {
  const [file, setFile] = useState("");
  const suggested = `endorsement_${t.policy.replace(/\//g, "_")}.pdf`;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <FileCheck2 size={16} style={{ color: C.teal }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>Upload endorsement copy</div>
            <div className="text-xs" style={{ color: C.ink3 }}>{t.policy} · {t.insurer}</div>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>
        <div className="p-4 space-y-3">
          <button onClick={() => setFile(suggested)}
            className="w-full flex items-center gap-2 px-3 py-6 rounded border-2 border-dashed text-sm justify-center"
            style={{ borderColor: file ? C.teal : C.line, color: file ? C.teal : C.ink3, background: file ? C.tealSoft : C.white }}>
            {file ? <><FileCheck2 size={15} /> {file}</> : <><Paperclip size={15} /> Choose the endorsement copy</>}
          </button>
          <div className="text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: C.tealSoft, color: C.teal }}>
            <Send size={12} className="shrink-0 mt-0.5" />
            On confirm the copy is attached to the ticket and queued for QC. Nothing is sent to the client until you send it.
          </div>
        </div>
        <footer className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: C.line, background: C.canvas }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: C.ink2 }}>Cancel</button>
          <button disabled={!file} onClick={() => onConfirm(file)} className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: file ? C.teal : C.line, color: file ? C.white : C.ink3 }}>Log receipt</button>
        </footer>
      </div>
    </div>
  );
}


/* Customer Withdrawn (M3 FR-036/037, BR-017) — terminal, and blocked until the
   customer's withdrawal email is on file. */
function WithdrawModal({ t, onConfirm, onClose }) {
  const [file, setFile] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <XCircle size={16} style={{ color: C.breach }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>Mark customer withdrawn</div>
            <div className="text-xs" style={{ color: C.ink3 }}>{t.id} · {t.client}</div>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Reason recorded on the ticket</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="What did the customer ask for?"
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border outline-none resize-none" style={{ borderColor: C.line, color: C.ink }} />
          </label>
          <button onClick={() => setFile(`withdrawal_request_${t.short}.eml`)}
            className="w-full flex items-center gap-2 px-3 py-5 rounded border-2 border-dashed text-sm justify-center"
            style={{ borderColor: file ? C.teal : C.line, color: file ? C.teal : C.ink3, background: file ? C.tealSoft : C.white }}>
            {file ? <><FileCheck2 size={15} /> {file}</> : <><Paperclip size={15} /> Upload the customer's withdrawal email</>}
          </button>
          <div className="text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: C.breachSoft, color: C.breach }}>
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            Terminal status. Insurer communication stops, the ticket becomes read-only and cannot be reopened.
          </div>
        </div>
        <footer className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: C.line, background: C.canvas }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: C.ink2 }}>Cancel</button>
          <button disabled={!file || !reason.trim()} onClick={() => onConfirm({ file, reason: reason.trim() })}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: file && reason.trim() ? C.breach : C.line, color: file && reason.trim() ? C.white : C.ink3 }}>
            Mark withdrawn
          </button>
        </footer>
      </div>
    </div>
  );
}

/* Reassignment (M2 FR-020/021, BR-008/010) — reason mandatory, SLA continues. */
function ReassignModal({ t, onConfirm, onClose }) {
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const targets = Object.keys(ROLES).filter((r) => r !== t.owner && ROLES[r].role === "Servicing executive").concat([ESCALATION.serviceHead]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <User size={16} style={{ color: C.wait }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>Reassign ticket</div>
            <div className="text-xs" style={{ color: C.ink3 }}>currently {t.owner}</div>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>New owner</span>
            <select value={to} onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              <option value="">Select…</option>
              {targets.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Reason (mandatory, audited)</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              <option value="">Select…</option>
              {["Out of office", "Urgent — owner unavailable", "Workload rebalancing", "Escalated to Service Head"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <div className="text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: C.canvas, color: C.ink2 }}>
            <Clock size={12} className="shrink-0 mt-0.5" /> The stage SLA continues from where it is — reassignment does not reset the clock.
          </div>
        </div>
        <footer className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: C.line, background: C.canvas }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: C.ink2 }}>Cancel</button>
          <button disabled={!to || !reason} onClick={() => onConfirm({ to, reason })} className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: to && reason ? C.teal : C.line, color: to && reason ? C.white : C.ink3 }}>Reassign</button>
        </footer>
      </div>
    </div>
  );
}


/* Eleven statuses do not fit on a strip. Group them into the five phases a
   person actually thinks in, show where the ticket is, and keep the full
   stage-by-stage detail one click away. */
const PHASES = [
  { label: "Intake", stages: ["New / Unassigned"] },
  { label: "Verification", stages: ["Under Verification"] },
  { label: "Insurer", stages: ["Submitted to Insurer", "Awaiting Quote"] },
  { label: "Payment", stages: ["Awaiting Payment Link", "Awaiting Payment"] },
  { label: "Delivery", stages: ["Awaiting Endorsement Copy", "Copy Received", "Closed"] },
];

function Journey({ t }) {
  const [open, setOpen] = useState(false);
  const seq = seqOf(t);
  const here = Math.max(0, posOf(t) >= 0 ? posOf(t) : posOf(t, t.priorStage || "Under Verification"));
  const phases = PHASES
    .map((p) => ({ ...p, stages: p.stages.filter((k) => seq.includes(k)) }))
    .filter((p) => p.stages.length);
  const legOf = (k) => t.legs.find((l) => l.s === k);
  const over = (k) => { const l = legOf(k), sg = stageOf(k); if (!l || sg.sla === null) return false;
    const cap = sg.unit === "BH" ? sg.sla * 2.7 : sg.unit === "WD" ? sg.sla * 24 : sg.unit === "CD" ? sg.sla : sg.sla / 60;
    return l.h > cap; };

  return (
    <div className="p-3">
      <div className="flex gap-1.5 mb-3">
        {phases.map((p) => {
          const idxs = p.stages.map((k) => seq.indexOf(k));
          const done = Math.max(...idxs) < here;
          const current = idxs.some((i) => i === here);
          const anyOver = p.stages.some(over);
          const fill = current ? ((here - Math.min(...idxs) + 1) / p.stages.length) * 100 : done ? 100 : 0;
          return (
            <div key={p.label} className="flex-1 min-w-0">
              <div className="h-1.5 rounded-sm overflow-hidden mb-1.5" style={{ background: C.lineSoft }}>
                <div className="h-full rounded-sm" style={{ width: `${fill}%`, background: anyOver ? C.breach : current ? C.ink : C.teal }} />
              </div>
              <div className="flex items-center gap-1 text-xs truncate"
                style={{ color: current ? C.ink : done ? C.teal : C.ink3, fontWeight: current ? 600 : 400 }}>
                {done && <CheckCircle2 size={10} />}{current && <CircleDot size={10} />}
                <span className="truncate">{p.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs uppercase tracking-wider" style={{ color: C.ink3 }}>Now</span>
        <span className="text-sm font-semibold" style={{ color: C.ink }}>{statusOf(t).label}</span>
        <span className="text-xs" style={{ color: C.ink3 }}>
          · step {here + 1} of {seq.length} · {stageOf(t.stage).owner || "—"} owns the next move
        </span>
        <button onClick={() => setOpen(!open)} className="ml-auto text-xs flex items-center gap-1" style={{ color: C.link }}>
          {open ? "Hide" : "All"} stages
          <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none" }} />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: C.lineSoft }}>
          <div className="flex items-center gap-2.5 pb-1.5 mb-1 border-b text-xs uppercase tracking-wider" style={{ borderColor: C.lineSoft, color: C.ink3 }}>
            <span className="w-4 shrink-0" />
            <span className="flex-1">Stage</span>
            <span className="w-20 text-right shrink-0">Owner</span>
            <span className="w-16 text-right shrink-0">Allowed</span>
            <span className="w-20 text-right shrink-0">Taken</span>
          </div>
          {seq.map((k, i) => {
            const sg = stageOf(k), leg = legOf(k), done = i < here, current = i === here;
            return (
              <div key={k} className="flex items-center gap-2.5 py-1">
                <span className="w-4 flex justify-center shrink-0">
                  {done ? (over(k) ? <AlertTriangle size={12} style={{ color: C.breach }} /> : <CheckCircle2 size={12} style={{ color: C.teal }} />)
                    : current ? <CircleDot size={12} style={{ color: C.ink }} />
                    : <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.line }} />}
                </span>
                <span className="text-sm flex-1 truncate" style={{ color: current ? C.ink : done ? C.ink2 : C.ink3, fontWeight: current ? 600 : 400 }}>
                  {sg.label}
                </span>
                <span className="w-20 text-right text-xs shrink-0 whitespace-nowrap" style={{ color: C.ink3 }}>{sg.owner || "—"}</span>
                <span className="w-16 text-right font-mono text-xs shrink-0 whitespace-nowrap" style={{ color: C.ink3 }}>
                  {sg.sla !== null ? unitLabel(sg.sla, sg.unit) : "—"}
                </span>
                <span className="w-20 text-right font-mono text-xs shrink-0 whitespace-nowrap"
                  style={{ color: over(k) ? C.breach : current ? C.ink : C.ink2 }}>
                  {leg ? fmtPlain(leg.h) : current ? `${fmtPlain(t.inStage)} so far` : "—"}
                </span>
              </div>
            );
          })}
          <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: C.lineSoft, color: C.ink3 }}>
            Allowed is the time permitted for that stage. Taken is how long it actually took. A dash means the ticket has not reached that stage.
          </div>
        </div>
      )}
    </div>
  );
}


/* Update quote — the SM edits premium and replaces the quote copy. Every
   update is stored as a new version; nothing is overwritten in place. */
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

  const field = (label, value, onChange, prefix) => (
    <label className="block">
      <span className="text-xs font-medium" style={{ color: C.ink2 }}>{label}</span>
      <div className="mt-1 flex items-center rounded border overflow-hidden" style={{ borderColor: C.line }}>
        <span className="px-2 text-sm" style={{ color: C.ink3 }}>{prefix}</span>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          className="flex-1 px-1 py-2 text-sm font-mono outline-none" style={{ color: C.ink }} />
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,26,31,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-md overflow-hidden" style={{ background: C.white }} onClick={(e) => e.stopPropagation()}>
        <header className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
          <RotateCcw size={16} style={{ color: C.wait }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>Update quote</div>
            <div className="text-xs" style={{ color: C.ink3 }}>current v{q.version} · {money(q.total)} · {t.policy}</div>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: C.ink2 }}><X size={16} /></button>
        </header>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("Base premium", base, setBaseAnd, "₹")}
            {field("GST", gst, (v) => { setGstTouched(true); setGst(v); }, "₹")}
          </div>
          <div className="flex items-baseline justify-between px-2.5 py-2 rounded" style={{ background: C.canvas }}>
            <span className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>Revised total payable</span>
            <span className="font-mono text-lg font-semibold" style={{ color: C.ink }}>{money(b + g)}</span>
          </div>

          <button onClick={() => setFile(`quote_${t.policy.replace(/\//g, "_")}_v${q.version + 1}.pdf`)}
            className="w-full flex items-center gap-2 px-3 py-4 rounded border-2 border-dashed text-sm justify-center"
            style={{ borderColor: file ? C.teal : C.line, color: file ? C.teal : C.ink3, background: file ? C.tealSoft : C.white }}>
            {file ? <><FileCheck2 size={15} /> {file}</> : <><Paperclip size={15} /> Replace the quote copy (optional)</>}
          </button>

          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Reason for the update</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why is the quote being updated?"
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border outline-none" style={{ borderColor: C.line, color: C.ink }} />
          </label>

          <div className="text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: C.canvas, color: C.ink2 }}>
            <Layers size={12} className="shrink-0 mt-0.5" />
            Saved as v{q.version + 1}. The previous version is kept and remains viewable.
          </div>
        </div>

        <footer className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: C.line, background: C.canvas }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: C.ink2 }}>Cancel</button>
          <button disabled={!ready} onClick={() => onConfirm({ base: b, gst: g, file: file || q.file, reason: reason.trim() })}
            className="px-3 py-1.5 rounded text-sm font-medium" style={{ background: ready ? C.teal : C.line, color: ready ? C.white : C.ink3 }}>
            Save v{q.version + 1}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* Detail with tabs ------------------------------------------------ */
function Detail({ t, scope, onAdvance, onAttachCopy, onChase, onQuery, onAnswer, onSendCopy, onWithdraw, onReassign, onManualReview, onChangeType, onRemind, onQc, onReceiveLink, onUpdateQuote, onRegenerate, onRevertPayment, back }) {
  const [tab, setTab] = useState("overview");
  const [ask, setAsk] = useState(null);
  const [upload, setUpload] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [editType, setEditType] = useState(false);
  const [summary, setSummary] = useState(null);
  const [updatingQuote, setUpdatingQuote] = useState(false);
  const [note, setNote] = useState("");
  const [openMail, setOpenMail] = useState(0);
  const [preview, setPreview] = useState(null);
  const idx = posOf(t);
  const st = stageOf(t.stage);
  const s = clock(t);
  const docs = useMemo(() => docsOf(t), [t]);
  const intake = useMemo(() => intakeOf(t), [t]);
  const queries = t.queries || [];
  const endo = endoOf(t);
  const sends = sendsOf(t);
  const qcDone = !!t.qcPassed;
  const openQ = queries.filter((q) => q.status === "open");
  const canAsk = t.stage === "Under Verification" && !readOnly(t);
  const rem = remindersOf(t);
  const cycles = queries.length;
  const canEditType = !atOrPast(t, "Submitted to Insurer") && !readOnly(t);
  const payLeft = t.payLink ? t.payLink.expiresIn - (t.stage === "Awaiting Payment" ? t.inStage : 0) : 0;
  const payExpired = !!t.payLink && payLeft <= 0;
  const thread = useMemo(() => mailOf(t), [t]);
  const pendingDocs = docs.filter((d) => d.status === "Awaiting").length;
  const pendingAll = pendingDocs + fieldGaps(t);

  const TABS = [["overview", "Overview", CircleDot], ["docs", `Documents (${docs.length})`, FileText], ["queries", `Queries (${queries.length})`, MessageCircleQuestion], ["mail", `Mail trail (${thread.length})`, Mail], ...(t.kind === "Financial" ? [["payment", "Premium & payment", IndianRupee]] : []),
    ["activity", "Activity", Clock], ["manage", "Manage", SlidersHorizontal]];

  return (
    <div className="space-y-3">
      <button onClick={back} className="flex items-center gap-1 text-sm" style={{ color: C.ink2 }}><ArrowLeft size={14} /> Back</button>

      <div className="rounded-md border p-4" style={{ background: C.white, borderColor: C.line }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm" style={{ color: C.ink3 }}>{t.id}</span>
              <Chip color={PRIORITY[t.priority].color} bg={PRIORITY[t.priority].bg}>{t.priority}</Chip>
              <Chip color={statusOf(t).tone} bg={statusOf(t).bg}>{statusOf(t).label}</Chip>
              <Chip color={t.kind === "Financial" ? C.warn : C.ink2} bg={t.kind === "Financial" ? C.warnSoft : C.lineSoft}>
                {t.kind === "Financial" ? <IndianRupee size={10} /> : null}{t.kind}
              </Chip>
              {t.quote && atOrPast(t, "Awaiting Payment") && <Chip color={C.ink} bg={C.lineSoft} mono>{money(t.quote.total)}</Chip>}
              {cycles > 0 && <Chip color={C.wait} bg={C.waitSoft}><MessageCircleQuestion size={10} /> {cycles} clarification cycle{cycles > 1 ? "s" : ""}</Chip>}
              <Chip mono>age {fmtDur(ageOf(t))}</Chip>
            </div>
            <div className="flex items-center gap-2">
              {editType
                ? <select autoFocus value={t.type} onChange={(e) => { onChangeType(t.id, e.target.value); setEditType(false); }}
                    onBlur={() => setEditType(false)} className="px-2 py-1 text-base rounded border bg-white" style={{ borderColor: C.teal, color: C.ink }}>
                    {(PRODUCTS[t.product] || Object.keys(TYPES)).map((x) => <option key={x}>{x}</option>)}
                  </select>
                : <h2 className="text-lg font-semibold" style={{ color: C.ink }}>{t.type}</h2>}
              {canEditType && !editType && (
                <button onClick={() => setEditType(true)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: C.lineSoft, color: C.link }}
                  title="Classification can only be corrected before the request goes to the insurer (BR-058)">Correct type</button>
              )}
            </div>
            <div className="text-sm mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: C.ink2 }}>
              <span className="flex items-center gap-1"><Building2 size={12} /> {t.client}</span>
              <span className="flex items-center gap-1 font-mono text-xs"><FileText size={12} /> {t.policy}</span>
              <span className="flex items-center gap-1"><Layers size={12} /> {t.product}</span>
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> {t.insurer}</span>
              {scope === "team" && <span className="flex items-center gap-1"><User size={12} /> {t.owner}</span>}
            </div>
          </div>
          <div className="w-full sm:w-64 rounded p-2.5" style={{ background: C.canvas }}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.ink3 }}>{stageOf(t.stage).label}</span>
              {st.sla && <span className="text-xs" style={{ color: C.ink3 }}>{unitLabel(st.sla, st.unit)} allowed</span>}
            </div>
            <SlaBar t={t} />
            {st.sla && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: C.ink2 }}>
                <Clock size={11} style={{ color: C.ink3 }} />
                {s.state === "breached" ? "was due " : "due "}{fmtWhen(s.due)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: C.line }}>
        {TABS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className="flex items-center gap-1.5 px-3 py-2 text-sm -mb-px border-b-2"
            style={{ borderColor: tab === k ? C.teal : "transparent", color: tab === k ? C.teal : C.ink2, fontWeight: tab === k ? 600 : 400 }}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <Panel title="Workflow"
            hint={`${seqOf(t).length} statuses for a ${(t.kind || "Non-Financial").toLowerCase()} endorsement. The chip icon marks system steps, the pause icon insurer time.`}>
            <Journey t={t} />
          </Panel>
          <Panel title="Captured at intake" count={intake.length}
            hint={`Mandatory fields for ${t.type}, with what the client supplied.`}
            action={fieldGaps(t) > 0
              ? <Chip color={C.warn} bg={C.warnSoft}><FileClock size={10} /> {fieldGaps(t)} not captured</Chip>
              : <Chip color={C.teal} bg={C.tealSoft}><CheckCircle2 size={10} /> complete</Chip>}>
            <dl className="p-3 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {intake.map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide mb-0.5" style={{ color: C.ink3 }}>{f.label}</dt>
                  {f.value === null
                    ? <dd className="flex items-center gap-1.5 text-sm" style={{ color: C.warn }}>
                        <FileClock size={12} /> Not captured
                        {canAsk && <button onClick={() => setAsk({ kind: "missing", target: f.label })}
                          className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: C.warnSoft, color: C.warn }}>Request</button>}
                      </dd>
                    : <dd className="flex items-start gap-1.5 text-sm" style={{ color: C.ink }}>
                        <CheckCircle2 size={12} style={{ color: C.teal }} className="shrink-0 mt-0.5" />
                        <span className="flex-1">{f.value}</span>
                        {canAsk && <button onClick={() => setAsk({ kind: "field", target: f.label })}
                          className="text-xs shrink-0" style={{ color: C.link }}>Query</button>}
                      </dd>}
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      )}

      {tab === "overview" && endo && (
        <Panel title="Endorsement copy"
          hint={qcDone
            ? "Approved at QC and mailed to the client automatically. Use Send to customer only if they ask for it again."
            : `${endo.source === "bot" ? `Fetched from ${t.insurer}'s mail by the bot` : `Uploaded by ${endo.by}`} — approve at QC to send it and close the ticket.`}
          action={<Chip color={qcDone ? C.teal : C.warn} bg={qcDone ? C.tealSoft : C.warnSoft}>
            {qcDone ? <><CheckCircle2 size={10} /> QC passed</> : <><FileClock size={10} /> awaiting QC</>}
          </Chip>}>
          <div className="p-3 flex flex-wrap items-center gap-3">
            <span className="p-2 rounded shrink-0" style={{ background: C.tealSoft }}><FileCheck2 size={18} style={{ color: C.teal }} /></span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{endo.file}</div>
              <div className="text-xs" style={{ color: C.ink3 }}>
                {endo.size} · {endo.source === "bot" ? "fetched by bot" : "uploaded manually"} · {fmtAgo(endo.at)}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setPreview({ name: "Endorsement copy", kind: endo.source === "bot" ? "Fetched by bot" : "Uploaded manually", file: endo.file, size: endo.size, by: endo.by, status: "Verified", at: endo.at })}
                className="px-2.5 py-1.5 rounded text-sm font-medium" style={{ background: C.tealSoft, color: C.teal }}>View</button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium border"
                style={{ borderColor: C.line, color: C.ink2 }}><Download size={13} /> Download</button>
              <button disabled={!!t.terminal} onClick={() => onSendCopy(t.id)}
                title="Re-sends the copy — the client already received it automatically on QC approval"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium"
                style={{ background: t.terminal ? C.line : C.teal, color: t.terminal ? C.ink3 : C.white }}>
                <Send size={13} /> Send to customer</button>
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.ink3 }}>Sent to client</div>
            {sends.map((x, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-sm" style={{ color: C.ink2 }}>
                {i === 0 ? <Send size={12} style={{ color: C.teal }} /> : <CornerUpLeft size={12} style={{ color: C.wait }} />}
                {i === 0 ? (x.mode === "auto" ? "Mailed automatically on QC approval" : `Sent by ${x.by}`) : `Resent by ${x.by}`}
                <span className="text-xs" style={{ color: C.ink3 }}>· {fmtAgo(x.at)}</span>
              </div>
            ))}
            {!sends.length && (
              <div className="text-sm flex items-center gap-1.5" style={{ color: C.ink3 }}>
                <FileClock size={12} /> Not sent yet — the client is mailed automatically on QC approval.
              </div>
            )}
          </div>
        </Panel>
      )}

      {tab === "docs" && (
        <Panel title="Documents" count={docs.length}
          hint="Mandatory list comes from the endorsement type. Anything Awaiting blocks submission to the insurer."
          action={<button className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: C.tealSoft, color: C.teal }}><Plus size={12} /> Upload</button>}>
          {docs.map((d, i) => {
            const tone = d.status === "Awaiting" ? [C.warn, C.warnSoft] : d.status === "Verified" ? [C.teal, C.tealSoft] : [C.ink2, C.lineSoft];
            return (
              <div key={i} className="px-3 py-2.5 border-b flex items-center gap-3" style={{ borderColor: C.lineSoft }}>
                {d.status === "Awaiting" ? <FileClock size={16} style={{ color: C.warn }} className="shrink-0" /> : <FileCheck2 size={16} style={{ color: C.teal }} className="shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: C.ink }}>{d.name}</div>
                  <div className="font-mono text-xs truncate" style={{ color: C.ink3 }}>
                    {d.status === "Awaiting" ? "not received" : `${d.file} · ${d.size} · ${d.by} · ${fmtAgo(d.at)}`}
                  </div>
                </div>
                <Chip color={tone[0]} bg={tone[1]}>{d.status}</Chip>
                <Chip>{d.kind}</Chip>
                {canAsk && <button onClick={() => setAsk({ kind: d.status === "Awaiting" ? "missing" : "doc", target: d.name })}
                  className="text-xs font-medium px-2 py-1 rounded shrink-0"
                  style={{ background: C.waitSoft, color: C.wait }}>{d.status === "Awaiting" ? "Request" : "Query"}</button>}
                <button disabled={d.status === "Awaiting"} onClick={() => setPreview(d)}
                  className="text-xs font-medium px-2 py-1 rounded shrink-0"
                  style={{ background: d.status === "Awaiting" ? C.lineSoft : C.tealSoft, color: d.status === "Awaiting" ? C.ink3 : C.teal }}>View</button>
              </div>
            );
          })}
          {!docs.length && <Empty>No documents on this ticket.</Empty>}
        </Panel>
      )}

      {tab === "queries" && (
        <Panel title="Queries with the client" count={queries.length}
          hint="Each open query holds the stage clock. Clients answer in the portal against the query itself, so a response can never land on the wrong one."
          action={canAsk
            ? <button onClick={() => setAsk({ kind: "new", target: null })} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                style={{ background: C.teal, color: C.white }}><Plus size={12} /> Ask a question</button>
            : <span className="text-xs" style={{ color: C.ink3 }}>Available at In review</span>}>
          {queries.length ? queries.map((q) => (
            <div key={q.id} className="px-3 py-3 border-b" style={{ borderColor: C.lineSoft }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Chip color={q.status === "open" ? C.wait : C.teal} bg={q.status === "open" ? C.waitSoft : C.tealSoft}>
                      {q.status === "open" ? "Awaiting client" : "Answered"}
                    </Chip>
                    <Chip>{{ field: "On a captured detail", doc: "On a shared document", missing: "Missing item", new: "New question" }[q.kind]}</Chip>
                    {q.target && <span className="text-xs truncate" style={{ color: C.ink3 }}>{q.target}</span>}
                  </div>
                  <div className="text-sm" style={{ color: C.ink }}>{q.text}</div>
                  {q.docs?.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {q.docs.map((d) => <Chip key={d} color={C.ink2}><Paperclip size={10} /> {d}</Chip>)}
                    </div>
                  )}
                  <div className="text-xs mt-1.5" style={{ color: C.ink3 }}>
                    {q.by} · asked {fmtAgo(q.at)}{q.status === "answered" ? ` · answered ${fmtAgo(q.answeredAt)}` : ""}
                  </div>
                </div>
                {q.status === "open" && (
                  <button onClick={() => onAnswer(t.id, q.id)} className="px-2.5 py-1.5 rounded text-xs font-medium shrink-0 border"
                    style={{ borderColor: C.line, color: C.ink2, background: C.white }}
                    title="Demo control — client answers this query in the portal">▶ Simulate portal response</button>
                )}
              </div>

              {q.reply && (
                <div className="mt-3 ml-1 pl-3 border-l-2" style={{ borderColor: C.teal }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Globe size={12} style={{ color: C.teal }} />
                    <span className="text-sm font-medium" style={{ color: C.ink }}>Client portal response</span>
                    <span className="text-xs" style={{ color: C.ink3 }}>{q.reply.by} · {fmtAgo(q.reply.at)}</span>
                    <Chip color={C.teal} bg={C.tealSoft}><Link2 size={10} /> submitted against {q.id}</Chip>
                  </div>

                  {Object.entries(q.reply.values || {}).map(([k, v]) => (
                    <div key={k} className="mb-2">
                      <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>{k}</div>
                      <div className="text-sm" style={{ color: C.ink }}>{v}</div>
                    </div>
                  ))}
                  {q.reply.note && <div className="text-sm mb-2 p-2.5 rounded" style={{ background: C.canvas, color: C.ink }}>{q.reply.note}</div>}

                  {q.reply.files?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {q.reply.files.map((f) => (
                        <button key={f.name} onClick={() => setPreview({ name: f.name, kind: "Client portal upload", file: f.file, size: f.size, by: q.reply.by, status: "Received", at: q.reply.at })}
                          className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs" style={{ borderColor: C.line, color: C.ink2 }}>
                          <Paperclip size={10} style={{ color: C.teal }} /> {f.file}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )) : <Empty>No queries raised. The client has given us everything we asked for.</Empty>}
        </Panel>
      )}

      {tab === "mail" && (
        <Panel title="Mail trail" count={thread.length}
          hint={`Email only — BimaKavach and ${t.insurer}, plus portal notifications to the client. Client responses live under Queries.`}
          action={
            <div className="flex gap-1.5">
              <button onClick={() => setSummary(summary ? null : summariseThread(t))}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: C.waitSoft, color: C.wait }}>
                <Sparkles size={12} /> {summary ? "Hide summary" : "Summarise email"}
              </button>
              {!readOnly(t) && (
                <button onClick={() => onChase(t.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: C.teal, color: C.white }}>
                  <CornerUpLeft size={12} /> Chase insurer
                </button>
              )}
            </div>
          }>
          {summary && (
            <div className="px-3 py-3 border-b" style={{ borderColor: C.line, background: C.canvas }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={12} style={{ color: C.wait }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.ink3 }}>Bot summary of the thread</span>
              </div>
              <ul className="space-y-1">
                {summary.map((l, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: C.ink }}>
                    <span style={{ color: C.ink3 }}>·</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {thread.map((m, i) => {
            const isOut = m.dir === "out";
            const expanded = openMail === i;
            return (
              <div key={i} className="border-b" style={{ borderColor: C.lineSoft }}>
                <button onClick={() => setOpenMail(expanded ? -1 : i)} className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50">
                  <span className="mt-0.5 p-1 rounded shrink-0" style={{ background: isOut ? C.tealSoft : C.waitSoft }}>
                    {isOut ? <Send size={11} style={{ color: C.teal }} /> : <Mail size={11} style={{ color: C.wait }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: C.ink }}>{m.name}</span>
                      <span className="text-xs" style={{ color: C.ink3 }}>{isOut ? `to ${m.to}` : m.who}</span>
                      {m.link === "manual" && <Chip color={C.wait} bg={C.waitSoft}><Link2 size={10} /> linked manually</Chip>}
                      {m.queryRef && <Chip color={C.wait} bg={C.waitSoft}><Globe size={10} /> portal link · {m.queryRef}</Chip>}
                    </div>
                    <div className="text-sm truncate" style={{ color: C.ink2 }}>{m.subject}</div>
                    {!expanded && <div className="text-xs truncate mt-0.5" style={{ color: C.ink3 }}>{m.body.split("\n")[2] || m.body.split("\n")[0]}</div>}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="font-mono text-xs" style={{ color: C.ink3 }}>{fmtAgo(m.at)}</span>
                    {m.att > 0 && <span className="flex items-center gap-0.5 text-xs" style={{ color: C.ink3 }}><Paperclip size={10} />{m.att}</span>}
                  </div>
                  <ChevronDown size={14} className="shrink-0 mt-1" style={{ color: C.ink3, transform: expanded ? "rotate(180deg)" : "none" }} />
                </button>
                {expanded && (
                  <div className="px-3 pb-3 pl-11">
                    <div className="text-sm whitespace-pre-line p-3 rounded" style={{ background: C.canvas, color: C.ink }}>{m.body}</div>
                    {m.att > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {docs.slice(0, m.att).map((d, j) => (
                          <button key={j} onClick={() => setPreview(d)} className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs" style={{ borderColor: C.line, color: C.ink2 }}>
                            <Paperclip size={11} style={{ color: C.ink3 }} /> {d.file}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Panel>
      )}

      {tab === "payment" && (
        <div className="space-y-3">
          {/* M5 — quote and premium */}
          <Panel title="Quote &amp; premium"
            hint={t.quote
              ? (t.quote.source === "bot"
                  ? `Version ${t.quote.version} · extracted by the mail bot at ${Math.round(t.quote.confidence * 100)}% confidence.`
                  : `Version ${t.quote.version} · updated by ${t.quote.by}.`)
              : "Nothing received from the insurer yet."}
            action={t.quote && <Chip color={C.teal} bg={C.tealSoft}><FileCheck2 size={10} /> {t.quote.file}</Chip>}>
            {t.quote ? (
              <div className="p-3">
                <div className="grid sm:grid-cols-4 gap-3 mb-3">
                  {[["Base premium", money(t.quote.base)], ["GST @ 18%", money(t.quote.gst)],
                    ["Total payable", money(t.quote.total)], ["Quote version", `v${t.quote.version}`]].map(([k, v], i) => (
                    <div key={k}>
                      <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>{k}</div>
                      <div className={`mt-0.5 font-mono ${i === 2 ? "text-lg font-semibold" : "text-sm"}`} style={{ color: i === 2 ? C.ink : C.ink2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setPreview({ name: "Insurer quote", kind: "Insurer issued", file: t.quote.file, size: "184 KB", by: t.insurer, status: "Verified", at: t.quote.at })}
                    className="px-2.5 py-1.5 rounded text-sm font-medium" style={{ background: C.tealSoft, color: C.teal }}>View quote</button>
                  {!readOnly(t) && !atOrPast(t, "Awaiting Endorsement Copy") && (
                    <button onClick={() => setUpdatingQuote(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium border"
                      style={{ borderColor: C.line, color: C.ink2 }}><RotateCcw size={13} /> Update quote</button>
                  )}
                </div>
                {(t.quoteVersions || []).length > 1 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: C.lineSoft }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.ink3 }}>Version history</div>
                    {[...t.quoteVersions].reverse().map((v) => (
                      <div key={v.version} className="flex items-center gap-2 py-1 text-sm">
                        <span className="font-mono text-xs w-8 shrink-0" style={{ color: C.ink3 }}>v{v.version}</span>
                        <span className="font-mono" style={{ color: v.version === t.quote.version ? C.ink : C.ink3 }}>{money(v.total)}</span>
                        <span className="text-xs" style={{ color: C.ink3 }}>
                          {v.source === "bot" ? "mail bot" : `updated by ${v.by}`} · {fmtAgo(Math.max(v.at, 0.02))}
                        </span>
                        <button onClick={() => setPreview({ name: `Quote v${v.version}`, kind: "Insurer issued", file: v.file, size: "184 KB", by: t.insurer, status: "Verified", at: v.at })}
                          className="ml-auto text-xs shrink-0" style={{ color: C.link }}>View</button>
                      </div>
                    ))}
                  </div>
                )}
                {!atOrPast(t, "Awaiting Payment") && (
                  <div className="mt-3 text-xs flex items-start gap-1.5 px-2 py-1.5 rounded" style={{ background: C.warnSoft, color: C.warn }}>
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    Premium is withheld from the customer until the payment link is ready (BR-026, FR-061).
                  </div>
                )}
              </div>
            ) : <Empty>Waiting on the insurer's quote.</Empty>}
          </Panel>

          {/* M6 — payment link */}
          {t.quote && (
            <Panel title="Payment link" hint={`${t.payMode} flow for ${t.insurer} — configured per insurer (BR-030).`}
              action={t.payLink
                ? <Chip color={payExpired ? C.breach : C.teal} bg={payExpired ? C.breachSoft : C.tealSoft}>
                    {payExpired ? "expired" : `expires in ${fmtPlain(payLeft)}`}
                  </Chip>
                : <Chip color={C.warn} bg={C.warnSoft}><Clock size={10} /> being generated</Chip>}>
              <div className="p-3">
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>Mode</div>
                    <div className="text-sm mt-0.5 flex items-center gap-1" style={{ color: C.ink }}>
                      {t.payMode === "Portal" ? <Globe size={12} style={{ color: C.wait }} /> : <Mail size={12} style={{ color: C.wait }} />}
                      Payment link via {(t.payMode || "email").toLowerCase()}
                    </div>
                  </div>
                  {t.childTicket && (
                    <div>
                      <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>Operations child ticket</div>
                      <div className="font-mono text-sm mt-0.5" style={{ color: C.link }}>{t.childTicket}</div>
                      <div className="text-xs" style={{ color: t.payLink ? C.teal : C.warn }}>
                        {t.payLink ? "closed — link uploaded" : "open with Operations"}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>Link reference</div>
                    <div className="font-mono text-sm mt-0.5" style={{ color: t.payLink ? C.ink : C.ink3 }}>{t.payLink ? t.payLink.ref : "not yet received"}</div>
                    {t.payLink && (
                      <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: C.ink3 }}>
                        {t.payLink.source === "child-ticket" ? <Globe size={10} /> : <Sparkles size={10} />}
                        {t.payLink.source === "child-ticket"
                          ? `auto-attached from ${t.childTicket}`
                          : `auto-filled by bot${t.payLink.confidence ? ` · ${Math.round(t.payLink.confidence * 100)}%` : ""}`}
                      </div>
                    )}
                  </div>
                </div>

                {t.payLink && (
                  <>
                    {(t.payLink.regens || []).map((r, i) => (
                      <div key={i} className="text-xs flex items-center gap-1.5 py-0.5" style={{ color: C.ink3 }}>
                        <RotateCcw size={11} /> Regenerated {fmtAgo(r.at)} by {r.by} — {r.reason}
                      </div>
                    ))}
                    {!readOnly(t) && !atOrPast(t, "Awaiting Endorsement Copy") && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button onClick={() => onRegenerate(t.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium"
                          style={{ background: payExpired ? C.breach : C.lineSoft, color: payExpired ? C.white : C.ink2 }}>
                          <RotateCcw size={13} /> Regenerate payment link
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-3 pt-3 border-t" style={{ borderColor: C.lineSoft }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.ink3 }}>NEFT alternative shown to the customer</div>
                  <div className="grid sm:grid-cols-4 gap-2 text-xs" style={{ color: C.ink2 }}>
                    {Object.entries(NEFT(t)).map(([k, v]) => (
                      <div key={k}><span style={{ color: C.ink3 }}>{k}: </span><span className="font-mono">{v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {t.stage === "Awaiting Payment Link" && (
            <Panel title="Awaiting the link" hint="No manual entry — the link attaches itself and goes out to the customer the moment it lands.">
              <div className="p-3">
                <div className="flex items-start gap-3 mb-3">
                  <span className="p-2 rounded shrink-0" style={{ background: C.waitSoft }}>
                    {t.payMode === "Portal" ? <Globe size={16} style={{ color: C.wait }} /> : <Mail size={16} style={{ color: C.wait }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: C.ink }}>
                      {t.payMode === "Portal"
                        ? `Operations to upload the link on ${t.childTicket}`
                        : `Bot watching ${t.insurerMail} for the link`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: C.ink3 }}>
                      {t.payMode === "Portal"
                        ? "Uploading it on the child ticket auto-attaches it here and closes the child."
                        : "The bot extracts the link from the insurer's reply and auto-fills it here."}
                    </div>
                  </div>
                </div>
                {!readOnly(t) && (
                  <button onClick={() => onReceiveLink(t.id)} className="px-3 py-1.5 rounded text-sm font-medium border"
                    style={{ borderColor: C.line, color: C.ink2, background: C.white }}
                    title="Demo control — simulates the link arriving from its configured source">
                    ▶ Simulate {t.payMode === "Portal" ? "Operations upload" : "bot fetch from insurer mail"}
                  </button>
                )}
              </div>
            </Panel>
          )}

          {/* M6 FR-075 / FR-157 — proof and the revert path */}
          {t.payment && (
            <Panel title="Payment received" hint="Uploaded by the customer in BimaKendra and emailed to the insurer for verification."
              action={!readOnly(t) && <button onClick={() => onRevertPayment(t.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                style={{ background: C.warnSoft, color: C.warn }}><RotateCcw size={12} /> Revert to payment pending</button>}>
              <div className="p-3 grid sm:grid-cols-4 gap-3">
                {[["Mode", t.payment.mode], ["Transaction / UTR", t.payment.utr], ["Payment date", t.payment.date], ["Amount", money(t.quote.total)]].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: C.ink3 }}>{k}</div>
                    <div className="font-mono text-sm mt-0.5" style={{ color: C.ink }}>{v}</div>
                  </div>
                ))}
                <div className="sm:col-span-4">
                  <button onClick={() => setPreview({ name: "Payment proof", kind: "Customer upload", file: t.payment.file, size: "96 KB", by: t.client, status: "Received", at: t.payment.at })}
                    className="px-2.5 py-1.5 rounded text-sm font-medium" style={{ background: C.tealSoft, color: C.teal }}>View proof</button>
                </div>
              </div>
            </Panel>
          )}
        </div>
      )}

      {tab === "activity" && (
        <Panel title="Activity" hint="Every state change, with who and how long.">
          <div className="p-3">
            {(t.history || []).slice().reverse().map((h, i) => (
              <div key={i} className="flex gap-2 pb-3 last:pb-0">
                <div className="flex flex-col items-center pt-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? C.teal : C.line }} />
                  {i < t.history.length - 1 && <span className="w-px flex-1 mt-1" style={{ background: C.lineSoft }} />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="text-sm" style={{ color: C.ink }}>{h.text}</div>
                  <div className="text-xs" style={{ color: C.ink3 }}>{h.by} · {fmtAgo(h.at)}</div>
                  {h.note && <div className="text-xs mt-1 px-2 py-1 rounded" style={{ background: C.canvas, color: C.ink2 }}>{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {readOnly(t) && (
        <div className="rounded-md border p-3 flex items-center gap-2 text-sm"
          style={{ background: t.terminal ? C.lineSoft : C.tealSoft, borderColor: C.line, color: t.terminal ? C.ink2 : C.teal }}>
          {t.terminal ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          {t.terminal
            ? `${TERMINAL[t.terminal].label} — terminal status. This ticket is read-only and cannot be reopened.`
            : `Closed in ${fmtDur(ageOf(t))} — read-only and cannot be reopened.`}
        </div>
      )}

      {tab === "manage" && (
        <div className="space-y-3">
        {!readOnly(t) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: User, label: "Reassign", sub: "SLA continues, reason audited", tone: C.ink, bg: C.white, border: C.line, onClick: () => setReassigning(true) },
              { icon: UserMinus, label: "Customer withdrawn", sub: "Terminal — needs withdrawal email", tone: C.breach, bg: C.white, border: C.line, onClick: () => setWithdrawing(true) },
            ].map((a) => (
              <button key={a.label} onClick={a.onClick}
                className="text-left p-3 rounded-md border-2 hover:border-slate-400 transition-colors"
                style={{ background: a.bg, borderColor: a.border }}>
                <div className="flex items-center gap-2 mb-1">
                  <a.icon size={16} style={{ color: a.tone }} />
                  <span className="text-sm font-semibold" style={{ color: a.tone }}>{a.label}</span>
                </div>
                <div className="text-xs" style={{ color: C.ink3 }}>{a.sub}</div>
              </button>
            ))}
          </div>
        )}

        {t.manualReview && (
          <div className="rounded-md border p-3 flex flex-wrap items-center gap-3 text-sm" style={{ background: C.waitSoft, borderColor: C.line, color: C.wait }}>
            <RefreshCw size={14} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div>Raised by the email bot — {t.manualReview.reason}</div>
              <div className="text-xs mt-0.5" style={{ color: C.ink3 }}>Returns to “{t.manualReview.priorStatus}” once resolved.</div>
            </div>
            {!readOnly(t) && (
              <button onClick={() => onManualReview(t.id)} className="px-3 py-1.5 rounded text-sm font-medium shrink-0"
                style={{ background: C.teal, color: C.white }}>Resolve &amp; resume</button>
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
            action={!readOnly(t) && <button onClick={() => onRemind(t.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
              style={{ background: C.tealSoft, color: C.teal }}><BellRing size={12} /> Send reminder now</button>}>
            <div className="p-3">
              {rem.paused && <div className="text-xs mb-2 px-2 py-1 rounded inline-flex items-center gap-1.5" style={{ background: C.waitSoft, color: C.wait }}>
                <PauseCircle size={11} /> Schedule paused while the clock is on hold</div>}
              {rem.fired.length ? rem.fired.map((f) => (
                <div key={f.n} className="flex items-center gap-2 py-1 text-sm" style={{ color: C.ink2 }}>
                  <BellRing size={12} style={{ color: C.warn }} /> Follow-up {f.n} of {rem.max}
                  <span className="text-xs" style={{ color: C.ink3 }}>· {fmtAgo(Math.max(f.at, 0.02))}</span>
                </div>
              )) : <div className="text-sm" style={{ color: C.ink3 }}>Inside SLA — follow-ups start on breach.</div>}
              {rem.next !== null && (
                <div className="flex items-center gap-2 py-1 text-sm" style={{ color: C.ink3 }}>
                  <Clock size={12} /> {rem.fired.length ? "Next follow-up" : "Due"} in {fmtPlain(rem.next)}
                </div>
              )}
              {rem.escalated && (
                <div className="mt-2 space-y-1">
                  {(rem.ladder || []).slice(1).map((step, i) => (
                    <div key={i} className="text-sm flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: C.breachSoft, color: C.breach }}>
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
      )}

      {st.awaited && t.stage === "Awaiting Payment Link" && !readOnly(t) && (
        <div className="rounded-md border p-3 flex items-center gap-2 text-sm" style={{ background: C.canvas, borderColor: C.line, color: C.ink2 }}>
          <Cpu size={14} style={{ color: C.ink3 }} />
          Nothing to do here — the payment link attaches itself from {t.payMode === "Portal" ? `the Operations child ticket ${t.childTicket}` : "the insurer's mail"} and goes to the customer automatically. See Premium &amp; payment.
        </div>
      )}

      {st.system && (
        <div className="rounded-md border p-3 flex items-center gap-2 text-sm" style={{ background: C.canvas, borderColor: C.line, color: C.ink2 }}>
          <Cpu size={14} style={{ color: C.ink3 }} />
          Routing in progress — {ASSIGNMENT.rule.toLowerCase()}. The ticket appears on the owner's desk once assigned.
        </div>
      )}
      {(st.verb || t.stage === "Awaiting Endorsement Copy") && !readOnly(t) && (
        <div className="rounded-md border p-3" style={{ background: C.white, borderColor: C.line }}>
          <Eyebrow>Next action</Eyebrow>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the audit trail"
              className="flex-1 px-2.5 py-2 text-sm rounded border outline-none" style={{ borderColor: C.line, color: C.ink }} />
            {t.stage === "Awaiting Endorsement Copy" && (
              <button onClick={() => setUpload(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium border"
                style={{ borderColor: C.line, color: C.ink2, background: C.white }}>
                <Paperclip size={13} /> Log manually — upload copy
              </button>
            )}
            <button disabled={(t.stage === "Under Verification" && (pendingAll > 0 || openQ.length > 0))}
              onClick={() => { if (t.stage === "Awaiting Endorsement Copy") onAttachCopy(t.id, {}); else if (t.stage === "Copy Received") onQc(t.id); else onAdvance(t.id, note); setNote(""); }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded text-sm font-medium"
              style={{ background: ((t.stage === "Under Verification" && (pendingAll > 0 || openQ.length > 0))) ? C.line : C.teal,
                color: ((t.stage === "Under Verification" && (pendingAll > 0 || openQ.length > 0))) ? C.ink3 : C.white }}>
              <Send size={13} /> {t.stage === "Awaiting Endorsement Copy" ? "Bot fetched copy — attach" : st.verb}
            </button>
            {canAsk && (
              <button onClick={() => setAsk({ kind: "new", target: null })}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium border"
                style={{ borderColor: C.line, color: C.wait, background: C.white }}>
                <HelpCircle size={13} /> Ask the client
              </button>
            )}
          </div>
          <div className="text-xs mt-2" style={{ color: C.ink3 }}>
            {t.stage === "Under Verification" && (pendingAll > 0 || openQ.length > 0)
              ? (openQ.length > 0 ? "Blocked: waiting on the client to answer an open query." : "Blocked: mandatory intake is incomplete. Raise a query to request it.")
              : "Advancing closes this stage's clock and stamps its duration on the ticket."}
          </div>
        </div>
      )}
      <DocViewer doc={preview} onClose={() => setPreview(null)} />
      {ask && <QueryModal ctx={ask} t={t} onClose={() => setAsk(null)} onSend={(q) => { onQuery(t.id, q); setAsk(null); setTab("queries"); }} />}
      {withdrawing && <WithdrawModal t={t} onClose={() => setWithdrawing(false)} onConfirm={(x) => { onWithdraw(t.id, x); setWithdrawing(false); }} />}
      {reassigning && <ReassignModal t={t} onClose={() => setReassigning(false)} onConfirm={(x) => { onReassign(t.id, x); setReassigning(false); }} />}
      {updatingQuote && t.quote && <UpdateQuoteModal t={t} onClose={() => setUpdatingQuote(false)} onConfirm={(x) => { onUpdateQuote(t.id, x); setUpdatingQuote(false); }} />}
      {upload && <UploadModal t={t} onClose={() => setUpload(false)} onConfirm={(file) => { onAttachCopy(t.id, { source: "manual", file }); setUpload(false); setNote(""); }} />}
    </div>
  );
}

/* Review + Create ------------------------------------------------- */
function Review({ mails, onClaim, back }) {
  return (
    <div className="space-y-3">
      <button onClick={back} className="flex items-center gap-1 text-sm" style={{ color: C.ink2 }}><ArrowLeft size={14} /> Back</button>
      <Panel title="Manual review queue" count={mails.length} hint="The bot could not tie these to a policy. No clock has started until one is claimed.">
        {mails.length ? mails.map((m) => (
          <div key={m.id} className="px-3 py-3 border-b" style={{ borderColor: C.lineSoft }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs" style={{ color: C.ink3 }}>{m.id}</span>
                  <Chip color={C.wait} bg={C.waitSoft}>{m.reason}</Chip>
                </div>
                <div className="text-sm mt-1" style={{ color: C.ink }}>{m.subject}</div>
                <div className="text-xs" style={{ color: C.ink3 }}>{m.from} · received {fmtAgo(m.received)}</div>
                <div className="text-xs mt-1.5 px-2 py-1 rounded inline-block" style={{ background: C.canvas, color: C.ink2 }}>Best guess: {m.guess}</div>
              </div>
              <button onClick={() => onClaim(m.id)} className="px-3 py-1.5 rounded text-sm font-medium shrink-0" style={{ background: C.teal, color: C.white }}>
                Claim & raise ticket
              </button>
            </div>
          </div>
        )) : <Empty>Queue empty. Every inbound mail matched a policy.</Empty>}
      </Panel>
    </div>
  );
}

function Create({ onCreate, back, prefill }) {
  const [f, setF] = useState({ client: prefill?.client || "", policy: "", insurer: "ICICI Lombard",
    product: "Fire & Burglary", type: prefill?.type || "Address Change / Correction / Update", priority: "Medium" });
  const meta = TYPES[f.type] || { fields: [], docs: [] };
  const offered = PRODUCTS[f.product] || [];
  const refund = meta.kind === "Return-Premium";
  const ready = f.client && f.policy && !refund;
  return (
    <div className="space-y-3">
      <button onClick={back} className="flex items-center gap-1 text-sm" style={{ color: C.ink2 }}><ArrowLeft size={14} /> Back</button>
      <Panel title="Create endorsement ticket" hint="Type is chosen here, not later — that is what lets the form demand the right fields and documents upfront.">
        <div className="p-4 grid sm:grid-cols-2 gap-3">
          {[["client", "Client"], ["policy", "Policy number"]].map(([k, l]) => (
            <label key={k} className="block">
              <span className="text-xs font-medium" style={{ color: C.ink2 }}>{l}</span>
              <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
                className="mt-1 w-full px-2.5 py-2 text-sm rounded border outline-none" style={{ borderColor: C.line, color: C.ink }} />
            </label>
          ))}
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Insurer</span>
            <select value={f.insurer} onChange={(e) => setF({ ...f, insurer: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              {["ICICI Lombard", "Bajaj Allianz", "HDFC ERGO", "TATA AIG", "Chola MS", "New India", "IFFCO Tokio", "Kotak General", "Future Generali"].map((i) => <option key={i}>{i}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Priority</span>
            <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              {Object.keys(PRIORITY).map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>Product</span>
            <select value={f.product} onChange={(e) => {
                const p = e.target.value;
                setF({ ...f, product: p, type: PRODUCTS[p][0] });
              }}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              {Object.keys(PRODUCTS).map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: C.ink2 }}>
              Endorsement type <span style={{ color: C.ink3 }}>· {offered.length} available for this product</span>
            </span>
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 text-sm rounded border bg-white" style={{ borderColor: C.line, color: C.ink }}>
              {offered.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: C.ink3 }}>
              Classification: <KindTag kind={meta.kind === "Return-Premium" ? "Non-Financial" : meta.kind} small />
              {refund && <span style={{ color: C.breach }}>Return-premium — not supported in this release</span>}
            </span>
          </label>
          <div className="sm:col-span-2 rounded p-3" style={{ background: C.canvas }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.ink3 }}>
              Required for “{f.type}”{!meta.fields.length && !meta.docs.length ? " — nothing mandatory beyond the basics" : ""}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>{meta.fields.map((x) => <input key={x} placeholder={x} className="w-full mb-2 px-2.5 py-2 text-sm rounded border outline-none" style={{ borderColor: C.line, background: C.white }} />)}</div>
              <div>{meta.docs.map((x) => (
                <div key={x} className="flex items-center gap-2 mb-2 px-2.5 py-2 text-sm rounded border" style={{ borderColor: C.line, background: C.white, color: C.ink2 }}>
                  <Paperclip size={12} style={{ color: C.ink3 }} /> <span className="truncate">{x}</span>
                  <span className="ml-auto text-xs" style={{ color: C.teal }}>Attach</span>
                </div>
              ))}</div>
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <button disabled={!ready} onClick={() => onCreate(f)} className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: ready ? C.teal : C.line, color: ready ? C.white : C.ink3 }}>Raise ticket</button>
            <span className="text-xs" style={{ color: C.ink3 }}>Raising starts the New-stage clock. Missing documents can be chased later but block submission to the insurer.</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* Shell ----------------------------------------------------------- */
export default function App() {
  const [tickets, setTickets] = useState(() =>
    SEED.map((t) => {
      const raised = ageOf(t);
      return { ...t, history: [
        { text: "Ticket raised from client mail", by: "Auto-linked by policy number", at: raised, note: null },
        ...t.legs.map((l, i) => ({ text: `Left ${stageOf(l.s).label} after ${fmtDur(l.h)}`, by: t.owner, at: raised - t.legs.slice(0, i + 1).reduce((a, x) => a + x.h, 0), note: null })),
      ] };
    })
  );
  const [mails, setMails] = useState(SEED_MAILS);
  const [view, setView] = useState("home");
  const [filter, setFilter] = useState("attention");
  const [openId, setOpenId] = useState(null);
  const [scope, setScope] = useState("mine");
  const [prefill, setPrefill] = useState(null);
  const [preset, setPreset] = useState(null);
  const [toast, setToast] = useState(null);

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
          { text: `Left ${stageOf(t.stage).label} after ${fmtDur(t.inStage)} → ${next.label}`, by: t.owner, at: 0, note: note || null }] };
    }));
    flash(c.state === "breached" ? `Stage closed ${c.label} past its due time.` : "Stage closed on time.");
  };

  /* M7 FR-091/093 — the copy is attached inside Endorsement Copy Pending,
     by the bot or by hand; the stage does not move until it is sent. */
  const attachCopy = (id, opts) => {
    const manual = opts?.source === "manual";
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const endo = { file: opts?.file || `endorsement_${t.policy.replace(/\//g, "_")}.pdf`, size: "312 KB",
        source: manual ? "manual" : "bot", at: 0, by: manual ? t.owner : t.insurer };
      return { ...t, endo, sends: [], lastAction: 0, stage: "Copy Received", inStage: 0,
        legs: [...t.legs, { s: t.stage, h: t.inStage }],
        extraMail: [...(t.extraMail || []),
          ...(manual ? [] : [{ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Endorsement copy — ${t.policy}`, at: 0, att: 1, link: "auto",
            body: `Dear Partner,\n\nPlease find attached the endorsement copy for the above policy.\n\nRegards,\nEndorsement Desk` }])],
        history: [...t.history,
          { text: manual ? "Endorsement copy uploaded manually" : "Endorsement copy fetched from insurer mail by bot", by: manual ? t.owner : "Mail bot", at: 0, note: opts?.file || null },
          { text: "Awaiting QC before the copy goes to the client", by: "System", at: 0, note: null }] };
    }));
    flash(manual ? "Copy uploaded. Check it at QC, then send to the client." : "Bot fetched and attached the copy. Check it at QC, then send.");
  };

  /* QC on the insurer's copy, now a flag rather than a stage */
  const passQc = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      return { ...t, qcPassed: true, stage: "Closed", inStage: 0, lastAction: 0,
        legs: [...t.legs, { s: t.stage, h: t.inStage }],
        sends: [{ mode: "auto", at: 0, by: "Auto-mailer" }],
        extraMail: [...(t.extraMail || []), {
          dir: "out", who: "no-reply@bimakavach.com", name: "BimaKavach (automatic)", to: `ops@${t.short}.com`,
          subject: `Endorsement copy — ${t.policy}`, at: 0, att: 1, link: "auto", auto: true,
          body: `Dear Sir/Madam,\n\nYour requested ${t.type.toLowerCase()} has been processed. The endorsement copy is attached and is also available on your portal.\n\nRegards,\nBimaKavach Servicing`,
        }],
        history: [...t.history,
          { text: "Endorsement copy passed QC", by: t.owner, at: 0, note: "Checked against the request" },
          { text: "Copy mailed to the client automatically", by: "Auto-mailer", at: 0, note: null },
          { text: `Left ${stageOf(t.stage).label} after ${fmtDur(t.inStage)} → Closed`, by: "Workflow engine", at: 0, note: null }] };
    }));
    flash("QC approved. Copy mailed to the client and ticket closed.");
  };

  /* Manual resend, for when the client asks for the copy again */
  const sendCopy = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const e = endoOf(t);
      return { ...t, lastAction: 0, sends: [...sendsOf(t), { mode: "manual", at: 0, by: t.owner }],
        extraMail: [...(t.extraMail || []), { dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing",
          to: `ops@${t.short}.com`, subject: `Endorsement copy — ${t.policy}${sendsOf(t).length ? " (resent)" : ""}`, at: 0, att: 1, link: "auto",
          body: sendsOf(t).length
            ? `Dear Sir/Madam,\n\nAs requested, resending the endorsement copy for ${t.policy}.\n\nRegards,\nServicing Desk`
            : `Dear Sir/Madam,\n\nYour requested ${t.type.toLowerCase()} has been processed. The endorsement copy is attached and is also available on your portal.\n\nRegards,\nServicing Desk` }],
        history: [...t.history, { text: sendsOf(t).length ? "Endorsement copy resent to client" : "Endorsement copy sent to client", by: t.owner, at: 0, note: e?.file || null }] };
    }));
    flash("Endorsement copy sent to the client.");
  };

  /* Chase writes a real mail into the trail, addressed to whoever the current
     status is waiting on, and worded for what is actually outstanding. */
  const chase = (id) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const asking = {
        "Submitted to Insurer": "confirmation that the endorsement request has been accepted",
        "Awaiting Quote": "the quote and premium for the endorsement",
        "Awaiting Payment Link": "the payment link for the premium",
        "Awaiting Endorsement Copy": "the endorsement copy",
      }[t.stage] || "a status update";
      const n = (t.chases || 0) + 1;
      const c = clock(t);
      const overdue = c.state === "breached";
      return { ...t, chases: n, lastAction: 0,
        extraMail: [...(t.extraMail || []), {
          dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: t.insurerMail,
          subject: `${n > 1 ? `Reminder ${n} — ` : "Reminder — "}${t.type} — ${t.policy}`, at: 0, att: 0, link: "auto",
          body: `Dear Team,\n\nFollowing up on the endorsement request below, for which we are awaiting ${asking}.\n\n`
            + `Policy: ${t.policy}\nInsured: ${t.client}\nRequest: ${t.type}\nPending since: ${fmtWhen(c.entered)}`
            + `${overdue ? `\nAgreed turnaround exceeded by ${c.label}.` : ""}\n\n`
            + `Request you to share ${asking} at the earliest.\n\nRegards,\nServicing Desk`,
        }],
        history: [...t.history, { text: `Reminder ${n} emailed to ${t.insurer}`, by: t.owner, at: 0,
          note: `Awaiting ${asking}` }] };
    }));
    flash("Reminder emailed to the insurer — added to the mail trail.");
  };

  const raiseQuery = (id, q) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const qid = `Q${(t.queries || []).length + 1}`;
      return { ...t, lastAction: 0, priorStage: t.stage, stage: "Awaiting Customer Information", inStage: 0,
        queries: [...(t.queries || []), { id: qid, kind: q.kind, target: q.target, text: q.text, docs: q.docs, status: "open", by: t.owner, at: 0 }],
        extraMail: [...(t.extraMail || []), {
          dir: "out", who: "endorsements@bimakavach.com", name: "BimaKavach Servicing", to: `ops@${t.short}.com`,
          subject: `Action needed on ${t.type} — ${t.policy}`, at: 0, att: 0, link: "auto", queryRef: qid, portal: true,
          body: `Dear Sir/Madam,\n\n${q.text}${q.docs.length ? `\n\nDocuments required:\n${q.docs.map((d) => `• ${d}`).join("\n")}` : ""}\n\nPlease respond through your BimaKavach portal — open ticket ${t.id} and answer the pending query. Uploading there attaches your response to the request directly.\n\nWe will resume processing as soon as you respond.\n\nRegards,\nServicing Desk`,
        }],
        history: [...t.history, { text: `Query ${qid} published to client portal${q.target ? ` — ${q.target}` : ""}`, by: t.owner, at: 0, note: q.text }] };
    }));
    flash("Query published. Ticket moved to SLA-04 — Awaiting customer information.");
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
        values[q.target] = (INTAKE_VALUES[t.type] ? INTAKE_VALUES[t.type](t) : {})[q.target] || "Provided by client";
      } else if (q.target) {
        values[q.target] = "Confirmed as correct — no change required";
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
    flash("Portal response received. Back to SLA-03 — re-verification, fresh 4 BH clock.");
  };

  /* M3 FR-036/037 — terminal, blocked without the withdrawal email */
  const withdraw = (id, { file, reason }) => {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, terminal: "Customer Withdrawn", lastAction: 0,
      queries: (t.queries || []).map((q) => q.status === "open" ? { ...q, status: "closed" } : q),
      history: [...t.history,
        { text: "Customer Withdrawn — insurer communication halted", by: t.owner, at: 0, note: reason },
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
          history: [...t.history, { text: `Manual review resolved — returned to ${stageOf(t.stage).label}`, by: t.owner, at: 0, note: null }] }
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
    const t0 = tickets.find((x) => x.id === id);
    if (stageOf(t0.stage).owner === "insurer") return chase(id);
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, lastAction: 0,
      extraMail: [...(t.extraMail || []), {
        dir: "out", who: "no-reply@bimakavach.com", name: "BimaKavach (automatic)", to: `ops@${t.short}.com`,
        subject: `Reminder — action needed on ${t.type} — ${t.policy}`, at: 0, att: 0, link: "auto", auto: true,
        body: `Dear Sir/Madam,\n\nThis is a reminder that your endorsement request ${t.id} is waiting on you.\n\nPlease sign in to your BimaKavach portal to complete the pending action.\n\nRegards,\nServicing Desk`,
      }],
      history: [...t.history, { text: "Reminder emailed to the customer", by: t.owner, at: 0, note: "Manual, outside the schedule" }] } : t));
    flash("Reminder emailed to the customer — added to the mail trail.");
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
          ...(portal ? [] : [{ dir: "in", who: t.insurerMail, name: t.insurer, subject: `Payment link — ${t.policy}`, at: 0, att: 0, link: "auto",
            body: `Dear Partner,\n\nPayment link for the endorsement on ${t.policy} is below. Premium payable ${money(t.quote.total)}.\n\nRegards,\nEndorsement Desk` }]),
          { dir: "out", who: "no-reply@bimakavach.com", name: "BimaKavach (automatic)", to: `ops@${t.short}.com`,
            subject: `Payment link ready — ${t.policy}`, at: 0, att: 0, link: "auto", auto: true,
            body: `Dear Sir/Madam,\n\nYour endorsement has been approved. Premium payable is ${money(t.quote.total)}.\n\nThe payment link is available on your BimaKavach portal, along with NEFT details if you prefer a bank transfer.\n\nRegards,\nServicing Desk` },
        ],
        history: [...t.history,
          portal
            ? { text: `Payment link uploaded by Operations on ${t.childTicket} — auto-attached to this ticket`, by: "Operations", at: 0, note: "Portal flow · child ticket closed" }
            : { text: "Payment link extracted from insurer mail by bot and auto-filled", by: "Mail bot", at: 0, note: `Confidence ${Math.round(payLink.confidence * 100)}% · Email flow` },
          { text: "Customer notified automatically — premium and link now visible", by: "Notification engine", at: 0, note: "Email + WhatsApp + BimaKendra (FR-071)" },
          { text: `Left ${stageOf(t.stage).label} after ${fmtDur(t.inStage)} → ${next.label}`, by: "Workflow engine", at: 0, note: null }] };
    }));
    flash("Payment link attached automatically and sent to the customer.");
  };

  /* M5 — updating the quote creates a new version; nothing is overwritten */
  const updateQuote = (id, { base, gst, file, reason }) => {
    setTickets((ts) => ts.map((t) => {
      if (t.id !== id || !t.quote) return t;
      const prev = t.quote;
      const quote = { base, gst, total: base + gst, file, version: prev.version + 1,
        at: 0, source: "manual", by: t.owner, confidence: null };
      return { ...t, quote, quoteVersions: [...(t.quoteVersions || [prev]), quote].slice(-6), lastAction: 0,
        history: [...t.history, {
          text: `Quote updated to v${quote.version} — ${money(quote.total)}`,
          by: t.owner, at: 0,
          note: (file !== prev.file ? `Copy replaced with ${file} · ` : "") + reason,
        }] };
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
          subject: `New payment link — ${t.policy}`, at: 0, att: 0, link: "auto", auto: true,
          body: `Dear Sir/Madam,\n\nA fresh payment link has been generated for your endorsement request. It is available on your BimaKavach portal.\n\nRegards,\nServicing Desk` }],
        history: [...t.history,
          { text: `Payment link regenerated — ${payLink.ref}`, by: t.owner, at: 0, note: t.payMode === "Portal" ? "New Operations child ticket raised" : "Fresh request emailed to the insurer" },
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
        history: [...t.history, { text: "Reverted from Payment complete to Payment pending", by: t.owner, at: 0, note: "Payment mismatch — amount does not reconcile with the quote (FR-157)" }] };
    }));
    flash("Reverted to Payment pending. The payment workflow is open again.");
  };

  const create = (f) => {
    const id = `END-${1056 + tickets.length - SEED.length}`;
    setTickets((ts) => [{ ...f, id, short: f.client.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 12) || "client",
      insurerMail: "endorsements@" + f.insurer.toLowerCase().replace(/[^a-z]+/g, "") + ".com",
      product: f.product, kind: kindOfType(f.type),
      stage: "Under Verification", owner: "Priya N", inStage: 0, lastAction: 0, touched: false, legs: [{ s: "New / Unassigned", h: 0.02 }],
      missing: [], missingFields: [], queries: [], extraMail: [], endo: null, sends: [],
      history: [
        { text: "Ticket raised", by: "Priya N", at: 0, note: null },
        { text: "Auto-assigned to Priya N", by: "Routing rule", at: 0, note: null },
      ] }, ...ts]);
    setPrefill(null); flash(`${id} raised and auto-assigned.`); setOpenId(id); setView("ticket");
  };

  const claim = (mid) => {
    const m = mails.find((x) => x.id === mid);
    setMails((ms) => ms.filter((x) => x.id !== mid));
    setPrefill({ client: m.guess.includes("—") ? m.guess.split(" — ")[0] : "" });
    setView("create");
  };

  const current = tickets.find((t) => t.id === openId);
  const bc = useMemo(() => tickets.filter((t) => t.owner === "Priya N" && breached(t)).length, [tickets]);
  const NAV = [["home", "Home", Layers], ["list", "My tickets", Inbox], ["review", "Manual review", MailQuestion]];

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: C.white, borderColor: C.line }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight">BimaKavach TMS</span>
            <span className="text-xs hidden sm:inline" style={{ color: C.ink3 }}>Endorsement desk</span>
          </div>
          <nav className="flex gap-0.5 ml-2">
            {NAV.map(([k, l, Icon]) => (
              <button key={k} onClick={() => go(k, k === "list" ? "attention" : undefined)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm"
                style={{ background: view === k ? C.tealSoft : "transparent", color: view === k ? C.teal : C.ink2, fontWeight: view === k ? 600 : 400 }}>
                <Icon size={13} /> <span className="hidden sm:inline">{l}</span>
                {k === "review" && mails.length > 0 && <span className="font-mono text-xs px-1 rounded" style={{ background: C.waitSoft, color: C.wait }}>{mails.length}</span>}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: C.canvas, color: C.ink2 }}
              title="Stage clocks pause outside these hours and on declared holidays">
              <Clock size={11} style={{ color: C.ink3 }} /> Mon–Fri 10:00–19:00
            </span>
            {bc > 0 && <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: C.breachSoft, color: C.breach }}>
              <XCircle size={11} /> {bc} breached</span>}
            <button onClick={() => { setPrefill(null); setView("create"); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium"
              style={{ background: C.teal, color: C.white }}><Plus size={13} /> <span className="hidden sm:inline">Create ticket</span></button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: C.ink, color: C.white }}>PN</div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">
        {view === "home" && <Home tickets={tickets} scope={scope} setScope={setScope} go={go} openTicket={openTicket} />}
        {view === "list" && <ListView key={filter + JSON.stringify(preset)} tickets={tickets} filter={filter} setFilter={setFilter} scope={scope} openTicket={openTicket} go={go} preset={preset} />}
        {view === "ticket" && current && <Detail t={current} scope={scope} onAdvance={advance} onAttachCopy={attachCopy} onChase={chase} onQuery={raiseQuery} onAnswer={receiveReply} onSendCopy={sendCopy} onWithdraw={withdraw} onReassign={reassign} onManualReview={resolveManualReview} onChangeType={changeType} onRemind={sendReminder} onQc={passQc} onReceiveLink={receiveLink} onUpdateQuote={updateQuote} onRegenerate={regenerateLink} onRevertPayment={revertPayment} back={() => setView("home")} />}
        {view === "review" && <Review mails={mails} onClaim={claim} back={() => setView("home")} />}
        {view === "create" && <Create onCreate={create} back={() => setView("home")} prefill={prefill} />}
      </main>
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded text-sm shadow-lg flex items-center gap-2 max-w-md z-30" style={{ background: C.ink, color: C.white }}>
          <CheckCircle2 size={13} style={{ color: "#6EE7B7" }} className="shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}
