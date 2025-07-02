"use client"

import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GitBranch,
  Code,
  TestTube,
  Upload,
  Settings,
  Shield,
  Cloud,
  Bell,
  Coffee,
  Package,
  Zap,
  Globe,
  Lock,
  HardDrive,
  Smartphone,
  Monitor,
  Server,
  Container,
  Layers,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Archive,
} from "lucide-react"
import { nodesData, type NodeData } from "@/lib/nodes-data"

// 아이콘 매핑 객체
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GitBranch,
  Code,
  TestTube,
  Upload,
  Settings,
  Shield,
  Cloud,
  Bell,
  Coffee,
  Package,
  Zap,
  Globe,
  Lock,
  HardDrive,
  Smartphone,
  Monitor,
  Server,
  Container,
  Layers,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Archive,
}

export function NodeToolbox() {
  // 정적 데이터 사용 - 상태 관리 불필요
  const nodeCategories = nodesData.nodeCategories



  // 정적 데이터이므로 초기 로딩 불필요
  // useEffect(() => {
  //   // 초기 로딩
  //   loadNodeData()

  //   // 페이지 가시성 변경 시 자동 갱신
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden) {
  //       loadNodeData()
  //     }
  //   }

  //   // 윈도우 포커스 시 자동 갱신
  //   const handleFocus = () => {
  //       loadNodeData()
  //   }

  //   document.addEventListener('visibilitychange', handleVisibilityChange)
  //   window.addEventListener('focus', handleFocus)

  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange)
  //     window.removeEventListener('focus', handleFocus)
  //   }
  // }, [loadNodeData])

  const handleDragStart = (e: React.DragEvent, nodeData: NodeData) => {
    try {
      // Drag start triggered for node
      
      // 사파리 특별 처리 - 더 간단한 데이터 형식 사용
      const simpleData = {
        type: nodeData.type,
        name: nodeData.name,
        icon: nodeData.icon,
        config: nodeData.config,
        marketplace: nodeData.marketplace,
        color: nodeData.color,
        description: nodeData.description,
      }
      
      // 브라우저별 데이터 타입 지원 (우선순위 순서)
      e.dataTransfer.setData("application/json", JSON.stringify(simpleData))
      e.dataTransfer.setData("text/plain", JSON.stringify(simpleData))
      e.dataTransfer.setData("text", JSON.stringify(simpleData))
      
      // 사파리 특별 처리 - 문자열로도 설정
      e.dataTransfer.setData("string", JSON.stringify(simpleData))
      
      // 사파리에서 effectAllowed 설정
      e.dataTransfer.effectAllowed = "copy"
      
      // 사파리에서 드래그 이미지 설정
      if (e.dataTransfer.setDragImage) {
        const dragImage = e.currentTarget as HTMLElement
        e.dataTransfer.setDragImage(dragImage, 0, 0)
      }
      
      // 사파리에서 드래그 시작을 강제로 트리거
      setTimeout(() => {
        // Drag data set successfully
      }, 0)
      
          } catch (error) {
        // Error setting drag data
      }
  }



  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">GitHub Actions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drag actions to build your pipeline</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {nodeCategories.map((category) => (
            <div key={category.title}>
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide border-b border-gray-200 dark:border-gray-600 pb-1">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.nodes.map((node) => {
                  const IconComponent = iconMap[node.icon]
                  return (
                    <Card
                      key={node.type}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, {
                          name: node.name,
                          type: node.type,
                          icon: node.icon,
                          config: node.config,
                          marketplace: node.marketplace,
                          color: node.color,
                          description: node.description,
                        })
                      }
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md ${node.color} text-white flex-shrink-0`}>
                            {IconComponent && <IconComponent className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{node.name}</h4>
                              {node.marketplace.startsWith("actions/") && (
                                <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                                  Official
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{node.description}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs font-mono border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300">
                                {node.marketplace}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
