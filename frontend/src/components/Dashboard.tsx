import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import type { RececaoUva } from '../types';
import { Search, TrendingUp, Users, Loader2, AlertCircle, LayoutDashboard, ListFilter, BarChart2, Scale, Waves, ClipboardList, FileDown } from 'lucide-react';
import Analytics from './Analytics';
import QualityAnalytics from './QualityAnalytics';
import YieldAnalytics from './YieldAnalytics';
import GrauKgAnalytics from './GrauKgAnalytics';
import SocioView from './SocioView';

export type ViewMode = 'kg' | 'eur';

export default function Dashboard() {
    const [data, setData] = useState<RececaoUva[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCampanha, setSelectedCampanha] = useState('');
    const [selectedCasta, setSelectedCasta] = useState('');
    const [selectedProcesso, setSelectedProcesso] = useState('');
    const [selectedSubFamilia, setSelectedSubFamilia] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'graukg' | 'socio' | 'quality' | 'yields'>('table');
    const [viewMode, setViewMode] = useState<ViewMode>('kg');

    // PDF Export Ref
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Executivo_AgVindima_${selectedCampanha || 'Global'}`,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 5mm;
            }
            @media print {
                html, body {
                    width: 297mm;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .max-w-7xl {
                    zoom: 0.58;
                }
                .card-premium {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    box-shadow: none !important;
                    border: 1px solid #e2e8f0;
                }
            }
        `
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get<RececaoUva[]>('http://localhost:3001/api/rececao-uvas');
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError('Ocorreu um erro ao carregar os dados. Verifique se o servidor está ativo.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Extract unique options for filters
    const campanhas = Array.from(new Set(data.map(item => item.Campanha))).filter(Boolean).sort();
    const castas = Array.from(new Set(data.map(item => item.DescricaoCasta))).filter(Boolean).sort();
    const processos = Array.from(new Set(data.map(item => item.DescricaoProcesso))).filter(Boolean).sort();
    const subfamilias = Array.from(new Set(data.map(item => item.DescricaoSubFamilia))).filter(Boolean).sort();

    const filteredData = data.filter(item => {
        const matchSearch = item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.CodSocio?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchCampanha = selectedCampanha === '' || item.Campanha === selectedCampanha;
        const matchCasta = selectedCasta === '' || item.DescricaoCasta === selectedCasta;
        const matchProcesso = selectedProcesso === '' || item.DescricaoProcesso === selectedProcesso;
        const matchSubFamilia = selectedSubFamilia === '' || item.DescricaoSubFamilia === selectedSubFamilia;

        return matchSearch && matchCampanha && matchCasta && matchProcesso && matchSubFamilia;
    });

    const totalPeso = filteredData.reduce((acc, curr) => acc + (curr.PesoLiquido || 0), 0);
    const pesoTotalComGrau = filteredData.reduce((acc, curr) => acc + (curr.Grau && curr.Grau > 0 ? (curr.PesoLiquido || 0) : 0), 0);
    const avgGrau = pesoTotalComGrau > 0
        ? filteredData.reduce((acc, curr) => acc + ((curr.PesoLiquido || 0) * (curr.Grau || 0)), 0) / pesoTotalComGrau
        : 0;
    const totalValor = filteredData.reduce((acc, curr) => acc + (curr.ValorTotalTalao || 0), 0);
    const uniqueSocios = new Set(filteredData.map(item => item.CodSocio)).size;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center text-wine-800">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <h2 className="text-xl font-semibold">A carregar dados premium...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-red-100 flex flex-col items-center text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Erro de Conexão</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-wine-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-bold"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-slate-800 pb-12 font-sans antialiased">
            
            {/* Header with Title and Floating Filter Panel */}
            <div className="bg-white border-b border-slate-200 shadow-sm mb-8 relative z-20">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Central</h1>
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-wine-50 text-slate-600 hover:text-wine-700 text-sm font-bold rounded-lg border border-slate-200 hover:border-wine-200 transition-colors shadow-sm cursor-pointer"
                                title="Gerar Relatório Resumo Executivo (PDF)"
                            >
                                <FileDown className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF Executivo</span>
                            </button>
                        </div>
                        <p className="text-slate-500 font-bold mt-1 uppercase tracking-wider text-xs">Visão geral do desempenho</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-inner">
                        
                        {/* Kilos / Euros Toggle */}
                        <div className="flex bg-slate-200/50 p-1 rounded-xl mr-2">
                            <button
                                onClick={() => setViewMode('kg')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'kg' 
                                    ? 'bg-white text-slate-800 shadow-sm scale-100' 
                                    : 'text-slate-500 hover:text-slate-700 scale-95'
                                }`}
                            >
                                Kilos (Kg)
                            </button>
                            <button
                                onClick={() => setViewMode('eur')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'eur' 
                                    ? 'bg-wine-600 text-white shadow-sm scale-100' 
                                    : 'text-slate-500 hover:text-wine-700 scale-95'
                                }`}
                            >
                                Euros (€)
                            </button>
                        </div>
                        <div className="flex flex-col w-36">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1 px-1">Campanha</label>
                            <select
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full py-2 px-3 outline-none font-bold shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                                value={selectedCampanha}
                                onChange={(e) => setSelectedCampanha(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {campanhas.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col w-36">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1 px-1">Tipo</label>
                            <select
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full py-2 px-3 outline-none font-bold shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                                value={selectedSubFamilia}
                                onChange={(e) => setSelectedSubFamilia(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {subfamilias.map(sf => <option key={sf} value={sf}>{sf}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col w-36">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1 px-1">Casta</label>
                            <select
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full py-2 px-3 outline-none font-bold shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                                value={selectedCasta}
                                onChange={(e) => setSelectedCasta(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {castas.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col w-40">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1 px-1">Processo</label>
                            <select
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full py-2 px-3 outline-none font-bold shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                                value={selectedProcesso}
                                onChange={(e) => setSelectedProcesso(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {processos.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8 px-6" ref={componentRef}>
                {/* Print Title Only Visible on PDF */}
                <div className="hidden print:block mb-8 text-center border-b pb-4">
                    <h1 className="text-3xl font-black text-wine-900">Relatório de Receção (AG Vindima)</h1>
                    <p className="text-slate-500 mt-2 font-bold">Filtros: {selectedCampanha || 'Global'} | {selectedSubFamilia || 'Global'} | {selectedCasta || 'Multicasta'} | {selectedProcesso || 'Multiprocesso'}</p>
                    <p className="text-sm text-slate-400 mt-1">Gerado a: {new Date().toLocaleString('pt-PT')}</p>
                </div>

                {/* KPI Stats com Bento Box Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-6">
                    <div className="card-premium p-6 flex items-start justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-wine-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-60"></div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                                {viewMode === 'kg' ? 'Total Entregue' : 'Valor Total Pago'}
                            </p>
                            <p className="text-4xl font-extrabold text-wine-900 tracking-tight">
                                {viewMode === 'kg' 
                                    ? <>{(totalPeso / 1000).toFixed(1)}<span className="text-lg text-wine-400 font-bold ml-1">ton</span></>
                                    : <>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalValor)}</>
                                }
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-wine-100 to-wine-200 p-3 rounded-2xl relative z-10 text-wine-700 shadow-sm">
                            <Scale className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="card-premium p-6 flex items-start justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-60"></div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                                {viewMode === 'kg' ? 'Qualidade (Grau)' : 'Preço Médio / Kg'}
                            </p>
                            <p className="text-4xl font-extrabold text-emerald-900 tracking-tight">
                                {viewMode === 'kg'
                                    ? <>{avgGrau.toFixed(2)}<span className="text-lg text-emerald-400 font-bold ml-1">º</span></>
                                    : <>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalPeso > 0 ? totalValor / totalPeso : 0)}</>
                                }
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-2xl relative z-10 text-emerald-700 shadow-sm">
                            <Waves className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="card-premium p-6 flex items-start justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-60"></div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Sócios Ativos</p>
                            <p className="text-4xl font-extrabold text-blue-900 tracking-tight">{uniqueSocios}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-2xl relative z-10 text-blue-700 shadow-sm">
                            <Users className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="card-premium p-6 flex items-start justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-60"></div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Dossiers</p>
                            <p className="text-4xl font-extrabold text-amber-900 tracking-tight">{filteredData.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-2xl relative z-10 text-amber-700 shadow-sm">
                            <ClipboardList className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation (Pill/Bubble Menu) */}
                <div className="flex justify-center w-full print:hidden">
                    <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-2xl inline-flex overflow-x-auto gap-1 border border-slate-200 shadow-sm mb-2 max-w-full scrollbar-none">
                        {[
                            { id: 'table', icon: ListFilter, label: 'Registos' },
                            { id: 'analytics', icon: LayoutDashboard, label: 'Produção' },
                            { id: 'graukg', icon: BarChart2, label: 'Eficácia' },
                            { id: 'quality', icon: BarChart2, label: 'Q. Rendimento' },
                            { id: 'yields', icon: TrendingUp, label: 'Rendimentos' },
                            { id: 'socio', icon: Users, label: 'Sócio' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`flex items-center space-x-2 py-2.5 px-5 font-bold text-sm transition-all duration-300 rounded-xl whitespace-nowrap ${
                                    activeTab === t.id
                                        ? 'bg-white text-wine-800 shadow-card border border-slate-200 scale-100'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 scale-95'
                                }`}
                            >
                                <t.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area Rendering */}
                {activeTab === 'analytics' ? (
                    <Analytics data={filteredData} viewMode={viewMode} />
                ) : activeTab === 'graukg' ? (
                    <GrauKgAnalytics data={filteredData} viewMode={viewMode} />
                ) : activeTab === 'socio' ? (
                    <SocioView data={filteredData} viewMode={viewMode} />
                ) : activeTab === 'quality' ? (
                    <QualityAnalytics data={filteredData} viewMode={viewMode} />
                ) : activeTab === 'yields' ? (
                    <YieldAnalytics data={filteredData} viewMode={viewMode} />
                ) : (
                    <div className="card-premium overflow-hidden mt-4">
                        <div className="p-5 border-b border-slate-100 bg-white/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-extrabold text-slate-800">Tabela de Receções</h2>
                                <span className="text-xs font-bold text-wine-700 bg-wine-50 px-3 py-1.5 rounded-lg border border-wine-100">{filteredData.length} Entradas</span>
                            </div>
                            
                            <div className="relative w-full md:w-80">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Procurar por Sócio..."
                                    className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 transition-all outline-none text-sm text-slate-700 placeholder:text-slate-400 font-bold shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-sm backdrop-blur-md border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-4 rounded-tl-xl">Sócio</th>
                                        <th className="px-5 py-4">Tipo</th>
                                        <th className="px-5 py-4">Campanha</th>
                                        <th className="px-5 py-4">Casta</th>
                                        <th className="px-5 py-4">Processo</th>
                                        <th className="px-5 py-4">Propriedade</th>
                                        <th className="px-5 py-4">Parcela</th>
                                        {viewMode === 'kg' ? (
                                            <>
                                                <th className="px-5 py-4 text-right">Peso (Kg)</th>
                                                <th className="px-5 py-4 text-right rounded-tr-xl">Grau</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-5 py-4 text-right">Total Uva (€)</th>
                                                <th className="px-5 py-4 text-right rounded-tr-xl">Total Talão (€)</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                                    {filteredData.slice(0, 100).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-extrabold text-slate-900">{row.CodSocio}</div>
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 truncate max-w-[150px]">{row.nome}</div>
                                            </td>
                                            <td className="px-5 py-3 font-semibold">
                                                {row.DescricaoSubFamilia || '-'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-extrabold">{row.Campanha}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-extrabold text-wine-800">{row.DescricaoCasta}</div>
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-slate-500">{row.DescricaoProcesso}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-500">{row.DescricaoPropriedade || '-'}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-500">{row.DescricaoParcela || '-'}</td>
                                            {viewMode === 'kg' ? (
                                                <>
                                                    <td className="px-5 py-3 text-right font-extrabold text-slate-900 text-sm">{row.PesoLiquido?.toLocaleString('pt-PT')}</td>
                                                    <td className="px-5 py-3 text-right">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${(row.Grau || 0) > 13 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                            {row.Grau?.toFixed(1) || '0.0'}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-5 py-3 text-right font-extrabold text-slate-900 text-sm">
                                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(row.ValorTotalUva || 0)}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-extrabold text-wine-700 text-sm">
                                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(row.ValorTotalTalao || 0)}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length > 100 && (
                                <div className="p-5 text-center text-sm font-bold text-slate-400 border-t border-slate-100 bg-slate-50/50">
                                    Mostrando os primeiros 100 registos de {filteredData.length}. Use os filtros para refinar.
                                </div>
                            )}
                            {filteredData.length === 0 && (
                                <div className="p-12 text-center text-slate-400 font-bold text-lg">
                                    Nenhum registo encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
