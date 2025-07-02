"use client"

import { useCallback, useRef, useEffect } from "react"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface PipelineNode {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  config: Record<string, string | boolean | number>
  inputs: string[]
  outputs: string[]
}

export interface PipelineConnection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface PipelineTriggers {
  push?: {
    branches: string[]
    paths?: string[]
    paths_ignore?: string[]
  }
  pull_request?: {
    branches: string[]
    types?: string[]
  }
  schedule?: {
    cron: string
  }
  workflow_dispatch?: {
    inputs?: Record<string, unknown>
  }
  [key: string]: unknown
}

interface PipelineContextType {
  nodes: PipelineNode[]
  connections: PipelineConnection[]
  selectedNode: string | null
  connectingFrom: string | null
  triggers: PipelineTriggers
  canUndo: boolean
  canRedo: boolean
  addNode: (node: Omit<PipelineNode, "id">) => void
  updateNode: (id: string, updates: Partial<PipelineNode>) => void
  deleteNode: (id: string) => void
  selectNode: (id: string | null) => void
  addConnection: (connection: Omit<PipelineConnection, "id">) => void
  deleteConnection: (id: string) => void
  clearPipeline: () => void
  startConnection: (nodeId: string) => void
  endConnection: (nodeId: string) => void
  cancelConnection: () => void
  updateTriggers: (triggers: PipelineTriggers) => void
  undo: () => void
  redo: () => void
}

