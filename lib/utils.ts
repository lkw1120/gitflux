import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PipelineNode, PipelineConnection } from "@/components/pipeline-context"
import type { Node, Edge } from "reactflow"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ReactFlow와 커스텀 시스템 간 데이터 변환 유틸리티
export function customNodesToReactFlowNodes(customNodes: PipelineNode[]): Node[] {
  return customNodes.map((node) => ({
    id: node.id,
    type: "custom",
    position: node.position,
    data: {
      label: node.name,
      type: node.type,
      config: node.config,
      // 커스텀 노드에서 필요한 추가 데이터
      customNode: node,
    },
  }))
}

export function customConnectionsToReactFlowEdges(customConnections: PipelineConnection[]): Edge[] {
  return customConnections.map((connection) => ({
    id: connection.id,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    type: "smoothstep", // 부드러운 곡선 연결선
    style: {
      stroke: "#6b7280",
      strokeWidth: 3,
    },
    data: {
      customConnection: connection,
    },
  }))
}

export function reactFlowNodesToCustomNodes(reactFlowNodes: Node[]): PipelineNode[] {
  return reactFlowNodes.map((node) => ({
    id: node.id,
    type: node.data?.type || "unknown",
    name: node.data?.label || "Unnamed",
    position: node.position,
    config: node.data?.config || {},
    inputs: [],
    outputs: [],
  }))
}

export function reactFlowEdgesToCustomConnections(reactFlowEdges: Edge[]): PipelineConnection[] {
  return reactFlowEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
    targetHandle: edge.targetHandle || undefined,
  }))
}

// Debounce 함수
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle 함수
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Topological sort function
export function topologicalSort(nodes: PipelineNode[], connections: PipelineConnection[]): PipelineNode[] {
  if (connections.length === 0) {
    // If no connections, sort by Y position
    return [...nodes].sort((a, b) => a.position.y - b.position.y)
  }

  const graph = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  // Initialize graph
  nodes.forEach((node) => {
    graph.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // Build graph from connections
  connections.forEach((conn) => {
    const sourceConnections = graph.get(conn.source) || []
    sourceConnections.push(conn.target)
    graph.set(conn.source, sourceConnections)
    inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1)
  })

  // Topological sort
  const queue: string[] = []
  const result: PipelineNode[] = []

  // Find nodes with no incoming edges
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId)
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = nodes.find((n) => n.id === nodeId)
    if (node) result.push(node)

    // Reduce in-degree for connected nodes
    const connections = graph.get(nodeId) || []
    connections.forEach((targetId: string) => {
      const currentDegree = inDegree.get(targetId) || 0
      inDegree.set(targetId, currentDegree - 1)
      if (currentDegree - 1 === 0) {
        queue.push(targetId)
      }
    })
  }

  // Add any remaining nodes (in case of cycles)
  nodes.forEach((node) => {
    if (!result.find((n) => n.id === node.id)) {
      result.push(node)
    }
  })

  return result
}

// YAML 안전 처리 유틸리티 함수들
function escapeYamlString(str: string): string {
  if (!str || typeof str !== 'string') {
    return '""';
  }
  
  // 특수 문자가 포함된 경우 따옴표로 감싸기
  if (str.includes(':') || str.includes('"') || str.includes("'") || 
      str.includes('\n') || str.includes('\t') || str.includes('\\') ||
      str.includes('[') || str.includes(']') || str.includes('{') || str.includes('}') ||
      str.includes('#') || str.includes('&') || str.includes('*') || str.includes('!') ||
      str.includes('|') || str.includes('>') || str.includes('?') || str.includes('-') ||
      str.includes(',') || str.includes('`') || str.includes('@') || str.includes('%')) {
    return `"${str.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}"`;
  }
  
  // 빈 문자열이나 공백만 있는 경우
  if (str.trim() === '') {
    return '""';
  }
  
  return str;
}

