/**
 * Standalone image operation helpers for HwpxDocument.
 */

import type { HwpxDocument } from "./document.js";
import { mmToHwp } from "./image-utils.js";

export type HwpxCellImagePreset = {
  textWrap?: string;
  treatAsChar?: boolean;
  imageWidthMm?: number;
  imageHeightMm?: number;
};

export function registerImageAsset(
  doc: HwpxDocument,
  imageData: Uint8Array,
  opts: { mediaType: string; extension?: string },
): string {
  return doc.package.addBinaryItem(imageData, {
    mediaType: opts.mediaType,
    extension: opts.extension,
  });
}

export function setImagePreset(doc: HwpxDocument, name: string, preset: HwpxCellImagePreset): void {
  const key = name.trim();
  if (!key) throw new Error("preset name must be non-empty");
  doc._imagePresets.set(key, { ...preset });
}

export function getImagePreset(doc: HwpxDocument, name: string): HwpxCellImagePreset | null {
  const preset = doc._imagePresets.get(name);
  return preset ? { ...preset } : null;
}

export function listImagePresets(doc: HwpxDocument): string[] {
  return Array.from(doc._imagePresets.keys()).sort();
}

export function deleteImagePreset(doc: HwpxDocument, name: string): boolean {
  return doc._imagePresets.delete(name.trim());
}

export function addImage(
  doc: HwpxDocument,
  imageData: Uint8Array,
  opts: {
    mediaType: string;
    widthMm: number;
    heightMm: number;
    sectionIndex?: number;
    textWrap?: string;
    treatAsChar?: boolean;
  },
) {
  const binaryItemId = registerImageAsset(doc, imageData, { mediaType: opts.mediaType });
  const para = doc.addParagraph("", { sectionIndex: opts.sectionIndex });
  para.addPicture(binaryItemId, {
    width: mmToHwp(opts.widthMm),
    height: mmToHwp(opts.heightMm),
    textWrap: opts.textWrap,
    treatAsChar: opts.treatAsChar,
  });
  return para;
}
