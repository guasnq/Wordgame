import type React from "react"
import { useState, useEffect } from "react"
import { GameLayout } from "@/components/game/GameLayout"
import { GameHeader } from "@/components/game/GameHeader"
import { GameStatusBar } from "@/components/game/GameStatusBar"
import { SceneArea } from "@/components/game/SceneArea"
import { StatusArea } from "@/components/game/StatusArea"
import { NarrationArea } from "@/components/game/NarrationArea"
import { ActionArea } from "@/components/game/ActionArea"
import { InventoryCard } from "@/components/game/InventoryCard"
import { QuestCard } from "@/components/game/QuestCard"
import { RelationshipCard } from "@/components/game/RelationshipCard"
import { MobileDrawer } from "@/components/game/MobileDrawer"
import { MobileExtensionMenu } from "@/components/game/MobileExtensionMenu"
import { useMobile } from "@/hooks/use-mobile"
import type { PageType } from "@/types/page"
import type { StatusItem, Quest, Relationship } from "@/types/game"
import type { GameOption } from "@/stores/gameStore"

type InventoryItem = string
 type ConnectionState = "connected" | "connecting" | "disconnected"

interface DemoGameState {
  scene: string
  narration: string
  status: StatusItem[]
  actions: GameOption[]
  inventory: InventoryItem[]
  quests: Quest[]
  relationships: Relationship[]
}

interface GameMainPageProps {
  onNavigate: (page: PageType) => void
}

