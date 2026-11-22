import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type {
  IWhiteboardElement,
  IWhiteboardPoint,
  IWhiteboardState,
  ILaserPointerState,
  WhiteboardTool,
} from '../../../../services/nativeWebrtc/types'

interface TeacherWhiteboardProps {
  whiteboard: IWhiteboardState
  setWhiteboard: React.Dispatch<React.SetStateAction<IWhiteboardState>>
  remoteLaser: ILaserPointerState | null
  remoteDraftElement?: { page: number; element: IWhiteboardElement } | null
  isTeacher: boolean
  sendWhiteboardAction: (action: string, payload?: any) => void
  fileInputRef?: React.RefObject<HTMLInputElement | null>
}

const COLORS = [
  { hex: '#0f172a', label: 'مشکی' },
  { hex: '#2563eb', label: 'آبی' },
  { hex: '#dc2626', label: 'قرمز' },
  { hex: '#16a34a', label: 'سبز' },
  { hex: '#9333ea', label: 'بنفش' },
  { hex: '#ea580c', label: 'نارنجی' },
  { hex: '#eab308', label: 'زرد' },
]

const SIZES = [
  { value: 2.5, label: 'نازک' },
  { value: 4.5, label: 'متوسط' },
  { value: 8, label: 'ضخیم' },
  { value: 14, label: 'ماژیک' },
]

// Helper to load local self-hosted PDF.js on demand
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib
  }
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const scriptSrc = `${normalizedBase}pdfjs/pdf.min.js`
  const workerSrc = `${normalizedBase}pdfjs/pdf.worker.min.js`

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-pdfjs="true"]')
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.dataset.pdfjs = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('خطا در بارگذاری موتور نمایش PDF'))
    document.head.appendChild(script)
  })

  const pdfjsLib = (window as any).pdfjsLib
  if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
  }
  return pdfjsLib
}

