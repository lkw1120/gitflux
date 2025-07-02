"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { usePipeline } from "./pipeline-context"
import { PipelineNode } from "./pipeline-node"
import { ConnectionLines } from "./connection-lines"
import { CanvasMenuBar } from "./canvas-menu-bar"

import { useTheme } from "next-themes"

// Window 객체 확장 타입 정의
interface ExtendedWindow extends Window {
  resetCanvasScale?: () => void
  fitCanvasView?: () => void
  getCanvasScale?: () => number
  setCanvasScale?: (scale: number) => void
  zoomToCenter?: (scale: number) => void
}

export function PipelineCanvas() {
  const { addNode, nodes, connectingFrom, cancelConnection, selectNode } = usePipeline()
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef<{ startX: number; startY: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const DRAG_THRESHOLD = 5 // 5px 이상 움직여야 패닝 시작

  // 스케일 초기화 함수
  const resetScale = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
    // zoom 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('canvas-zoom-change'))
  }, [])

  // Fit to Screen 함수
  const fitView = useCallback(() => {
    if (nodes.length === 0) return;
    
    // 모든 노드의 위치를 계산해서 화면에 맞게 조정
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y));
    
    const canvasWidth = canvasRef.current?.clientWidth || 800;
    const canvasHeight = canvasRef.current?.clientHeight || 600;
    
    // 적절한 스케일과 패닝 계산 (여백 포함)
    const padding = 100; // 여백
    const scaleX = (canvasWidth - padding * 2) / (maxX - minX + 200);
    const scaleY = (canvasHeight - padding * 2) / (maxY - minY + 200);
    let newScale = Math.min(scaleX, scaleY);
    
    // 50% ~ 200% 범위로 제한
    newScale = Math.max(0.5, Math.min(2.0, newScale));
    
    // 10의 배수로 반올림 (10% 단위로 맞춤)
    const newPercent = Math.round(newScale * 100);
    const roundedPercent = Math.round(newPercent / 10) * 10; // 10의 배수로 반올림
    newScale = roundedPercent / 100;
    
    setScale(newScale);
    setPan({
      x: (canvasWidth - (maxX + minX) * newScale) / 2,
      y: (canvasHeight - (maxY + minY) * newScale) / 2
    });
    // zoom 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('canvas-zoom-change'))
  }, [nodes])

  // 캔버스 중앙을 기준으로 확대/축소하는 함수
  const zoomToCenter = useCallback((newScale: number) => {
    if (!canvasRef.current) return
    
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const centerX = canvasRect.width / 2
    const centerY = canvasRect.height / 2
    
    const scaleChange = newScale / scale
    const newPanX = centerX - (centerX - pan.x) * scaleChange
    const newPanY = centerY - (centerY - pan.y) * scaleChange
    
    setScale(newScale)
    setPan({ x: newPanX, y: newPanY })
    // zoom 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('canvas-zoom-change'))
  }, [scale, pan])

  // 전역에서 접근할 수 있도록 window 객체에 등록
  useEffect(() => {
    const extWindow = window as ExtendedWindow
    extWindow.resetCanvasScale = resetScale
    extWindow.fitCanvasView = fitView
    extWindow.getCanvasScale = () => scale
    extWindow.setCanvasScale = (newScale: number) => {
      setScale(newScale)
    }
    extWindow.zoomToCenter = zoomToCenter
    return () => {
      delete extWindow.resetCanvasScale
      delete extWindow.fitCanvasView
      delete extWindow.getCanvasScale
      delete extWindow.setCanvasScale
      delete extWindow.zoomToCenter
    }
  }, [resetScale, fitView, scale, zoomToCenter])

  // 그리드 색상 계산 - 메모이제이션으로 성능 최적화
  const getGridColor = useMemo(() => {
    if (dragOver) {
      return theme === 'dark' ? '#1e3a8a' : '#dbeafe'
    }
    return theme === 'dark' ? '#374151' : '#e5e7eb'
  }, [dragOver, theme])

  // 전역 클릭 이벤트로 캔버스 클릭 감지
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 캔버스 영역 내에서 클릭했는지 확인
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        // 노드나 노드의 자식 요소를 클릭한 것이 아닌지 확인
        const target = e.target as HTMLElement
        const isNodeClick = target && typeof target.closest === 'function' && 
          (target.closest('.pipeline-node') || target.closest('.node-content'))
        
        if (!isNodeClick) {
                  // Canvas background clicked, deselecting node
          if (connectingFrom) {
            cancelConnection()
          }
          selectNode(null)
        }
      }
    }

    // 전역 드래그 이벤트로 dragOver 상태 관리
    const handleGlobalDragEnd = () => {
      setDragOver(false)
    }

    const handleGlobalDragLeave = (e: DragEvent) => {
      // 드래그가 문서 전체를 벗어났을 때
      if (e.clientX <= 0 || e.clientY <= 0 || 
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setDragOver(false)
      }
    }

    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('dragend', handleGlobalDragEnd)
    document.addEventListener('dragleave', handleGlobalDragLeave)
    
    return () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('dragend', handleGlobalDragEnd)
      document.removeEventListener('dragleave', handleGlobalDragLeave)
    }
  }, [connectingFrom, cancelConnection, selectNode])

  // 마우스 휠로 확대/축소 - 브라우저 호환성 개선
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    // 현재 퍼센트를 10% 단위로 조정
    const currentPercent = Math.round(scale * 100)
    const newPercent = e.deltaY > 0 
      ? Math.max(currentPercent - 10, 50)  // 축소: 10%씩 감소, 최소 50%
      : Math.min(currentPercent + 10, 200) // 확대: 10%씩 증가, 최대 200%
    const newScale = newPercent / 100
    
    // 마우스 위치를 기준으로 확대/축소
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const scaleChange = newScale / scale
      const newPanX = mouseX - (mouseX - pan.x) * scaleChange
      const newPanY = mouseY - (mouseY - pan.y) * scaleChange
      
      setScale(newScale)
      setPan({ x: newPanX, y: newPanY })
      
      // zoom 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('canvas-zoom-change'))
    }
  }, [scale, pan])

  // 마우스 드래그로 패닝 - 파이어폭스 호환성 개선
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 노드나 노드의 자식 요소를 클릭한 경우 패닝하지 않음
    const target = e.target as HTMLElement
    const isNodeClick = target && typeof target.closest === 'function' && 
      (target.closest('.pipeline-node') || target.closest('.node-content'))
    
    if (!isNodeClick && e.button === 0) { // 좌클릭이고 노드가 아닌 경우
      // 파이어폭스에서 preventDefault 추가
      e.preventDefault()
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 파이어폭스에서 preventDefault 추가
    if (isPanning) {
      e.preventDefault()
    }
    
    if (dragStart && !isPanning) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2)
      )
      
      if (distance > DRAG_THRESHOLD) {
        setIsPanning(true)
        panRef.current = {
          startX: e.clientX - pan.x,
          startY: e.clientY - pan.y,
        }
        setDragStart(null)
      }
    }
    
    if (isPanning && panRef.current) {
      setPan({
        x: e.clientX - panRef.current.startX,
        y: e.clientY - panRef.current.startY,
      })
    }
  }, [dragStart, isPanning, pan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragStart(null)
    panRef.current = null
  }, [])

  // 브라우저 호환성을 위한 드래그 앤 드롭 개선 - 파이어폭스 우선 지원
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    // Drop event triggered

    // 마우스 위치와 캔버스 정보를 미리 저장 (비동기 처리 전에)
    const mouseX = e.clientX
    const mouseY = e.clientY
    const canvasRect = canvasRef.current?.getBoundingClientRect()

    try {
      // 파이어폭스 우선 처리 - 파이어폭스에서는 text/plain이 가장 안정적
      let jsonData = null
      const dataTypes = [
        "text/plain",  // 파이어폭스에서 가장 안정적
        "application/json",
        "text",
        "string"
      ]
      
      for (const dataType of dataTypes) {
        try {
          jsonData = e.dataTransfer.getData(dataType)
          if (jsonData && jsonData.trim()) {
            break
          }
        } catch {
          // Failed to get data from dataType
        }
      }
      
              // 파이어폭스 특별 처리 - Promise 기반으로 개선
        if (!jsonData && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        
        // Promise 기반으로 비동기 처리
        const processFirefoxItems = async () => {
          for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i]
            
            if (item.type === 'text/plain' || item.type === 'application/json') {
              return new Promise<string>((resolve) => {
                item.getAsString((str) => {
                  resolve(str || '')
                })
              })
            }
          }
          return null
        }
        
        // 비동기 처리 실행
        processFirefoxItems().then((str) => {
          if (str && str.trim()) {
            try {
              const nodeData = JSON.parse(str)
              handleNodeDropWithPosition(nodeData, mouseX, mouseY, canvasRect)
            } catch {
              // Firefox JSON parse error
            }
          }
        }).catch(() => {
          // Firefox items processing error
        })
        
        return // 비동기 처리 중이므로 여기서 종료
      }
      
      if (!jsonData || !jsonData.trim()) {
        return
      }

      const nodeData = JSON.parse(jsonData)
      // 저장된 마우스 위치와 캔버스 정보 사용
      handleNodeDropWithPosition(nodeData, mouseX, mouseY, canvasRect)
    } catch {
      // Error parsing drop data
    }
  }

  // 노드 드롭 처리 함수 - 위치 정보를 매개변수로 받음 (Firefox 비동기 처리용)
  const handleNodeDropWithPosition = (
    nodeData: { type: string; name: string; config: Record<string, unknown> }, 
    mouseX: number, 
    mouseY: number, 
    canvasRect: DOMRect | undefined
  ) => {
    if (canvasRect && nodeData) {
      // 확대/축소와 패닝을 고려한 정확한 위치 계산
      // 마우스 위치를 캔버스 기준으로 변환
      const canvasX = mouseX - canvasRect.left
      const canvasY = mouseY - canvasRect.top
      
      // transform을 역산하여 실제 노드 좌표 계산
      // transform: translate(${pan.x}px, ${pan.y}px) scale(${scale})의 역산
      const x = (canvasX - pan.x) / scale
      const y = (canvasY - pan.y) / scale

      // Drop calculation completed

      addNode({
        type: nodeData.type,
        name: nodeData.name,
        position: { x, y },
        config: nodeData.config as Record<string, string | number | boolean>,
        inputs: [],
        outputs: [],
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation() // 사파리에서 이벤트 전파 방지
    
    // 사파리에서 dropEffect 설정
    e.dataTransfer.dropEffect = "copy"
    
    setDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // 사파리에서 dragleave 이벤트가 자주 발생하는 문제 해결
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // 캔버스 영역을 벗어났을 때만 dragOver 해제
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setDragOver(false)
      }
    }
  }

  // scale 값이 변경될 때마다 zoom 이벤트 발생
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-zoom-change'))
  }, [scale])

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 줌 상태 표시 */}
      <div className="absolute top-4 right-4 z-50">
        <div className="text-xs text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 shadow-lg">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Connection instructions */}
      {connectingFrom && (
        <div className="absolute top-4 left-[336px] bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 z-50 shadow-lg">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">🔗 Connecting from selected node</p>
          <p className="text-xs text-green-600 dark:text-green-300 mt-1">
            Click the <span className="inline-block w-3 h-3 bg-green-400 rounded-full mx-1"></span>
            input handle (top circle) of another node to connect
          </p>
          <p className="text-xs text-green-500 dark:text-green-400 mt-1">Or click anywhere on the canvas to cancel</p>
        </div>
      )}

      <div
        ref={canvasRef}
        className={`w-full h-full relative ${dragOver ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-900"} transition-colors overflow-hidden ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundImage: `
            radial-gradient(circle, ${getGridColor} 1px, transparent 1px)
          `,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          pointerEvents: "auto",
          // 브라우저 호환성을 위한 안전한 스타일
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        {/* Transform container - 브라우저 호환성 개선 */}
        <div
          className="absolute inset-0"
          data-canvas="true"
          style={{
            // 브라우저별 transform 호환성
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            WebkitTransform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            MozTransform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            msTransform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            WebkitTransformOrigin: '0 0',
            MozTransformOrigin: '0 0',
            msTransformOrigin: '0 0',
          }}
        >
          {/* Connection lines layer */}
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            <ConnectionLines />
          </div>

          {/* Nodes layer */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {nodes.map((node) => (
              <PipelineNode key={node.id} node={node} />
            ))}
          </div>
        </div>

        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-8">
              <p className="text-blue-600 dark:text-blue-300 font-medium">Drop here to add node</p>
            </div>
          </div>
        )}

        {/* Instructions overlay when no nodes */}
        {nodes.length === 0 && !dragOver && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Build Your CI/CD Pipeline</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Drag actions from the left panel to get started</p>
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="flex items-center justify-center">• Drag nodes to the canvas</p>
                <p className="flex items-center justify-center">
                  • Click the <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mx-1"></span>
                  blue circle to start connecting
                </p>
                <p className="flex items-center justify-center">
                  • Click the <span className="inline-block w-3 h-3 bg-green-400 rounded-full mx-1"></span>
                  green circle to complete connection
                </p>
                <p className="flex items-center justify-center">• Click nodes to configure settings</p>
                <p className="flex items-center justify-center">• Use mouse wheel to zoom, drag to pan</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 플로팅 하단 메뉴바 */}
      <CanvasMenuBar />
    </div>
  )
}