function formatMultilineString(str: string): string {
  if (!str || typeof str !== 'string') {
    return '""';
  }
  
  // 줄바꿈이 포함된 경우 멀티라인 형식 사용
  if (str.includes('\n')) {
    const lines = str.split('\n');
    return `|\n        ${lines.join('\n        ')}`;
  }
  
  // 특수 문자가 포함된 경우 이스케이프
  return escapeYamlString(str);
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  
  if (typeof value === 'string') {
    return escapeYamlString(value);
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '""';
    }
  }
  
  return '""';
}

// 안전한 YAML 생성 함수들
export function generateSafeNodeYaml(node: PipelineNode): string {
  const { name, config } = node;
  
  // 1. 이름 안전하게 처리
  const safeName = escapeYamlString(name || 'Unnamed Step');
  let yaml = `    - name: ${safeName}\n`;

  // 2. repository 안전하게 처리
  if (config.repository && typeof config.repository === 'string' && config.repository.trim() !== '') {
    const safeRepo = escapeYamlString(config.repository);
    yaml += `      uses: ${safeRepo}\n`;
  }

  // 3. with 필드 안전하게 처리
  const withEntries = Object.entries(config).filter(
    ([key, value]) =>
      key !== 'repository' &&
      key !== 'run' &&
      key !== 'env' &&
      value !== undefined &&
      value !== null &&
      value !== '' &&
      typeof key === 'string' &&
      key.trim() !== ''
  );
  
  if (withEntries.length > 0) {
    yaml += `      with:\n`;
    withEntries.forEach(([key, value]) => {
      const safeKey = escapeYamlString(key);
      const safeValue = safeStringify(value);
      yaml += `        ${safeKey}: ${safeValue}\n`;
    });
  }

  // 4. env 필드 안전하게 처리
  if (config.env && typeof config.env === 'object' && Object.keys(config.env).length > 0) {
    yaml += `      env:\n`;
    Object.entries(config.env).forEach(([key, value]) => {
      if (key && typeof key === 'string' && key.trim() !== '' && value !== undefined && value !== null) {
        const safeKey = escapeYamlString(key);
        const safeValue = safeStringify(value);
        yaml += `        ${safeKey}: ${safeValue}\n`;
      }
    });
  }

  // 5. run 필드 안전하게 처리 (멀티라인 지원)
  if (typeof config.run === 'string' && config.run.trim() !== "") {
    yaml += `      run: ${formatMultilineString(config.run)}\n`;
  }

  return yaml;
}

// 기존 함수를 안전한 버전으로 교체
export function generateNodeYaml(node: PipelineNode): string {
  return generateSafeNodeYaml(node);
}

