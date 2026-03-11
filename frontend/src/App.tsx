import { useState } from 'react';
import Dashboard from './components/Dashboard';
import SocioView from './components/SocioView';
import ComparativeView from './components/ComparativeView';
import { LayoutDashboard, UserCircle, LineChart } from 'lucide-react';

function App() {
  const [activeMainTab, setActiveMainTab] = useState<'global' | 'socio' | 'comparative'>('global');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-wine-100 selection:text-wine-900">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveMainTab('global')}
              className={`flex items-center space-x-2 py-4 font-semibold text-sm transition-colors border-b-2 ${
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
  );
}

export default App;
