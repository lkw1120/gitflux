"use client"

import { usePipeline } from "./pipeline-context"
import { X } from "lucide-react"

export function ConnectionLines() {
  const { nodes, connections, deleteConnection, connectingFrom } = usePipeline()

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    return {
      x: node.position.x,
      y: node.position.y,
    }
  }

  const START_ARROW_SIZE = 8; // 시작점(아래) 보정
  const END_ARROW_SIZE = 12;   // 도착점(위) 보정

  const getConnectionPath = (
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): string => {
    // 노드의 실제 연결점 위치 (노드에서 24px 떨어진 위치)
    const connectionOffset = 24;
    // output 핸들(아래 중앙)
    const src = { x: source.x, y: source.y + connectionOffset };
    // input 핸들(위 중앙)
    const tgt = { x: target.x, y: target.y - connectionOffset };
    // y축 방향으로만 보정값 적용
    const src2 = { x: src.x, y: src.y + START_ARROW_SIZE };
    const tgt2 = { x: tgt.x, y: tgt.y - END_ARROW_SIZE };
    // 곡선 제어점 계산
    const dy = tgt2.y - src2.y;
    const controlPointOffset = Math.abs(dy) * 0.5 + 50;
    return `M ${src2.x} ${src2.y} C ${src2.x} ${src2.y + controlPointOffset}, ${tgt2.x} ${tgt2.y - controlPointOffset}, ${tgt2.x} ${tgt2.y}`;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ 
        zIndex: 1,
        // 브라우저 호환성을 위한 안전한 스타일
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      viewBox="0 0 100% 100%"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Standard arrow marker */}
        <marker
          id="arrowhead"
          markerWidth="14"
          markerHeight="14"
          refX="7"
          refY="7"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 14 14"
        >
          <polygon points="2,2 2,12 12,7" fill="#6b7280" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 14 14"
        >
          <polygon points="0,2 0,12 12,6" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-success"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 14 14"
        >
          <polygon points="0,2 0,12 12,6" fill="#10b981" />
        </marker>
      </defs>

      {connections.map((connection) => {
        const source = getNodeCenter(connection.source)
        const target = getNodeCenter(connection.target)
        const isActive = connectingFrom === connection.source || connectingFrom === connection.target
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2

        // Determine connection color and marker
        let strokeColor = "#6b7280"
        let markerEnd = "url(#arrowhead)"

        if (isActive) {
          strokeColor = "#3b82f6"
          markerEnd = "url(#arrowhead-active)"
        }

        return (
          <g key={connection.id} className="group">
            {/* Main connection path - 파이어폭스 호환성 개선 */}
            <path
              d={getConnectionPath(source, target)}
              stroke={strokeColor}
              strokeWidth="3"
              fill="none"
              markerEnd={markerEnd}
              className="transition-all duration-200 hover:stroke-blue-500 cursor-pointer"
              style={{
                // 브라우저별 필터 호환성
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                WebkitFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                strokeLinecap: "round",
                // 파이어폭스에서 화살표 렌더링 개선
                vectorEffect: "non-scaling-stroke",
              }}
            />

            {/* Invisible wider path for easier clicking */}
            <path
              d={getConnectionPath(source, target)}
              stroke="transparent"
              strokeWidth="12"
              fill="none"
              className="cursor-pointer pointer-events-auto"
              onClick={() => deleteConnection(connection.id)}
            />

            {/* Connection delete button - only show on hover */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="white"
                stroke="#ef4444"
                strokeWidth="2"
                className="cursor-pointer pointer-events-auto drop-shadow-sm"
                onClick={() => deleteConnection(connection.id)}
              />
              <foreignObject x={midX - 8} y={midY - 8} width="16" height="16" className="pointer-events-auto">
                <div
                  onClick={() => deleteConnection(connection.id)}
                  className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                  style={{
                    // 브라우저 호환성을 위한 안전한 스타일
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                  }}
                  title="Delete connection"
                >
                  <X size={10} />
                </div>
              </foreignObject>
            </g>

            {/* Connection label (optional - shows connection info on hover) */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <rect
                x={midX - 30}
                y={midY - 35}
                width="60"
                height="20"
                rx="4"
                fill="rgba(0,0,0,0.8)"
                className="pointer-events-none"
              />
              <text
                x={midX}
                y={midY - 22}
                textAnchor="middle"
                className="fill-white text-xs font-medium pointer-events-none"
              >
                Connection
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
