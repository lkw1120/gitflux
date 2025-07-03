"use client"

import type React from "react"

import { useState, useRef, useCallback, memo, useEffect, useMemo } from "react"
import { usePipeline, type PipelineNode as PipelineNodeType } from "./pipeline-context"
import { 
  GitBranch, Play, TestTube, Upload, Settings, Database, X, 
  HardDrive, Code, Coffee, Zap, Monitor, Package, Container, 
  Layers, Shield, Eye, CheckCircle, AlertTriangle, Lock, 
  Cloud, Bell, Server, Smartphone, Globe, Download, Archive 
} from "lucide-react"

const iconMap = {
  checkout: GitBranch,
  "setup-node": Settings,
  install: Database,
  test: TestTube,
  build: Play,
  deploy: Upload,
  cache: HardDrive,
  "setup-java": Coffee,
  "setup-python": Code,
  "setup-go": Zap,
  "setup-dotnet": Monitor,
  "setup-ruby": Package,
  "build-gradle": Settings,
  "build-maven": Package,
  "docker-build": Container,
  "docker-setup": Layers,
  "super-linter": Shield,
  codecov: Eye,
  "sonarcloud": CheckCircle,
  "test-reporter": TestTube,
  "dependency-review": Shield,
  codeql: Lock,
  snyk: AlertTriangle,
  "aws-configure": Cloud,
  "azure-login": Cloud,
  "gcp-auth": Cloud,
  "vercel-deploy": Upload,
  "netlify-deploy": Globe,
  "heroku-deploy": Server,
  "android-build": Smartphone,
  "ios-build": Smartphone,
  "electron-build": Monitor,
  "slack-notify": Bell,
  "discord-notify": Bell,
  "teams-notify": Bell,
  "upload-artifact": Upload,
  "download-artifact": Download,
  "create-release": Archive,
  "semantic-release": Package,
}

const colorMap = {
  checkout: "bg-blue-500",
  "setup-node": "bg-green-500",
  install: "bg-purple-500",
  test: "bg-yellow-500",
  build: "bg-orange-500",
  deploy: "bg-red-500",
  cache: "bg-indigo-500",
  "setup-java": "bg-orange-600",
  "setup-python": "bg-blue-600",
  "setup-go": "bg-cyan-500",
  "setup-dotnet": "bg-purple-600",
  "setup-ruby": "bg-red-500",
  "build-gradle": "bg-green-600",
  "build-maven": "bg-orange-500",
  "docker-build": "bg-blue-700",
  "docker-setup": "bg-blue-600",
  "super-linter": "bg-green-700",
  codecov: "bg-pink-500",
  "sonarcloud": "bg-orange-600",
  "test-reporter": "bg-yellow-600",
  "dependency-review": "bg-red-600",
  codeql: "bg-gray-700",
  snyk: "bg-purple-700",
  "aws-configure": "bg-yellow-500",
  "azure-login": "bg-blue-600",
  "gcp-auth": "bg-red-500",
  "vercel-deploy": "bg-black",
  "netlify-deploy": "bg-teal-500",
  "heroku-deploy": "bg-purple-600",
  "android-build": "bg-green-600",
  "ios-build": "bg-gray-600",
  "electron-build": "bg-blue-500",
  "slack-notify": "bg-purple-500",
  "discord-notify": "bg-indigo-600",
  "teams-notify": "bg-blue-700",
  "upload-artifact": "bg-gray-600",
  "download-artifact": "bg-gray-500",
  "create-release": "bg-green-700",
  "semantic-release": "bg-teal-600",
}

interface Props {
  node: PipelineNodeType
}

