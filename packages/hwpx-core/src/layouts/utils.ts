/**
 * Layout unit conversion and minimal section creation helpers.
 */

import type { MarginSpec, PaperSpec } from "./types.js";
import { A4_PAPER, DEFAULT_MARGIN } from "./types.js";
import {
  HP_NS,
  paragraphId,
} from "../oxml/xml-utils.js";
import { parseXml } from "../xml/dom.js";

export function mm(value: number): number {
  return Math.round((value * 7200) / 25.4);
}

export function pt(value: number): number {
  return Math.round(value * 100);
}

export function createSectionElement(
  _xmlDoc: Document,
  opts?: {
    paper?: PaperSpec;
    margin?: MarginSpec;
  },
): Element {
  const paper = opts?.paper ?? A4_PAPER;
  const margins = opts?.margin ?? DEFAULT_MARGIN;

  const w = mm(paper.width);
  const h = mm(paper.height);
  const orientation = paper.orientation ?? "PORTRAIT";
  const ml = mm(margins.left);
  const mr = mm(margins.right);
  const mt = mm(margins.top);
  const mb = mm(margins.bottom);
  const mh = mm(margins.header ?? 15);
  const mf = mm(margins.footer ?? 15);
  const mg = mm(margins.gutter ?? 0);
  const pId = paragraphId();

  const xmlStr =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<hs:sec xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="${HP_NS}" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0">` +
    `<hp:p id="${pId}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">` +
    `<hp:run charPrIDRef="0"><hp:secPr><hp:pagePr landscape="${orientation}" width="${w}" height="${h}" gutterType="LEFT_ONLY"><hp:margin left="${ml}" right="${mr}" top="${mt}" bottom="${mb}" header="${mh}" footer="${mf}" gutter="${mg}"/></hp:pagePr></hp:secPr></hp:run>` +
    `</hp:p></hs:sec>`;

  return parseXml(xmlStr).documentElement;
}
