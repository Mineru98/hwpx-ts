import type { HwpxOxmlDocument } from "../oxml/document.js";
import type { HwpxPackage } from "../package.js";
import { HwpxOxmlMasterPage } from "../oxml/simple-parts.js";
import { parseXml } from "../xml/dom.js";
import { mm } from "./utils.js";
import { HC_NS, HP_NS, createNsElement, objectId, subElement } from "../oxml/xml-utils.js";
import { addMasterPageToDocument, linkMasterPageToSection } from "./master-page.js";

export interface MasterPageBackgroundOptions {
  image: Uint8Array;
  imageFileName?: string;
  pageWidth?: number;
  pageHeight?: number;
  masterPageId?: string;
  type?: "BOTH" | "ODD" | "EVEN";
}

function inferMediaType(fileName?: string): string {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

function insertPictureInMasterPage(masterPageElement: Element, binaryItemIdRef: string, width: number, height: number): void {
  const xmlDoc = masterPageElement.ownerDocument!;
  const subList = Array.from(masterPageElement.childNodes).find((n) => n.nodeType === 1 && (n as Element).localName === "subList") as Element | undefined;
  const p = subList ? (Array.from(subList.childNodes).find((n) => n.nodeType === 1 && (n as Element).localName === "p") as Element | undefined) : undefined;
  const run = p ? (Array.from(p.childNodes).find((n) => n.nodeType === 1 && (n as Element).localName === "run") as Element | undefined) : undefined;
  if (!run) return;
  const pic = createNsElement(xmlDoc, HP_NS, "pic", { id: objectId(), zOrder: "-1", numberingType: "PICTURE", textWrap: "BEHIND_TEXT", textFlow: "BOTH_SIDES", lock: "0", dropcapstyle: "None", href: "", groupLevel: "0", instid: objectId(), reverse: "0" });
  subElement(pic, HP_NS, "offset", { x: "0", y: "0" });
  subElement(pic, HP_NS, "orgSz", { width: String(width), height: String(height) });
  subElement(pic, HP_NS, "curSz", { width: String(width), height: String(height) });
  subElement(pic, HP_NS, "flip", { horizontal: "0", vertical: "0" });
  subElement(pic, HP_NS, "rotationInfo", { angle: "0", centerX: String(Math.floor(width / 2)), centerY: String(Math.floor(height / 2)), rotateimage: "1" });
  const renderingInfo = subElement(pic, HP_NS, "renderingInfo");
  const identity = { e1: "1", e2: "0", e3: "0", e4: "0", e5: "1", e6: "0" };
  subElement(renderingInfo, HC_NS, "transMatrix", identity);
  subElement(renderingInfo, HC_NS, "scaMatrix", identity);
  subElement(renderingInfo, HC_NS, "rotMatrix", identity);
  subElement(pic, HC_NS, "img", { binaryItemIDRef: binaryItemIdRef, bright: "0", contrast: "0", effect: "REAL_PIC", alpha: "0" });
  const imgRect = subElement(pic, HP_NS, "imgRect");
  subElement(imgRect, HC_NS, "pt0", { x: "0", y: "0" });
  subElement(imgRect, HC_NS, "pt1", { x: String(width), y: "0" });
  subElement(imgRect, HC_NS, "pt2", { x: String(width), y: String(height) });
  subElement(imgRect, HC_NS, "pt3", { x: "0", y: String(height) });
  subElement(pic, HP_NS, "imgClip", { left: "0", right: String(width), top: "0", bottom: String(height) });
  subElement(pic, HP_NS, "inMargin", { left: "0", right: "0", top: "0", bottom: "0" });
  subElement(pic, HP_NS, "imgDim", { dimwidth: String(width), dimheight: String(height) });
  subElement(pic, HP_NS, "effects");
  subElement(pic, HP_NS, "sz", { width: String(width), widthRelTo: "ABSOLUTE", height: String(height), heightRelTo: "ABSOLUTE", protect: "0" });
  subElement(pic, HP_NS, "pos", { treatAsChar: "0", affectLSpacing: "0", flowWithText: "0", allowOverlap: "1", holdAnchorAndSO: "0", vertRelTo: "PAPER", horzRelTo: "PAPER", vertAlign: "TOP", horzAlign: "LEFT", vertOffset: "0", horzOffset: "0" });
  subElement(pic, HP_NS, "outMargin", { left: "0", right: "0", top: "0", bottom: "0" });
  const emptyT = Array.from(run.childNodes).find((n) => n.nodeType === 1 && (n as Element).localName === "t");
  if (emptyT) run.insertBefore(pic, emptyT);
  else run.appendChild(pic);
}

export function applyRepeatingBackgroundMasterPage(doc: HwpxOxmlDocument, pkg: HwpxPackage, opts: MasterPageBackgroundOptions): string {
  const pageWidth = opts.pageWidth ?? 210;
  const pageHeight = opts.pageHeight ?? 297;
  const masterPageId = opts.masterPageId ?? "masterpage-bg";
  const type = opts.type ?? "BOTH";
  const binaryItemIdRef = pkg.addBinaryItem(opts.image, { mediaType: inferMediaType(opts.imageFileName) });
  const textWidth = mm(pageWidth) - mm(30) * 2;
  const textHeight = mm(pageHeight) - mm(20) * 2;
  const xmlStr = `<?xml version="1.0" encoding="UTF-8"?><masterPage xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" id="${masterPageId}" type="${type}" pageNumber="0" pageDuplicate="0" pageFront="0"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="${textWidth}" textHeight="${textHeight}" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t/></hp:run><hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="${textWidth}" flags="393216"/></hp:linesegarray></hp:p></hp:subList></masterPage>`;
  const xmlDoc = parseXml(xmlStr);
  const masterPageEl = xmlDoc.documentElement;
  insertPictureInMasterPage(masterPageEl, binaryItemIdRef, mm(pageWidth), mm(pageHeight));
  addMasterPageToDocument(doc, pkg, new HwpxOxmlMasterPage(`Contents/${masterPageId}.xml`, masterPageEl));
  return masterPageId;
}

export function applyRepeatingBackgroundToSection(_doc: HwpxOxmlDocument, _pkg: HwpxPackage, section: { properties: { pageBorderFills: { type: string }[]; removePageBorderFill: (type: string) => void } }, masterPageId: string): void {
  for (const existing of section.properties.pageBorderFills) section.properties.removePageBorderFill(existing.type);
  linkMasterPageToSection(section as never, masterPageId);
}
