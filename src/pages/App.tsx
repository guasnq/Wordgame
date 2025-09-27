import { useState } from "react"
import { GameMainPage } from "@/components/game/GameMainPage"
import { SettingsPage } from "@/components/game/SettingsPage"
import { WorldViewPage } from "@/components/game/WorldViewPage"
import { PresetPage } from "@/components/game/PresetPage"
import { SavePage } from "@/components/game/SavePage"
import type { PageType } from "@/types/page"

export default function App() {
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
      default:
        return <GameMainPage onNavigate={setCurrentPage} />
    }
  }

  return <div className="min-h-screen bg-background">{renderPage()}</div>
}