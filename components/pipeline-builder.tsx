"use client"

import type React from "react"
import { useState, useCallback, useRef, useMemo } from "react"
import {
  ReactFlow,
  addEdge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  type ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Save, Download, Upload, Undo, Redo, Grid3X3, Eye, EyeOff, Settings, Code } from "lucide-react"

import { NodeToolbox } from "@/components/node-toolbox"
import { NodeConfig } from "@/components/node-config"
import { YamlPreview } from "@/components/yaml-preview"
import { CustomNode } from "@/components/custom-node"
import { usePipeline } from "./pipeline-context"
import { 
  customNodesToReactFlowNodes, 
  customConnectionsToReactFlowEdges
} from "@/lib/utils"

const nodeTypes = {
  custom: CustomNode,
}

export function PipelineBuilder() {
  // 커스텀 파이프라인 시스템 사용 (비즈니스 로직)
  const { 
    nodes: customNodes, 
    connections: customConnections, 
    addNode: addCustomNode,
    addConnection: addCustomConnection,
    updateNode: updateCustomNode
  } = usePipeline()

  // ReactFlow 상태 (UI 렌더링만 담당)
  const [, , onReactFlowNodesChange] = useNodesState([])
  const [, setReactFlowEdges, onReactFlowEdgesChange] = useEdgesState([])

  // 커스텀 노드를 ReactFlow 노드로 변환 (메모이제이션)
  const convertedNodes = useMemo(() => {
    return customNodesToReactFlowNodes(customNodes)
  }, [customNodes])

  // 커스텀 연결을 ReactFlow 엣지로 변환 (메모이제이션)
  const convertedEdges = useMemo(() => {
    return customConnectionsToReactFlowEdges(customConnections)
  }, [customConnections])

  // ReactFlow 노드 변경 시 커스텀 시스템 동기화
  const handleReactFlowNodesChange = useCallback((changes: NodeChange[]) => {
    onReactFlowNodesChange(changes)
    
    // 위치 변경만 커스텀 시스템에 반영
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        updateCustomNode(change.id, { position: change.position })
      }
    })
  }, [onReactFlowNodesChange, updateCustomNode])

  // ReactFlow 엣지 변경 시 커스텀 시스템 동기화
  const handleReactFlowEdgesChange = useCallback((changes: EdgeChange[]) => {
    onReactFlowEdgesChange(changes)
  }, [onReactFlowEdgesChange])

  // ReactFlow 연결 시 커스텀 시스템에 추가
  const handleReactFlowConnect = useCallback((params: Connection) => {
    setReactFlowEdges((eds) => addEdge(params, eds))
    
    // 커스텀 시스템에도 연결 추가
    addCustomConnection({
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
    })
  }, [setReactFlowEdges, addCustomConnection])

  const [showYamlPreview, setShowYamlPreview] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      try {
        const jsonData = event.dataTransfer.getData("application/json")
        if (!jsonData) {
          return
        }

        const nodeData = JSON.parse(jsonData)
        const position = reactFlowInstance?.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }) || { x: 0, y: 0 }

        // 커스텀 시스템에 노드 추가
        addCustomNode({
          type: nodeData.type,
          name: nodeData.name,
          position,
          config: nodeData.config || {},
          inputs: [],
          outputs: [],
        })
      } catch {
        // Error parsing drop data
      }
    },
    [reactFlowInstance, addCustomNode],
  )

  const exportYaml = () => {
    // 커스텀 시스템의 YAML 생성 로직 사용
    const yaml = generateYamlFromCustomNodes(customNodes)
    const blob = new Blob([yaml], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pipeline.yml"
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateYamlFromCustomNodes = (nodes: { name: string; type: string; position: { y: number }; config: Record<string, unknown> }[]) => {
    // Simple YAML generation logic
    let yaml = `name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
`

    // Sort nodes by position for logical order
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y)

    sortedNodes.forEach((node) => {
      const { name, type, config } = node
      yaml += `    - name: ${name}
      uses: ${config?.repository || `actions/${type}@v4`}
`
      if (config && Object.keys(config).length > 1) {
        yaml += `      with:
`
        Object.entries(config).forEach(([key, value]) => {
          if (key !== "repository") {
            yaml += `        ${key}: ${value}
`
          }
        })
      }
    })

    return yaml
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={exportYaml}>
              <Download className="h-4 w-4 mr-2" />
              Export YAML
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={showMiniMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMiniMap(!showMiniMap)}
            >
              {showMiniMap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={showYamlPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowYamlPreview(!showYamlPreview)}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-auto">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Run Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Toolbox */}
        <div className="w-64 border-r bg-muted/50">
          <NodeToolbox />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <div className="h-full" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={convertedNodes}
                edges={convertedEdges}
                onNodesChange={handleReactFlowNodesChange}
                onEdgesChange={handleReactFlowEdgesChange}
                onConnect={handleReactFlowConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
              >
                <Controls />
                {showMiniMap && <MiniMap className="bg-background border rounded-lg" nodeColor="#8b5cf6" />}
                {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l bg-background">
          <Tabs defaultValue="config" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">
                <Settings className="h-4 w-4 mr-2" />
                Config
              </TabsTrigger>
              <TabsTrigger value="yaml">
                <Code className="h-4 w-4 mr-2" />
                YAML
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="h-full mt-0">
              <NodeConfig />
            </TabsContent>

            <TabsContent value="yaml" className="h-full mt-0">
              <YamlPreview />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
