import type { HwpxOxmlSection } from "../oxml/document.js";
import type { FontStyle } from "./types.js";
import {
  HP_NS,
  DEFAULT_PARAGRAPH_ATTRS,
  paragraphId,
  objectId,
  getIntAttr,
  findChild,
  createNsElement,
  subElement,
  defaultSublistAttributes,
} from "../oxml/xml-utils.js";

export interface HeaderOptions {
  leftText?: string;
  centerText?: string;
  rightText?: string;
  font?: FontStyle;
  pageType?: string;
  charPrIdRef?: string;
  paraPrIdRef?: string;
}

export interface FooterOptions {
  showPageNumber?: boolean;
  pageNumberStyle?: "plain" | "dash" | "bracket";
  useAutoNum?: boolean;
  leftText?: string;
  rightText?: string;
  font?: FontStyle;
  pageType?: string;
  charPrIdRef?: string;
  paraPrIdRef?: string;
}

function computeContentWidth(section: HwpxOxmlSection): number {
  const fallback = 42520;
  const pagePr = findChild(section.properties.element, HP_NS, "pagePr");
  if (!pagePr) return fallback;
  const pageWidth = getIntAttr(pagePr, "width", 0);
  if (pageWidth <= 0) return fallback;
  const margin = findChild(pagePr, HP_NS, "margin");
  if (!margin) return pageWidth;
  const result = pageWidth - getIntAttr(margin, "left", 0) - getIntAttr(margin, "right", 0);
  return result > 0 ? result : fallback;
}

function computeHFHeight(section: HwpxOxmlSection, type: "header" | "footer"): number {
  const fallback = 4252;
  const margin = findChild(findChild(section.properties.element, HP_NS, "pagePr") ?? section.properties.element, HP_NS, "margin");
  const value = margin ? getIntAttr(margin, type, 0) : 0;
  return value > 0 ? value : fallback;
}

function buildHFSubList(xmlDoc: Document, text: string, vertAlign: "TOP" | "BOTTOM", section: HwpxOxmlSection, charPrIdRef?: string, paraPrIdRef?: string): Element {
  const attrs = defaultSublistAttributes();
  attrs.vertAlign = vertAlign;
  attrs.textWidth = String(computeContentWidth(section));
  attrs.textHeight = String(computeHFHeight(section, vertAlign === "TOP" ? "header" : "footer"));
  const subList = createNsElement(xmlDoc, HP_NS, "subList", attrs);
  const pAttrs: Record<string, string> = { ...DEFAULT_PARAGRAPH_ATTRS, id: paragraphId() };
  if (paraPrIdRef) pAttrs.paraPrIDRef = paraPrIdRef;
  const p = subElement(subList, HP_NS, "p", pAttrs);
  const run = subElement(p, HP_NS, "run", { charPrIDRef: charPrIdRef ?? "0" });
  subElement(run, HP_NS, "t").textContent = text;
  const linesegarray = subElement(p, HP_NS, "linesegarray");
  subElement(linesegarray, HP_NS, "lineseg", {
    textpos: "0",
    vertpos: "0",
    vertsize: "4000",
    textheight: "4000",
    baseline: "3400",
    spacing: "2000",
    horzpos: "0",
    horzsize: attrs.textWidth,
    flags: "393216",
  });
  return subList;
}

