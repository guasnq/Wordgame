"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PageType } from "@/app/page"

interface PresetPageProps {
  onNavigate: (page: PageType) => void
}

interface Preset {
  id: string
  name: string
  icon: string
  createTime: string
  modifyTime: string
  isActive: boolean
  isComplete: boolean
  hasWorldView: boolean
  hasStatusBar: boolean
  hasCardConfig: boolean
}

export function PresetPage({ onNavigate }: PresetPageProps) {
  const [myPresets] = useState<Preset[]>([
    {
      id: "1",
      name: "中世纪奇幻冒险",
      icon: "📜",
      createTime: "2024-01-15",
      modifyTime: "昨天",
      isActive: true,
      isComplete: true,
      hasWorldView: true,
      hasStatusBar: true,
      hasCardConfig: true,
    },
    {
      id: "2",
      name: "现代都市探索",
      icon: "🌆",
      createTime: "2024-01-10",
      modifyTime: "3天前",
      isActive: false,
      isComplete: true,
      hasWorldView: true,
      hasStatusBar: true,
      hasCardConfig: true,
    },
    {
      id: "3",
      name: "星际科幻冒险",
      icon: "🚀",
      createTime: "2024-01-08",
      modifyTime: "1周前",
      isActive: false,
      isComplete: false,
      hasWorldView: true,
      hasStatusBar: false,
      hasCardConfig: true,
    },
  ])

  const [officialPresets] = useState([
    {
      id: "official-1",
      name: "经典龙与地下城风格",
      icon: "🏰",
      tags: ["奇幻", "RPG", "经典"],
      description: "完整D&D体系，6大属性，法术系统",
    },
    {
      id: "official-2",
      name: "克苏鲁神话探索",
      icon: "🎭",
      tags: ["恐怖", "悬疑", "调查"],
      description: "San值系统，调查技能，恐怖氛围",
    },
    {
      id: "official-3",
      name: "现代特工行动",
      icon: "💼",
      tags: ["现代", "间谍", "动作"],
      description: "装备系统，任务评级，声誉机制",
    },
  ])

  const handleSwitchPreset = (presetId: string) => {
    console.log("切换预设:", presetId)
  }

  const handleEditPreset = (presetId: string) => {
    console.log("编辑预设:", presetId)
  }

  const handleCopyPreset = (presetId: string) => {
    console.log("复制预设:", presetId)
  }

  const handleExportPreset = (presetId: string) => {
    console.log("导出预设:", presetId)
  }

  const handleDeletePreset = (presetId: string) => {
    console.log("删除预设:", presetId)
  }

  const handleImportOfficialPreset = (presetId: string) => {
    console.log("导入官方预设:", presetId)
  }

  const handleCreateNewPreset = () => {
    onNavigate("worldview")
  }

  const handleImportPreset = () => {
    console.log("导入预设文件")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate("game")}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </Button>
              <h1 className="text-2xl font-bold text-foreground">预设管理页面</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateNewPreset}>新建预设</Button>
              <Button variant="outline" onClick={handleImportPreset}>
                导入预设
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* 我的预设 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">我的预设:</h2>
            <div className="space-y-4">
              {myPresets.map((preset) => (
                <Card key={preset.id} className={preset.isActive ? "border-primary" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{preset.name}</h3>
                            {preset.isActive && <Badge>正在使用</Badge>}
                            {!preset.isComplete && <Badge variant="destructive">未完成</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            创建时间: {preset.createTime} | 修改: {preset.modifyTime}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              包含: 世界观{preset.hasWorldView ? "✓" : "✗"} 状态栏
                              {preset.hasStatusBar ? "✓" : "✗"} 卡片配置{preset.hasCardConfig ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!preset.isActive && (
                          <Button variant="outline" size="sm" onClick={() => handleSwitchPreset(preset.id)}>
                            切换
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEditPreset(preset.id)}>
                          编辑
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopyPreset(preset.id)}>
                          复制
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExportPreset(preset.id)}>
                          导出
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
                          disabled={preset.isActive}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* 官方示例预设 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">官方示例预设:</h2>
            <div className="space-y-4">
              {officialPresets.map((preset) => (
                <Card key={preset.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{preset.name}</h3>
                          <div className="flex gap-2 mt-1">
                            {preset.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">特色: {preset.description}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          预览
                        </Button>
                        <Button size="sm" onClick={() => handleImportOfficialPreset(preset.id)}>
                          导入
                        </Button>
                        <Button variant="outline" size="sm">
                          了解更多
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
