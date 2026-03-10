import type { HwpxOxmlDocument } from "../oxml/document.js";
import type { HwpxPackage } from "../package.js";
import type { HwpxOxmlSection } from "../oxml/section.js";
import { HwpxOxmlMasterPage } from "../oxml/simple-parts.js";
import { createTextBox, insertTextBoxInMasterPage } from "./text-box.js";
import { mm } from "./utils.js";
import { HP_NS, findAllChildren, subElement } from "../oxml/xml-utils.js";
import { parseXml } from "../xml/dom.js";

export interface IndexTabDefinition {
  text: string;
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
}

export interface MasterPageIndexOptions {
  tabs: IndexTabDefinition[];
  activeIndex?: number;
  tabWidth?: number;
  tabX?: number;
  tabTopMargin?: number;
  tabBottomMargin?: number;
  tabGap?: number;
  pageWidth?: number;
  pageHeight?: number;
  masterPageId?: string;
  type?: "ODD" | "EVEN" | "BOTH";
}

export interface WorkbookIndexSetOptions {
  tabs: IndexTabDefinition[];
  activeIndex: number;
  tabWidth?: number;
  tabTopMargin?: number;
  tabBottomMargin?: number;
  tabGap?: number;
  pageWidth?: number;
  pageHeight?: number;
  idPrefix?: string;
  mirrorEven?: boolean;
}

export function createMasterPageWithIndexTabs(doc: HwpxOxmlDocument, opts: MasterPageIndexOptions): HwpxOxmlMasterPage {
  const pageW = opts.pageWidth ?? 210;
  const pageH = opts.pageHeight ?? 297;
  const tabWidth = opts.tabWidth ?? 15;
  const tabX = opts.tabX ?? pageW - tabWidth;
  const tabTopMargin = opts.tabTopMargin ?? 0;
  const tabBottomMargin = opts.tabBottomMargin ?? 0;
  const tabGap = opts.tabGap ?? 0;
  const tabCount = opts.tabs.length;
  const tabH = (pageH - tabTopMargin - tabBottomMargin - tabGap * (tabCount - 1)) / tabCount;
  const masterPageId = opts.masterPageId ?? "masterpage0";
  const type = opts.type ?? "ODD";
  const textWidth = mm(pageW) - mm(30) * 2;
  const textHeight = mm(pageH) - mm(20) * 2;
  const xmlStr = `<?xml version="1.0" encoding="UTF-8"?><masterPage xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" id="${masterPageId}" type="${type}" pageNumber="0" pageDuplicate="0" pageFront="0"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="${textWidth}" textHeight="${textHeight}" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t/></hp:run><hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="${textWidth}" flags="393216"/></hp:linesegarray></hp:p></hp:subList></masterPage>`;
  const xmlDoc = parseXml(xmlStr);
  const masterPageEl = xmlDoc.documentElement;
  for (let i = 0; i < tabCount; i += 1) {
    const tab = opts.tabs[i]!;
    const fillColor = opts.activeIndex === i ? tab.activeColor ?? "#2C3E50" : tab.inactiveColor ?? (opts.activeIndex != null ? "#BDC3C7" : tab.activeColor ?? "#333333");
    const textColor = opts.activeIndex === i ? tab.textColor ?? "#FFFFFF" : opts.activeIndex != null ? "#666666" : tab.textColor ?? "#FFFFFF";
    const charPrIdRef = String(doc.ensureRunStyle({ fontFamily: tab.fontFamily ?? "함초롬돋움", fontSize: tab.fontSize ?? 10, bold: tab.bold ?? true, textColor }));
    const rect = createTextBox(xmlDoc, {
      text: tab.text,
      placement: { x: tabX, y: tabTopMargin + i * (tabH + tabGap), width: tabWidth, height: tabH, anchorTo: "PAPER" },
      textDirection: "VERTICAL",
      fillColor,
      lineStyle: "NONE",
      charPrIdRef,
    });
    insertTextBoxInMasterPage(masterPageEl, rect);
  }
  return new HwpxOxmlMasterPage(`Contents/${masterPageId}.xml`, masterPageEl);
}

export function createChapterMasterPages(doc: HwpxOxmlDocument, opts: WorkbookIndexSetOptions): HwpxOxmlMasterPage[] {
  const prefix = opts.idPrefix ?? "masterpage";
  const out = [createMasterPageWithIndexTabs(doc, { ...opts, masterPageId: `${prefix}${opts.activeIndex * 2}`, type: "ODD" })];
  if (opts.mirrorEven) out.push(createMasterPageWithIndexTabs(doc, { ...opts, masterPageId: `${prefix}${opts.activeIndex * 2 + 1}`, type: "EVEN", tabX: 0 }));
  return out;
}

export function linkMasterPageToSection(section: HwpxOxmlSection, masterPageId: string): void {
  const secPr = section.properties.element;
  for (const el of findAllChildren(secPr, HP_NS, "masterPage")) {
    if (el.getAttribute("idRef") === masterPageId) return;
  }
  secPr.setAttribute("masterPageCnt", String(parseInt(secPr.getAttribute("masterPageCnt") ?? "0", 10) + 1));
  subElement(secPr, HP_NS, "masterPage", { idRef: masterPageId });
  section.markDirty();
}

export function linkMasterPagesToSection(section: HwpxOxmlSection, masterPageIds: string[]): void {
  for (const id of masterPageIds) linkMasterPageToSection(section, id);
}

export function addMasterPageToDocument(doc: HwpxOxmlDocument, pkg: HwpxPackage, masterPage: HwpxOxmlMasterPage): void {
  pkg.addMasterPageToManifest(masterPage.partName);
  doc.addMasterPage(masterPage);
}

export function setSectionStartOnOddPage(section: HwpxOxmlSection): void {
  section.properties.setStartNumbering({ pageStartsOn: "ODD" });
}
