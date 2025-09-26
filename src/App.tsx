
function App() {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='container mx-auto px-4 py-8'>
        <header className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-slate-900'>
            AI文字游戏渲染器
          </h1>
          <p className='mt-2 text-slate-600'>基于AI的沉浸式文字游戏体验平台</p>
        </header>

        <main className='grid gap-6 lg:grid-cols-3'>
          {/* 场景描述区 */}
          <div className='game-area lg:col-span-2'>
            <h2 className='mb-4 text-xl font-semibold text-slate-800'>
              场景描述
            </h2>
            <div className='min-h-[200px] text-slate-700'>
              <p>欢迎来到AI文字游戏渲染器！</p>
              <p className='mt-4'>
                项目脚手架已搭建完成，等待配置和功能模块的开发...
              </p>
            </div>
          </div>

          {/* 角色状态区 */}
          <div className='game-area'>
            <h2 className='mb-4 text-xl font-semibold text-slate-800'>
              角色状态
            </h2>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span>生命值</span>
                <span>100/100</span>
              </div>
              <div className='flex justify-between'>
                <span>等级</span>
                <span>1</span>
              </div>
            </div>
          </div>

          {/* 旁白区 */}
          <div className='game-area lg:col-span-2'>
            <h2 className='mb-4 text-xl font-semibold text-slate-800'>旁白</h2>
            <div className='min-h-[120px] text-slate-700'>
              <p>系统已初始化，准备开始你的冒险之旅...</p>
            </div>
          </div>

          {/* 行动选择区 */}
          <div className='game-area'>
            <h2 className='mb-4 text-xl font-semibold text-slate-800'>
              行动选择
            </h2>
            <div className='space-y-2'>
              <button className='game-button w-full'>A. 开始配置</button>
              <button className='game-button w-full'>B. 查看文档</button>
              <button className='game-button w-full'>C. 开始游戏</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
