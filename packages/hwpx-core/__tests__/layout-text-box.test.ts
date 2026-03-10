import { describe, expect, it } from "vitest";
import {
  A4_PAPER,
  DEFAULT_MARGIN,
  createSectionElement,
  createTextBox,
  insertTextBoxInMasterPage,
  insertTextBoxInSection,
  mm,
} from "../src/index.js";
import { parseXml, serializeXml } from "../src/xml/dom.js";

describe("layout text box helpers", () => {
  it("creates a section element with expected page metrics", () => {
    const doc = parseXml("<root/>");
    const section = createSectionElement(doc, {
      paper: A4_PAPER,
      margin: DEFAULT_MARGIN,
    });

    const pagePr = section.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/paragraph", "pagePr")[0];
    expect(pagePr?.getAttribute("width")).toBe(String(mm(210)));
    expect(pagePr?.getAttribute("height")).toBe(String(mm(297)));
  });

  it("creates a rect textbox with drawText and core corner points", () => {
    const doc = parseXml("<root/>");
    const rect = createTextBox(doc, {
      text: "Hello",
      placement: { x: 10, y: 20, width: 30, height: 40 },
      fillColor: "#ABCDEF",
      textDirection: "VERTICAL",
    });

    expect(rect.localName).toBe("rect");
    expect(rect.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/paragraph", "drawText").length).toBe(1);
    expect(rect.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/core", "pt0").length).toBe(1);
    expect(rect.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/core", "fillBrush").length).toBe(1);
  });

  it("inserts a rect directly into a section run instead of wrapping it", () => {
    const doc = parseXml("<root/>");
    const section = createSectionElement(doc);
    const rect = createTextBox(doc, {
      text: "Section Box",
      placement: { x: 5, y: 5, width: 20, height: 10 },
    });

    insertTextBoxInSection(section, rect);

    const xml = serializeXml(section);
    expect(xml).toContain("<hp:rect");
    expect(xml).not.toContain("<hp:ctrl");
  });

  it("inserts a rect before the trailing text node in a master page run", () => {
    const doc = parseXml(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<masterPage xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">` +
        `<hp:subList><hp:p><hp:run><hp:t/></hp:run></hp:p></hp:subList>` +
        `</masterPage>`,
    );
    const rect = createTextBox(doc, {
      text: "Master",
      placement: { x: 1, y: 2, width: 3, height: 4 },
    });

    insertTextBoxInMasterPage(doc.documentElement, rect);

    const xml = serializeXml(doc.documentElement);
    expect(xml.indexOf("<hp:rect")).toBeGreaterThan(-1);
    expect(xml.indexOf("<hp:rect")).toBeLessThan(xml.indexOf("<hp:t"));
  });
});
