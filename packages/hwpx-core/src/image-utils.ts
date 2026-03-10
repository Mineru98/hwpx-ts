/**
 * Utility types and functions for HWPX image handling.
 */

import type { HwpxMargin } from "./oxml/document.js";

export type HwpxMeasuredImage = {
  widthPx: number;
  heightPx: number;
  type: "png" | "jpeg";
};

export function mmToHwp(mm: number): number {
  return Math.round((mm * 7200) / 25.4);
}

export function measureImage(imageData: Uint8Array): HwpxMeasuredImage | null {
  const readU16 = (offset: number): number => (imageData[offset]! << 8) | imageData[offset + 1]!;
  const readU32 = (offset: number): number =>
    (imageData[offset]! * 0x1000000) + (imageData[offset + 1]! << 16) + (imageData[offset + 2]! << 8) + imageData[offset + 3]!;

  if (
    imageData.length >= 24 &&
    imageData[0] === 0x89 &&
    imageData[1] === 0x50 &&
    imageData[2] === 0x4e &&
    imageData[3] === 0x47 &&
    imageData[4] === 0x0d &&
    imageData[5] === 0x0a &&
    imageData[6] === 0x1a &&
    imageData[7] === 0x0a &&
    imageData[12] === 0x49 &&
    imageData[13] === 0x48 &&
    imageData[14] === 0x44 &&
    imageData[15] === 0x52
  ) {
    const widthPx = readU32(16);
    const heightPx = readU32(20);
    return widthPx > 0 && heightPx > 0 ? { widthPx, heightPx, type: "png" } : null;
  }

  if (imageData.length >= 4 && imageData[0] === 0xff && imageData[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < imageData.length && offset < 65536) {
      if (imageData[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < imageData.length && imageData[offset] === 0xff) offset += 1;
      if (offset >= imageData.length) break;
      const marker = imageData[offset]!;
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 1 >= imageData.length) break;
      const segmentLength = readU16(offset);
      if (segmentLength < 2 || offset + segmentLength > imageData.length) return null;
      const sof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (sof) {
        if (segmentLength < 7) return null;
        const frame = offset + 2;
        const heightPx = readU16(frame + 1);
        const widthPx = readU16(frame + 3);
        return widthPx > 0 && heightPx > 0 ? { widthPx, heightPx, type: "jpeg" } : null;
      }
      offset += segmentLength;
    }
  }

  return null;
}

export function convertPaddingMm(
  paddingMm: Partial<HwpxMargin> | undefined,
): { top?: number; bottom?: number; left?: number; right?: number } | undefined {
  if (!paddingMm) return undefined;
  return {
    top: paddingMm.top != null ? mmToHwp(paddingMm.top) : undefined,
    bottom: paddingMm.bottom != null ? mmToHwp(paddingMm.bottom) : undefined,
    left: paddingMm.left != null ? mmToHwp(paddingMm.left) : undefined,
    right: paddingMm.right != null ? mmToHwp(paddingMm.right) : undefined,
  };
}
