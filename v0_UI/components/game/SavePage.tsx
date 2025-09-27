"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { PageType } from "@/app/page"

interface SavePageProps {
  onNavigate: (page: PageType) => void
}

interface SaveFile {
  id: string
  name: string
  gameTime: string
  createTime: string
  lastSave: string
  preset: string
  status: string
  scene: string
  isActive: boolean
}

interface HistoryRound {
  round: number
  time: string
  userInput: string
  scene: string
  narration: string
  choices: string[]
  statusChange: string
}

export function SavePage({ onNavigate }: SavePageProps) {
  const [currentSave] = useState<SaveFile>({
    id: "current",
    name: "中世纪奇幻冒险 - 艾尔德的传说",
    gameTime: "第42回合",
    createTime: "2024-01-20 14:30",
    lastSave: "刚才",
    preset: "中世纪奇幻冒险",
    status: "HP:75/100 MP:30/50 EXP:260 Gold:50",
    scene: "你站在古老城堡的大门前...",
    isActive: true,
  })

  const [historySaves] = useState<SaveFile[]>([
    {
      id: "save2",
      name: "现代都市探索 - 夜行者",
      gameTime: "第28回合",
      createTime: "2024-01-18 09:15",
      lastSave: "2天前",
      preset: "现代都市探索",
      status: "HP:90/100 Stress:25/100 Money:1500",
      scene: "你潜入了废弃的工厂...",
      isActive: false,
    },
    {
      id: "save3",
      name: "星际科幻冒险 - 星海漂流者",
      gameTime: "第15回合",
      createTime: "2024-01-15 20:45",
      lastSave: "5天前",
      preset: "星际科幻冒险",
      status: "HP:60/80 Energy:40/60 Credits:250",
      scene: "飞船的警报声响起...",
      isActive: false,
    },
  ])

  const [currentRound, setCurrentRound] = useState(40)
  const [maxRound] = useState(42)
  const [historyRound] = useState<HistoryRound>({
    round: 40,
    time: "2024-01-20 14:25",
    userInput: "我想仔细观察城堡的结构",
    scene: "你仔细观察着城堡的石墙...",
    narration: "你发现了一些奇怪的符文...",
    choices: ["A:触摸符文", "B:绕过去", "C:记录下来"],
    statusChange: "无",
  })

  const storageUsed = 15.2
  const storageTotal = 100

  const handleContinueGame = () => {
    onNavigate("game")
  }

  const handleLoadSave = (saveId: string) => {
    console.log("加载存档:", saveId)
    onNavigate("game")
  }

  const handleRenameSave = (saveId: string) => {
    console.log("重命名存档:", saveId)
  }

  const handleExportSave = (saveId: string) => {
    console.log("导出存档:", saveId)
  }

  const handleDeleteSave = (saveId: string) => {
    console.log("删除存档:", saveId)
  }

  const handleBackupSave = (saveId: string) => {
    console.log("备份存档:", saveId)
  }

  const handleCreateNewSave = () => {
    console.log("新建存档")
  }

  const handleImportSave = () => {
    console.log("导入存档")
  }

  const handleCleanOldSaves = () => {
    console.log("清理旧存档")
  }

  const handlePreviousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1)
    }
  }

  const handleNextRound = () => {
    if (currentRound < maxRound) {
      setCurrentRound(currentRound + 1)
    }
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
              <h1 className="text-2xl font-bold text-foreground">存档管理页面</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateNewSave}>新建存档</Button>
              <Button variant="outline" onClick={handleImportSave}>
                导入存档
              </Button>
              <Button variant="outline" onClick={handleCleanOldSaves}>
                清理旧存档
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* 当前存档 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">当前存档:</h2>
            <Card className="border-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📂</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{currentSave.name}</h3>
                        <Badge>正在游戏</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        游戏时间: {currentSave.gameTime} | 创建: {currentSave.createTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        最后保存: {currentSave.lastSave} | 预设: {currentSave.preset}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">角色状态: {currentSave.status}</div>
                      <div className="text-sm text-muted-foreground">当前场景: {currentSave.scene}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleContinueGame}>继续游戏</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRenameSave(currentSave.id)}>
                      重命名
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportSave(currentSave.id)}>
                      导出
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBackupSave(currentSave.id)}>
                      备份
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteSave(currentSave.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 历史存档 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">历史存档:</h2>
            <div className="space-y-4">
              {historySaves.map((save) => (
                <Card key={save.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">📂</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{save.name}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            游戏时间: {save.gameTime} | 创建: {save.createTime}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            最后保存: {save.lastSave} | 预设: {save.preset}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">角色状态: {save.status}</div>
                          <div className="text-sm text-muted-foreground">当前场景: {save.scene}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleLoadSave(save.id)}>加载</Button>
                        <Button variant="outline" size="sm" onClick={() => handleRenameSave(save.id)}>
                          重命名
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExportSave(save.id)}>
                          导出
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSave(save.id)}>
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="text-center">
                <Button variant="outline">显示更多存档...</Button>
                <div className="text-sm text-muted-foreground mt-2">
                  存储空间: {storageUsed}/{storageTotal}MB
                </div>
                <Progress value={(storageUsed / storageTotal) * 100} className="w-32 mx-auto mt-1" />
              </div>
            </div>
          </div>

          <Separator />

          {/* 回合历史浏览 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">回合历史浏览:</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">回合时间轴</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handlePreviousRound} disabled={currentRound <= 1}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <span className="text-sm font-medium">
                      第{currentRound}回合 / 第{maxRound}回合
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNextRound} disabled={currentRound >= maxRound}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base">第{historyRound.round}回合</CardTitle>
                    <CardDescription>时间: {historyRound.time}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">用户输入: </span>
                      <span className="text-sm">"{historyRound.userInput}"</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">场景: </span>
                      <span className="text-sm">{historyRound.scene}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">旁白: </span>
                      <span className="text-sm">{historyRound.narration}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">选择: </span>
                      <span className="text-sm">{historyRound.choices.join(" ")}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">状态变化: </span>
                      <span className="text-sm">{historyRound.statusChange}</span>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
