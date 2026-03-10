import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HwpxDocument,
  HwpxPackage,
  applyRepeatingBackgroundMasterPage,
  applyRepeatingBackgroundToSection,
  applySectionVisualLayout,
  createChapterMasterPages,
  linkMasterPagesToSection,
  measureImage,
  setSectionStartOnOddPage,
} from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKELETON_PATH = resolve(__dirname, "..", "assets", "Skeleton.hwpx");
const skeletonBytes = new Uint8Array(readFileSync(SKELETON_PATH));

const RED_PIXEL_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54,
  0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00,
  0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

describe("visual layout helpers", () => {
  it("measures a tiny PNG image", () => {
    expect(measureImage(RED_PIXEL_PNG)).toEqual({
      widthPx: 1,
      heightPx: 1,
      type: "png",
    });
  });

  it("applies section background/page border fill and text overlay", async () => {
    const doc = await HwpxDocument.open(skeletonBytes);
    const section = doc.section(0);

    applySectionVisualLayout(doc.oxml, doc.package, section, {
      visuals: {
        background: {
          image: RED_PIXEL_PNG,
          imageFileName: "bg.png",
          type: "BOTH",
        },
        overlays: {
          texts: [
            {
              text: "Overlay",
              bbox: { x: 10, y: 12, width: 40, height: 10 },
            },
          ],
        },
      },
    });

    expect(section.properties.pageBorderFills).toHaveLength(1);
    expect(section.properties.pageBorderFills[0]?.fillArea).toBe("PAPER");
    expect(doc.headers[0]?.element.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/core", "img").length).toBeGreaterThan(0);
    expect(section.element.getElementsByTagNameNS("http://www.hancom.co.kr/hwpml/2011/paragraph", "rect").length).toBeGreaterThan(0);
  });

  it("creates and links chapter master pages", async () => {
    const doc = await HwpxDocument.open(skeletonBytes);
    const masterPages = createChapterMasterPages(doc.oxml, {
      tabs: [{ text: "국어" }, { text: "수학" }],
      activeIndex: 1,
      idPrefix: "chapter-",
      mirrorEven: true,
    });

    for (const masterPage of masterPages) {
      doc.package.addMasterPageToManifest(masterPage.partName);
      doc.oxml.addMasterPage(masterPage);
    }
    linkMasterPagesToSection(doc.section(0), masterPages.map((masterPage) => masterPage.element.getAttribute("id") ?? ""));
    setSectionStartOnOddPage(doc.section(0));

    const saved = await doc.save();
    const reopened = await HwpxPackage.open(saved);
    const masterPagePaths = reopened.masterPagePaths();

    expect(masterPages).toHaveLength(2);
    expect(masterPagePaths.some((path) => path.endsWith("chapter-2.xml"))).toBe(true);
    expect(masterPagePaths.some((path) => path.endsWith("chapter-3.xml"))).toBe(true);
    expect(doc.section(0).properties.startNumbering.pageStartsOn).toBe("ODD");
  });

  it("creates a repeating background master page and links it to a section", async () => {
    const doc = await HwpxDocument.open(skeletonBytes);
    const masterPageId = applyRepeatingBackgroundMasterPage(doc.oxml, doc.package, {
      image: RED_PIXEL_PNG,
      imageFileName: "repeat.png",
      masterPageId: "masterpage-bg-test",
    });

    applyRepeatingBackgroundToSection(doc.oxml, doc.package, doc.section(0), masterPageId);

    const saved = await doc.save();
    const reopened = await HwpxPackage.open(saved);
    const sectionXml = reopened.getText(reopened.sectionPaths()[0]!);

    expect(reopened.masterPagePaths().some((path) => path.endsWith("masterpage-bg-test.xml"))).toBe(true);
    expect(sectionXml).toContain('masterPage');
    expect(sectionXml).toContain('idRef="masterpage-bg-test"');
  });
});