const PipelineContext = createContext<PipelineContextType | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<PipelineNode[]>([])
  const [connections, setConnections] = useState<PipelineConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [triggers, setTriggers] = useState<PipelineTriggers>({
    push: {
      branches: ['main'],
      paths: [],
      paths_ignore: []
    }
  })
  
  // Undo/Redo 히스토리 상태
  const [history, setHistory] = useState<Array<{
    nodes: PipelineNode[]
    connections: PipelineConnection[]
    triggers: PipelineTriggers
    timestamp: number
  }>>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false)
  
  // 최신 상태를 참조하기 위한 ref
  const nodesRef = useRef<PipelineNode[]>([])
  const connectionsRef = useRef<PipelineConnection[]>([])
  const triggersRef = useRef<PipelineTriggers>(triggers)
  
  // Timeout 관리를 위한 ref (메모리 누수 방지)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // ref 업데이트
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])
  
  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])
  
  useEffect(() => {
    triggersRef.current = triggers
  }, [triggers])

  // Timeout cleanup 함수
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // 히스토리에 상태 저장 (2초 debounce - 설정 변경용)
  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction) return
    
    // 기존 timeout 정리
    clearTimeoutRef()
    
    timeoutRef.current = setTimeout(() => {
      setHistory(prevHistory => {
        const newState = {
          nodes: [...nodesRef.current],        // ✅ ref 사용으로 최신 값 보장
          connections: [...connectionsRef.current], // ✅ ref 사용으로 최신 값 보장
          triggers: { ...triggersRef.current },     // ✅ ref 사용으로 최신 값 보장
          timestamp: Date.now()
        }
        
        const newHistory = prevHistory.slice(0, currentIndex + 1)
        newHistory.push(newState)
        
        if (newHistory.length > 200) {
          newHistory.shift()
        }
        
        setCurrentIndex(newHistory.length - 1)
        return newHistory
      })
    }, 2000)
  }, [currentIndex, isUndoRedoAction, clearTimeoutRef])

  // 히스토리에 상태 저장 (0.5초 debounce - 핵심 액션용)
  const saveToHistoryQuick = useCallback(() => {
    if (isUndoRedoAction) return
    
    // 기존 timeout 정리
    clearTimeoutRef()
    
    timeoutRef.current = setTimeout(() => {
      setHistory(prevHistory => {
        const newState = {
          nodes: [...nodesRef.current],        // ✅ ref 사용으로 최신 값 보장
          connections: [...connectionsRef.current], // ✅ ref 사용으로 최신 값 보장
          triggers: { ...triggersRef.current },     // ✅ ref 사용으로 최신 값 보장
          timestamp: Date.now()
        }
        
        const newHistory = prevHistory.slice(0, currentIndex + 1)
        newHistory.push(newState)
        
        if (newHistory.length > 200) {
          newHistory.shift()
        }
        
        setCurrentIndex(newHistory.length - 1)
        return newHistory
      })
    }, 500)
  }, [currentIndex, isUndoRedoAction, clearTimeoutRef])

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      clearTimeoutRef()
    }
  }, [clearTimeoutRef])

  const addNode = useCallback((node: Omit<PipelineNode, "id">) => {
    const newNode: PipelineNode = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setNodes(prev => [...prev, newNode])
    saveToHistoryQuick()
  }, [saveToHistoryQuick])

  const updateNode = useCallback((id: string, updates: Partial<PipelineNode>) => {
    setNodes(prev => prev.map((node) => (node.id === id ? { ...node, ...updates } : node)))
    saveToHistory()
  }, [saveToHistory])

  const deleteNode = useCallback(
    (id: string) => {
      setNodes(prev => prev.filter((node) => node.id !== id))
      setConnections(prev => prev.filter((conn) => conn.source !== id && conn.target !== id))
      if (selectedNode === id) {
        setSelectedNode(null)
      }
      // 연결 삭제 후 히스토리 저장
      saveToHistoryQuick()
    },
    [selectedNode, saveToHistoryQuick],
  )

  const selectNode = useCallback((id: string | null) => {
    setSelectedNode(id)
  }, [])

  const addConnection = useCallback((connection: Omit<PipelineConnection, "id">) => {
    const newConnection: PipelineConnection = {
      ...connection,
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setConnections(prev => [...prev, newConnection])
    saveToHistoryQuick()
  }, [saveToHistoryQuick])

  const deleteConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter((conn) => conn.id !== id))
    saveToHistoryQuick()
  }, [saveToHistoryQuick])

  const clearPipeline = useCallback(() => {
    setNodes([])
    setConnections([])
    setSelectedNode(null)
    saveToHistoryQuick()
  }, [saveToHistoryQuick])

  const startConnection = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId)
  }, [])

  const endConnection = useCallback(
    (nodeId: string) => {
      if (connectingFrom && connectingFrom !== nodeId) {
        // Check if connection already exists
        const existingConnection = connections.find((conn) => conn.source === connectingFrom && conn.target === nodeId)

        if (!existingConnection) {
          addConnection({
            source: connectingFrom,
            target: nodeId,
          })
        }
      }
      setConnectingFrom(null)
    },
    [connectingFrom, connections, addConnection],
  )

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null)
  }, [])

  const updateTriggers = useCallback((newTriggers: PipelineTriggers) => {
    setTriggers(newTriggers)
    saveToHistory()
  }, [saveToHistory])

  // Undo 함수
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setIsUndoRedoAction(true)
      const prevState = history[currentIndex - 1]
      setNodes(prevState.nodes)
      setConnections(prevState.connections)
      setTriggers(prevState.triggers)
      setCurrentIndex(currentIndex - 1)
      setIsUndoRedoAction(false)
    }
  }, [currentIndex, history])

  // Redo 함수
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setIsUndoRedoAction(true)
      const nextState = history[currentIndex + 1]
      setNodes(nextState.nodes)
      setConnections(nextState.connections)
      setTriggers(nextState.triggers)
      setCurrentIndex(currentIndex + 1)
      setIsUndoRedoAction(false)
    }
  }, [currentIndex, history])

  // 초기 상태를 히스토리에 추가
  useEffect(() => {
    if (history.length === 0) {
      const initialState = {
        nodes: [],
        connections: [],
        triggers: { ...triggers },
        timestamp: Date.now()
      }
      setHistory([initialState])
      setCurrentIndex(0)
    }
  }, [])

  // Undo/Redo 가능 여부 계산
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return (
    <PipelineContext.Provider
      value={{
        nodes,
        connections,
        selectedNode,
        connectingFrom,
        triggers,
        canUndo,
        canRedo,
        addNode,
        updateNode,
        deleteNode,
        selectNode,
        addConnection,
        deleteConnection,
        clearPipeline,
        startConnection,
        endConnection,
        cancelConnection,
        updateTriggers,
        undo,
        redo,
      }}
    >
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipeline() {
  const context = useContext(PipelineContext)
  if (!context) {
    throw new Error("usePipeline must be used within PipelineProvider")
  }
  return context
}