export function GameMainPage({ onNavigate }: GameMainPageProps) {
  const isMobile = useMobile()
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isExtensionOpen, setIsExtensionOpen] = useState(false)
  const [activeExtension, setActiveExtension] = useState<string | null>(null)
  const [userInput, setUserInput] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("connected")
  const [gameStatus, setGameStatus] = useState("等待输入...")
  const [isLoading, setIsLoading] = useState(false)

  const [gameState, setGameState] = useState<DemoGameState>({
    scene:
      "你发现自己站在一座古老的城堡前，夜晚的月光照射着石制的大门，周围弥漫着神秘的气息。古老的石墙上刻着奇怪的符文，似乎在诉说着这座城堡的悠久历史。大门紧闭，但你注意到门上有一个古老的门环。",
    narration:
      "你的心情有些紧张，决定下一步行动。微风轻抚过你的脸庞，带来了一丝寒意。你感觉到这个地方充满了未知的秘密。",
    status: [
      { name: "HP", value: 75, max: 100, type: "progress" },
      { name: "MP", value: 30, max: 50, type: "progress" },
      { name: "EXP", value: 260, type: "number" },
      { name: "Gold", value: 50, type: "number" },
    ],
    actions: [
      { id: "A", text: "走向大门并敲响门环" },
      { id: "B", text: "绕到城堡后面寻找其他入口" },
      { id: "C", text: "仔细观察门上的符文" },
    ],
    inventory: ["铁剑 x1", "生命药水 x3", "面包 x5", "金币袋 x1", "神秘钥匙 x1"],
    quests: [
      { name: "寻找失落的宝石", status: "进行中", progress: 60 },
      { name: "拯救村民", status: "已完成", progress: 100 },
      { name: "击败邪恶法师", status: "未开始", progress: 0 },
      { name: "探索古老城堡", status: "进行中", progress: 10 },
    ],
    relationships: [
      { name: "村长艾德华", level: 3, maxLevel: 5 },
      { name: "法师莉莉安", level: 2, maxLevel: 5 },
      { name: "盗贼杰克", level: 1, maxLevel: 5 },
      { name: "神秘商人", level: 4, maxLevel: 5 },
    ],
  })

  useEffect(() => {
    const statuses: ConnectionState[] = ["connected", "connecting"]
    const interval = setInterval(() => {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setConnectionStatus(randomStatus)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleExtensionClick = (extensionType: string) => {
    if (isMobile) {
      if (extensionType === "menu") {
        setActiveExtension("menu")
        setIsExtensionOpen(true)
      } else {
        setActiveExtension(extensionType)
      }
    }
  }

  const handleSystemClick = (systemType: string) => {
    switch (systemType) {
      case "settings":
        onNavigate("settings")
        break
      case "worldview":
        onNavigate("worldview")
        break
      case "presets":
        onNavigate("presets")
        break
      case "saves":
        onNavigate("saves")
        break
      case "debug":
        onNavigate("debug")
        break
      default:
        break
    }
  }

  const handleStatusClick = () => {
    if (isMobile) {
      setIsStatusOpen(true)
    }
  }

  type ResponseData = {
    scene: string
    narration: string
    actions: GameOption[]
  }

  const optionResponses: Record<GameOption["id"], ResponseData> = {
    A: {
      scene: "你走向大门，伸手敲响了古老的门环。沉重的敲击声在夜空中回荡，随后你听到了脚步声从城堡内部传来。",
      narration: "门环发出的声音比你想象的要响亮，你开始担心是否惊动了什么不该惊动的存在。",
      actions: [
        { id: "A", text: "耐心等待有人开门" },
        { id: "B", text: "再次敲响门环" },
        { id: "C", text: "后退并准备战斗" },
      ],
    },
    B: {
      scene: "你决定绕到城堡后面。经过一番探索，你发现了一扇半掩的侧门，门缝中透出微弱的光芒。",
      narration: "这扇门似乎没有完全关闭，你可以听到里面传来轻微的声音。这可能是一个机会。",
      actions: [
        { id: "A", text: "小心推开侧门" },
        { id: "B", text: "先透过门缝观察" },
        { id: "C", text: "返回正门" },
      ],
    },
    C: {
      scene: "你仔细观察门上的符文，发现它们似乎在月光下微微发光。这些符文组成了一个复杂的图案。",
      narration: "你感觉这些符文不仅仅是装饰，它们似乎蕴含着某种魔法力量。你的魔法知识告诉你这可能是一个保护咒语。",
      actions: [
        { id: "A", text: "尝试用魔法激活符文" },
        { id: "B", text: "寻找符文的规律" },
        { id: "C", text: "放弃研究，选择其他方式" },
      ],
    },
  }

  const getResponseByOption = (id: GameOption["id"]): ResponseData => optionResponses[id]

  const buildCustomResponse = (): ResponseData => {
    const randomId = (Object.keys(optionResponses) as GameOption["id"][])[Math.floor(Math.random() * 3)]
    return getResponseByOption(randomId)
  }

  const simulateAIResponse = async (input: GameOption["id"] | "custom") => {
    setIsLoading(true)
    setGameStatus("AI思考中...")

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const responseData = input === "custom" ? buildCustomResponse() : getResponseByOption(input)

    setGameState((prev) => ({
      ...prev,
      scene: responseData.scene,
      narration: responseData.narration,
      actions: responseData.actions,
      status: prev.status.map((item) =>
        item.name === "EXP"
          ? { ...item, value: Number(item.value) + 10 }
          : item
      ),
    }))

    setIsLoading(false)
    setGameStatus("等待输入...")
  }

  const handleActionClick = (option: GameOption) => {
    console.log("选择:", option)
    simulateAIResponse(option.id)
  }

  const handleSendMessage = () => {
    if (userInput.trim()) {
      console.log("发送消息:", userInput)
      setGameStatus("处理自定义输入...")
      simulateAIResponse("custom")
      setUserInput("")
    }
  }

  const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter" && !isLoading) {
      handleSendMessage()
    }
  }

  const toggleExtension = (extension: string) => {
    if (activeExtension === extension) {
      setActiveExtension(null)
    } else {
      setActiveExtension(extension)
    }
  }

  const getDrawerTitle = (extension: string | null) => {
    switch (extension) {
      case "inventory":
        return "背包"
      case "quests":
        return "任务"
      case "relationships":
        return "关系"
      default:
        return "扩展功能"
    }
  }

  return (
    <GameLayout>
      <GameHeader connectionStatus={connectionStatus} onSystemClick={handleSystemClick} />

      <div className="flex-1 flex overflow-hidden">
        {!isMobile ? (
          <>
            <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
              <div className="space-y-4">
                <InventoryCard items={gameState.inventory} />
                <QuestCard quests={gameState.quests} />
                <RelationshipCard relationships={gameState.relationships} />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <SceneArea scene={gameState.scene} />
                <NarrationArea narration={gameState.narration} />
                <ActionArea options={gameState.actions} onOptionClick={handleActionClick} />
              </div>

              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入你的行动..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading ? "处理中" : "发送"}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-72 border-l border-border bg-card p-4 overflow-y-auto">
              <div className="space-y-4">
                <StatusArea items={gameState.status} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <SceneArea scene={gameState.scene} />
              <NarrationArea narration={gameState.narration} />

              <div className="p-4 space-y-4">
                <div
                  className="p-4 bg-card border border-border rounded-lg flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">角色状态</h3>
                    <button
                      onClick={handleStatusClick}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      查看详情
                    </button>
                  </div>
                  <StatusArea items={gameState.status} defaultCollapsed={false} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleStatusClick}
                    className="p-3 bg-card border border-border rounded-lg text-left hover:bg-muted/50 transition-colors duration-200 active:scale-95"
                  >
                    <div className="text-sm font-medium mb-1 text-foreground">角色状态</div>
                    <div className="text-xs text-muted-foreground">
                      HP: {gameState.status[0]?.value}/{gameState.status[0]?.max} | MP: {gameState.status[1]?.value}/
                      {gameState.status[1]?.max}
                    </div>
                  </button>
                  <button
                    onClick={() => handleExtensionClick("menu")}
                    className="p-3 bg-card border border-border rounded-lg text-left hover:bg-muted/50 transition-colors duration-200 active:scale-95"
                  >
                    <div className="text-sm font-medium mb-1 text-foreground">扩展功能</div>
                    <div className="text-xs text-muted-foreground">背包 | 任务 | 设置</div>
                  </button>
                </div>

                <ActionArea options={gameState.actions} onOptionClick={handleActionClick} />
              </div>

              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入行动..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading ? "处理中" : "发送"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <GameStatusBar status={gameStatus} isLoading={isLoading} />

      {isMobile && (
        <>
          <MobileDrawer isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title="角色状态">
            <StatusArea items={gameState.status} defaultCollapsed={false} />
          </MobileDrawer>

          <MobileDrawer
            isOpen={isExtensionOpen}
            onClose={() => setIsExtensionOpen(false)}
            title={getDrawerTitle(activeExtension)}
          >
            {activeExtension === "menu" && (
              <MobileExtensionMenu onExtensionClick={handleExtensionClick} onSystemClick={handleSystemClick} />
            )}

            {activeExtension === "inventory" && (
              <div className="space-y-4">
                <button
                  onClick={() => toggleExtension("menu")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回菜单
                </button>
                <InventoryCard items={gameState.inventory} />
              </div>
            )}

            {activeExtension === "quests" && (
              <div className="space-y-4">
                <button
                  onClick={() => toggleExtension("menu")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回菜单
                </button>
                <QuestCard quests={gameState.quests} />
              </div>
            )}

            {activeExtension === "relationships" && (
              <div className="space-y-4">
                <button
                  onClick={() => toggleExtension("menu")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回菜单
                </button>
                <RelationshipCard relationships={gameState.relationships} />
              </div>
            )}
          </MobileDrawer>
        </>
      )}
    </GameLayout>
  )
}





