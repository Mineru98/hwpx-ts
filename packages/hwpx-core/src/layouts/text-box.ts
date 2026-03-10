/**
 * Text box helpers for generating rect + drawText structures.
 */

import type { TextBoxPlacement } from "./types.js";
import {
  HP_NS,
  HC_NS,
  objectId,
  createNsElement,
  subElement,
  defaultSublistAttributes,
} from "../oxml/xml-utils.js";
import { mm } from "./utils.js";

export interface TextBoxOptions {
  text: string;
  placement: TextBoxPlacement;
  charPrIdRef?: string;
  paraPrIdRef?: string;
  lineStyle?: "NONE" | "SOLID";
  lineWidth?: string;
  fillColor?: string | null;
  textDirection?: "HORIZONTAL" | "VERTICAL";
}

export function createTextBox(xmlDoc: Document, opts: TextBoxOptions): Element {
  const p = opts.placement;
  const anchorTo = p.anchorTo ?? "PAPER";
  const w = mm(p.width);
  const h = mm(p.height);
  const x = mm(p.x);
  const y = mm(p.y);
  const textDir = opts.textDirection ?? "HORIZONTAL";
  const lineStyle = opts.lineStyle ?? "NONE";
  const lineWidth = opts.lineWidth ?? (lineStyle === "SOLID" ? "33" : "0");

  const rect = createNsElement(xmlDoc, HP_NS, "rect", {
    id: objectId(),
    zOrder: "0",
    numberingType: "PICTURE",
    textWrap: "IN_FRONT_OF_TEXT",
    textFlow: "BOTH_SIDES",
    lock: "0",
    dropcapstyle: "None",
    href: "",
    groupLevel: "0",
    instid: objectId(),
    ratio: "0",
  });

  subElement(rect, HP_NS, "offset", { x: "0", y: "0" });
  subElement(rect, HP_NS, "orgSz", { width: String(w), height: String(h) });
  subElement(rect, HP_NS, "curSz", { width: "0", height: "0" });
  subElement(rect, HP_NS, "flip", { horizontal: "0", vertical: "0" });

  const cx = String(Math.round(w / 2));
  const cy = String(Math.round(h / 2));
  subElement(rect, HP_NS, "rotationInfo", {
    angle: "0",
    centerX: cx,
    centerY: cy,
    rotateimage: "1",
  });

  const renderingInfo = subElement(rect, HP_NS, "renderingInfo");
  const identity = { e1: "1", e2: "0", e3: "0", e4: "0", e5: "1", e6: "0" };
  subElement(renderingInfo, HC_NS, "transMatrix", identity);
  subElement(renderingInfo, HC_NS, "scaMatrix", identity);
  subElement(renderingInfo, HC_NS, "rotMatrix", identity);

  subElement(rect, HP_NS, "lineShape", {
    color: "#000000",
    width: lineWidth,
    style: lineStyle,
    endCap: "FLAT",
    headStyle: "NORMAL",
    tailStyle: "NORMAL",
    headfill: "1",
    tailfill: "1",
    headSz: "MEDIUM_MEDIUM",
    tailSz: "MEDIUM_MEDIUM",
    outlineStyle: "NORMAL",
    alpha: "0",
  });

  if (opts.fillColor !== null) {
    const fillBrush = subElement(rect, HC_NS, "fillBrush");
    subElement(fillBrush, HC_NS, "winBrush", {
      faceColor: opts.fillColor ?? "#FFFFFF",
      hatchColor: "#000000",
      alpha: "0",
    });
  }

  subElement(rect, HP_NS, "shadow", {
    type: "NONE",
    color: "#B2B2B2",
    offsetX: "0",
    offsetY: "0",
    alpha: "0",
  });

  const drawText = subElement(rect, HP_NS, "drawText", {
    lastWidth: String(w),
    name: "",
    editable: "0",
  });

  const subListAttrs = defaultSublistAttributes();
  subListAttrs.textDirection = textDir;
  subListAttrs.vertAlign = "CENTER";
  const subList = subElement(drawText, HP_NS, "subList", subListAttrs);

  for (const line of opts.text.split("\n")) {
    const paragraph = subElement(subList, HP_NS, "p", {
      id: "0",
      paraPrIDRef: opts.paraPrIdRef ?? "0",
      styleIDRef: "0",
      pageBreak: "0",
      columnBreak: "0",
      merged: "0",
    });

    const run = subElement(paragraph, HP_NS, "run", {
      charPrIDRef: opts.charPrIdRef ?? "0",
    });
    if (line) {
      subElement(run, HP_NS, "t").textContent = line;
    }

    const linesegarray = subElement(paragraph, HP_NS, "linesegarray");
    subElement(linesegarray, HP_NS, "lineseg", {
      textpos: "0",
      vertpos: "0",
      vertsize: "1000",
      textheight: "1000",
      baseline: textDir === "VERTICAL" ? "500" : "850",
      spacing: "600",
      horzpos: "0",
      horzsize: String(w),
      flags: "393216",
    });
  }

  subElement(drawText, HP_NS, "textMargin", {
    left: "283",
    right: "283",
    top: "283",
    bottom: "283",
  });

  subElement(rect, HC_NS, "pt0", { x: "0", y: "0" });
  subElement(rect, HC_NS, "pt1", { x: String(w), y: "0" });
  subElement(rect, HC_NS, "pt2", { x: String(w), y: String(h) });
  subElement(rect, HC_NS, "pt3", { x: "0", y: String(h) });

  subElement(rect, HP_NS, "sz", {
    width: String(w),
    widthRelTo: "ABSOLUTE",
    height: String(h),
    heightRelTo: "ABSOLUTE",
    protect: "0",
  });

  subElement(rect, HP_NS, "pos", {
    treatAsChar: "0",
    affectLSpacing: "0",
    flowWithText: "0",
    allowOverlap: "1",
    holdAnchorAndSO: "0",
    vertRelTo: anchorTo,
    horzRelTo: anchorTo,
    vertAlign: p.vertAlign ?? "TOP",
    horzAlign: p.horzAlign ?? "LEFT",
    vertOffset: String(y),
    horzOffset: String(x),
  });

  subElement(rect, HP_NS, "outMargin", {
    left: "0",
    right: "0",
    top: "0",
    bottom: "0",
  });
  subElement(rect, HP_NS, "shapeComment").textContent = "사각형입니다.";

  return rect;
}

