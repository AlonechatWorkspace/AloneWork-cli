"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Type,
  Square,
  Circle,
  Triangle,
  Image as ImageIcon,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BringToFront,
  SendToBack,
  Grid3x3,
} from "lucide-react";
import type { LocalFile, SlideData, SlideElement, PresentationData } from "@/types/file";
import { cn } from "@/lib/utils";

interface PresentationEditorProps {
  file: LocalFile;
  onChange: (file: LocalFile) => void;
}

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 108;

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function PresentationEditor({ file, onChange }: PresentationEditorProps) {
  const [data, setData] = useState<PresentationData>(() => {
    const defaultData: PresentationData = {
      slides: [{ id: generateId(), elements: [] }],
      activeSlideIndex: 0,
    };
    if (file.content && typeof file.content === "object" && "slides" in file.content) {
      return file.content as PresentationData;
    }
    return defaultData;
  });

  const [activeTab, setActiveTab] = useState("home");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showSlideBgPicker, setShowSlideBgPicker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const activeSlide = data.slides[data.activeSlideIndex];
  const selectedElementData = activeSlide.elements.find((el) => el.id === selectedElement);

  const handleAutoSave = useCallback(
    (newData: PresentationData) => {
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

  const updateSlide = (slideIndex: number, slide: SlideData) => {
    const newData = { ...data };
    const newSlides = [...newData.slides];
    newSlides[slideIndex] = slide;
    newData.slides = newSlides;
    setData(newData);
    handleAutoSave(newData);
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: generateId(),
      elements: [],
    };
    const newData = {
      ...data,
      slides: [...data.slides, newSlide],
      activeSlideIndex: data.slides.length,
    };
    setData(newData);
    handleAutoSave(newData);
  };

  const deleteSlide = (index: number) => {
    if (data.slides.length <= 1) return;
    const newSlides = data.slides.filter((_, i) => i !== index);
    setData({
      ...data,
      slides: newSlides,
      activeSlideIndex: Math.min(data.activeSlideIndex, newSlides.length - 1),
    });
  };

  const duplicateSlide = (index: number) => {
    const slide = data.slides[index];
    const newSlide: SlideData = {
      ...slide,
      id: generateId(),
      elements: slide.elements.map((el) => ({ ...el, id: generateId() })),
    };
    const newSlides = [...data.slides];
    newSlides.splice(index + 1, 0, newSlide);
    setData({
      ...data,
      slides: newSlides,
      activeSlideIndex: index + 1,
    });
  };

  const addTextElement = () => {
    const newElement: SlideElement = {
      id: generateId(),
      type: "text",
      x: 100,
      y: 200,
      width: 300,
      height: 100,
      content: "双击编辑文本",
      style: {
        fontSize: 24,
        fontColor: "#1a1a1a",
      },
    };
    const newSlide = { ...activeSlide, elements: [...activeSlide.elements, newElement] };
    updateSlide(data.activeSlideIndex, newSlide);
    setSelectedElement(newElement.id);
  };

  const addShapeElement = (shape: "rectangle" | "circle" | "triangle") => {
    const newElement: SlideElement = {
      id: generateId(),
      type: "shape",
      shape,
      x: 100,
      y: 200,
      width: 200,
      height: 150,
      content: "",
      style: {
        bgColor: "#e0e0e0",
        border: "2px solid #c0c0c0",
      },
    };
    const newSlide = { ...activeSlide, elements: [...activeSlide.elements, newElement] };
    updateSlide(data.activeSlideIndex, newSlide);
    setSelectedElement(newElement.id);
  };

  const addImageElement = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newElement: SlideElement = {
            id: generateId(),
            type: "image",
            x: 100,
            y: 200,
            width: 300,
            height: 200,
            content: event.target?.result as string,
          };
          const newSlide = { ...activeSlide, elements: [...activeSlide.elements, newElement] };
          updateSlide(data.activeSlideIndex, newSlide);
          setSelectedElement(newElement.id);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const newElements = activeSlide.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    const newSlide = { ...activeSlide, elements: newElements };
    updateSlide(data.activeSlideIndex, newSlide);
  };

  const deleteElement = (elementId: string) => {
    const newElements = activeSlide.elements.filter((el) => el.id !== elementId);
    const newSlide = { ...activeSlide, elements: newElements };
    updateSlide(data.activeSlideIndex, newSlide);
    setSelectedElement(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent, element: SlideElement) => {
    e.stopPropagation();
    setSelectedElement(element.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const newX = Math.max(0, Math.min(SLIDE_WIDTH - elementStart.width, elementStart.x + dx));
    const newY = Math.max(0, Math.min(SLIDE_HEIGHT - elementStart.height, elementStart.y + dy));

    updateElement(selectedElement, { x: newX, y: newY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
      setEditingElement(null);
    }
  };

  const startEditing = (element: SlideElement) => {
    if (element.type === "text") {
      setEditingElement(element.id);
      setEditContent(element.content);
      setTimeout(() => editInputRef.current?.focus(), 100);
    }
  };

  const finishEditing = () => {
    if (editingElement) {
      updateElement(editingElement, { content: editContent });
      setEditingElement(null);
    }
  };

  const setElementColor = (color: string) => {
    if (selectedElement) {
      updateElement(selectedElement, {
        style: { ...selectedElementData?.style, fontColor: color },
      });
      setShowColorPicker(false);
    }
  };

  const setElementBgColor = (color: string) => {
    if (selectedElement) {
      updateElement(selectedElement, {
        style: { ...selectedElementData?.style, bgColor: color },
      });
      setShowBgColorPicker(false);
    }
  };

  const setSlideBackground = (color: string) => {
    const newSlide = { ...activeSlide, background: color };
    updateSlide(data.activeSlideIndex, newSlide);
    setShowSlideBgPicker(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedElement && !editingElement && (e.key === "Delete" || e.key === "Backspace")) {
        deleteElement(selectedElement);
      }
    },
    [selectedElement, editingElement]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const shapeColors = [
    "#000000", "#C00000", "#FF0000", "#FFC000", "#FFFF00",
    "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060",
  ];

  const bgColors = [
    "#ffffff", "#ff0000", "#ffc000", "#ffff00", "#92d050",
    "#00b050", "#00b0f0", "#0070c0", "#002060", "#f2f2f2",
    "#e0e0e0", "#d9d9d9",
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Ribbon Toolbar */}
      <div className="bg-[var(--ribbon-bg)] border-b border-[var(--ribbon-border)]">
        <div className="flex border-b border-[var(--ribbon-border)]">
          {[
            { id: "home", label: "开始" },
            { id: "insert", label: "插入" },
            { id: "design", label: "设计" },
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
                  <RibbonButton icon={<Copy className="w-4 h-4" />} label="复制" />
                  {selectedElement && (
                    <RibbonButton
                      icon={<Trash2 className="w-4 h-4" />}
                      label="删除"
                      onClick={() => deleteElement(selectedElement)}
                    />
                  )}
                </div>
              </div>

              {selectedElementData?.type === "text" && (
                <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                  <span className="text-xs text-[var(--text-muted)]">文本</span>
                  <div className="flex items-center gap-1">
                    <select
                      className="h-7 w-14 text-sm border border-[var(--border-light)] rounded bg-white"
                      defaultValue={selectedElementData.style?.fontSize || 24}
                      onChange={(e) =>
                        updateElement(selectedElement!, {
                          style: { ...selectedElementData.style, fontSize: parseInt(e.target.value) },
                        })
                      }
                    >
                      {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <RibbonToggleButton
                      icon={<Bold className="w-4 h-4" />}
                      label="粗体"
                      onClick={() =>
                        updateElement(selectedElement!, {
                          content: `<b>${selectedElementData.content}</b>`,
                        })
                      }
                    />
                    <RibbonToggleButton
                      icon={<AlignLeft className="w-4 h-4" />}
                      label="左对齐"
                    />
                    <RibbonToggleButton
                      icon={<AlignCenter className="w-4 h-4" />}
                      label="居中"
                    />
                    <RibbonToggleButton
                      icon={<AlignRight className="w-4 h-4" />}
                      label="右对齐"
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
                            {shapeColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setElementColor(color)}
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
              )}

              {selectedElementData?.type === "shape" && (
                <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                  <span className="text-xs text-[var(--text-muted)]">形状</span>
                  <div className="flex items-center gap-0.5">
                    <div className="relative">
                      <RibbonButton
                        icon={<Palette className="w-4 h-4" />}
                        label="填充颜色"
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                      />
                      {showBgColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50">
                          <div className="grid grid-cols-6 gap-1">
                            {bgColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setElementBgColor(color)}
                                className="w-6 h-6 rounded border border-[var(--border-light)] hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <RibbonButton
                      icon={<BringToFront className="w-4 h-4" />}
                      label="置于顶层"
                      onClick={() => {
                        const idx = activeSlide.elements.findIndex((el) => el.id === selectedElement);
                        if (idx < activeSlide.elements.length - 1) {
                          const newElements = [...activeSlide.elements];
                          [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
                          updateSlide(data.activeSlideIndex, { ...activeSlide, elements: newElements });
                        }
                      }}
                    />
                    <RibbonButton
                      icon={<SendToBack className="w-4 h-4" />}
                      label="置于底层"
                      onClick={() => {
                        const idx = activeSlide.elements.findIndex((el) => el.id === selectedElement);
                        if (idx > 0) {
                          const newElements = [...activeSlide.elements];
                          [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
                          updateSlide(data.activeSlideIndex, { ...activeSlide, elements: newElements });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "insert" && (
            <>
              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">文本</span>
                <RibbonButton
                  icon={<Type className="w-4 h-4" />}
                  label="文本框"
                  onClick={addTextElement}
                />
              </div>

              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">形状</span>
                <div className="flex items-center gap-0.5">
                  <RibbonButton
                    icon={<Square className="w-4 h-4" />}
                    label="矩形"
                    onClick={() => addShapeElement("rectangle")}
                  />
                  <RibbonButton
                    icon={<Circle className="w-4 h-4" />}
                    label="圆形"
                    onClick={() => addShapeElement("circle")}
                  />
                  <RibbonButton
                    icon={<Triangle className="w-4 h-4" />}
                    label="三角形"
                    onClick={() => addShapeElement("triangle")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">媒体</span>
                <RibbonButton
                  icon={<ImageIcon className="w-4 h-4" />}
                  label="图片"
                  onClick={addImageElement}
                />
              </div>
            </>
          )}

          {activeTab === "design" && (
            <>
              <div className="flex flex-col gap-1 px-2 border-r border-[var(--border-light)]">
                <span className="text-xs text-[var(--text-muted)]">幻灯片背景</span>
                <div className="flex items-center gap-0.5">
                  <div className="relative">
                    <RibbonButton
                      icon={<Palette className="w-4 h-4" />}
                      label="背景颜色"
                      onClick={() => setShowSlideBgPicker(!showSlideBgPicker)}
                    />
                    {showSlideBgPicker && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[var(--border-light)] z-50">
                        <div className="grid grid-cols-6 gap-1">
                          {bgColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSlideBackground(color)}
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
                <span className="text-xs text-[var(--text-muted)]">版式</span>
                <select className="h-7 px-2 text-sm border border-[var(--border-light)] rounded bg-white">
                  <option>空白</option>
                  <option>标题幻灯片</option>
                  <option>标题和内容</option>
                  <option>两栏内容</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-full flex">
        {/* Thumbnails Panel */}
        <div className="w-[220px] bg-[var(--bg-primary)] border-r border-[var(--border-light)] flex flex-col">
          <div className="p-3 border-b border-[var(--border-light)]">
            <h3 className="text-sm font-medium">幻灯片</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {data.slides.length} 张幻灯片
            </p>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              {data.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setData({ ...data, activeSlideIndex: index })}
                  className={cn(
                    "relative rounded overflow-hidden cursor-pointer border-2 transition-all",
                    data.activeSlideIndex === index
                      ? "border-[var(--office-blue)] shadow-md"
                      : "border-transparent hover:border-[var(--border-medium)]"
                  )}
                >
                  <div
                    className="bg-white"
                    style={{
                      width: THUMBNAIL_WIDTH,
                      height: THUMBNAIL_HEIGHT,
                    }}
                  >
                    <div
                      className="w-full h-full relative"
                      style={{ backgroundColor: slide.background || "#ffffff" }}
                    >
                      {slide.elements.map((el) => (
                        <div
                          key={el.id}
                          className="absolute"
                          style={{
                            left: (el.x / SLIDE_WIDTH) * 100 + "%",
                            top: (el.y / SLIDE_HEIGHT) * 100 + "%",
                            width: (el.width / SLIDE_WIDTH) * 100 + "%",
                            height: (el.height / SLIDE_HEIGHT) * 100 + "%",
                          }}
                        >
                          {el.type === "text" && (
                            <div
                              className="w-full h-full overflow-hidden text-ellipsis"
                              style={{
                                fontSize: Math.max(6, (el.style?.fontSize || 24) * 0.2),
                                color: el.style?.fontColor || "#1a1a1a",
                              }}
                            >
                              {el.content}
                            </div>
                          )}
                          {el.type === "shape" && (
                            <div
                              className="w-full h-full"
                              style={{
                                backgroundColor: el.style?.bgColor || "#e0e0e0",
                                border: el.style?.border || "1px solid #c0c0c0",
                                borderRadius: el.shape === "circle" ? "50%" : el.shape === "triangle" ? "0" : "0",
                                clipPath: el.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
                              }}
                            />
                          )}
                          {el.type === "image" && (
                            <img src={el.content} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(index);
                      }}
                      className="p-1 bg-white rounded shadow hover:bg-[var(--bg-hover)]"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {data.slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(index);
                        }}
                        className="p-1 bg-white rounded shadow hover:bg-[var(--error-bg)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-1 left-1 text-xs text-[var(--text-muted)] bg-white/80 px-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addSlide}
              className="w-full mt-2 py-2 border border-dashed border-[var(--border-medium)] rounded text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              + 添加幻灯片
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border-b border-[var(--border-light)]">
            <button
              onClick={() =>
                setData({
                  ...data,
                  activeSlideIndex: Math.max(0, data.activeSlideIndex - 1),
                })
              }
              disabled={data.activeSlideIndex === 0}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">
              {data.activeSlideIndex + 1} / {data.slides.length}
            </span>
            <button
              onClick={() =>
                setData({
                  ...data,
                  activeSlideIndex: Math.min(data.slides.length - 1, data.activeSlideIndex + 1),
                })
              }
              disabled={data.activeSlideIndex === data.slides.length - 1}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {selectedElement && (
              <button
                onClick={() => deleteElement(selectedElement)}
                className="px-3 py-1.5 text-sm rounded hover:bg-[var(--error-bg)] hover:text-[var(--error)] flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> 删除元素
              </button>
            )}
          </div>

          {/* Slide Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="relative bg-white shadow-xl"
              style={{
                width: SLIDE_WIDTH,
                height: SLIDE_HEIGHT,
                backgroundColor: activeSlide.background || "#ffffff",
              }}
            >
              {activeSlide.elements.map((element) => (
                <div
                  key={element.id}
                  onMouseDown={(e) => !editingElement && handleCanvasMouseDown(e, element)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (element.type === "text") {
                      startEditing(element);
                    }
                  }}
                  className={cn(
                    "absolute cursor-move",
                    selectedElement === element.id && "ring-2 ring-[var(--office-blue)] ring-offset-1"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                  }}
                >
                  {element.type === "text" && (
                    editingElement === element.id ? (
                      <textarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={finishEditing}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setEditingElement(null);
                          }
                          if (e.key === "Enter" && e.ctrlKey) {
                            finishEditing();
                          }
                        }}
                        className="w-full h-full p-2 resize-none outline-none"
                        style={{
                          fontSize: element.style?.fontSize || 24,
                          color: element.style?.fontColor || "#1a1a1a",
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full overflow-hidden p-2"
                        style={{
                          fontSize: element.style?.fontSize || 24,
                          color: element.style?.fontColor || "#1a1a1a",
                        }}
                      >
                        {element.content}
                      </div>
                    )
                  )}
                  {element.type === "shape" && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: element.style?.bgColor || "#e0e0e0",
                        border: element.style?.border || "2px solid #c0c0c0",
                        borderRadius: element.shape === "circle" ? "50%" : "0",
                        clipPath: element.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
                      }}
                    />
                  )}
                  {element.type === "image" && (
                    <img src={element.content} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}

              {activeSlide.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
                  <div className="text-center">
                    <p className="mb-2">点击"插入"选项卡添加内容</p>
                    <p className="text-sm">支持文本框、形状、图片等元素</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between h-6 px-4 bg-[var(--bg-primary)] border-t border-[var(--border-light)] text-xs text-[var(--text-muted)]">
            <span>16:9 比例 · {SLIDE_WIDTH} × {SLIDE_HEIGHT} px</span>
            <span>
              {activeSlide.elements.length} 个元素 · 第 {data.activeSlideIndex + 1} 页
            </span>
          </div>
        </div>
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
