import type { HwpxOxmlDocument, HwpxOxmlSection } from "../oxml/document.js";
import type { HwpxPackage } from "../package.js";
import type { SectionBackgroundSpec, SectionOverlayImageSpec, SectionOverlayTextSpec, SectionVisualLayout } from "./types.js";
import type { HeaderOptions, FooterOptions } from "./header-footer.js";
import { applyHeader, applyFooter } from "./header-footer.js";
import { createTextBox, insertTextBoxInSection } from "./text-box.js";
import { mm } from "./utils.js";

export interface ApplySectionVisualOptions {
  header?: HeaderOptions;
  footer?: FooterOptions;
  visuals?: SectionVisualLayout;
}

function inferMediaType(fileName?: string): string {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

function applySectionBackground(doc: HwpxOxmlDocument, pkg: HwpxPackage, section: HwpxOxmlSection, background: SectionBackgroundSpec): void {
  for (const existing of section.properties.pageBorderFills) {
    section.properties.removePageBorderFill(existing.type);
  }
  if (background.image) {
    const binaryItemIdRef = pkg.addBinaryItem(background.image, {
      mediaType: inferMediaType(background.imageFileName),
    });
    const header = doc.headers[0];
    if (!header) return;
    const borderFillId = header.ensureImageBorderFill(binaryItemIdRef);
    section.properties.setPageBorderFill({
      type: background.type ?? "BOTH",
      borderFillIDRef: Number(borderFillId),
      fillArea: background.fillArea ?? "PAPER",
      headerInside: background.headerInside ?? false,
      footerInside: background.footerInside ?? false,
      offset: { left: 0, right: 0, top: 0, bottom: 0 },
    });
    return;
  }
  if (background.color) {
    const header = doc.headers[0];
    if (!header) return;
    const borderFillId = header.ensureBorderFill({ backgroundColor: background.color });
    section.properties.setPageBorderFill({
      type: background.type ?? "BOTH",
      borderFillIDRef: Number(borderFillId),
      fillArea: background.fillArea ?? "PAPER",
      headerInside: background.headerInside ?? false,
      footerInside: background.footerInside ?? false,
      offset: { left: 0, right: 0, top: 0, bottom: 0 },
    });
  }
}

function applyOverlayImage(pkg: HwpxPackage, section: HwpxOxmlSection, spec: SectionOverlayImageSpec): void {
  const binaryItemIdRef = pkg.addBinaryItem(spec.image, {
    mediaType: inferMediaType(spec.imageFileName),
  });
  const paragraph = section.addParagraph("", { includeRun: false });
  paragraph.addPicture(binaryItemIdRef, {
    width: mm(spec.bbox.width),
    height: mm(spec.bbox.height),
    treatAsChar: spec.treatAsChar ?? false,
    textWrap: spec.textWrap ?? "IN_FRONT_OF_TEXT",
  });
  const pic = paragraph.pictures[0];
  if (!pic) return;
  const pos = pic.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/paragraph", "pos")[0];
  if (!pos) return;
  pos.setAttribute("treatAsChar", spec.treatAsChar ?? false ? "1" : "0");
  pos.setAttribute("horzRelTo", "PAPER");
  pos.setAttribute("vertRelTo", "PAPER");
  pos.setAttribute("horzOffset", String(mm(spec.bbox.x)));
  pos.setAttribute("vertOffset", String(mm(spec.bbox.y)));
  pic.setAttribute("textWrap", spec.textWrap ?? "IN_FRONT_OF_TEXT");
  section.markDirty();
}

function applyOverlayText(section: HwpxOxmlSection, spec: SectionOverlayTextSpec): void {
  const xmlDoc = section.element.ownerDocument!;
  const textBox = createTextBox(xmlDoc, {
    text: spec.text,
    placement: { x: spec.bbox.x, y: spec.bbox.y, width: spec.bbox.width, height: spec.bbox.height, anchorTo: "PAPER" },
    charPrIdRef: spec.charPrIdRef,
    paraPrIdRef: spec.paraPrIdRef,
    lineStyle: spec.lineStyle ?? "NONE",
    fillColor: spec.fillColor,
    textDirection: spec.textDirection ?? "HORIZONTAL",
  });
  insertTextBoxInSection(section.element, textBox);
  section.markDirty();
}

export function applySectionVisualLayout(doc: HwpxOxmlDocument, pkg: HwpxPackage, section: HwpxOxmlSection, opts: ApplySectionVisualOptions): void {
  if (opts.header) applyHeader(section, opts.header);
  if (opts.footer) applyFooter(section, opts.footer);
  if (opts.visuals?.background) applySectionBackground(doc, pkg, section, opts.visuals.background);
  for (const image of opts.visuals?.overlays?.images ?? []) applyOverlayImage(pkg, section, image);
  for (const text of opts.visuals?.overlays?.texts ?? []) applyOverlayText(section, text);
}
