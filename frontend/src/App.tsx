import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ComparativeView from './components/ComparativeView';
import { LayoutDashboard, LineChart, Grape, Coins } from 'lucide-react';

function App() {
  const [activeMainTab, setActiveMainTab] = useState<'global' | 'comparative'>('global');

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased selection:bg-wine-100 selection:text-wine-900">
      
      {/* Nav Moderna e Vibrante */}
      <nav className="bg-wine-950/95 backdrop-blur-lg border-b border-wine-800/50 text-white sticky top-0 z-50 transition-all shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-[72px]">
                  {/* Logo Area */}
                  <div className="flex items-center space-x-3 cursor-default">
                      <div className="bg-gradient-to-br from-wine-400 to-wine-600 p-2.5 rounded-2xl shadow-inner border border-wine-500/30">
                          <Grape className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-wine-200">
                          AG Vindima
                      </span>
                  </div>
                  {/* Nav Buttons (Pills) */}
                  <div className="flex items-center space-x-2">
                      <button
                          onClick={() => setActiveMainTab('global')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                              activeMainTab === 'global'
                                  ? 'bg-white text-wine-900 shadow-md transform scale-105'
                                  : 'text-wine-100/80 hover:bg-wine-800/50 hover:text-white'
                          }`}
                      >
                          <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={2.5} />
                          <span>Painel Global</span>
                      </button>
                      <button
                          onClick={() => setActiveMainTab('comparative')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                              activeMainTab === 'comparative'
                                  ? 'bg-white text-wine-900 shadow-md transform scale-105'
                                  : 'text-wine-100/80 hover:bg-wine-800/50 hover:text-white'
                          }`}
                      >
                          <LineChart className="w-[18px] h-[18px]" strokeWidth={2.5} />
                          <span>Comparativa</span>
                      </button>
                  </div>
              </div>
          </div>
      </nav>

      <main className="pt-2">
        {activeMainTab === 'global' && <Dashboard />}
        {activeMainTab === 'comparative' && <ComparativeView />}
      </main>

    </div>
  );
}

export default App;
