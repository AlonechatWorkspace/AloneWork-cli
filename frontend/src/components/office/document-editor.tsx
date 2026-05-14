"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Highlighter,
  Type,
  Copy,
  Clipboard,
  Trash2,
  Download,
  Printer,
  Palette,
  Code,
  Eraser,
  ChevronDown,
} from "lucide-react";
import type { LocalFile } from "@/types/file";
import { cn } from "@/lib/utils";

interface DocumentEditorProps {
  file: LocalFile;
  onChange: (file: LocalFile) => void;
}

interface RibbonTab {
  id: string;
  label: string;
  groups: RibbonGroup[];
}

interface RibbonGroup {
  id: string;
  label: string;
  buttons: RibbonButton[];
}

interface RibbonButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: string;
  active?: boolean;
  disabled?: boolean;
}

export function DocumentEditor({ file, onChange }: DocumentEditorProps) {
  const [title, setTitle] = useState(file.filename);
  const [activeTab, setActiveTab] = useState("home");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        table: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "开始输入内容..." }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getInitialContent(file.content),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[800px] p-12 mx-auto bg-white shadow-lg",
      },
    },
    onUpdate: ({ editor }) => {
      handleAutoSave(editor.getHTML());
      updateCounts(editor.getText());
    },
  });

  function getInitialContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (content && typeof content === "object" && "html" in content) {
      return String(content.html);
    }
    return "";
  }

  const handleAutoSave = useCallback(
    (htmlContent: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onChange({
          ...file,
          content: { html: htmlContent },
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    },
    [file, onChange]
  );

  const updateCounts = (text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onChange({
      ...file,
      filename: newTitle,
    });
  };

  const handleExport = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, title]);

  const handleInsertImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, [editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* LibreOffice Style Title Bar */}
      <div className="flex items-center justify-between h-10 px-4 bg-[var(--bg-primary)] border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {editor.isDirty && <span className="text-xs text-[var(--text-muted)]">● 已修改</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => window.print()} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="打印">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="导出">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LibreOffice Style Ribbon */}
      <RibbonToolbar
        editor={editor}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInsertImage={handleInsertImage}
      />

      {/* Editor Content */}
      <div className="flex-1 overflow-auto py-8">
        <div className="max-w-[21cm] mx-auto">
          {/* Document Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-center text-3xl font-bold bg-transparent border-none outline-none mb-8"
            placeholder="文档标题"
          />

          {/* A4 Paper */}
          <div className="w-[21cm] min-h-[29.7cm] bg-white shadow-lg rounded-sm overflow-hidden">
            <EditorContent editor={editor} />
          </div>

          {/* Page Info */}
          <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
            A4 纸张 · 21 cm × 29.7 cm
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between h-6 px-4 bg-[var(--bg-primary)] border-t border-[var(--border-light)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span>页面 1 / 1</span>
          <span>字数: {wordCount}</span>
          <span>字符: {charCount}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>中文(简体)</span>
          <span>缩放: 100%</span>
        </div>
      </div>
    </div>
  );
}

interface RibbonToolbarProps {
  editor: ReturnType<typeof useEditor>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onInsertImage: () => void;
}

