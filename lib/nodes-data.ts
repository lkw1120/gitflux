// 정적 노드 데이터 - 빌드 타임에 포함
import nodesJson from './github-actions-nodes.json'

export const nodesData = nodesJson

export interface NodeData {
  type: string
  name: string
  icon: string
  color: string
  description: string
  marketplace: string
  config: Record<string, unknown>
}

export interface NodeCategory {
  title: string
  nodes: NodeData[]
}

export interface NodeCategoriesData {
  nodeCategories: NodeCategory[]
} 