

interface WorldViewCardProps {
  className?: string
}

export function WorldViewCard({ className = "" }: WorldViewCardProps) {
  const worldInfo = {
    name: "艾瑟拉大陆",
    description: "一个充满魔法与冒险的奇幻世界",
    regions: [
      { name: "翡翠森林", status: "已探索", danger: "低" },
      { name: "暗影山脉", status: "部分探索", danger: "中" },
      { name: "古老城堡", status: "当前位置", danger: "高" },
      { name: "水晶湖泊", status: "未知", danger: "未知" },
    ],
    lore: ["古老的魔法师曾在此建立了强大的魔法帝国", "传说中的龙族守护着世界的平衡", "神秘的符文石散落在大陆各处"],
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-foreground">世界观</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">{worldInfo.name}</h4>
          <p className="text-sm text-muted-foreground">{worldInfo.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-foreground mb-2">区域信息</h4>
          <div className="space-y-2">
            {worldInfo.regions.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium text-foreground">{region.name}</div>
                  <div className="text-xs text-muted-foreground">{region.status}</div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    region.danger === "低"
                      ? "bg-green-100 text-green-800"
                      : region.danger === "中"
                        ? "bg-yellow-100 text-yellow-800"
                        : region.danger === "高"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {region.danger}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-foreground mb-2">世界传说</h4>
          <div className="space-y-2">
            {worldInfo.lore.map((item, index) => (
              <div key={index} className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                • {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
