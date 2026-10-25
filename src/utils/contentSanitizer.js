/**
 * contentSanitizer.js
 * Guards public pages against rendering raw AI prompt text that was
 * accidentally saved into a content field from the admin "AI prompt" helper
 * (e.g. "Write the historical background … Output only the paragraph …").
 */

const PROMPT_PATTERNS = [
  /\boutput only (the )?(paragraph|list|essay|text)/i,
  /\bno (extra )?(headings|commentary|bullet points)\b/i,
  /^\s*(write|list and describe|generate|create|describe)\b[^.]{0,160}\b(of|about|for)\b[^.]{0,120}(located in|maharashtra|trek)/i,
  /\bwrite \d+\s*[–-]\s*\d+ words\b/i,
  /\bcover(ing)?( in)? \d+\s*[–-]\s*\d+ words\b/i,
  /\breference style\b/i,
  /\[(trek name|location|region|duration|altitude|base village|attraction name)\]/i,
  /\bformat each (attraction|item) as\b/i,
  /\byou are an? (expert|assistant|travel writer)\b/i,
  /\bas an ai\b/i,
];

/** Score how "prompt-like" a string is. */
export function promptScore(text) {
  if (!text || typeof text !== "string") return 0;
  return PROMPT_PATTERNS.reduce((n, re) => (re.test(text) ? n + 1 : n), 0);
}

/** True when a string looks like an instruction to an AI rather than content. */
export function isPromptLike(text) {
  if (!text || typeof text !== "string") return false;
  const score = promptScore(text);
  if (score >= 2) return true;
  // Strong single markers
  return /\boutput only\b/i.test(text) || /\[(trek name|location)\]/i.test(text);
}

/**
 * Returns the text if it is safe to show, otherwise "".
 * A field that contains a pasted AI prompt is treated as empty, so the
 * section falls back / hides instead of showing instructions to visitors.
 */
export function cleanDisplayText(text) {
  if (text == null) return "";
  const str = String(text);
  return isPromptLike(str) ? "" : str;
}

/** Clean every string in an array, removing empty/prompt-like entries. */
export function cleanTextList(list = []) {
  return (Array.isArray(list) ? list : []).map((v) => cleanDisplayText(v)).filter(Boolean);
}

/* Text fields an admin may fill via the AI-prompt helper. If a raw prompt was
   saved instead of generated copy, blank it so it never renders publicly. */
const PROMPT_GUARDED_FIELDS = [
  "about",
  "subtitle",
  "history",
  "mainAttractions",
  "detailedHistory",
  "highlights",
  "placesToVisit",
  "included",
  "notIncluded",
  "thingsToCarry",
  "description",
];

export const stripPromptFields = (item) => {
  if (!item) return item;
  const next = { ...item };
  PROMPT_GUARDED_FIELDS.forEach((key) => {
    if (typeof next[key] === "string" && isPromptLike(next[key])) next[key] = "";
  });
  return next;
};
