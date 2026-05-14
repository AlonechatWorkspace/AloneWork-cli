"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Palette,
  Highlighter,
  Type,
  Minus,
  Plus,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  ChevronDown,
  Grid3x3,
  SortAsc,
  SortDesc,
  Filter,
  FunctionSquare,
} from "lucide-react";
import type { LocalFile, CellData, SheetData, SpreadsheetData } from "@/types/file";
import { cn } from "@/lib/utils";

interface SpreadsheetEditorProps {
  file: LocalFile;
  onChange: (file: LocalFile) => void;
}

const COLS = 26;
const ROWS = 100;
const COL_WIDTH = 100;
const ROW_HEIGHT = 28;

function colToLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

function cellId(col: number, row: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

function parseCellId(id: string): { col: number; row: number } | null {
  const match = id.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2]) - 1;
  return { col, row };
}

function evaluateFormula(formula: string, cells: Record<string, CellData>): string {
  const expr = formula.slice(1).toUpperCase();

  const rangeMatch = expr.match(/^([A-Z]\d+):([A-Z]\d+)$/);
  if (rangeMatch) {
    const start = parseCellId(rangeMatch[1]);
    const end = parseCellId(rangeMatch[2]);
    if (!start || !end) return "#ERROR!";

    const values: number[] = [];
    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.col; col <= end.col; col++) {
        const id = cellId(col, row);
        const cell = cells[id];
        const val = parseFloat(cell?.value || "0");
        if (!isNaN(val)) values.push(val);
      }
    }
    return values.length > 0 ? values.join(",") : "0";
  }

  const cellRefs = expr.match(/([A-Z]\d+)/g);
  if (cellRefs) {
    let evalExpr = expr;
    for (const ref of cellRefs) {
      const cell = cells[ref];
      const val = cell?.value || "0";
      const numVal = parseFloat(val);
      evalExpr = evalExpr.replace(new RegExp(ref, "g"), isNaN(numVal) ? "0" : numVal.toString());
    }

    try {
      const result = Function(`"use strict"; return (${evalExpr})`)();
      return typeof result === "number" ? result.toString() : "#ERROR!";
    } catch {
      return "#ERROR!";
    }
  }

  return "#ERROR!";
}

function getCellValue(id: string, cells: Record<string, CellData>): string {
  const cell = cells[id];
  if (!cell) return "";
  if (cell.formula) {
    return evaluateFormula(cell.formula, cells);
  }
  return cell.value;
}