function buildAutoNumSubList(xmlDoc: Document, section: HwpxOxmlSection, opts: FooterOptions): Element {
  const attrs = defaultSublistAttributes();
  attrs.vertAlign = "BOTTOM";
  attrs.textWidth = String(computeContentWidth(section));
  attrs.textHeight = String(computeHFHeight(section, "footer"));
  const subList = createNsElement(xmlDoc, HP_NS, "subList", attrs);
  const pAttrs: Record<string, string> = { ...DEFAULT_PARAGRAPH_ATTRS, id: paragraphId() };
  if (opts.paraPrIdRef) pAttrs.paraPrIDRef = opts.paraPrIdRef;
  const p = subElement(subList, HP_NS, "p", pAttrs);
  const charRef = opts.charPrIdRef ?? "0";
  const style = opts.pageNumberStyle ?? "dash";
  const prefix = style === "dash" ? "- " : style === "bracket" ? "[ " : "";
  const suffix = style === "dash" ? " -" : style === "bracket" ? " ]" : "";
  if (opts.leftText) subElement(subElement(p, HP_NS, "run", { charPrIDRef: charRef }), HP_NS, "t").textContent = `${opts.leftText}    `;
  if (prefix) subElement(subElement(p, HP_NS, "run", { charPrIDRef: charRef }), HP_NS, "t").textContent = prefix;
  const autoNumRun = subElement(p, HP_NS, "run", { charPrIDRef: charRef });
  const ctrl = subElement(autoNumRun, HP_NS, "ctrl");
  const autoNum = subElement(ctrl, HP_NS, "autoNum", { num: "1", numType: "PAGE" });
  subElement(autoNum, HP_NS, "autoNumFormat", { type: "DIGIT", userChar: "", prefixChar: "", suffixChar: "", supscript: "0" });
  subElement(autoNumRun, HP_NS, "t");
  if (suffix) subElement(subElement(p, HP_NS, "run", { charPrIDRef: charRef }), HP_NS, "t").textContent = suffix;
  if (opts.rightText) subElement(subElement(p, HP_NS, "run", { charPrIDRef: charRef }), HP_NS, "t").textContent = `    ${opts.rightText}`;
  const linesegarray = subElement(p, HP_NS, "linesegarray");
  subElement(linesegarray, HP_NS, "lineseg", {
    textpos: "0",
    vertpos: "0",
    vertsize: "4000",
    textheight: "4000",
    baseline: "3400",
    spacing: "2000",
    horzpos: "0",
    horzsize: attrs.textWidth,
    flags: "393216",
  });
  return subList;
}

function createHFParagraph(xmlDoc: Document, tag: "header" | "footer", subList: Element, pageType: string): Element {
  const hfElement = createNsElement(xmlDoc, HP_NS, tag, { id: objectId(), applyPageType: pageType });
  hfElement.appendChild(subList);
  const ctrl = createNsElement(xmlDoc, HP_NS, "ctrl");
  ctrl.appendChild(hfElement);
  const p = createNsElement(xmlDoc, HP_NS, "p", { ...DEFAULT_PARAGRAPH_ATTRS, id: paragraphId() });
  const run = subElement(p, HP_NS, "run", { charPrIDRef: "0" });
  run.appendChild(ctrl);
  subElement(run, HP_NS, "t").textContent = "";
  return p;
}

export function createHeaderParagraph(section: HwpxOxmlSection, opts: HeaderOptions): Element | null {
  const text = [opts.leftText, opts.centerText, opts.rightText].filter(Boolean).join("    ");
  if (!text) return null;
  return createHFParagraph(section.element.ownerDocument!, "header", buildHFSubList(section.element.ownerDocument!, text, "TOP", section, opts.charPrIdRef, opts.paraPrIdRef), opts.pageType ?? "BOTH");
}

export function createFooterParagraph(section: HwpxOxmlSection, opts: FooterOptions): Element | null {
  const xmlDoc = section.element.ownerDocument!;
  const subList = opts.useAutoNum && opts.showPageNumber !== false
    ? buildAutoNumSubList(xmlDoc, section, opts)
    : (() => {
        const parts: string[] = [];
        if (opts.leftText) parts.push(opts.leftText);
        if (opts.showPageNumber !== false) parts.push((opts.pageNumberStyle ?? "dash") === "bracket" ? "[ {page} ]" : (opts.pageNumberStyle ?? "dash") === "plain" ? "{page}" : "- {page} -");
        if (opts.rightText) parts.push(opts.rightText);
        const text = parts.join("    ");
        if (!text) return null;
        return buildHFSubList(xmlDoc, text, "BOTTOM", section, opts.charPrIdRef, opts.paraPrIdRef);
      })();
  return subList ? createHFParagraph(xmlDoc, "footer", subList, opts.pageType ?? "BOTH") : null;
}

export function applyHeader(section: HwpxOxmlSection, opts: HeaderOptions): void {
  const paragraph = createHeaderParagraph(section, opts);
  if (!paragraph) return;
  section.element.insertBefore(paragraph, section.element.firstChild);
  section.markDirty();
}

export function applyFooter(section: HwpxOxmlSection, opts: FooterOptions): void {
  const paragraph = createFooterParagraph(section, opts);
  if (!paragraph) return;
  section.element.appendChild(paragraph);
  section.markDirty();
}
