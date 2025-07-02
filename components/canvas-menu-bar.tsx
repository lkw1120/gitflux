"use client"

import { usePipeline } from "./pipeline-context"
import { Button } from "@/components/ui/button"
import { 
  Undo, 
  Redo, 
  RotateCcw, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  Plus
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

// Window 객체 확장 타입 정의
interface ExtendedWindow extends Window {
  getCanvasScale?: () => number
  resetCanvasScale?: () => void
  fitCanvasView?: () => void
  setCanvasScale?: (scale: number) => void
  zoomToCenter?: (scale: number) => void
}

export function CanvasMenuBar() {
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    nodes, 
    clearPipeline 
  } = usePipeline()
  
  const [zoom, setZoom] = useState(100)
  const { showConfirm, ConfirmDialog } = useConfirmDialog()

  // 실제 캔버스의 zoom 상태와 동기화 - 이벤트 기반으로 개선
  const updateZoom = useCallback(() => {
    const extWindow = window as ExtendedWindow
    if (extWindow.getCanvasScale) {
      const canvasScale = extWindow.getCanvasScale()
      setZoom(Math.round(canvasScale * 100))
    }
  }, [])

  useEffect(() => {
    // 초기 동기화
    updateZoom()
    
    // 커스텀 이벤트 리스너로 변경 (setInterval 제거)
    const handleZoomChange = () => {
      updateZoom()
    }
    
    // 커스텀 이벤트 리스너 등록
    window.addEventListener('canvas-zoom-change', handleZoomChange)
    
    return () => {
      window.removeEventListener('canvas-zoom-change', handleZoomChange)
    }
  }, [updateZoom])

  const handleNewWorkflow = () => {
    if (nodes.length > 0) {
      showConfirm(
        "Clear Pipeline",
        "This will clear the current pipeline. Are you sure you want to continue?",
        () => {
          clearPipeline()
          // 캔버스 스케일도 초기화
          const extWindow = window as ExtendedWindow
          if (extWindow.resetCanvasScale) {
            extWindow.resetCanvasScale()
          }
        },
        {
          confirmText: "Clear",
          cancelText: "Cancel",
          variant: "destructive"
        }
      )
    } else {
      clearPipeline()
      // 캔버스 스케일도 초기화
      const extWindow = window as ExtendedWindow
      if (extWindow.resetCanvasScale) {
        extWindow.resetCanvasScale()
      }
    }
  }

  const handleResetScale = () => {
    const extWindow = window as ExtendedWindow
    if (extWindow.resetCanvasScale) {
      extWindow.resetCanvasScale()
    }
  }

  const handleFitView = () => {
    const extWindow = window as ExtendedWindow
    if (extWindow.fitCanvasView) {
      extWindow.fitCanvasView()
    }
  }

  const handleZoomIn = () => {
    const extWindow = window as ExtendedWindow
    if (extWindow.setCanvasScale && extWindow.zoomToCenter) {
      const currentScale = extWindow.getCanvasScale?.() || 1
      const currentPercent = Math.round(currentScale * 100)
      const newPercent = Math.min(currentPercent + 10, 200) // 10%씩 증가, 최대 200%
      const newScale = newPercent / 100
      extWindow.zoomToCenter(newScale)
    }
  }

  const handleZoomOut = () => {
    const extWindow = window as ExtendedWindow
    if (extWindow.setCanvasScale && extWindow.zoomToCenter) {
      const currentScale = extWindow.getCanvasScale?.() || 1
      const currentPercent = Math.round(currentScale * 100)
      const newPercent = Math.max(currentPercent - 10, 50) // 10%씩 감소, 최소 50%
      const newScale = newPercent / 100
      extWindow.zoomToCenter(newScale)
    }
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center space-x-3">
        
        {/* New Workflow */}
        <div className="border-r border-gray-300/50 dark:border-gray-600/50 pr-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNewWorkflow}
            className="h-9 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="New Workflow"
          >
            <Plus size={16} />
            <span className="ml-1.5 text-sm font-medium">New</span>
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1 border-r border-gray-300/50 dark:border-gray-600/50 pr-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo size={16} />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 border-r border-gray-300/50 dark:border-gray-600/50 pr-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm font-semibold min-w-[70px] text-center text-gray-700 dark:text-gray-300">
            {zoom}%
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom In (Ctrl+=)"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetScale}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Reset Scale"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        {/* Fit to Screen */}
        <div className="border-r border-gray-300/50 dark:border-gray-600/50 pr-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFitView}
            className="h-9 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Fit to Screen"
          >
            <Maximize2 size={16} />
            <span className="ml-1.5 text-sm font-medium">Fit</span>
          </Button>
        </div>

        {/* Node Count */}
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
          {nodes.length} node{nodes.length !== 1 ? 's' : ''}
        </div>
      </div>
      {ConfirmDialog}
    </div>
  )
} 