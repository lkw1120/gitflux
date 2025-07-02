"use client"
import { useState } from 'react'
import { PipelineProvider } from '@/components/pipeline-context'
import { ControlBar } from '@/components/control-bar'
import { PipelineCanvas } from '@/components/pipeline-canvas'
import { NodeToolbox } from '@/components/node-toolbox'
import { NodeConfig } from '@/components/node-config'
import { YamlPreview } from '@/components/yaml-preview'

export default function Page() {
  const [rightTab, setRightTab] = useState<'config' | 'yaml'>('config')

  return (
    <PipelineProvider>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
        {/* 헤더 */}
        <div className="fixed top-0 left-0 w-full z-20">
          <ControlBar />
        </div>
        {/* 캔버스: 항상 배경에, 헤더 높이만큼 아래에서 시작 */}
        <div className="absolute top-16 left-0 w-full h-[calc(100%-64px)] z-0">
          <div className="w-full h-full">
            <PipelineCanvas />
          </div>
        </div>
        {/* 툴박스: 좌측에 겹쳐서 */}
        <div className="absolute left-0 top-16 h-[calc(100%-64px)] w-80 shadow-2xl bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
          <NodeToolbox />
        </div>
        {/* 설정/프리뷰: 우측에 겹쳐서, 상단 탭 UI */}
        <div className="absolute right-0 top-16 h-[calc(100%-64px)] w-[360px] shadow-2xl bg-white dark:bg-gray-800 flex flex-col z-10 border-l border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${rightTab === 'config' ? 'border-blue-500 text-blue-600 bg-gray-50 dark:bg-gray-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'}`}
              onClick={() => setRightTab('config')}
            >
              Settings
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${rightTab === 'yaml' ? 'border-blue-500 text-blue-600 bg-gray-50 dark:bg-gray-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'}`}
              onClick={() => setRightTab('yaml')}
            >
              YAML
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'config' ? <NodeConfig /> : <YamlPreview />}
          </div>
        </div>
      </div>
    </PipelineProvider>
  )
}
