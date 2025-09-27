"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { PageType } from "@/app/page"

interface SettingsPageProps {
  onNavigate: (page: PageType) => void
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [apiProvider, setApiProvider] = useState("deepseek")
  const [apiKey, setApiKey] = useState("sk-xxxxxxxxxxxxxxxxxxxxxxxx")
  const [model, setModel] = useState("deepseek-chat")
  const [temperature, setTemperature] = useState([0.7])
  const [maxLength, setMaxLength] = useState("2000")
  const [timeout, setTimeout] = useState("30")
  const [theme, setTheme] = useState("default")
  const [autoSave, setAutoSave] = useState(true)
  const [saveRounds, setSaveRounds] = useState("100")
  const [compressHistory, setCompressHistory] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const handleTestConnection = async () => {
    setConnectionStatus("testing")
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConnectionStatus("success")
    setTimeout(() => setConnectionStatus("idle"), 3000)
  }

  const handleSaveConfig = () => {
    // Save configuration logic
    console.log("保存配置")
  }

  const handleExportSettings = () => {
    // Export settings logic
    console.log("导出设置")
  }

  const handleImportSettings = () => {
    // Import settings logic
    console.log("导入设置")
  }

  const handleResetDefaults = () => {
    // Reset to defaults logic
    console.log("恢复默认设置")
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
                返回游戏
              </Button>
              <h1 className="text-2xl font-bold text-foreground">设置页面</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* AI服务配置 */}
          <Card>
            <CardHeader>
              <CardTitle>AI服务配置</CardTitle>
              <CardDescription>配置您的AI服务提供商和相关参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">服务商选择</Label>
                <Select value={apiProvider} onValueChange={setApiProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek">DeepSeek API (高性价比)</SelectItem>
                    <SelectItem value="gemini">Google Gemini API (多模态)</SelectItem>
                    <SelectItem value="siliconflow">SiliconFlow API (多模型选择)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apikey">API密钥</Label>
                <Input
                  id="apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的API密钥"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">模型名称</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-chat">deepseek-chat</SelectItem>
                    <SelectItem value="deepseek-coder">deepseek-coder</SelectItem>
                    <SelectItem value="gemini-pro">gemini-pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>温度值: {temperature[0]}</Label>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">控制AI回复的随机性 (0.0-2.0)</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxlength">最大长度</Label>
                  <Input
                    id="maxlength"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    placeholder="2000"
                  />
                  <div className="text-xs text-muted-foreground">字符</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">超时设置</Label>
                  <Input id="timeout" value={timeout} onChange={(e) => setTimeout(e.target.value)} placeholder="30" />
                  <div className="text-xs text-muted-foreground">秒</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTestConnection} disabled={connectionStatus === "testing"}>
                  {connectionStatus === "testing" ? "测试中..." : "测试连接"}
                </Button>
                <Button onClick={handleSaveConfig}>保存配置</Button>
              </div>

              {connectionStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  连接正常 (延迟: 120ms)
                </div>
              )}
            </CardContent>
          </Card>

          {/* 界面主题 */}
          <Card>
            <CardHeader>
              <CardTitle>界面主题</CardTitle>
              <CardDescription>自定义界面外观和主题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>主题选择</Label>
                <div className="grid grid-cols-4 gap-4">
                  {["default", "ancient", "scifi", "modern"].map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => setTheme(themeOption)}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        theme === themeOption ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-full h-8 bg-gradient-to-r from-primary/20 to-primary/40 rounded mb-2"></div>
                      <div className="text-sm">
                        {themeOption === "default" && "默认"}
                        {themeOption === "ancient" && "古风"}
                        {themeOption === "scifi" && "科幻"}
                        {themeOption === "modern" && "现代"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>自定义颜色</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bgcolor">背景色</Label>
                    <div className="flex gap-2">
                      <Input id="bgcolor" value="#f8f9fa" readOnly />
                      <Button variant="outline" size="sm">
                        选择
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textcolor">文字色</Label>
                    <div className="flex gap-2">
                      <Input id="textcolor" value="#343a40" readOnly />
                      <Button variant="outline" size="sm">
                        选择
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentcolor">强调色</Label>
                    <div className="flex gap-2">
                      <Input id="accentcolor" value="#007bff" readOnly />
                      <Button variant="outline" size="sm">
                        选择
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">预览效果</Button>
                <Button>应用主题</Button>
              </div>
            </CardContent>
          </Card>

          {/* 其他设置 */}
          <Card>
            <CardHeader>
              <CardTitle>其他设置</CardTitle>
              <CardDescription>快捷键、存档和其他功能设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>快捷键设置</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>发送消息:</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>关闭面板:</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>快速选项:</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">1/2/3</kbd>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>存档设置</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="autosave">自动保存</Label>
                      <div className="text-xs text-muted-foreground">每回合自动保存</div>
                    </div>
                    <Switch id="autosave" checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saverounds">保存回合数</Label>
                    <Input
                      id="saverounds"
                      value={saveRounds}
                      onChange={(e) => setSaveRounds(e.target.value)}
                      placeholder="100"
                    />
                    <div className="text-xs text-muted-foreground">最近回合</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="compress">压缩历史</Label>
                      <div className="text-xs text-muted-foreground">超过50回合时压缩</div>
                    </div>
                    <Switch id="compress" checked={compressHistory} onCheckedChange={setCompressHistory} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetDefaults}>
                  恢复默认
                </Button>
                <Button variant="outline" onClick={handleExportSettings}>
                  导出设置
                </Button>
                <Button variant="outline" onClick={handleImportSettings}>
                  导入设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
