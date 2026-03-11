import { Search, Map, BarChart } from 'lucide-react';

export default function SocioView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-4">
            <div className="bg-wine-50 p-6 rounded-full text-wine-600 mb-2">
                <Search className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Visão por Sócio</h2>
            <p className="max-w-md text-center">
                Aqui poderá pesquisar e analisar em detalhe toda a informação, entregas e métricas de qualidade específicas de um único sócio.
            </p>
            <div className="flex gap-4 pt-6 opacity-60">
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-32">
                    <Map className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold">Origens</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-32">
                    <BarChart className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold">Qualidade</span>
                </div>
            </div>
            <div className="mt-8 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">
                Em desenvolvimento
            </div>
        </div>
    );
}
