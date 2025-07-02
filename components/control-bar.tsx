"use client"

import { ThemeToggle } from "./theme-toggle"
import { FaGithub } from "react-icons/fa"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    resetCanvasScale?: () => void;
    fitCanvasView?: () => void;
    getCanvasScale?: () => number;
    setCanvasScale?: (scale: number) => void;
  }
}

export function ControlBar() {

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 fixed top-0 left-0 w-full z-50" style={{height: '64px'}}>
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          Instant CI/CD Pipeline Builder
        </div>
        <div className="flex items-center space-x-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="flex items-center justify-center bg-transparent"
            title="View on GitHub"
          >
            <a
              href="https://github.com/lkw1120/gitflux"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="w-5 h-5" />
            </a>
          </Button>
          <span className="mx-4 border-l h-6" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
