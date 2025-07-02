// components/trigger-settings.tsx
"use client"

import { usePipeline } from "./pipeline-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitPullRequest, Clock, Play, Upload } from "lucide-react"
import type { PipelineTriggers } from "./pipeline-context"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

export function TriggerSettings() {
  const { triggers, updateTriggers } = usePipeline()
  const { showConfirm, ConfirmDialog } = useConfirmDialog()

  const handleTriggerChange = (triggerType: keyof PipelineTriggers, enabled: boolean) => {
    const activeCount = triggerTypes.filter(t => Boolean(triggers[t.key])).length;
    if (!enabled && activeCount === 1) {
      // 마지막 트리거를 끄려고 할 때
      showConfirm(
        "Cannot Disable Trigger",
        "At least one trigger must be active. Please enable another trigger before disabling this one.",
        () => {
          // 다시 활성화
          updateTriggers({ ...triggers, [triggerType]: triggers[triggerType] || getDefaultTriggerConfig(triggerType) });
        },
        {
          confirmText: "OK",
          variant: "default"
        }
      );
      return;
    }
    const newTriggers = { ...triggers }
    if (enabled) {
      newTriggers[triggerType] = newTriggers[triggerType] || getDefaultTriggerConfig(triggerType)
    } else {
      delete newTriggers[triggerType]
    }
    updateTriggers(newTriggers)
  }

  const handleConfigChange = (triggerType: keyof PipelineTriggers, key: string, value: unknown) => {
    const newTriggers = { ...triggers }
    if (!newTriggers[triggerType]) {
      newTriggers[triggerType] = getDefaultTriggerConfig(triggerType)
    }
    
    // 타입별로 안전하게 설정
    if (triggerType === 'push' && newTriggers.push) {
      (newTriggers.push as Record<string, unknown>)[key] = value
    } else if (triggerType === 'pull_request' && newTriggers.pull_request) {
      (newTriggers.pull_request as Record<string, unknown>)[key] = value
    } else if (triggerType === 'schedule' && newTriggers.schedule) {
      (newTriggers.schedule as Record<string, unknown>)[key] = value
    } else if (triggerType === 'workflow_dispatch' && newTriggers.workflow_dispatch) {
      (newTriggers.workflow_dispatch as Record<string, unknown>)[key] = value
    }
    
    updateTriggers(newTriggers)
  }

  const getDefaultTriggerConfig = (triggerType: keyof PipelineTriggers) => {
    switch (triggerType) {
      case 'push':
        return { branches: ['main'], paths: [], paths_ignore: [] }
      case 'pull_request':
        return { branches: ['main'], types: ['opened', 'synchronize', 'reopened'] }
      case 'schedule':
        return { cron: '' }
      case 'workflow_dispatch':
        return { inputs: '' }
      default:
        return {}
    }
  }

  // 타입 가드 함수들
  const isPushConfig = (config: unknown): config is { branches: string[], paths?: string[], paths_ignore?: string[] } => {
    return typeof config === 'object' && config !== null && 'branches' in config
  }

  const isPullRequestConfig = (config: unknown): config is { branches: string[], types?: string[] } => {
    return typeof config === 'object' && config !== null && 'branches' in config
  }

  const isScheduleConfig = (config: unknown): config is { cron: string } => {
    return typeof config === 'object' && config !== null && 'cron' in config
  }

  // 타입 안전한 접근을 위한 헬퍼 함수들
  const getBranches = (config: unknown): string => {
    if (isPushConfig(config) || isPullRequestConfig(config)) {
      return typeof config.branches === 'string' ? config.branches : Array.isArray(config.branches) ? config.branches.join(', ') : ''
    }
    return ''
  }

  const getPaths = (config: unknown): string => {
    if (isPushConfig(config)) {
      return typeof config.paths === 'string' ? config.paths : Array.isArray(config.paths) ? config.paths.join(', ') : ''
    }
    return ''
  }

  const getPathsIgnore = (config: unknown): string => {
    if (isPushConfig(config)) {
      return typeof config.paths_ignore === 'string' ? config.paths_ignore : Array.isArray(config.paths_ignore) ? config.paths_ignore.join(', ') : ''
    }
    return ''
  }

  const getTypes = (config: unknown): string => {
    if (isPullRequestConfig(config)) {
      return typeof config.types === 'string' ? config.types : Array.isArray(config.types) ? config.types.join(', ') : 'opened, synchronize, reopened'
    }
    return ''
  }

  const triggerTypes = [
    {
      key: 'push' as const,
      name: 'Push',
      description: 'Trigger on push to branches',
      icon: Upload,
      color: 'bg-green-500'
    },
    {
      key: 'pull_request' as const,
      name: 'Pull Request',
      description: 'Trigger on pull requests',
      icon: GitPullRequest,
      color: 'bg-blue-500'
    },
    {
      key: 'schedule' as const,
      name: 'Schedule',
      description: 'Trigger on a schedule',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      key: 'workflow_dispatch' as const,
      name: 'Manual',
      description: 'Trigger manually',
      icon: Play,
      color: 'bg-orange-500'
    }
  ]
  
  return (
    <div className="relative h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Workflow Triggers</h3>
        <div className="space-y-4">
          {triggerTypes.map((trigger) => {
            const isEnabled = Boolean(triggers[trigger.key])
            const config = triggers[trigger.key] || getDefaultTriggerConfig(trigger.key)
            const IconComponent = trigger.icon

            return (
              <Card key={trigger.key} className="border-gray-200 dark:border-gray-700">
                <CardHeader className="py-3">
      <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent size={20} className="text-gray-600 dark:text-gray-400" />
                      <div>
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                          {trigger.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                          {trigger.description}
                        </CardDescription>
        </div>
          </div>
                    <div className="flex items-center space-x-2">
                      {isEnabled && (
                        <Badge variant="secondary" className="text-xs w-2 h-2 p-0 rounded-full" />
        )}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleTriggerChange(trigger.key, checked)}
                      />
                    </div>
      </div>
                </CardHeader>
                
                {isEnabled && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {trigger.key === 'push' && isPushConfig(config) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Branches
                            </Label>
                            <Input
                              value={getBranches(config)}
                              onChange={(e) => handleConfigChange(trigger.key, 'branches', e.target.value)}
                              onBlur={(e) => {
                                const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                                handleConfigChange(trigger.key, 'branches', arr)
                              }}
                              placeholder="main, develop, feature/*"
                              className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
            </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Paths (optional)
                            </Label>
                            <Input
                              value={getPaths(config)}
                              onChange={(e) => handleConfigChange(trigger.key, 'paths', e.target.value)}
                              onBlur={(e) => {
                                const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                                handleConfigChange(trigger.key, 'paths', arr)
                              }}
                              placeholder="src/, docs/"
                              className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Paths Ignore (optional)
                            </Label>
                            <Input
                              value={getPathsIgnore(config)}
                              onChange={(e) => handleConfigChange(trigger.key, 'paths_ignore', e.target.value)}
                              onBlur={(e) => {
                                const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                                handleConfigChange(trigger.key, 'paths_ignore', arr)
                              }}
                              placeholder="*.md, docs/, tests/"
                              className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
        </div>
                        </>
      )}
      
                      {trigger.key === 'pull_request' && isPullRequestConfig(config) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Branches
                            </Label>
                            <Input
                              value={getBranches(config)}
                              onChange={(e) => handleConfigChange(trigger.key, 'branches', e.target.value)}
                              onBlur={(e) => {
                                const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                                handleConfigChange(trigger.key, 'branches', arr)
                              }}
                              placeholder="main, develop"
                              className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
            <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Event Types
                            </Label>
              <Input
                              value={getTypes(config)}
                              onChange={(e) => handleConfigChange(trigger.key, 'types', e.target.value)}
                              onBlur={(e) => {
                                const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                                handleConfigChange(trigger.key, 'types', arr)
                }}
                              placeholder="opened, synchronize, reopened"
                              className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                              Events: opened, synchronize, reopened, closed, assigned, unassigned, labeled, unlabeled, review_requested, review_request_removed
              </p>
            </div>
                        </>
                      )}
                      
                      {trigger.key === 'schedule' && isScheduleConfig(config) && (
            <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Cron Expression
                          </Label>
              <Input
                            value={typeof config.cron === 'string' ? config.cron : ''}
                            onChange={(e) => handleConfigChange(trigger.key, 'cron', e.target.value)}
                            onBlur={(e) => {
                              const cron = e.target.value.trim()
                              handleConfigChange(trigger.key, 'cron', cron)
                }}
                            placeholder="0 0 * * 1-5  # Every weekday at midnight (UTC)"
                            className="text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                            Format: minute hour day month day-of-week
                          </p>
                          {!config.cron && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                              ⚠️ No cron expression set. The schedule trigger will not work without a valid cron expression.
              </p>
                          )}
            </div>
          )}
                      
                      {trigger.key === 'workflow_dispatch' && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Manual Trigger Configuration
                          </Label>
                          <textarea
                            value={typeof triggers.workflow_dispatch?.inputs === 'string' ? triggers.workflow_dispatch.inputs : JSON.stringify(triggers.workflow_dispatch?.inputs || {}, null, 2)}
                            onChange={(e) => handleConfigChange(trigger.key, 'inputs', e.target.value)}
                            onBlur={(e) => {
                              const value = e.target.value.trim()
                              if (value === '') {
                                handleConfigChange(trigger.key, 'inputs', '')
                              } else {
                                try {
                                  const inputs = JSON.parse(value)
                                  handleConfigChange(trigger.key, 'inputs', inputs)
                                } catch {
                                  handleConfigChange(trigger.key, 'inputs', value)
                                }
                              }
                            }}
                            placeholder={`{
  "environment": {
    "description": "Environment to deploy to",
    "required": true,
    "type": "choice",
    "options": ["staging", "production"]
  }
}`}
                            className="min-h-[180px] w-full text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono rounded-md p-2 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                            Define input parameters in JSON format. Each parameter can have description, required, and type properties.
                          </p>
                          {(() => {
                            const inputs = triggers.workflow_dispatch?.inputs
                            const isEmpty = !inputs || 
                              (typeof inputs === 'string' && inputs === '') ||
                              (typeof inputs === 'object' && inputs && Object.keys(inputs).length === 0)
                            return isEmpty ? (
                              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                                💡 No input parameters defined. The manual trigger will work without any input fields.
                              </p>
                            ) : null
                          })()}
            </div>
          )}
        </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
      {/* Reset Triggers Footer */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 flex items-center justify-center space-x-1 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            const newTriggers = { ...triggers }
            Object.keys(newTriggers).forEach(key => {
              newTriggers[key as string] = getDefaultTriggerConfig(key)
            })
            updateTriggers(newTriggers)
          }}
        >
          Reset All Triggers
        </Button>
        </div>
      {ConfirmDialog}
    </div>
  )
}