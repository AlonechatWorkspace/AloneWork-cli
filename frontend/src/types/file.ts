export type FileType = "document" | "spreadsheet" | "presentation" | "other";

export interface FileRecord {
  id: string;
  filename: string;
  fileType: FileType;
  content?: unknown;
  previewData?: unknown;
  fileSize?: number;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  remoteId?: string;
}

export interface LocalFile {
  id?: number;
  filename: string;
  fileType: FileType;
  content: unknown;
  updatedAt: string;
  synced: boolean;
  remoteId?: string;
}

export interface UploadFileRequest {
  file: File;
  workspaceId: string;
}

export interface FileListParams {
  workspaceId: string;
  fileType?: FileType;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  align?: "left" | "center" | "right";
  border?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface CellData {
  value: string;
  formula?: string;
  style?: CellStyle;
}

export interface SheetData {
  name: string;
  cells: Record<string, CellData>;
}

export interface SpreadsheetData {
  sheets: SheetData[];
  activeSheetIndex: number;
}

export interface SlideElementStyle {
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  border?: string;
}

export interface SlideElement {
  id: string;
  type: "text" | "shape" | "image";
  shape?: "rectangle" | "circle" | "triangle";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style?: SlideElementStyle;
}

export interface SlideData {
  id: string;
  elements: SlideElement[];
  background?: string;
  notes?: string;
}

export interface PresentationData {
  slides: SlideData[];
  activeSlideIndex: number;
}

export interface DocumentContent {
  type: string;
  content?: unknown[];
  html?: string;
}
