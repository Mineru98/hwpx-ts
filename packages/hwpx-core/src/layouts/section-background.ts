import type { HwpxOxmlSection } from "../oxml/document.js";
import type { HwpxPackage } from "../package.js";
import { mm } from "./utils.js";
import { findChild, HP_NS } from "../oxml/xml-utils.js";

export interface SectionBackgroundPictureOptions {
  image: Uint8Array;
  imageFileName?: string;
  pageWidthMm?: number;
  pageHeightMm?: number;
  xMm?: number;
  yMm?: number;
}

function inferMediaType(fileName?: string): string {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

export function applySectionBackgroundPicture(pkg: HwpxPackage, section: HwpxOxmlSection, opts: SectionBackgroundPictureOptions): void {
  const binaryItemIdRef = pkg.addBinaryItem(opts.image, { mediaType: inferMediaType(opts.imageFileName) });
  const paragraph = section.insertParagraphAt(0, "", { includeRun: false });
  paragraph.addPicture(binaryItemIdRef, {
    width: mm(opts.pageWidthMm ?? 210),
    height: mm(opts.pageHeightMm ?? 297),
    treatAsChar: false,
    textWrap: "BEHIND_TEXT",
  });
  const pic = paragraph.pictures[0];
  if (pic) {
    pic.setAttribute("zOrder", "-1");
    pic.setAttribute("textWrap", "BEHIND_TEXT");
    const pos = findChild(pic, HP_NS, "pos");
    if (pos) {
      pos.setAttribute("flowWithText", "0");
      pos.setAttribute("allowOverlap", "1");
      pos.setAttribute("treatAsChar", "0");
      pos.setAttribute("vertRelTo", "PAPER");
      pos.setAttribute("horzRelTo", "PAPER");
      pos.setAttribute("vertAlign", "TOP");
      pos.setAttribute("horzAlign", "LEFT");
      pos.setAttribute("vertOffset", String(mm(opts.yMm ?? 0)));
      pos.setAttribute("horzOffset", String(mm(opts.xMm ?? 0)));
    }
    const outMargin = findChild(pic, HP_NS, "outMargin");
    if (outMargin) {
      outMargin.setAttribute("left", "0");
      outMargin.setAttribute("right", "0");
      outMargin.setAttribute("top", "0");
      outMargin.setAttribute("bottom", "0");
    }
  }
  section.markDirty();
}
