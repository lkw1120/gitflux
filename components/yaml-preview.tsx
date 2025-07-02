"use client"

import { usePipeline } from "./pipeline-context"
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { useState, useMemo } from "react"
import { generateNodeYaml, debounce, throttle, topologicalSort, debugYamlGeneration } from "@/lib/utils"
import type { PipelineTriggers } from "./pipeline-context"

export function YamlPreview() {
  const { nodes, connections, triggers } = usePipeline()
  const [copied, setCopied] = useState(false)

  // 트리거 설정을 YAML로 변환하는 함수
  const generateTriggersYaml = (triggerConfig: PipelineTriggers) => {
    const triggerLines: string[] = []
    
    if (triggerConfig.push) {
      const pushConfig = triggerConfig.push
      triggerLines.push('  push:')
      if (pushConfig.branches && pushConfig.branches.length > 0) {
        triggerLines.push(`    branches: [ ${pushConfig.branches.join(', ')} ]`)
      }
      if (pushConfig.paths && pushConfig.paths.length > 0) {
        triggerLines.push(`    paths: [ ${pushConfig.paths.join(', ')} ]`)
      }
      if (pushConfig.paths_ignore && pushConfig.paths_ignore.length > 0) {
        triggerLines.push(`    paths-ignore: [ ${pushConfig.paths_ignore.join(', ')} ]`)
      }
    }
    
    if (triggerConfig.pull_request) {
      const prConfig = triggerConfig.pull_request
      triggerLines.push('  pull_request:')
      if (prConfig.branches && prConfig.branches.length > 0) {
        triggerLines.push(`    branches: [ ${prConfig.branches.join(', ')} ]`)
      }
      if (prConfig.types && prConfig.types.length > 0) {
        triggerLines.push(`    types: [ ${prConfig.types.join(', ')} ]`)
      }
    }
    
    if (triggerConfig.schedule) {
      const scheduleConfig = triggerConfig.schedule
      triggerLines.push('  schedule:')
      triggerLines.push(`    - cron: '${scheduleConfig.cron || '0 0 * * *'}'`)
    }
    
    if (triggerConfig.workflow_dispatch) {
      triggerLines.push('  workflow_dispatch:')
      if (triggerConfig.workflow_dispatch.inputs && Object.keys(triggerConfig.workflow_dispatch.inputs).length > 0) {
        triggerLines.push('    inputs:')
        Object.entries(triggerConfig.workflow_dispatch.inputs).forEach(([key, value]: [string, unknown]) => {
          const inputValue = value as Record<string, unknown>
          triggerLines.push(`      ${key}:`)
          triggerLines.push(`        description: ${inputValue.description || 'Input parameter'}`)
          triggerLines.push(`        required: ${inputValue.required || false}`)
          triggerLines.push(`        type: ${inputValue.type || 'string'}`)
        })
      }
    }
    
    // 기본값이 없으면 기본 push 트리거 추가
    if (triggerLines.length === 0) {
      triggerLines.push('  push:')
      triggerLines.push('    branches: [ main ]')
    }
    
    return triggerLines.join('\n')
  }

  // YAML 생성을 메모이제이션 (debounce는 제거 - 즉시 반영되도록)
  const yamlContent = useMemo(() => {
    if (nodes.length === 0) {
      return `# No pipeline steps defined yet
# Drag actions from the toolbox to get started

name: CI/CD Pipeline
on:
${generateTriggersYaml(triggers)}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Add your pipeline steps here`
    }

    // Sort nodes based on connections (topological sort)
    const sortedNodes = topologicalSort(nodes, connections)

    const yaml = `name: CI/CD Pipeline
on:
${generateTriggersYaml(triggers)}

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
${sortedNodes.map((node) => generateNodeYaml(node)).join("\n\n")}`

    // 개발 환경에서만 디버깅 실행
    debugYamlGeneration(nodes, connections)

    return yaml
  }, [nodes, connections, triggers])

  // Debounced copy function (복사만 debounce)
  const handleCopy = debounce(async () => {
    try {
      await navigator.clipboard.writeText(yamlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Failed to copy to clipboard
    }
  }, 300)

  // Throttled download function (다운로드만 throttle)
  const handleDownload = throttle(() => {
    const blob = new Blob([yamlContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "workflow.yml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1000)

  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">YAML Preview</h3>
      <div className="flex-1 bg-gray-900 dark:bg-gray-950 rounded-lg p-3 overflow-auto mb-4 border border-gray-700 dark:border-gray-600">
        <pre className="text-sm text-gray-100 dark:text-gray-200 whitespace-pre-wrap font-mono">{yamlContent}</pre>
      </div>
      <div className="flex w-full gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center space-x-1 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Copy size={14} />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center space-x-1 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Download size={14} />
          <span>Download</span>
        </Button>
      </div>
    </div>
  )
}
