/**
 * Shared layout types for public, low-dependency page helpers.
 */

export interface PaperSpec {
  width: number;
  height: number;
  orientation?: "PORTRAIT" | "LANDSCAPE";
}

export interface MarginSpec {
  top: number;
  bottom: number;
  left: number;
  right: number;
  header?: number;
  footer?: number;
  gutter?: number;
}

export interface TextBoxPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorTo?: "PAPER" | "PAGE";
  vertAlign?: "TOP" | "CENTER" | "BOTTOM";
  horzAlign?: "LEFT" | "CENTER" | "RIGHT";
}

export interface FontStyle {
  fontName?: string;
  size?: number;
  bold?: boolean;
  color?: string;
  italic?: boolean;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectionBackgroundSpec {
  color?: string;
  image?: Uint8Array;
  imageFileName?: string;
  type?: "BOTH" | "EVEN" | "ODD";
  fillArea?: "PAPER" | "BODY";
  headerInside?: boolean;
  footerInside?: boolean;
}

export interface SectionOverlayImageSpec {
  bbox: BBox;
  image: Uint8Array;
  imageFileName?: string;
  treatAsChar?: boolean;
  textWrap?: string;
  zOrder?: number;
}

export interface SectionOverlayTextSpec {
  text: string;
  bbox: BBox;
  charPrIdRef?: string;
  paraPrIdRef?: string;
  lineStyle?: "NONE" | "SOLID";
  fillColor?: string;
  textDirection?: "HORIZONTAL" | "VERTICAL";
}

export interface SectionVisualLayout {
  background?: SectionBackgroundSpec;
  overlays?: {
    images?: SectionOverlayImageSpec[];
    texts?: SectionOverlayTextSpec[];
  };
}

export const A4_PAPER: PaperSpec = { width: 210, height: 297, orientation: "PORTRAIT" };

export const DEFAULT_MARGIN: MarginSpec = {
  top: 20,
  bottom: 15,
  left: 30,
  right: 30,
  header: 15,
  footer: 15,
  gutter: 0,
};
