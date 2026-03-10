/**
 * @hwpx/core - TypeScript library for reading and editing HWPX documents.
 *
 * Main entry point. Re-exports all public APIs.
 */

// High-level API
export { HwpxDocument } from "./document.js";
export { HwpxPackage } from "./package.js";
export { __version__, resolveLibraryVersion } from "./version.js";
export { loadSkeletonHwpx, setSkeletonHwpx, fetchSkeletonHwpx } from "./templates.js";
export { measureImage, mmToHwp, convertPaddingMm } from "./image-utils.js";
export { addImage, registerImageAsset, setImagePreset, getImagePreset, listImagePresets, deleteImagePreset } from "./image-operations.js";
export type { HwpxMeasuredImage } from "./image-utils.js";
export type { HwpxCellImagePreset } from "./image-operations.js";

// XML abstraction
export {
  parseXml,
  serializeXml,
  localName,
  createElement,
  getAttributes,
  childElements,
  getTextContent,
  getTailText,
  setTextContent,
} from "./xml/dom.js";

// OXML document model
export {
  HwpxOxmlDocument,
  HwpxOxmlSection,
  HwpxOxmlHeader,
  HwpxOxmlParagraph,
  HwpxOxmlRun,
  HwpxOxmlTable,
  HwpxOxmlTableCell,
  HwpxOxmlTableRow,
  HwpxOxmlMemo,
  HwpxOxmlMemoGroup,
  HwpxOxmlSectionProperties,
  HwpxOxmlSectionHeaderFooter,
  HwpxOxmlMasterPage,
  HwpxOxmlHistory,
  HwpxOxmlVersion,
} from "./oxml/document.js";

export type {
  PageSize,
  PageMargins,
  SectionStartNumbering,
  ColumnLayout,
  PageBorderFill,
  PageBorderFillOffset,
  DocumentNumbering,
  RunStyle,
  HwpxTableGridPosition,
  HwpxMargin,
} from "./oxml/document.js";

// OXML body models
export type {
  Paragraph,
  Run,
  TextSpan,
  Control,
  InlineObject,
  Table,
  Section,
  TrackChangeMark,
} from "./oxml/body.js";

// OXML header models
export type {
  Style,
  ParagraphProperty,
  Bullet,
  MemoShape,
  MemoProperties,
  TrackChange,
  TrackChangeAuthor,
  Font,
  FontFace,
  Header,
  RefList,
  CharProperty,
  BorderFillList,
} from "./oxml/header.js";

// Common types
export type { GenericElement } from "./oxml/common.js";

// Parser
export { elementToModel, parseHeaderXml, parseSectionXml } from "./oxml/parser.js";

// Layout helpers
export {
  mm,
  pt,
  createSectionElement,
  createTextBox,
  insertTextBoxInSection,
  insertTextBoxInMasterPage,
  applyHeader,
  applyFooter,
  createHeaderParagraph,
  createFooterParagraph,
  applySectionBackgroundPicture,
  applySectionVisualLayout,
  createMasterPageWithIndexTabs,
  createChapterMasterPages,
  linkMasterPageToSection,
  linkMasterPagesToSection,
  addMasterPageToDocument,
  setSectionStartOnOddPage,
  applyRepeatingBackgroundMasterPage,
  applyRepeatingBackgroundToSection,
  A4_PAPER,
  DEFAULT_MARGIN,
} from "./layouts/index.js";
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
  HeaderOptions,
  FooterOptions,
  SectionBackgroundPictureOptions,
  ApplySectionVisualOptions,
  MasterPageIndexOptions,
  IndexTabDefinition,
  WorkbookIndexSetOptions,
  MasterPageBackgroundOptions,
  TextBoxOptions,
} from "./layouts/index.js";

// Tools
export { TextExtractor } from "./tools/text-extractor.js";
export { ObjectFinder } from "./tools/object-finder.js";