function drawSingleElement(ctx: CanvasRenderingContext2D, el: IWhiteboardElement, w: number, h: number) {
  if (!el) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = el.color || '#0f172a'
  ctx.fillStyle = el.color || '#0f172a'
  const scaledSize = Math.max(1.8, ((el.size || 4) / 1000) * Math.max(w, h))
  ctx.lineWidth = el.tool === 'highlighter' ? scaledSize * 3 : scaledSize
  ctx.globalAlpha = el.tool === 'highlighter' ? 0.35 : 1.0

  if ((el.tool === 'pen' || el.tool === 'highlighter') && el.points && el.points.length > 0) {
    ctx.beginPath()
    const first = el.points[0]
    ctx.moveTo(first.x * w, first.y * h)
    if (el.points.length === 1) {
      ctx.arc(first.x * w, first.y * h, scaledSize / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      for (let i = 1; i < el.points.length; i++) {
        const p = el.points[i]
        ctx.lineTo(p.x * w, p.y * h)
      }
      ctx.stroke()
    }
  } else if (el.tool === 'line' && el.start && el.end) {
    ctx.beginPath()
    ctx.moveTo(el.start.x * w, el.start.y * h)
    ctx.lineTo(el.end.x * w, el.end.y * h)
    ctx.stroke()
  } else if (el.tool === 'arrow' && el.start && el.end) {
    const sx = el.start.x * w
    const sy = el.start.y * h
    const ex = el.end.x * w
    const ey = el.end.y * h
    const headLen = Math.max(12, scaledSize * 3.5)
    const angle = Math.atan2(ey - sy, ex - sx)

    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(ex, ey)
    ctx.lineTo(
      ex - headLen * Math.cos(angle - Math.PI / 6),
      ey - headLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      ex - headLen * Math.cos(angle + Math.PI / 6),
      ey - headLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  } else if (el.tool === 'rect' && el.start && el.end) {
    const rx = Math.min(el.start.x, el.end.x) * w
    const ry = Math.min(el.start.y, el.end.y) * h
    const rw = Math.abs(el.end.x - el.start.x) * w
    const rh = Math.abs(el.end.y - el.start.y) * h
    ctx.strokeRect(rx, ry, rw, rh)
  } else if (el.tool === 'circle' && el.start && el.end) {
    const cx = ((el.start.x + el.end.x) / 2) * w
    const cy = ((el.start.y + el.end.y) / 2) * h
    const rx = (Math.abs(el.end.x - el.start.x) / 2) * w
    const ry = (Math.abs(el.end.y - el.start.y) / 2) * h
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (el.tool === 'text' && el.start && el.text) {
    const fontSize = Math.max(15, scaledSize * 4.2)
    ctx.font = `bold ${fontSize}px Shabnam, Tahoma, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(el.text, el.start.x * w, el.start.y * h)
  }

  ctx.restore()
}

interface WhiteboardPageSurfaceProps {
  pageNum: number
  totalPages: number
  gridMode: IWhiteboardState['gridMode']
  bgSrc?: string
  elements: IWhiteboardElement[]
  draftElement: IWhiteboardElement | null
  remoteDraftElement?: IWhiteboardElement | null
  canDraw: boolean
  activeTool: WhiteboardTool
  isScrollDocument: boolean
  zoom: number
  localLaser: { page: number; x: number; y: number } | null
  remoteLaser: ILaserPointerState | null
  textPrompt: { page: number; x: number; y: number; value: string } | null
  bgImageCache: Map<string, HTMLImageElement>
  onPointerDownPage: (pageNum: number, e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMovePage: (pageNum: number, e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUpPage: (pageNum: number) => void
  onChangeTextPrompt: (val: string) => void
  onSubmitTextPrompt: () => void
  onCancelTextPrompt: () => void
  registerPageRef?: (pageNum: number, el: HTMLDivElement | null) => void
}

const WhiteboardPageSurface: React.FC<WhiteboardPageSurfaceProps> = ({
  pageNum,
  totalPages,
  gridMode,
  bgSrc,
  elements,
  draftElement,
  remoteDraftElement,
  canDraw,
  activeTool,
  isScrollDocument,
  zoom,
  localLaser,
  remoteLaser,
  textPrompt,
  bgImageCache,
  onPointerDownPage,
  onPointerMovePage,
  onPointerUpPage,
  onChangeTextPrompt,
  onSubmitTextPrompt,
  onCancelTextPrompt,
  registerPageRef,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [aspectRatio, setAspectRatio] = useState<number>(1.414) // default portrait/slide friendly ratio

  useEffect(() => {
    if (!bgSrc) {
      setAspectRatio(1.414)
      return
    }
    const cached = bgImageCache.get(bgSrc)
    if (cached && cached.complete && cached.naturalWidth > 0) {
      setAspectRatio(cached.naturalWidth / cached.naturalHeight)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      bgImageCache.set(bgSrc, img)
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight)
      }
    }
    img.src = bgSrc
  }, [bgSrc, bgImageCache])

  const drawSurface = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const targetW = Math.floor(rect.width * dpr)
    const targetH = Math.floor(rect.height * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const w = rect.width
    const h = rect.height

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)

    // Grid overlay only on blank boards (or subtle when no slide background)
    if (!bgSrc) {
      const step = Math.max(18, 30 * (isScrollDocument ? 1 : zoom))
      if (gridMode === 'grid') {
        ctx.strokeStyle = '#f1f5f9'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = step; x < w; x += step) {
          ctx.moveTo(x, 0)
          ctx.lineTo(x, h)
        }
        for (let y = step; y < h; y += step) {
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
        }
        ctx.stroke()
      } else if (gridMode === 'lined') {
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let y = step; y < h; y += step) {
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
        }
        ctx.stroke()
      } else if (gridMode === 'dots') {
        ctx.fillStyle = '#cbd5e1'
        for (let x = step; x < w; x += step) {
          for (let y = step; y < h; y += step) {
            ctx.beginPath()
            ctx.arc(x, y, 1.2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    } else {
      const cachedImg = bgImageCache.get(bgSrc)
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        if (isScrollDocument) {
          // Exact aspect-locked container: draw edge-to-edge so annotations align 1:1 on zoom & across screens
          ctx.drawImage(cachedImg, 0, 0, w, h)
        } else {
          const scale = Math.min(w / cachedImg.naturalWidth, h / cachedImg.naturalHeight)
          const dw = cachedImg.naturalWidth * scale
          const dh = cachedImg.naturalHeight * scale
          const dx = (w - dw) / 2
          const dy = (h - dh) / 2
          ctx.drawImage(cachedImg, dx, dy, dw, dh)
        }
      }
    }

    for (const el of elements) {
      drawSingleElement(ctx, el, w, h)
    }
    if (remoteDraftElement) {
      drawSingleElement(ctx, remoteDraftElement, w, h)
    }
    if (draftElement) {
      drawSingleElement(ctx, draftElement, w, h)
    }

    ctx.restore()
  }, [bgSrc, bgImageCache, gridMode, elements, remoteDraftElement, draftElement, isScrollDocument, zoom])

  useEffect(() => {
    drawSurface()
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(() => drawSurface())
    ro.observe(wrapper)
    window.addEventListener('resize', drawSurface)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', drawSurface)
    }
  }, [drawSurface, aspectRatio])

  const showRemoteLaser =
    remoteLaser && remoteLaser.active && (!remoteLaser.page || remoteLaser.page === pageNum)

  const allowNativeTouchScroll = !canDraw || activeTool === 'pan'

  return (
    <div
      ref={el => {
        wrapperRef.current = el
        registerPageRef?.(pageNum, el)
      }}
      style={
        isScrollDocument
          ? { aspectRatio: `${aspectRatio}` }
          : undefined
      }
      className={
        isScrollDocument
          ? 'relative w-full bg-white rounded-xl shadow-lg ring-1 ring-slate-300/60 overflow-hidden shrink-0'
          : 'relative w-full h-full bg-white overflow-hidden'
      }
    >
      {isScrollDocument && (
        <div className="pointer-events-none absolute top-2 end-2 z-10 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-bold backdrop-blur-xs tabular-nums">
          صفحه {pageNum} از {totalPages}
        </div>
      )}

      <canvas
        ref={canvasRef}
        data-classroom-whiteboard="true"
        onPointerDown={e => onPointerDownPage(pageNum, e)}
        onPointerMove={e => onPointerMovePage(pageNum, e)}
        onPointerUp={() => onPointerUpPage(pageNum)}
        onPointerCancel={() => onPointerUpPage(pageNum)}
        style={{ touchAction: allowNativeTouchScroll ? 'auto' : 'none' }}
        className={`w-full h-full block ${
          !canDraw || activeTool === 'pan'
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : 'cursor-crosshair'
        }`}
      />

      {localLaser && localLaser.page === pageNum && (
        <div
          style={{
            left: `${localLaser.x * 100}%`,
            top: `${localLaser.y * 100}%`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 shadow-[0_0_14px_5px_rgba(220,38,38,0.85)] ring-2 ring-white"
        />
      )}

      {showRemoteLaser && (
        <div
          style={{
            left: `${remoteLaser!.x * 100}%`,
            top: `${remoteLaser!.y * 100}%`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5"
        >
          <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_16px_6px_rgba(220,38,38,0.9)] ring-2 ring-white animate-ping" />
          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
            {remoteLaser!.name}
          </span>
        </div>
      )}

      {textPrompt && textPrompt.page === pageNum && (
        <div
          style={{
            left: `${Math.min(Math.max(textPrompt.x * 100, 8), 65)}%`,
            top: `${Math.min(Math.max(textPrompt.y * 100, 8), 75)}%`,
          }}
          className="absolute z-30 bg-slate-900 text-white p-2 rounded-2xl shadow-2xl border border-blue-500 flex items-center gap-1.5"
        >
          <input
            type="text"
            autoFocus
            value={textPrompt.value}
            onChange={e => onChangeTextPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSubmitTextPrompt()
              if (e.key === 'Escape') onCancelTextPrompt()
            }}
            placeholder="متن یا فرمول..."
            className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-hidden focus:border-blue-400 w-36 sm:w-52"
          />
          <button
            type="button"
            onClick={onSubmitTextPrompt}
            className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 cursor-pointer"
          >
            ثبت
          </button>
          <button
            type="button"
            onClick={onCancelTextPrompt}
            className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export const TeacherWhiteboard: React.FC<TeacherWhiteboardProps> = ({
  whiteboard,
  setWhiteboard,
  remoteLaser,
  remoteDraftElement,
  isTeacher,
  sendWhiteboardAction,
  fileInputRef: externalFileInputRef,
}) => {
  const canDraw = isTeacher || !!whiteboard?.allowStudentDraw
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const internalFileInputRef = useRef<HTMLInputElement | null>(null)
  const fileInput = externalFileInputRef || internalFileInputRef

  const bgImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const lastProgressSentRef = useRef<number>(0)

  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen')
  const [color, setColor] = useState<string>('#0f172a')
  const [size, setSize] = useState<number>(4.5)
  const [zoom, setZoom] = useState<number>(1)
  const [viewMode, setViewMode] = useState<'auto' | 'scroll' | 'single'>('auto')
  const [isDrawing, setIsDrawing] = useState(false)
  const [activeDrawPage, setActiveDrawPage] = useState<number>(1)
  const [draftElement, setDraftElement] = useState<IWhiteboardElement | null>(null)
  const [localLaser, setLocalLaser] = useState<{ page: number; x: number; y: number } | null>(null)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [textPrompt, setTextPrompt] = useState<{ page: number; x: number; y: number; value: string } | null>(null)

  const currentPage = whiteboard?.currentPage || 1
  const loadedBgKeys = useMemo(
    () =>
      Object.keys(whiteboard?.pageBackgrounds || {})
        .map(Number)
        .filter(n => !Number.isNaN(n) && !!whiteboard?.pageBackgrounds?.[n]),
    [whiteboard?.pageBackgrounds]
  )
  const hasLoadedDocument = loadedBgKeys.length > 0
  const maxBgPage = loadedBgKeys.length > 0 ? Math.max(...loadedBgKeys) : 0
  const totalPages = Math.max(whiteboard?.totalPages || 10, maxBgPage)

  // Continuous scrollable mode activates automatically whenever a PDF / slide is loaded
  const isScrollDocument =
    viewMode === 'scroll' || (viewMode === 'auto' && hasLoadedDocument)

  const pagesToRender = useMemo(() => {
    if (!isScrollDocument) return [currentPage]
    const pageLimit = hasLoadedDocument ? Math.max(maxBgPage, 1) : totalPages
    return Array.from({ length: pageLimit }, (_, i) => i + 1)
  }, [isScrollDocument, currentPage, hasLoadedDocument, maxBgPage, totalPages])

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): IWhiteboardPoint => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(Math.max((e.clientX - rect.left) / Math.max(rect.width, 1), 0), 1),
      y: Math.min(Math.max((e.clientY - rect.top) / Math.max(rect.height, 1), 0), 1),
    }
  }

  const eraseAtPoint = (pageNum: number, pt: IWhiteboardPoint) => {
    const pageElements = (whiteboard?.pages && whiteboard.pages[pageNum]) || []
    const threshold = 0.035
    const target = pageElements.find(el => {
      if (el.points) {
        return el.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold)
      }
      if (el.start && el.end) {
        const cx = (el.start.x + el.end.x) / 2
        const cy = (el.start.y + el.end.y) / 2
        return (
          Math.hypot(el.start.x - pt.x, el.start.y - pt.y) < threshold * 1.5 ||
          Math.hypot(el.end.x - pt.x, el.end.y - pt.y) < threshold * 1.5 ||
          Math.hypot(cx - pt.x, cy - pt.y) < threshold * 1.5
        )
      }
      if (el.start) {
        return Math.hypot(el.start.x - pt.x, el.start.y - pt.y) < threshold * 2
      }
      return false
    })

    if (target) {
      setWhiteboard(prev => ({
        ...prev,
        pages: {
          ...prev.pages,
          [pageNum]: (prev.pages[pageNum] || []).filter(e => e.id !== target.id),
        },
      }))
      sendWhiteboardAction('erase_element', { page: pageNum, elementId: target.id })
    }
  }

  const handlePointerDownPage = (pageNum: number, e: React.PointerEvent<HTMLCanvasElement>) => {
    setShowColorMenu(false)
    setShowShapeMenu(false)
    if (!canDraw || activeTool === 'pan') return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}

    const pt = getNormalizedPoint(e)
    setActiveDrawPage(pageNum)

    if (activeTool === 'laser') {
      setIsDrawing(true)
      setLocalLaser({ page: pageNum, x: pt.x, y: pt.y })
      sendWhiteboardAction('laser_move', { page: pageNum, x: pt.x, y: pt.y, active: true })
      return
    }

    if (activeTool === 'eraser') {
      setIsDrawing(true)
      eraseAtPoint(pageNum, pt)
      return
    }

    if (activeTool === 'text') {
      setTextPrompt({ page: pageNum, x: pt.x, y: pt.y, value: '' })
      return
    }

    setIsDrawing(true)
    const id = `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setDraftElement({
        id,
        tool: activeTool,
        color,
        size,
        points: [pt],
      })
    } else {
      setDraftElement({
        id,
        tool: activeTool,
        color,
        size,
        start: pt,
        end: pt,
      })
    }
  }

  const handlePointerMovePage = (pageNum: number, e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || activeTool === 'pan') return
    const pt = getNormalizedPoint(e)
    const targetPage = isDrawing ? activeDrawPage : pageNum

    if (activeTool === 'laser') {
      if (isDrawing) {
        setLocalLaser({ page: targetPage, x: pt.x, y: pt.y })
        sendWhiteboardAction('laser_move', { page: targetPage, x: pt.x, y: pt.y, active: true })
      }
      return
    }

    if (!isDrawing) return

    if (activeTool === 'eraser') {
      eraseAtPoint(targetPage, pt)
      return
    }

    if (!draftElement) return

    let updated: IWhiteboardElement
    if (draftElement.tool === 'pen' || draftElement.tool === 'highlighter') {
      updated = { ...draftElement, points: [...(draftElement.points || []), pt] }
    } else {
      updated = { ...draftElement, end: pt }
    }
    setDraftElement(updated)

    const now = Date.now()
    if (now - lastProgressSentRef.current > 70) {
      lastProgressSentRef.current = now
      sendWhiteboardAction('draw_progress', { page: targetPage, element: updated })
    }
  }

  const handlePointerUpPage = (pageNum: number) => {
    if (!canDraw) return
    const targetPage = activeDrawPage || pageNum

    if (activeTool === 'laser') {
      setIsDrawing(false)
      setLocalLaser(null)
      sendWhiteboardAction('laser_move', { page: targetPage, x: 0, y: 0, active: false })
      return
    }

    if (isDrawing && draftElement) {
      const committed = draftElement
      setDraftElement(null)
      setIsDrawing(false)
      setWhiteboard(prev => ({
        ...prev,
        pages: {
          ...(prev.pages || {}),
          [targetPage]: [...((prev.pages && prev.pages[targetPage]) || []), committed],
        },
      }))
      sendWhiteboardAction('add_element', { page: targetPage, element: committed })
    } else {
      setIsDrawing(false)
    }
  }

  const submitTextPrompt = () => {
    if (!textPrompt || !textPrompt.value.trim()) {
      setTextPrompt(null)
      return
    }
    const targetPage = textPrompt.page
    const element: IWhiteboardElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: 'text',
      color,
      size,
      start: { x: textPrompt.x, y: textPrompt.y },
      text: textPrompt.value.trim(),
    }
    setWhiteboard(prev => ({
      ...prev,
      pages: {
        ...(prev.pages || {}),
        [targetPage]: [...((prev.pages && prev.pages[targetPage]) || []), element],
      },
    }))
    sendWhiteboardAction('add_element', { page: targetPage, element })
    setTextPrompt(null)
  }

  const handleUndo = () => {
    const targetPage = isScrollDocument ? activeDrawPage || currentPage : currentPage
    const pageEls = (whiteboard?.pages && whiteboard.pages[targetPage]) || []
    if (!canDraw || pageEls.length === 0) return
    setWhiteboard(prev => ({
      ...prev,
      pages: {
        ...(prev.pages || {}),
        [targetPage]: ((prev.pages && prev.pages[targetPage]) || []).slice(0, -1),
      },
    }))
    sendWhiteboardAction('undo', { page: targetPage })
  }

  const handleJumpOrChangePage = (nextPage: number) => {
    const maxPageCount = isScrollDocument ? pagesToRender.length : totalPages
    const target = Math.min(Math.max(nextPage, 1), maxPageCount)
    if (isScrollDocument) {
      const el = pageRefs.current.get(target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      if (!isTeacher) return
    }
    if (!isTeacher) return
    setWhiteboard(prev => ({
      ...prev,
      currentPage: target,
      pages: {
        ...(prev.pages || {}),
        [target]: (prev.pages && prev.pages[target]) || [],
      },
    }))
    sendWhiteboardAction('change_page', { page: target })
  }

  // Handle Ctrl/Cmd + Wheel Zoom cleanly
  const handleWheelViewport = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      setZoom(prev => Number(Math.min(2.5, Math.max(0.5, prev + delta)).toFixed(2)))
    }
  }

  // Handle PDF or Image upload onto the whiteboard
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setUploadingFile('در حال پردازش صفحات PDF...')
        const pdfjsLib = await loadPdfJs()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const numPages = Math.min(pdf.numPages, 30)
        const newBackgrounds: Record<number, string> = {}

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          setUploadingFile(`بارگذاری صفحه ${pageNum} از ${numPages} فایل PDF...`)
          const page = await pdf.getPage(pageNum)
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = Math.min(1400 / baseViewport.width, 1.8)
          const viewport = page.getViewport({ scale })

          const offCanvas = document.createElement('canvas')
          offCanvas.width = Math.floor(viewport.width)
          offCanvas.height = Math.floor(viewport.height)
          const offCtx = offCanvas.getContext('2d')!
          offCtx.fillStyle = '#ffffff'
          offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height)

          await page.render({ canvasContext: offCtx, viewport }).promise
          const dataUrl = offCanvas.toDataURL('image/jpeg', 0.78)
          newBackgrounds[pageNum] = dataUrl

          sendWhiteboardAction('set_page_backgrounds', {
            backgrounds: { [pageNum]: dataUrl },
            fileName: file.name,
            totalPages: Math.max(10, numPages),
            ...(pageNum === 1 ? { currentPage: 1 } : {}),
          })
        }

        setWhiteboard(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: Math.max(prev.totalPages || 10, numPages),
          activeFileName: file.name,
          pageBackgrounds: {
            ...(prev.pageBackgrounds || {}),
            ...newBackgrounds,
          },
        }))
        setViewMode('scroll')
        setZoom(1)
        setUploadingFile(null)
      } else if (file.type.startsWith('image/')) {
        setUploadingFile('در حال بارگذاری تصویر روی تخته...')
        const bitmapUrl = URL.createObjectURL(file)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('خطا در خواندن تصویر'))
          img.src = bitmapUrl
        })

        const maxDim = 1400
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
        const offCanvas = document.createElement('canvas')
        offCanvas.width = Math.floor(img.naturalWidth * scale)
        offCanvas.height = Math.floor(img.naturalHeight * scale)
        const offCtx = offCanvas.getContext('2d')!
        offCtx.fillStyle = '#ffffff'
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height)
        offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height)
        URL.revokeObjectURL(bitmapUrl)

        const dataUrl = offCanvas.toDataURL('image/jpeg', 0.82)
        setWhiteboard(prev => ({
          ...prev,
          activeFileName: file.name,
          pageBackgrounds: {
            ...(prev.pageBackgrounds || {}),
            [currentPage]: dataUrl,
          },
        }))
        sendWhiteboardAction('set_page_backgrounds', {
          backgrounds: { [currentPage]: dataUrl },
          fileName: file.name,
          currentPage,
        })
        setUploadingFile(null)
      }
    } catch (err: any) {
      console.error('Whiteboard file load error:', err)
      setUploadingFile(null)
      alert(err.message || 'خطا در بارگذاری فایل روی تخته')
    }
  }

  const isShapeTool = ['line', 'arrow', 'rect', 'circle'].includes(activeTool)

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl select-none">
      {/* Hidden File Input for PDF / Image Upload */}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Whiteboard + PDF Document Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-1.5 py-1 sm:px-2.5 sm:py-1.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-1 sm:gap-2 z-20 shrink-0 select-none">
        {canDraw ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {/* Scroll / Hand Pan Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('pan')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'pan'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="پیمایش / اسکرول بدون خط انداختن"
            >
              <span>🖐️</span>
              <span className="hidden xl:inline">اسکرول</span>
            </button>

            {/* Pen */}
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="قلم تحریر"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
              <span className="hidden sm:inline">قلم</span>
            </button>

            {/* Highlighter */}
            <button
              type="button"
              onClick={() => setActiveTool('highlighter')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="هایلایت"
            >
              <span>🖍️</span>
              <span className="hidden md:inline">هایلایت</span>
            </button>

            {/* Shapes */}
            <button
              type="button"
              onClick={() => {
                setShowShapeMenu(v => !v)
                setShowColorMenu(false)
              }}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                isShapeTool
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="اشکال هندسی"
            >
              <span>📐</span>
              <span className="hidden lg:inline">اشکال</span>
            </button>

            {/* Text */}
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="متن روی صفحه"
            >
              <span className="font-serif text-sm px-0.5">T</span>
              <span className="hidden lg:inline">متن</span>
            </button>

            {/* Laser */}
            <button
              type="button"
              onClick={() => setActiveTool('laser')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'laser'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="اشاره‌گر لیزری"
            >
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
              <span className="hidden sm:inline">لیزر</span>
            </button>

            {/* Eraser */}
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="پاک‌کن"
            >
              <span>🧹</span>
            </button>

            {/* Color & Size Picker */}
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(v => !v)
                setShowShapeMenu(false)
              }}
              className="p-1 px-1.5 sm:p-1.5 sm:px-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-700"
              title="رنگ و ضخامت"
            >
              <span
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] sm:text-[11px] text-slate-300 hidden sm:inline">
                {SIZES.find(s => s.value === size)?.label || 'ضخامت'}
              </span>
            </button>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 cursor-pointer"
              title="واگرد (Undo)"
            >
              ↩️
            </button>

            {/* Upload PDF/Image */}
            {isTeacher && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="p-1 px-2 sm:p-1.5 sm:px-2.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                title="بارگذاری فایل PDF یا تصویر"
              >
                <span>📄</span>
                <span className="hidden sm:inline">PDF / تصویر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 px-1 py-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs">تخته و اسلاید</span>
            {whiteboard?.activeFileName && (
              <span className="text-[10px] sm:text-[11px] text-emerald-300 bg-slate-800 px-2 py-0.5 rounded-lg truncate max-w-[140px] sm:max-w-[200px]">
                📄 {whiteboard.activeFileName}
              </span>
            )}
          </div>
        )}

        {/* Controls: Zoom (Always visible to EVERY user!) + View Mode + Page Jump */}
        <div className="flex items-center justify-between md:justify-end gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-slate-800 px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-lg sm:rounded-xl border border-slate-700 tabular-nums">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              disabled={zoom <= 0.5}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-35 cursor-pointer"
              title="کوچک‌نمایی"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-1 text-[10px] sm:text-[11px] font-extrabold text-cyan-300 hover:text-white cursor-pointer"
              title="بازنشانی بزرگنمایی به ۱۰۰٪"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
              disabled={zoom >= 2.5}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-35 cursor-pointer"
              title="بزرگ‌نمایی"
            >
              +
            </button>
          </div>

          {/* Continuous Scroll vs Single Page Switcher */}
          <button
            type="button"
            onClick={() => setViewMode(isScrollDocument ? 'single' : 'scroll')}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold border transition cursor-pointer shrink-0 ${
              isScrollDocument
                ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isScrollDocument ? 'تغییر به نمای تک‌صفحه' : 'نمایش پیوسته و قابل اسکرول صفحات'}
          >
            {isScrollDocument ? '📜 پیوسته' : '📄 تک‌صفحه'}
          </button>

          {/* Compact Page Navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800 px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-lg sm:rounded-xl border border-slate-700 tabular-nums shrink-0">
            <button
              type="button"
              disabled={currentPage <= 1 || (!isScrollDocument && !isTeacher)}
              onClick={() => handleJumpOrChangePage(currentPage - 1)}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-slate-700 flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
              title="صفحه قبل"
            >
              ❯
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 px-0.5 sm:px-1 whitespace-nowrap">
              {isScrollDocument ? `${pagesToRender.length} ص` : `${currentPage} / ${totalPages}`}
            </span>
            <button
              type="button"
              disabled={currentPage >= (isScrollDocument ? pagesToRender.length : totalPages) || (!isScrollDocument && !isTeacher)}
              onClick={() => handleJumpOrChangePage(currentPage + 1)}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-slate-700 flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
              title="صفحه بعد"
            >
              ❮
            </button>
          </div>
        </div>
      </div>

      {/* Popover: Shapes Selector */}
      {showShapeMenu && (
        <div className="absolute top-20 sm:top-12 start-2 sm:start-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-1.5 max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar">
          {[
            { id: 'line', label: 'خط صاف', icon: '╱' },
            { id: 'arrow', label: 'فلش', icon: '↗' },
            { id: 'rect', label: 'مستطیل', icon: '▭' },
            { id: 'circle', label: 'دایره', icon: '◯' },
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveTool(s.id as WhiteboardTool)
                setShowShapeMenu(false)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                activeTool === s.id ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Popover: Color & Size Picker */}
      {showColorMenu && (
        <div className="absolute top-12 start-12 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            {COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  setColor(c.hex)
                  setShowColorMenu(false)
                }}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                  color === c.hex ? 'border-white scale-120 ring-2 ring-blue-400' : 'border-slate-600'
                }`}
                title={c.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-t border-slate-800 pt-2">
            {SIZES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSize(s.value)
                  setShowColorMenu(false)
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  size === s.value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PDF / Image Processing Overlay */}
      {uploadingFile && (
        <div className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
          <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold">{uploadingFile}</p>
        </div>
      )}

      {/* Scrollable & Zoomable Interactive Stage */}
      <div
        ref={scrollViewportRef}
        onWheel={handleWheelViewport}
        className={`relative flex-1 w-full h-full ${
          isScrollDocument || zoom > 1
            ? 'overflow-auto bg-slate-800/70 p-2 sm:p-4'
            : 'overflow-hidden bg-white'
        }`}
      >
        <div
          style={
            isScrollDocument
              ? { width: `${Math.round(zoom * 100)}%`, maxWidth: zoom <= 1 ? '920px' : 'none' }
              : zoom > 1
              ? { width: `${Math.round(zoom * 100)}%`, height: `${Math.round(zoom * 100)}%` }
              : { width: '100%', height: '100%' }
          }
          className={
            isScrollDocument
              ? 'mx-auto flex flex-col gap-4'
              : 'w-full h-full'
          }
        >
          {pagesToRender.map(pageNum => (
            <WhiteboardPageSurface
              key={pageNum}
              pageNum={pageNum}
              totalPages={pagesToRender.length}
              gridMode={whiteboard?.gridMode || 'grid'}
              bgSrc={whiteboard?.pageBackgrounds?.[pageNum]}
              elements={(whiteboard?.pages && whiteboard.pages[pageNum]) || []}
              draftElement={isDrawing && activeDrawPage === pageNum ? draftElement : null}
              remoteDraftElement={
                remoteDraftElement && remoteDraftElement.page === pageNum
                  ? remoteDraftElement.element
                  : null
              }
              canDraw={canDraw}
              activeTool={activeTool}
              isScrollDocument={isScrollDocument}
              zoom={zoom}
              localLaser={localLaser}
              remoteLaser={remoteLaser}
              textPrompt={textPrompt}
              bgImageCache={bgImageCacheRef.current}
              onPointerDownPage={handlePointerDownPage}
              onPointerMovePage={handlePointerMovePage}
              onPointerUpPage={handlePointerUpPage}
              onChangeTextPrompt={val => setTextPrompt(prev => (prev ? { ...prev, value: val } : null))}
              onSubmitTextPrompt={submitTextPrompt}
              onCancelTextPrompt={() => setTextPrompt(null)}
              registerPageRef={(num, el) => {
                if (el) pageRefs.current.set(num, el)
                else pageRefs.current.delete(num)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
