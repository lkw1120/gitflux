"use client"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

export function CustomNode({ data, selected }: NodeProps) {
  const { label, type, icon: Icon, status = "idle" } = data

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case "running":
        return <Clock className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "border-green-500 bg-green-50"
      case "error":
        return "border-red-500 bg-red-50"
      case "running":
        return "border-blue-500 bg-blue-50"
      default:
        return selected ? "border-primary bg-primary/5" : "border-border bg-background"
    }
  }

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary border-2 border-background" />

      <Card className={`min-w-[200px] transition-all duration-200 ${getStatusColor()}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{label}</h3>
                {getStatusIcon()}
              </div>
              <Badge variant="secondary" className="text-xs">
                {type}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary border-2 border-background" />
    </div>
  )
}