export const PipelineNode = memo(function PipelineNode({ node }: Props) {
  const {
    updateNode,
    deleteNode,
    selectNode,
    selectedNode,
    connectingFrom,
    connections,
    startConnection,
    endConnection,
    cancelConnection,
    deleteConnection,
  } = usePipeline()
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startNodeX: number; startNodeY: number } | null>(null)

  const Icon = iconMap[node.type as keyof typeof iconMap] || Settings
  const bgColor = colorMap[node.type as keyof typeof colorMap] || "bg-gray-500"

  // 전역 마우스 이벤트 처리 - 파이어폭스 호환성 개선
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        // 캔버스의 transform 상태를 가져오기 위해 캔버스 요소 찾기
        const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement
        if (!canvas) return
        
        // 파이어폭스에서 transform 계산 개선
        const computedStyle = window.getComputedStyle(canvas)
        const transform = computedStyle.transform
        
        // 파이어폭스에서 transform 매트릭스 파싱
        let scale = 1
        let translateX = 0
        let translateY = 0
        
        if (transform && transform !== 'none') {
          // matrix(a, b, c, d, e, f) 형태에서 추출
          const matrix = transform.match(/matrix\(([^)]+)\)/)
          if (matrix) {
            const values = matrix[1].split(',').map(v => parseFloat(v.trim()))
            if (values.length >= 6) {
              scale = Math.sqrt(values[0] * values[0] + values[1] * values[1])
              translateX = values[4]
              translateY = values[5]
            }
          } else {
            // 개별 transform 속성 시도
            const scaleMatch = transform.match(/scale\(([^)]+)\)/)
            const translateMatch = transform.match(/translate\(([^)]+)\)/)
            
            scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1
            if (translateMatch) {
              const translateValues = translateMatch[1].split(',')
              translateX = parseFloat(translateValues[0]) || 0
              translateY = parseFloat(translateValues[1]) || 0
            }
          }
        }
        
        // 마우스 위치를 캔버스 좌표계로 변환
        const canvasX = (e.clientX - translateX) / scale
        const canvasY = (e.clientY - translateY) / scale
        
        // 드래그 시작 시 마우스 위치를 캔버스 좌표계로 변환
        const startCanvasX = (dragRef.current.startX - translateX) / scale
        const startCanvasY = (dragRef.current.startY - translateY) / scale
        
        // 노드의 새로운 위치 계산 (드래그 시작 시 노드 위치 + 마우스 이동 거리)
        const newX = dragRef.current.startNodeX + (canvasX - startCanvasX)
        const newY = dragRef.current.startNodeY + (canvasY - startCanvasY)
        // clamp 적용
        const clampNodePosition = (x: number, y: number) => {
          const clampedX = Math.max(-2000, Math.min(2000, x));
          const clampedY = Math.max(-1500, Math.min(1500, y));
          return { x: clampedX, y: clampedY };
        };
        updateNode(node.id, {
          position: clampNodePosition(newX, newY),
        })
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        dragRef.current = null
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, node.id, updateNode])

  const handleConnectionStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom === node.id) {
      cancelConnection()
    } else {
      startConnection(node.id)
    }
  }, [connectingFrom, node.id, cancelConnection, startConnection])

  const handleConnectionEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom && connectingFrom !== node.id) {
      // 기존 연결이 있는지 확인
      const existingConnection = connections.find(
        (conn) => conn.source === connectingFrom && conn.target === node.id
      )
      
      if (existingConnection) {
        // 기존 연결이 있으면 삭제
        deleteConnection(existingConnection.id)
      } else {
        // 기존 연결이 없으면 새로 생성
        endConnection(node.id)
      }
    }
  }, [connectingFrom, node.id, connections, deleteConnection, endConnection])

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom && connectingFrom !== node.id) {
      endConnection(node.id)
    } else if (!connectingFrom) {
      selectNode(node.id)
    }
  }, [connectingFrom, node.id, endConnection, selectNode])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start dragging if we're not in connection mode and clicking on the node content
    if (!connectingFrom && (e.target === e.currentTarget || (e.target as HTMLElement).closest(".node-content"))) {
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y,
      }
      selectNode(node.id)
    }
  }, [connectingFrom, node.position.x, node.position.y, node.id, selectNode])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNode(node.id)
  }, [deleteNode, node.id])

  // 메모이제이션된 값들
  const isSelected = useMemo(() => selectedNode === node.id, [selectedNode, node.id])

  return (
    <div
      className={`absolute select-none pipeline-node ${isDragging ? "" : "transition-all duration-200"} ${isSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""} ${
        connectingFrom === node.id ? "ring-2 ring-green-400 ring-offset-2" : ""
      } ${connectingFrom && connectingFrom !== node.id ? "cursor-pointer hover:scale-105" : "cursor-move"}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: "translate(-50%, -50%)",
        WebkitTransform: "translate(-50%, -50%)",
        MozTransform: "translate(-50%, -50%)",
        msTransform: "translate(-50%, -50%)",
        zIndex: isSelected || connectingFrom === node.id ? 10 : 5,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleNodeClick}
    >
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 min-w-[160px] node-content relative">
        {/* Input connection handle - 선택된 노드나 연결 중일 때만 표시 */}
        {(isSelected || connectingFrom || connectingFrom === node.id) && (
          <div
            className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 cursor-pointer transition-all z-20 shadow-sm ${
              connectingFrom && connectingFrom !== node.id
                ? "bg-green-400 hover:bg-green-500 scale-125 animate-pulse shadow-lg"
                : "bg-gray-400 hover:bg-gray-500 hover:scale-110"
            }`}
            style={{
              transform: "translate(-50%, -50%)",
              WebkitTransform: "translate(-50%, -50%)",
              MozTransform: "translate(-50%, -50%)",
              msTransform: "translate(-50%, -50%)",
              top: "-6px",
            }}
            onClick={handleConnectionEnd}
            title={
              connectingFrom && connectingFrom !== node.id ? "Click to complete connection" : "Input connection point"
            }
          />
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-1.5 rounded ${bgColor} text-white mr-2`}>
              <Icon size={14} />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{node.name}</span>
          </div>
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors z-20">
            <X size={14} />
          </button>
        </div>

        {/* Output connection handle - 선택된 노드나 연결 중일 때만 표시 */}
        {(isSelected || connectingFrom || connectingFrom === node.id) && (
          <div
            className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 cursor-pointer transition-all z-20 shadow-sm ${
              connectingFrom === node.id
                ? "bg-green-400 animate-pulse scale-125 shadow-lg"
                : "bg-blue-400 hover:bg-blue-500 hover:scale-110"
            }`}
            style={{
              transform: "translate(-50%, -50%)",
              WebkitTransform: "translate(-50%, -50%)",
              MozTransform: "translate(-50%, -50%)",
              msTransform: "translate(-50%, -50%)",
              bottom: "-24px",
            }}
            onClick={handleConnectionStart}
            title={connectingFrom === node.id ? "Click to cancel connection" : "Click to start connecting"}
          />
        )}
      </div>
    </div>
  )
})
