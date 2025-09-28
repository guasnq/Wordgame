
import { useState } from "react"
import { GameMainPage } from "@/components/game/GameMainPage"
import { SettingsPage } from "@/components/game/SettingsPage"
import { WorldViewPage } from "@/components/game/WorldViewPage"
import { PresetPage } from "@/components/game/PresetPage"
import { SavePage } from "@/components/game/SavePage"
import { EventBusTest } from "@/components/debug/EventBusTest"
import type { PageType } from "@/types/page"

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("game")

  const renderPage = () => {
    switch (currentPage) {
      case "game":
        return <GameMainPage onNavigate={setCurrentPage} />
      case "settings":
        return <SettingsPage onNavigate={setCurrentPage} />
      case "worldview":
        return <WorldViewPage onNavigate={setCurrentPage} />
      case "presets":
        return <PresetPage onNavigate={setCurrentPage} />
      case "saves":
        return <SavePage onNavigate={setCurrentPage} />
      case "debug":
        return (
          <div className="min-h-screen bg-background">
            <div className="p-4">
              <button
                onClick={() => setCurrentPage("game")}
                className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                ← 返回游戏
              </button>
              <EventBusTest />
            </div>
          </div>
        )
      default:
        return <GameMainPage onNavigate={setCurrentPage} />
    }
  }

  return <div className="min-h-screen bg-background">{renderPage()}</div>
}

export default App
