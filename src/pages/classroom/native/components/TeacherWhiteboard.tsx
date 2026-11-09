import React, { useEffect, useRef, useState, useCallback } from 'react'
import type {
  IWhiteboardElement,
  IWhiteboardPoint,
  IWhiteboardState,
  ILaserPointerState,
  WhiteboardTool,
  WhiteboardGridMode,
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

export const TeacherWhiteboard: React.FC<TeacherWhiteboardProps> = ({
  whiteboard,
  setWhiteboard,
  remoteLaser,
  remoteDraftElement,
  isTeacher,
  sendWhiteboardAction,
  fileInputRef: externalFileInputRef,
}) => {
  const canDraw = isTeacher || whiteboard.allowStudentDraw
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const internalFileInputRef = useRef<HTMLInputElement | null>(null)
  const fileInput = externalFileInputRef || internalFileInputRef

  // Cache decoded HTMLImageElement instances for background slides (PDF/Images)
  const bgImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const lastProgressSentRef = useRef<number>(0)

  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen')
  const [color, setColor] = useState<string>('#0f172a')
  const [size, setSize] = useState<number>(4.5)
  const [isDrawing, setIsDrawing] = useState(false)
  const [draftElement, setDraftElement] = useState<IWhiteboardElement | null>(null)
  const [localLaser, setLocalLaser] = useState<IWhiteboardPoint | null>(null)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)

  // Inline text input state
  const [textPrompt, setTextPrompt] = useState<{ x: number; y: number; value: string } | null>(null)

  const currentPage = whiteboard.currentPage || 1
  const totalPages = whiteboard.totalPages || 10
  const currentElements = (whiteboard.pages && whiteboard.pages[currentPage]) || []
  const currentBgSrc = whiteboard.pageBackgrounds?.[currentPage]

  const drawSingleElement = useCallback(
    (ctx: CanvasRenderingContext2D, el: IWhiteboardElement, w: number, h: number) => {
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
    },
    []
  )

  const renderBoard = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
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

    // 1. Base White Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)

    // 2. Grid pattern
    const step = 30
    if (whiteboard.gridMode === 'grid') {
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
    } else if (whiteboard.gridMode === 'lined') {
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let y = step; y < h; y += step) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()
    } else if (whiteboard.gridMode === 'dots') {
      ctx.fillStyle = '#cbd5e1'
      for (let x = step; x < w; x += step) {
        for (let y = step; y < h; y += step) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // 3. Background PDF / Image slide (if present on this page)
    if (currentBgSrc) {
      let cachedImg = bgImageCacheRef.current.get(currentBgSrc)
      if (!cachedImg) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          bgImageCacheRef.current.set(currentBgSrc, img)
          renderBoard()
        }
        img.src = currentBgSrc
      } else if (cachedImg.complete && cachedImg.naturalWidth > 0) {
        // Draw with aspect-ratio preserved (contain) centered on board
        const scale = Math.min(w / cachedImg.naturalWidth, h / cachedImg.naturalHeight)
        const dw = cachedImg.naturalWidth * scale
        const dh = cachedImg.naturalHeight * scale
        const dx = (w - dw) / 2
        const dy = (h - dh) / 2
        ctx.drawImage(cachedImg, dx, dy, dw, dh)
      }
    }

    // 4. Committed elements
    for (const el of currentElements) {
      drawSingleElement(ctx, el, w, h)
    }

    // 5. Remote live stroke preview
    if (remoteDraftElement && remoteDraftElement.page === currentPage && remoteDraftElement.element) {
      drawSingleElement(ctx, remoteDraftElement.element, w, h)
    }

    // 6. Local active draft stroke
    if (draftElement) {
      drawSingleElement(ctx, draftElement, w, h)
    }

    ctx.restore()
  }, [
    whiteboard.gridMode,
    currentBgSrc,
    currentElements,
    currentPage,
    remoteDraftElement,
    draftElement,
    drawSingleElement,
  ])

  useEffect(() => {
    renderBoard()
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      renderBoard()
    })
    ro.observe(container)
    window.addEventListener('resize', renderBoard)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', renderBoard)
    }
  }, [renderBoard])

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): IWhiteboardPoint => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.min(Math.max((e.clientX - rect.left) / Math.max(rect.width, 1), 0), 1),
      y: Math.min(Math.max((e.clientY - rect.top) / Math.max(rect.height, 1), 0), 1),
    }
  }

  const eraseAtPoint = (pt: IWhiteboardPoint) => {
    const threshold = 0.035
    const target = currentElements.find(el => {
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
          [currentPage]: (prev.pages[currentPage] || []).filter(e => e.id !== target.id),
        },
      }))
      sendWhiteboardAction('erase_element', { page: currentPage, elementId: target.id })
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setShowColorMenu(false)
    setShowShapeMenu(false)
    if (!canDraw) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}

    const pt = getNormalizedPoint(e)

    if (activeTool === 'laser') {
      setIsDrawing(true)
      setLocalLaser(pt)
      sendWhiteboardAction('laser_move', { x: pt.x, y: pt.y, active: true })
      return
    }

    if (activeTool === 'eraser') {
      setIsDrawing(true)
      eraseAtPoint(pt)
      return
    }

    if (activeTool === 'text') {
      setTextPrompt({ x: pt.x, y: pt.y, value: '' })
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

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return
    const pt = getNormalizedPoint(e)

    if (activeTool === 'laser') {
      if (isDrawing) {
        setLocalLaser(pt)
        sendWhiteboardAction('laser_move', { x: pt.x, y: pt.y, active: true })
      }
      return
    }

    if (!isDrawing) return

    if (activeTool === 'eraser') {
      eraseAtPoint(pt)
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

    // Broadcast live stroke progress throttled every 70ms so students see live writing
    const now = Date.now()
    if (now - lastProgressSentRef.current > 70) {
      lastProgressSentRef.current = now
      sendWhiteboardAction('draw_progress', { page: currentPage, element: updated })
    }
  }

  const handlePointerUp = () => {
    if (!canDraw) return

    if (activeTool === 'laser') {
      setIsDrawing(false)
      setLocalLaser(null)
      sendWhiteboardAction('laser_move', { x: 0, y: 0, active: false })
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
          [currentPage]: [...((prev.pages && prev.pages[currentPage]) || []), committed],
        },
      }))
      sendWhiteboardAction('add_element', { page: currentPage, element: committed })
    } else {
      setIsDrawing(false)
    }
  }

  const submitTextPrompt = () => {
    if (!textPrompt || !textPrompt.value.trim()) {
      setTextPrompt(null)
      return
    }
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
        [currentPage]: [...((prev.pages && prev.pages[currentPage]) || []), element],
      },
    }))
    sendWhiteboardAction('add_element', { page: currentPage, element })
    setTextPrompt(null)
  }

  const handleUndo = () => {
    if (!canDraw || currentElements.length === 0) return
    setWhiteboard(prev => ({
      ...prev,
      pages: {
        ...(prev.pages || {}),
        [currentPage]: ((prev.pages && prev.pages[currentPage]) || []).slice(0, -1),
      },
    }))
    sendWhiteboardAction('undo', { page: currentPage })
  }

  const handleChangePage = (nextPage: number) => {
    if (!isTeacher) return
    const target = Math.min(Math.max(nextPage, 1), totalPages)
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
        const numPages = Math.min(pdf.numPages, 15)
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

          // Send page-by-page so WebSocket frames stay small & responsive
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
    <div className="relative flex flex-col w-full h-full bg-white rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl select-none">
      {/* Hidden File Input for PDF / Image Upload */}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Compact Top Floating/Docked Whiteboard Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-2 py-1.5 border-b border-slate-800 flex items-center justify-between gap-1.5 z-20">
        {canDraw ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {/* Pen */}
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
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
              <span className="hidden md:inline text-[11px]">قلم</span>
            </button>

            {/* Highlighter */}
            <button
              type="button"
              onClick={() => setActiveTool('highlighter')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="ماژیک هایلایت"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m9 11-6 6v3h9l3-3" />
                <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
              <span className="hidden md:inline text-[11px]">هایلایت</span>
            </button>

            {/* Shapes Popover Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowShapeMenu(v => !v)
                  setShowColorMenu(false)
                }}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isShapeTool
                    ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="اشکال هندسی و خط"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                </svg>
                <span className="hidden md:inline text-[11px]">اشکال</span>
              </button>
            </div>

            {/* Text Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="افزودن متن یا فرمول"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              <span className="hidden md:inline text-[11px]">متن</span>
            </button>

            {/* Laser Pointer */}
            <button
              type="button"
              onClick={() => setActiveTool('laser')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'laser'
                  ? 'bg-red-600 text-white ring-1 ring-red-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="اشاره‌گر لیزری زنده"
            >
              <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-300 inline-block" />
              <span className="hidden md:inline text-[11px]">لیزر</span>
            </button>

            {/* Eraser */}
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="پاک‌کن"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                <path d="M22 21H7" />
                <path d="m5 11 9 9" />
              </svg>
            </button>

            {/* Color & Stroke Picker Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(v => !v)
                setShowShapeMenu(false)
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-700"
              title="انتخاب رنگ و ضخامت قلم"
            >
              <span
                style={{ backgroundColor: color }}
                className="w-4 h-4 rounded-full border border-white inline-block"
              />
              <span className="text-[10px] text-slate-300 font-bold px-0.5">
                {SIZES.find(s => s.value === size)?.label || 'متوسط'}
              </span>
            </button>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 cursor-pointer"
              title="واگرد آخرین خط"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>

            {/* Upload PDF / Image to Board (Teacher) */}
            {isTeacher && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                title="بارگذاری فایل PDF یا عکس درس روی تخته"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span>PDF / تصویر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 py-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>تخته هوشمند مدرس</span>
            {whiteboard.activeFileName && (
              <span className="text-[11px] text-emerald-300 bg-slate-800 px-2 py-0.5 rounded-lg truncate max-w-[160px]">
                📄 {whiteboard.activeFileName}
              </span>
            )}
          </div>
        )}

        {/* Compact Page Navigation in Right Corner of Board Header */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-700">
          {isTeacher && (
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handleChangePage(currentPage - 1)}
              className="w-6 h-6 rounded-lg hover:bg-slate-700 flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
              title="صفحه قبل"
            >
              ❯
            </button>
          )}
          <span className="text-[11px] font-bold text-slate-200 px-1 whitespace-nowrap">
            صفحه {currentPage} / {totalPages}
          </span>
          {isTeacher && (
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handleChangePage(currentPage + 1)}
              className="w-6 h-6 rounded-lg hover:bg-slate-700 flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
              title="صفحه بعد"
            >
              ❮
            </button>
          )}
        </div>
      </div>

      {/* Popover: Shapes Selector */}
      {showShapeMenu && (
        <div className="absolute top-12 right-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-1.5">
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
        <div className="absolute top-12 right-12 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-2.5">
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

      {/* Main Interactive Canvas Stage */}
      <div ref={containerRef} className="relative flex-1 w-full h-full bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className={`w-full h-full block ${
            canDraw
              ? activeTool === 'eraser'
                ? 'cursor-cell'
                : 'cursor-crosshair'
              : 'cursor-default'
          }`}
        />

        {/* Local Laser Pointer Indicator */}
        {localLaser && (
          <div
            style={{
              left: `${localLaser.x * 100}%`,
              top: `${localLaser.y * 100}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 shadow-[0_0_14px_5px_rgba(220,38,38,0.85)] ring-2 ring-white"
          />
        )}

        {/* Remote Teacher Laser Pointer Indicator */}
        {remoteLaser && remoteLaser.active && (
          <div
            style={{
              left: `${remoteLaser.x * 100}%`,
              top: `${remoteLaser.y * 100}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5"
          >
            <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_16px_6px_rgba(220,38,38,0.9)] ring-2 ring-white animate-ping" />
            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
              {remoteLaser.name}
            </span>
          </div>
        )}

        {/* Inline Text Input Box */}
        {textPrompt && (
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
              onChange={e => setTextPrompt({ ...textPrompt, value: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') submitTextPrompt()
                if (e.key === 'Escape') setTextPrompt(null)
              }}
              placeholder="متن یا فرمول..."
              className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-hidden focus:border-blue-400 w-36 sm:w-52"
            />
            <button
              type="button"
              onClick={submitTextPrompt}
              className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 cursor-pointer"
            >
              ثبت
            </button>
            <button
              type="button"
              onClick={() => setTextPrompt(null)}
              className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
