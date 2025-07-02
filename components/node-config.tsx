"use client"

import { usePipeline } from "./pipeline-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { validateUserInput, sanitizeNodeName, sanitizeConfigValue } from "@/lib/utils"
import { TriggerSettings } from "./trigger-settings"

export function NodeConfig() {
  const { nodes, selectedNode, updateNode } = usePipeline()

  // 노드가 선택되지 않았을 때는 트리거 설정 표시
  if (!selectedNode) {
    return <TriggerSettings />
  }

  const node = nodes.find((n) => n.id === selectedNode)

  if (!node) {
    return (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Node Configuration</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a node to configure its settings</p>
      </div>
    )
  }

  const handleConfigChange = (key: string, value: string | boolean | number) => {
    // 문자열인 경우 검증 및 정제
    if (typeof value === 'string') {
      const sanitizedValue = sanitizeConfigValue(key, value);
      const newConfig = { ...node.config, [key]: sanitizedValue }
      updateNode(node.id, { config: newConfig })
    } else {
      const newConfig = { ...node.config, [key]: value }
      updateNode(node.id, { config: newConfig })
    }
  }

  const handleNameChange = (name: string) => {
    const sanitizedName = sanitizeNodeName(name);
    updateNode(node.id, { name: sanitizedName })
  }

  const renderConfigField = (key: string, value: string | boolean | number) => {
    // 중첩 객체 처리
    if (typeof value === "object" && value !== null) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium text-gray-900 dark:text-white">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Label>
          <Textarea
            id={key}
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleConfigChange(key, parsed)
              } catch {
                // 파싱 에러 시에는 반영하지 않음
              }
            }}
            className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">JSON 형식으로 입력하세요.</p>
        </div>
      )
    }

    if (typeof value === "boolean") {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium text-gray-900 dark:text-white">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={key}
              checked={value}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Enable {key}</span>
          </div>
        </div>
      )
    }

    if (key === "command" || key === "run" || (typeof value === "string" && value.length > 50)) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium text-gray-900 dark:text-white">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Label>
          <Textarea
            id={key}
            value={value}
            onChange={(e) => {
              const validation = validateUserInput(key, e.target.value);
              if (validation.isValid) {
                handleConfigChange(key, validation.sanitizedValue || e.target.value);
              } else {
                // 오류가 있어도 사용자에게는 보이지 않게 하고, 정제된 값 사용
                handleConfigChange(key, validation.sanitizedValue || e.target.value);
              }
            }}
            className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      )
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium text-gray-900 dark:text-white">
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </Label>
        <Input 
          id={key} 
          value={value} 
          onChange={(e) => {
            const validation = validateUserInput(key, e.target.value);
            if (validation.isValid) {
              handleConfigChange(key, validation.sanitizedValue || e.target.value);
            } else {
              // 오류가 있어도 사용자에게는 보이지 않게 하고, 정제된 값 사용
              handleConfigChange(key, validation.sanitizedValue || e.target.value);
            }
          }}
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
    )
  }

  const resetNodeConfig = () => {
    // 노드 타입에 따른 기본 설정으로 초기화
    const defaultConfig = getDefaultNodeConfig(node.type)
    updateNode(node.id, { config: defaultConfig })
  }

  const getDefaultNodeConfig = (nodeType: string): Record<string, string | number | boolean> => {
    switch (nodeType) {
      case 'checkout':
        return { repository: '', ref: 'main', token: '' }
      case 'setup-node':
        return { 'node-version': '18', cache: 'npm' }
      case 'run':
        return { command: '', shell: 'bash' }
      case 'cache':
        return { path: 'node_modules', key: 'node-${{ hashFiles(\'**/package-lock.json\') }}' }
      case 'upload-artifact':
        return { name: 'artifact', path: 'dist/', 'retention-days': 30 }
      case 'download-artifact':
        return { name: 'artifact', path: 'dist/' }
      case 'deploy':
        return { environment: 'production', strategy: 'rolling' }
      default:
        return {}
    }
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Node Configuration</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nodeName" className="text-sm font-medium text-gray-900 dark:text-white">
              Node Name
            </Label>
            <Input 
              id="nodeName" 
              value={node.name} 
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {Object.entries(node.config)
            .filter(([key]) => key !== "run")
            .map(([key, value]) => renderConfigField(key, value))}

          {/* Always show the run field at the bottom with an English hint */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="space-y-2">
              <Label htmlFor="runField" className="text-sm font-medium text-gray-900 dark:text-white">
                Run
              </Label>
              <Textarea
                id="runField"
                value={String(node.config.run ?? "")}
                onChange={(e) => {
                  const validation = validateUserInput("run", e.target.value);
                  if (validation.isValid) {
                    handleConfigChange("run", validation.sanitizedValue || e.target.value);
                  } else {
                    // 오류가 있어도 사용자에게는 보이지 않게 하고, 정제된 값 사용
                    handleConfigChange("run", validation.sanitizedValue || e.target.value);
                  }
                }}
                placeholder="e.g., npm install, echo 'Hello World'"
                className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This command will be executed for this step. Leave empty if no command is needed.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Reset Node Config Footer */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 flex items-center justify-center space-x-1 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={resetNodeConfig}
        >
          Reset Node Config
        </Button>
      </div>
    </div>
  )
}
