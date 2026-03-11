import { useState } from 'react';
import Dashboard from './components/Dashboard';
import SocioView from './components/SocioView';
import ComparativeView from './components/ComparativeView';
import { LayoutDashboard, UserCircle, LineChart, Grape } from 'lucide-react';

function App() {
  const [activeMainTab, setActiveMainTab] = useState<'global' | 'socio' | 'comparative'>('global');

  return (
    <div className="min-h-screen font-sans antialiased selection:bg-wine-100 selection:text-wine-900 relative">
      
      {/* Background Layer: Solid Base -> Image Overlay */}
      <div className="fixed inset-0 -z-20 bg-slate-50" />
      <div 
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1559825481-12a05cc00344?q=80&w=2000&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.08, /* 8% de visibilidade */
          filter: 'grayscale(30%)'
        }}
      />

      <div className="relative z-0 flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex flex-shrink-0 items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-wine-50 flex items-center justify-center p-1.5 ring-1 ring-wine-100">
                <img 
                  src="https://www.rotavinhospsetubal.com/wp-content/uploads/2016/11/adega-coop-palmela-logo-rgb.jpg" 
                  alt="Adega Cooperativa de Palmela" 
                  className="w-full h-full object-contain mix-blend-multiply" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                />
                <Grape className="w-6 h-6 text-wine-700 hidden" strokeWidth={2} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">AG_Vindima</h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Adega de Palmela</p>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 h-full">
            <button
              onClick={() => setActiveMainTab('global')}
              className={`flex items-center space-x-2 px-4 h-full font-semibold text-sm transition-colors border-b-2 ${
                activeMainTab === 'global'
                  ? 'border-wine-600 text-wine-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" strokeWidth={2.5} />
              <span>Visão Global</span>
            </button>
            <button
              onClick={() => setActiveMainTab('socio')}
              className={`flex items-center space-x-2 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeMainTab === 'socio'
                  ? 'border-wine-600 text-wine-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UserCircle className="w-5 h-5" strokeWidth={2.5} />
              <span>Visão por Sócio</span>
            </button>
            <button
              onClick={() => setActiveMainTab('comparative')}
              className={`flex items-center space-x-2 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeMainTab === 'comparative'
                  ? 'border-wine-600 text-wine-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <LineChart className="w-5 h-5" strokeWidth={2.5} />
              <span>Análise Comparativa</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-2">
        {activeMainTab === 'global' && <Dashboard />}
        {activeMainTab === 'socio' && <SocioView />}
        {activeMainTab === 'comparative' && <ComparativeView />}
      </main>

      </div>
    </div>
  );
}

export default App;