export function insertTextBoxInMasterPage(masterPageElement: Element, textBoxElement: Element): void {
  const subList = findLocalChild(masterPageElement, "subList");
  const paragraph = subList ? findLocalChild(subList, "p") : null;
  const run = paragraph ? findLocalChild(paragraph, "run") : null;
  if (!run) {
    return;
  }

  const emptyT = findLocalChild(run, "t");
  if (emptyT) {
    run.insertBefore(textBoxElement, emptyT);
  } else {
    run.appendChild(textBoxElement);
    subElement(run, HP_NS, "t").textContent = "";
  }
}

export function insertTextBoxInSection(sectionElement: Element, textBoxElement: Element): void {
  const paragraphs = Array.from(sectionElement.childNodes).filter(
    (node) => node.nodeType === 1 && matchesLocalName(node as Element, "p"),
  ) as Element[];
  if (paragraphs.length === 0) {
    return;
  }

  const paragraph = paragraphs[0]!;
  let linesegarray: Element | null = null;
  for (const child of Array.from(paragraph.childNodes)) {
    if (child.nodeType === 1 && matchesLocalName(child as Element, "linesegarray")) {
      linesegarray = child as Element;
      break;
    }
  }

  let rectRun: Element | null = null;
  for (const child of Array.from(paragraph.childNodes)) {
    if (child.nodeType !== 1 || !matchesLocalName(child as Element, "run")) {
      continue;
    }
    const run = child as Element;
    let hasSecPr = false;
    let hasRect = false;
    for (const grandchild of Array.from(run.childNodes)) {
      if (grandchild.nodeType !== 1) {
        continue;
      }
      const element = grandchild as Element;
      if (matchesLocalName(element, "secPr")) {
        hasSecPr = true;
      }
      if (matchesLocalName(element, "rect")) {
        hasRect = true;
      }
    }
    if (hasRect && !hasSecPr) {
      rectRun = run;
      break;
    }
  }

  if (!rectRun) {
    rectRun = createNsElement(sectionElement.ownerDocument!, HP_NS, "run", { charPrIDRef: "0" });
    if (linesegarray) {
      paragraph.insertBefore(rectRun, linesegarray);
    } else {
      paragraph.appendChild(rectRun);
    }
  }

  const emptyT = findLocalChild(rectRun, "t");
  if (emptyT) {
    rectRun.insertBefore(textBoxElement, emptyT);
  } else {
    rectRun.appendChild(textBoxElement);
    subElement(rectRun, HP_NS, "t").textContent = "";
  }
}

function findLocalChild(parent: Element, name: string): Element | null {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 1 && matchesLocalName(child as Element, name)) {
      return child as Element;
    }
  }
  return null;
}

function matchesLocalName(element: Element, name: string): boolean {
  return element.localName === name || (element.localName?.endsWith(`:${name}`) ?? false);
}
