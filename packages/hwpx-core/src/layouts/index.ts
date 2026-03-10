export type {
  PaperSpec,
  MarginSpec,
  TextBoxPlacement,
  FontStyle,
  BBox,
  SectionBackgroundSpec,
  SectionOverlayImageSpec,
  SectionOverlayTextSpec,
  SectionVisualLayout,
} from "./types.js";
export { A4_PAPER, DEFAULT_MARGIN } from "./types.js";

export { mm, pt, createSectionElement } from "./utils.js";

export { createTextBox, insertTextBoxInSection, insertTextBoxInMasterPage } from "./text-box.js";
export type { TextBoxOptions } from "./text-box.js";

export { applyHeader, applyFooter, createHeaderParagraph, createFooterParagraph } from "./header-footer.js";
export type { HeaderOptions, FooterOptions } from "./header-footer.js";

export { applySectionBackgroundPicture } from "./section-background.js";
export type { SectionBackgroundPictureOptions } from "./section-background.js";

export { applySectionVisualLayout } from "./section-visuals.js";
export type { ApplySectionVisualOptions } from "./section-visuals.js";

export {
  createMasterPageWithIndexTabs,
  createChapterMasterPages,
  linkMasterPageToSection,
  linkMasterPagesToSection,
  addMasterPageToDocument,
  setSectionStartOnOddPage,
} from "./master-page.js";
export type { MasterPageIndexOptions, IndexTabDefinition, WorkbookIndexSetOptions } from "./master-page.js";

export {
  applyRepeatingBackgroundMasterPage,
  applyRepeatingBackgroundToSection,
} from "./master-page-background.js";
export type { MasterPageBackgroundOptions } from "./master-page-background.js";