function RibbonToolbar({ editor, activeTab, onTabChange, onInsertImage }: RibbonToolbarProps) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const fontColors = [
    "#000000", "#C00000", "#FF0000", "#FFC000", "#FFFF00",
    "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060",
    "#7030A0", "#ffffff",
  ];

  const bgColors = [
    "#ffffff", "#ff0000", "#ffc000", "#ffff00", "#92d050",
    "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0",
    "#f2f2f2", "#d9d9d9",
  ];

  const handleInsertLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const handleInsertTable = (rows: number, cols: number) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
    }
  };

  const setTextColor = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
      setShowTextColorPicker(false);
    }
  };

  const setBgColor = (color: string) => {
    if (editor) {
      editor.chain().focus().toggleHighlight({ color }).run();
      setShowBgColorPicker(false);
    }
  };

  const tabs = [
    { id: "home", label: "开始" },
    { id: "insert", label: "插入" },
    { id: "layout", label: "布局" },
    { id: "view", label: "视图" },
  ];

  return (
    <div className="bg-[var(--ribbon-bg)] border-b border-[var(--ribbon-border)]">
      <div className="flex border-b border-[var(--ribbon-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
            <RibbonGroup label="历史">
              <div className="flex items-center gap-0.5">
                <RibbonButton
                  icon={<Undo className="w-4 h-4" />}
                  label="撤销"
                  disabled={!editor?.can().undo()}
                  onClick={() => editor?.chain().focus().undo().run()}
                />
                <RibbonButton
                  icon={<Redo className="w-4 h-4" />}
                  label="重做"
                  disabled={!editor?.can().redo()}
                  onClick={() => editor?.chain().focus().redo().run()}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label="字体">
              <div className="flex items-center gap-1">
                <select
                  className="h-7 px-1 text-sm border border-[var(--border-light)] rounded bg-white"
                  defaultValue="等线"
                >
                  <option>等线</option>
                  <option>宋体</option>
                  <option>黑体</option>
                  <option>微软雅黑</option>
                  <option>Arial</option>
                  <option>Times New Roman</option>
                </select>
                <select
                  className="h-7 w-14 text-sm border border-[var(--border-light)] rounded bg-white"
                  defaultValue="11"
                >
                  <option>8</option>
                  <option>9</option>
                  <option>10</option>
                  <option>11</option>
                  <option>12</option>
                  <option>14</option>
                  <option>16</option>
                  <option>18</option>
                  <option>20</option>
                  <option>24</option>
                  <option>28</option>
                  <option>36</option>
                  <option>48</option>
                  <option>72</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <RibbonToggleButton
                  icon={<Bold className="w-4 h-4" />}
                  label="粗体"
                  active={editor?.isActive("bold")}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                />
                <RibbonToggleButton
                  icon={<Italic className="w-4 h-4" />}
                  label="斜体"
                  active={editor?.isActive("italic")}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                />
                <RibbonToggleButton
                  icon={<UnderlineIcon className="w-4 h-4" />}
                  label="下划线"
                  active={editor?.isActive("underline")}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                />
                <RibbonToggleButton
                  icon={<Strikethrough className="w-4 h-4" />}
                  label="删除线"
                  active={editor?.isActive("strike")}
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                />
                <div className="relative">
                  <RibbonToggleButton
                    icon={<Palette className="w-4 h-4" />}
                    label="字体颜色"
                    active={showTextColorPicker}
                    onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                  />
                  {showTextColorPicker && (
                    <div
                      ref={colorPickerRef}
                      className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50"
                    >
                      <div className="grid grid-cols-4 gap-1">
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
                    label="背景色"
                    active={showBgColorPicker}
                    onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                  />
                  {showBgColorPicker && (
                    <div
                      ref={colorPickerRef}
                      className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50"
                    >
                      <div className="grid grid-cols-4 gap-1">
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
                <RibbonToggleButton
                  icon={<Code className="w-4 h-4" />}
                  label="代码"
                  active={editor?.isActive("code")}
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                />
                <RibbonToggleButton
                  icon={<Eraser className="w-4 h-4" />}
                  label="清除格式"
                  onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label="段落">
              <div className="flex items-center gap-0.5">
                <RibbonToggleButton
                  icon={<AlignLeft className="w-4 h-4" />}
                  label="左对齐"
                  active={editor?.isActive({ textAlign: "left" })}
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                />
                <RibbonToggleButton
                  icon={<AlignCenter className="w-4 h-4" />}
                  label="居中"
                  active={editor?.isActive({ textAlign: "center" })}
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                />
                <RibbonToggleButton
                  icon={<AlignRight className="w-4 h-4" />}
                  label="右对齐"
                  active={editor?.isActive({ textAlign: "right" })}
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                />
                <RibbonToggleButton
                  icon={<AlignJustify className="w-4 h-4" />}
                  label="两端对齐"
                  active={editor?.isActive({ textAlign: "justify" })}
                  onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <RibbonToggleButton
                  icon={<List className="w-4 h-4" />}
                  label="无序列表"
                  active={editor?.isActive("bulletList")}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                />
                <RibbonToggleButton
                  icon={<ListOrdered className="w-4 h-4" />}
                  label="有序列表"
                  active={editor?.isActive("orderedList")}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                />
                <RibbonToggleButton
                  icon={<Quote className="w-4 h-4" />}
                  label="引用"
                  active={editor?.isActive("blockquote")}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label="样式">
              <div className="flex items-center gap-0.5">
                <RibbonToggleButton
                  icon={<Heading1 className="w-4 h-4" />}
                  label="标题 1"
                  active={editor?.isActive("heading", { level: 1 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                />
                <RibbonToggleButton
                  icon={<Heading2 className="w-4 h-4" />}
                  label="标题 2"
                  active={editor?.isActive("heading", { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <RibbonToggleButton
                  icon={<Heading3 className="w-4 h-4" />}
                  label="标题 3"
                  active={editor?.isActive("heading", { level: 3 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                />
                <RibbonToggleButton
                  icon={<Pilcrow className="w-4 h-4" />}
                  label="正文"
                  active={editor?.isActive("paragraph")}
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "insert" && (
          <>
            <RibbonGroup label="链接">
              <RibbonButton
                icon={<LinkIcon className="w-4 h-4" />}
                label="插入链接"
                onClick={() => setShowLinkDialog(true)}
              />
            </RibbonGroup>

            <RibbonGroup label="媒体">
              <RibbonButton
                icon={<ImageIcon className="w-4 h-4" />}
                label="插入图片"
                onClick={onInsertImage}
              />
            </RibbonGroup>

            <RibbonGroup label="表格">
              <div className="flex items-center gap-1">
                <RibbonButton
                  icon={<TableIcon className="w-4 h-4" />}
                  label="插入表格"
                  onClick={() => handleInsertTable(3, 3)}
                />
                <RibbonButton
                  icon={<Plus className="w-4 h-4" />}
                  label="添加行列"
                  onClick={() => {
                    editor?.chain().focus().addColumnAfter().run();
                  }}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label="其他">
              <RibbonButton
                icon={<Minus className="w-4 h-4" />}
                label="分隔线"
                onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              />
            </RibbonGroup>
          </>
        )}

        {activeTab === "layout" && (
          <RibbonGroup label="页面设置">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[var(--text-muted)] mb-1">页边距</span>
                <select className="h-7 px-2 text-sm border border-[var(--border-light)] rounded bg-white">
                  <option>普通</option>
                  <option>窄</option>
                  <option>宽</option>
                  <option>自定义</option>
                </select>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[var(--text-muted)] mb-1">纸张大小</span>
                <select className="h-7 px-2 text-sm border border-[var(--border-light)] rounded bg-white">
                  <option>A4</option>
                  <option>A3</option>
                  <option>A5</option>
                  <option>Letter</option>
                </select>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[var(--text-muted)] mb-1">方向</span>
                <select className="h-7 px-2 text-sm border border-[var(--border-light)] rounded bg-white">
                  <option>纵向</option>
                  <option>横向</option>
                </select>
              </div>
            </div>
          </RibbonGroup>
        )}

        {activeTab === "view" && (
          <>
            <RibbonGroup label="显示">
              <div className="flex items-center gap-1">
                <RibbonToggleButton
                  icon={<Type className="w-4 h-4" />}
                  label="全屏"
                  onClick={() => document.documentElement.requestFullscreen?.()}
                />
              </div>
            </RibbonGroup>
            <RibbonGroup label="缩放">
              <select
                className="h-7 px-2 text-sm border border-[var(--border-light)] rounded bg-white"
                onChange={(e) => {
                  const zoom = e.target.value;
                  const editorContent = document.querySelector('.ProseMirror') as HTMLElement;
                  if (editorContent) {
                    editorContent.style.transform = `scale(${parseInt(zoom) / 100})`;
                    editorContent.style.transformOrigin = 'top center';
                  }
                }}
              >
                <option>100%</option>
                <option>75%</option>
                <option>50%</option>
                <option>25%</option>
                <option>125%</option>
                <option>150%</option>
                <option>200%</option>
              </select>
            </RibbonGroup>
          </>
        )}
      </div>

      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">插入链接</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="输入链接地址"
              className="w-full px-3 py-2 border border-[var(--border-light)] rounded mb-4 focus:outline-none focus:border-[var(--office-blue)]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-sm rounded hover:bg-[var(--bg-hover)]"
              >
                取消
              </button>
              <button
                onClick={handleInsertLink}
                className="px-4 py-2 text-sm rounded bg-[var(--office-blue)] text-white hover:bg-[var(--office-blue-dark)]"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)] last:border-r-0">
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

interface RibbonButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function RibbonButton({ icon, label, disabled, onClick }: RibbonButtonProps) {
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

interface RibbonToggleButtonProps extends RibbonButtonProps {
  active?: boolean;
}

function RibbonToggleButton({ icon, label, active, disabled, onClick }: RibbonToggleButtonProps) {
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
