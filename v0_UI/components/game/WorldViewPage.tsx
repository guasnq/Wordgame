"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PageType } from "@/app/page"

interface WorldViewPageProps {
  onNavigate: (page: PageType) => void
}

export function WorldViewPage({ onNavigate }: WorldViewPageProps) {
  const [gameBackground, setGameBackground] = useState("medieval")
  const [worldDescription, setWorldDescription] = useState(
    "在一个被魔法浸润的古老大陆上，你扮演一名年轻的冒险者。这个世界充满了神秘的生物、古老的魔法和未知的危险。各个王国之间争权夺利，而邪恶的力量正在黑暗中蠢蠢欲动...\n\n游戏规则：\n• 角色生命值降至0时游戏结束\n• 通过完成任务获得经验值和金钱\n• 与NPC互动可能影响剧情发展",
  )
  const [statusFields, setStatusFields] = useState([
    { name: "生命值", displayName: "HP", type: "progress", initialValue: 100, maxValue: 100 },
    { name: "魔力值", displayName: "MP", type: "progress", initialValue: 50, maxValue: 50 },
    { name: "经验值", displayName: "EXP", type: "number", initialValue: 0, maxValue: null },
    { name: "金币", displayName: "Gold", type: "number", initialValue: 0, maxValue: null },
  ])
  const [extensionCards, setExtensionCards] = useState([
    { name: "背包", position: "left", type: "array", format: "list" },
    { name: "任务", position: "left", type: "object", format: "table" },
    { name: "人际关系", position: "left", type: "object", format: "keyvalue" },
  ])

  const completionPercentage = 60

  const handleSaveConfig = () => {
    console.log("保存配置")
  }

  const handleStartGame = () => {
    onNavigate("game")
  }

  const handleAddStatusField = () => {
    setStatusFields([
      ...statusFields,
      { name: "新字段", displayName: "NEW", type: "number", initialValue: 0, maxValue: null },
    ])
  }

  const handleDeleteStatusField = (index: number) => {
    setStatusFields(statusFields.filter((_, i) => i !== index))
  }

  const handleAddExtensionCard = () => {
    setExtensionCards([...extensionCards, { name: "新卡片", position: "left", type: "array", format: "list" }])
  }

  const handleDeleteExtensionCard = (index: number) => {
    setExtensionCards(extensionCards.filter((_, i) => i !== index))
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
              <h1 className="text-2xl font-bold text-foreground">游戏配置页面</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleSaveConfig}>保存配置</Button>
              <Button onClick={handleStartGame}>开始游戏</Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">配置完成度:</span>
                <Progress value={completionPercentage} className="w-20" />
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* 世界观设定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                世界观设定
                <Badge variant="destructive">必填</Badge>
              </CardTitle>
              <CardDescription>设定游戏的背景世界和基本规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="background">游戏背景</Label>
                <Select value={gameBackground} onValueChange={setGameBackground}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medieval">中世纪奇幻世界</SelectItem>
                    <SelectItem value="modern">现代都市</SelectItem>
                    <SelectItem value="scifi">科幻星际</SelectItem>
                    <SelectItem value="wuxia">武侠江湖</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">世界描述</Label>
                <Textarea
                  id="description"
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                  placeholder="描述您的游戏世界..."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>支持Markdown格式</span>
                  <span>字数: {worldDescription.length}/5000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 状态栏配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                状态栏配置
                <Badge variant="destructive">必填</Badge>
              </CardTitle>
              <CardDescription>配置角色的属性字段和显示方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>角色属性字段</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusFields.map((field, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">字段{index + 1}</Label>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              编辑
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteStatusField(index)}>
                              删除
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>字段名: {field.name}</div>
                          <div>显示名: {field.displayName}</div>
                          <div>类型: {field.type === "progress" ? "进度条" : "数值"}</div>
                          <div>初始值: {field.initialValue}</div>
                          {field.maxValue && <div>最大值: {field.maxValue}</div>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button variant="outline" onClick={handleAddStatusField}>
                  + 新增字段
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>预设模板</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    奇幻冒险
                  </Button>
                  <Button variant="outline" size="sm">
                    现代都市
                  </Button>
                  <Button variant="outline" size="sm">
                    科幻星际
                  </Button>
                  <Button variant="outline" size="sm">
                    武侠江湖
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 扩展卡片配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                扩展卡片配置
                <Badge variant="secondary">可选</Badge>
              </CardTitle>
              <CardDescription>配置游戏中的扩展信息卡片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>已配置卡片</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extensionCards.map((card, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">{card.name}</Label>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              编辑
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExtensionCard(index)}>
                              删除
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>位置: {card.position === "left" ? "左侧" : "右侧"}</div>
                          <div>类型: {card.type === "array" ? "数组" : "对象"}</div>
                          <div>
                            格式: {card.format === "list" ? "列表" : card.format === "table" ? "表格" : "键值对"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button variant="outline" onClick={handleAddExtensionCard}>
                  + 新增卡片
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>常用模板</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    背包系统
                  </Button>
                  <Button variant="outline" size="sm">
                    任务系统
                  </Button>
                  <Button variant="outline" size="sm">
                    技能树
                  </Button>
                  <Button variant="outline" size="sm">
                    关系网
                  </Button>
                  <Button variant="outline" size="sm">
                    日志
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