// 사용자 입력값 검증 함수들
export function validateUserInput(key: string, value: string): { isValid: boolean; error?: string; sanitizedValue?: string } {
  // 빈 값 허용
  if (!value || value.trim() === '') {
    return { isValid: true, sanitizedValue: value };
  }

  // XSS 방지를 위한 위험한 패턴 체크
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // <script> 태그
    /javascript:/gi, // javascript: 프로토콜
    /on\w+\s*=/gi, // 이벤트 핸들러 (onclick, onload 등)
    /data:text\/html/gi, // data URL HTML
    /vbscript:/gi, // VBScript
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // iframe 태그
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // object 태그
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, // embed 태그
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return { 
        isValid: false, 
        error: 'Potentially dangerous content detected. Please remove script tags and event handlers.',
        sanitizedValue: value.replace(pattern, '')
      };
    }
  }

  // 위험한 패턴 체크
  if (value.includes('${') && !value.includes('${{')) {
    return { 
      isValid: false, 
      error: 'Invalid variable syntax. Use ${{ }} for GitHub Actions expressions.',
      sanitizedValue: value.replace(/\$\{/g, '${{').replace(/\}/g, '}}')
    };
  }

  // Shell injection 방지
  if (value.includes('`') || value.includes('$(') || value.includes('&&') || value.includes('||')) {
    return { 
      isValid: false, 
      error: 'Shell command injection detected. Use "run" field for commands.',
      sanitizedValue: value.replace(/[`$()&|]/g, '')
    };
  }

  // SQL Injection 방지 (GitHub Actions에서는 직접적 위험은 낮지만 예방)
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(or|and)\b)/gi,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      return { 
        isValid: false, 
        error: 'SQL injection pattern detected. Please use safe input values.',
        sanitizedValue: value.replace(pattern, '')
      };
    }
  }

  // YAML 특수 문자 체크 (경고만)
  const yamlSpecialChars = ['#', '&', '*', '!', '|', '>', '?', '-', ',', '@', '%'];
  const hasSpecialChars = yamlSpecialChars.some(char => value.includes(char));
  
  if (hasSpecialChars) {
    // 특수 문자가 있어도 허용하되, YAML 생성 시 자동으로 이스케이프 처리됨
    return { isValid: true, sanitizedValue: value };
  }

  return { isValid: true, sanitizedValue: value };
}

export function sanitizeNodeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Unnamed Step';
  }

  // 위험한 문자 제거
  const sanitized = name
    .replace(/[`$()&|]/g, '') // Shell injection 방지
    .replace(/[<>:"/\\|?*]/g, '') // 파일명에 사용할 수 없는 문자 제거
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+\s*=/gi, '') // 이벤트 핸들러 제거
    .trim();

  return sanitized || 'Unnamed Step';
}

export function sanitizeConfigValue(key: string, value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // key에 따른 특별한 처리
  if (key === 'repository') {
    // repository는 GitHub Actions 형식이어야 함
    if (!value.includes('/') && !value.includes('@')) {
      return `actions/${value}@v4`;
    }
  }

  if (key === 'run') {
    // run 필드는 명령어이므로 특수 문자 허용하되 위험한 패턴만 제거
    return value
      .replace(/\$\{/g, '${{') // 올바른 GitHub Actions 표현식으로 변환
      .replace(/\}/g, '}}')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/on\w+\s*=/gi, ''); // 이벤트 핸들러 제거
  }

  // 일반적인 설정값 - XSS 방지
  return value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+\s*=/gi, ''); // 이벤트 핸들러 제거
}

// 개발자 도구용 YAML 검증 함수 (사용자에게는 보이지 않음)
export function validateGeneratedYaml(yamlString: string): { isValid: boolean; error?: string } {
  try {
    // 기본적인 YAML 구조 검증
    const lines = yamlString.split('\n');
    
    // 필수 필드 검증
    if (!yamlString.includes('name:')) {
      return { isValid: false, error: 'Missing workflow name' };
    }
    
    if (!yamlString.includes('on:')) {
      return { isValid: false, error: 'Missing triggers (on field)' };
    }
    
    if (!yamlString.includes('jobs:')) {
      return { isValid: false, error: 'Missing jobs' };
    }
    
    if (!yamlString.includes('runs-on:')) {
      return { isValid: false, error: 'Missing runs-on in jobs' };
    }
    
    if (!yamlString.includes('steps:')) {
      return { isValid: false, error: 'Missing steps in jobs' };
    }
    
    // 들여쓰기 검증
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const match = line.match(/^\s*/);
      if (match) {
        const indent = match[0].length;
        if (indent % 2 !== 0 && indent > 0) {
          return { isValid: false, error: `Invalid indentation at line: ${line.trim()}` };
        }
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

// 내부 디버깅용 함수 (개발 시에만 사용)
export function debugYamlGeneration(nodes: PipelineNode[], connections: PipelineConnection[]): void {
  if (process.env.NODE_ENV === 'development') {
    const sortedNodes = topologicalSort(nodes, connections);
    const yaml = `name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
${sortedNodes.map((node) => generateSafeNodeYaml(node)).join("\n\n")}`;

    const validation = validateGeneratedYaml(yaml);
    if (!validation.isValid) {
      // YAML Generation Warning
    }
  }
}