export function SpreadsheetEditor({ file, onChange }: SpreadsheetEditorProps) {
  const [data, setData] = useState<SpreadsheetData>(() => {
    const defaultData: SpreadsheetData = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheetIndex: 0,
    };
    if (file.content && typeof file.content === "object" && "sheets" in file.content) {
      return file.content as SpreadsheetData;
    }
    return defaultData;
  });

  const [activeTab, setActiveTab] = useState("home");
  const [selectedCell, setSelectedCell] = useState<string>("A1");
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [formulaBarValue, setFormulaBarValue] = useState<string>("");
  const [clipboard, setClipboard] = useState<{ cellId: string; value: string }[] | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const activeSheet = data.sheets[data.activeSheetIndex];

  const handleAutoSave = useCallback(
    (newData: SpreadsheetData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onChange({
          ...file,
          content: newData,
          updatedAt: new Date().toISOString(),
        });
      }, 1000);
    },
    [file, onChange]
  );

  const updateCell = (cellId: string, value: string) => {
    const newData = { ...data };
    const sheet = { ...newData.sheets[data.activeSheetIndex] };
    const cells = { ...sheet.cells };

    cells[cellId] = {
      value,
      formula: value.startsWith("=") ? value : undefined,
      style: cells[cellId]?.style,
    };

    sheet.cells = cells;
    newData.sheets[data.activeSheetIndex] = sheet;

    setData(newData);
    handleAutoSave(newData);
  };

  const updateCellStyle = (cellId: string, style: Partial<CellData["style"]>) => {
    const newData = { ...data };
    const sheet = { ...newData.sheets[data.activeSheetIndex] };
    const cells = { ...sheet.cells };

    const existingCell = cells[cellId] || { value: "" };
    cells[cellId] = {
      ...existingCell,
      style: { ...existingCell.style, ...style },
    };

    sheet.cells = cells;
    newData.sheets[data.activeSheetIndex] = sheet;

    setData(newData);
    handleAutoSave(newData);
  };

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    setSelectedRange(null);
    setEditingCell(null);
    const cell = activeSheet.cells[cellId];
    setFormulaBarValue(cell?.formula || cell?.value || "");
  };

  const handleCellDoubleClick = (cellId: string) => {
    setEditingCell(cellId);
    const cell = activeSheet.cells[cellId];
    setEditValue(cell?.value || "");
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editingCell) {
        updateCell(editingCell, editValue);
        setEditingCell(null);
      }
      const match = selectedCell.match(/([A-Z]+)(\d+)/);
      if (match) {
        const [, col, row] = match;
        const newRow = parseInt(row) + 1;
        if (newRow <= ROWS) {
          setSelectedCell(`${col}${newRow}`);
        }
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (editingCell) {
        updateCell(editingCell, editValue);
        setEditingCell(null);
      }
      const col = selectedCell.charCodeAt(0) - 65;
      if (col < COLS - 1) {
        setSelectedCell(String.fromCharCode(65 + col + 1) + selectedCell.slice(1));
      }
    } else if (!editingCell && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const match = selectedCell.match(/([A-Z]+)(\d+)/);
      if (match) {
        let [, col, row] = match;
        let colNum = col.charCodeAt(0) - 65;
        let rowNum = parseInt(row);

        if (e.key === "ArrowUp") rowNum = Math.max(1, rowNum - 1);
        if (e.key === "ArrowDown") rowNum = Math.min(ROWS, rowNum + 1);
        if (e.key === "ArrowLeft") colNum = Math.max(0, colNum - 1);
        if (e.key === "ArrowRight") colNum = Math.min(COLS - 1, colNum + 1);

        setSelectedCell(`${String.fromCharCode(65 + colNum)}${rowNum}`);
      }
    }
  };

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (editingCell) {
      setEditValue(value);
    } else {
      updateCell(selectedCell, value);
    }
  };

  const handleAddSheet = () => {
    const newSheet: SheetData = {
      name: `Sheet${data.sheets.length + 1}`,
      cells: {},
    };
    setData({
      ...data,
      sheets: [...data.sheets, newSheet],
      activeSheetIndex: data.sheets.length,
    });
  };

  const handleDeleteSheet = (index: number) => {
    if (data.sheets.length <= 1) return;
    const newSheets = data.sheets.filter((_, i) => i !== index);
    setData({
      ...data,
      sheets: newSheets,
      activeSheetIndex: Math.min(data.activeSheetIndex, newSheets.length - 1),
    });
  };

  const handleCopy = () => {
    const cell = activeSheet.cells[selectedCell];
    if (cell) {
      setClipboard([{ cellId: selectedCell, value: cell.value }]);
    }
  };

  const handleCut = () => {
    const cell = activeSheet.cells[selectedCell];
    if (cell) {
      setClipboard([{ cellId: selectedCell, value: cell.value }]);
      updateCell(selectedCell, "");
    }
  };

  const handlePaste = () => {
    if (clipboard && clipboard.length > 0) {
      const item = clipboard[0];
      updateCell(selectedCell, item.value);
    }
  };

  const setTextColor = (color: string) => {
    updateCellStyle(selectedCell, { fontColor: color });
    setShowColorPicker(false);
  };

  const setBgColor = (color: string) => {
    updateCellStyle(selectedCell, { bgColor: color });
    setShowBgColorPicker(false);
  };

  const fontColors = [
    "#000000", "#C00000", "#FF0000", "#FFC000", "#FFFF00",
    "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060",
  ];

  const bgColors = [
    "#ffffff", "#ff0000", "#ffc000", "#ffff00", "#92d050",
    "#00b050", "#00b0f0", "#0070c0", "#002060", "#f2f2f2",
  ];

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const currentCell = activeSheet.cells[selectedCell];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Ribbon Toolbar */}
      <div className="bg-[var(--ribbon-bg)] border-b border-[var(--ribbon-border)]">
        <div className="flex border-b border-[var(--ribbon-border)]">
          {[
            { id: "home", label: "开始" },
            { id: "insert", label: "插入" },
            { id: "formula", label: "公式" },
            { id: "data", label: "数据" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[var(--bg-primary)] border-b-2 border-[var(--office-blue)] text-[var(--office-blue)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--ribbon-tab-hover)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 p-2 bg-[var(--ribbon-bg)] min-h-[56px]">
          {activeTab === "home" && (
            <>
              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">剪贴板</span>
                <div className="flex items-center gap-0.5">
                  <RibbonButton icon={<Clipboard className="w-4 h-4" />} label="粘贴" onClick={handlePaste} />
                  <RibbonButton icon={<Copy className="w-4 h-4" />} label="复制" onClick={handleCopy} />
                  <RibbonButton icon={<Scissors className="w-4 h-4" />} label="剪切" onClick={handleCut} />
                </div>
              </div>

              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">字体</span>
                <div className="flex items-center gap-1">
                  <select className="h-7 w-24 text-sm border border-[var(--border-light)] rounded bg-white">
                    <option>等线</option>
                    <option>宋体</option>
                    <option>黑体</option>
                    <option>Arial</option>
                  </select>
                  <select className="h-7 w-14 text-sm border border-[var(--border-light)] rounded bg-white">
                    {[10, 11, 12, 14, 16, 18, 20, 24].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-0.5">
                  <RibbonToggleButton
                    icon={<Bold className="w-4 h-4" />}
                    label="粗体"
                    active={currentCell?.style?.bold}
                    onClick={() => updateCellStyle(selectedCell, { bold: !currentCell?.style?.bold })}
                  />
                  <RibbonToggleButton
                    icon={<Italic className="w-4 h-4" />}
                    label="斜体"
                    active={currentCell?.style?.italic}
                    onClick={() => updateCellStyle(selectedCell, { italic: !currentCell?.style?.italic })}
                  />
                  <div className="relative">
                    <RibbonToggleButton
                      icon={<Palette className="w-4 h-4" />}
                      label="字体颜色"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    />
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50">
                        <div className="grid grid-cols-5 gap-1">
                          {fontColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className="w-6 h-6 rounded border border-[var(--border-light)] hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <RibbonToggleButton
                      icon={<Highlighter className="w-4 h-4" />}
                      label="填充颜色"
                      onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                    />
                    {showBgColorPicker && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50">
                        <div className="grid grid-cols-5 gap-1">
                          {bgColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setBgColor(color)}
                              className="w-6 h-6 rounded border border-[var(--border-light)] hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">对齐</span>
                <div className="flex items-center gap-0.5">
                  <RibbonToggleButton
                    icon={<AlignLeft className="w-4 h-4" />}
                    label="左对齐"
                    active={currentCell?.style?.align === "left"}
                    onClick={() => updateCellStyle(selectedCell, { align: "left" })}
                  />
                  <RibbonToggleButton
                    icon={<AlignCenter className="w-4 h-4" />}
                    label="居中"
                    active={currentCell?.style?.align === "center"}
                    onClick={() => updateCellStyle(selectedCell, { align: "center" })}
                  />
                  <RibbonToggleButton
                    icon={<AlignRight className="w-4 h-4" />}
                    label="右对齐"
                    active={currentCell?.style?.align === "right"}
                    onClick={() => updateCellStyle(selectedCell, { align: "right" })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">数字</span>
                <select className="h-7 w-24 text-sm border border-[var(--border-light)] rounded bg-white">
                  <option>常规</option>
                  <option>数字</option>
                  <option>货币</option>
                  <option>百分比</option>
                  <option>日期</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "formula" && (
            <>
              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">函数</span>
                <div className="flex items-center gap-1">
                  <RibbonButton
                    icon={<FunctionSquare className="w-4 h-4" />}
                    label="SUM"
                    onClick={() => handleFormulaBarChange(`=SUM(${selectedCell}:${selectedCell})`)}
                  />
                  <RibbonButton
                    icon={<FunctionSquare className="w-4 h-4" />}
                    label="AVERAGE"
                    onClick={() => handleFormulaBarChange(`=AVERAGE(${selectedCell}:${selectedCell})`)}
                  />
                  <RibbonButton
                    icon={<FunctionSquare className="w-4 h-4" />}
                    label="COUNT"
                    onClick={() => handleFormulaBarChange(`=COUNT(${selectedCell}:${selectedCell})`)}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "data" && (
            <>
              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">排序和筛选</span>
                <div className="flex items-center gap-1">
                  <RibbonButton icon={<SortAsc className="w-4 h-4" />} label="升序" />
                  <RibbonButton icon={<SortDesc className="w-4 h-4" />} label="降序" />
                  <RibbonButton icon={<Filter className="w-4 h-4" />} label="筛选" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center h-10 px-4 bg-[var(--bg-primary)] border-b border-[var(--border-light)] gap-2">
        <div className="w-16 text-center text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded px-2 py-1">
          {selectedCell}
        </div>
        <span className="text-sm text-[var(--text-muted)]">fx</span>
        <input
          ref={inputRef}
          type="text"
          value={editingCell ? editValue : formulaBarValue}
          onChange={(e) => {
            if (editingCell) {
              setEditValue(e.target.value);
            } else {
              handleFormulaBarChange(e.target.value);
            }
          }}
          onKeyDown={handleCellKeyDown}
          className="flex-1 h-8 px-2 text-sm border border-[var(--border-light)] rounded focus:outline-none focus:border-[var(--border-focus)]"
          placeholder="输入值或公式 (如 =SUM(A1:A10))"
        />
      </div>

      {/* Grid */}
      <div ref={gridRef} className="flex-1 overflow-auto" onKeyDown={handleCellKeyDown} tabIndex={0}>
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex sticky top-0 z-10 bg-[var(--bg-secondary)]">
            <div className="w-12 h-7 flex-shrink-0 border border-[var(--border-light)] bg-[var(--bg-tertiary)]" />
            {Array.from({ length: COLS }).map((_, col) => (
              <div
                key={col}
                className="w-[100px] h-7 flex-shrink-0 flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-light)] bg-[var(--bg-tertiary)]"
              >
                {colToLetter(col)}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {Array.from({ length: ROWS }).map((_, row) => (
            <div key={row} className="flex">
              {/* Row Number */}
              <div className="w-12 h-[28px] flex-shrink-0 flex items-center justify-center text-xs text-[var(--text-muted)] border border-[var(--border-light)] bg-[var(--bg-tertiary)]">
                {row + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: COLS }).map((_, col) => {
                const id = cellId(col, row);
                const cell = activeSheet.cells[id];
                const isSelected = selectedCell === id;
                const isEditing = editingCell === id;

                return (
                  <div
                    key={col}
                    onClick={() => handleCellClick(id)}
                    onDoubleClick={() => handleCellDoubleClick(id)}
                    className={cn(
                      "w-[100px] h-[28px] flex-shrink-0 border border-[var(--border-light)]",
                      isSelected && "ring-2 ring-[var(--office-blue)] ring-inset z-10",
                      isEditing && "p-0"
                    )}
                    style={{
                      backgroundColor: cell?.style?.bgColor || (isSelected ? "#e8f0fe" : "transparent"),
                      fontWeight: cell?.style?.bold ? "bold" : "normal",
                      fontStyle: cell?.style?.italic ? "italic" : "normal",
                      color: cell?.style?.fontColor || "inherit",
                      textAlign: cell?.style?.align || "left",
                    }}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellKeyDown}
                        className="w-full h-full px-2 text-sm border-none outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="w-full h-full flex items-center text-sm truncate px-2">
                        {getCellValue(id, activeSheet.cells)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)] border-t border-[var(--border-light)]">
        {data.sheets.map((sheet, index) => (
          <div key={index} className="flex items-center gap-1">
            <button
              onClick={() => setData({ ...data, activeSheetIndex: index })}
              className={cn(
                "px-3 py-1 text-sm rounded transition-colors",
                data.activeSheetIndex === index
                  ? "bg-[var(--office-blue)] text-white"
                  : "hover:bg-[var(--bg-hover)]"
              )}
            >
              {sheet.name}
            </button>
            {data.sheets.length > 1 && (
              <button
                onClick={() => handleDeleteSheet(index)}
                className="p-0.5 rounded hover:bg-[var(--error-bg)] hover:text-[var(--error)]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddSheet}
          className="px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> 添加
        </button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between h-6 px-4 bg-[var(--bg-primary)] border-t border-[var(--border-light)] text-xs text-[var(--text-muted)]">
        <span>就绪 · {ROWS} 行 × {COLS} 列</span>
        <span>
          当前 Sheet: {activeSheet.name} · {Object.keys(activeSheet.cells).length} 个有数据的单元格
        </span>
      </div>
    </div>
  );
}

function RibbonButton({ icon, label, disabled, onClick }: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] transition-colors",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
}

function RibbonToggleButton({ icon, label, active, disabled, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded transition-colors",
        active
          ? "bg-[var(--office-blue-bg)] text-[var(--office-blue)]"
          : "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
}
