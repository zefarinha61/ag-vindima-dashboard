import { useState, useEffect } from 'react';
import axios from 'axios';
import type { RececaoUva } from '../types';
import { Grape, Calendar, TrendingUp, Users, Loader2, AlertCircle, LayoutDashboard, ListFilter, Map, BarChart2 } from 'lucide-react';
import Analytics from './Analytics';
import OrigensAnalytics from './OrigensAnalytics';
import QualityAnalytics from './QualityAnalytics';
import YieldAnalytics from './YieldAnalytics';

export default function Dashboard() {
    const [data, setData] = useState<RececaoUva[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filters
    const [selectedCampanha, setSelectedCampanha] = useState('');
    const [selectedCasta, setSelectedCasta] = useState('');
    const [selectedProcesso, setSelectedProcesso] = useState('');
    const [selectedSubFamilia, setSelectedSubFamilia] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'origens' | 'quality' | 'yields'>('table');

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
        const matchCampanha = selectedCampanha === '' || item.Campanha === selectedCampanha;
        const matchCasta = selectedCasta === '' || item.DescricaoCasta === selectedCasta;
        const matchProcesso = selectedProcesso === '' || item.DescricaoProcesso === selectedProcesso;
        const matchSubFamilia = selectedSubFamilia === '' || item.DescricaoSubFamilia === selectedSubFamilia;

        return matchCampanha && matchCasta && matchProcesso && matchSubFamilia;
    });

    const totalPeso = filteredData.reduce((acc, curr) => acc + (curr.PesoLiquido || 0), 0);
    const avgGrau = filteredData.length > 0
        ? filteredData.reduce((acc, curr) => acc + (curr.Grau || 0), 0) / filteredData.length
        : 0;
    const uniqueSocios = new Set(filteredData.map(item => item.CodSocio)).size;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-wine-50">
                <div className="flex flex-col items-center text-wine-800">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <h2 className="text-xl font-semibold">A carregar dados...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-wine-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100 flex flex-col items-center text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro de Conexão</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors font-medium"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans antialiased selection:bg-wine-100 selection:text-wine-900">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-6">
                    <header className="flex w-full">
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Estatísticas Gerais</h2>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
                        <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Campanha</label>
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full p-2.5 outline-none font-medium shadow-sm cursor-pointer"
                                value={selectedCampanha}
                                onChange={(e) => setSelectedCampanha(e.target.value)}
                            >
                                <option value="">Todas as Campanhas</option>
                                {campanhas.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipo</label>
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full p-2.5 outline-none font-medium shadow-sm cursor-pointer"
                                value={selectedSubFamilia}
                                onChange={(e) => setSelectedSubFamilia(e.target.value)}
                            >
                                <option value="">Todos os Tipos</option>
                                {subfamilias.map(sf => <option key={sf} value={sf}>{sf}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Casta</label>
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full p-2.5 outline-none font-medium shadow-sm cursor-pointer"
                                value={selectedCasta}
                                onChange={(e) => setSelectedCasta(e.target.value)}
                            >
                                <option value="">Todas as Castas</option>
                                {castas.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Processo Vindima</label>
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full p-2.5 outline-none font-medium shadow-sm cursor-pointer"
                                value={selectedProcesso}
                                onChange={(e) => setSelectedProcesso(e.target.value)}
                            >
                                <option value="">Todos os Processos</option>
                                {processos.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                        <div className="p-3 bg-wine-50 rounded-lg text-wine-600">
                            <Calendar className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Entregas</p>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{filteredData.length}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Peso Total (Kg)</p>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{totalPeso.toLocaleString('pt-PT')}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sócios Ativos</p>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{uniqueSocios}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600 flex items-center justify-center">
                            <span className="font-bold text-xl leading-none">%</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Grau Médio</p>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{avgGrau.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 mt-6 mb-2 scrollbar-none">
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center space-x-2 py-3 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'table'
                            ? 'border-wine-600 text-wine-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <ListFilter className="w-4 h-4" strokeWidth={2.5} />
                        <span>Tabela Detalhada</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center space-x-2 py-3 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'analytics'
                            ? 'border-wine-600 text-wine-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" strokeWidth={2.5} />
                        <span>Análise Gráfica</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('origens')}
                        className={`flex items-center space-x-2 py-3 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'origens'
                            ? 'border-wine-600 text-wine-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Map className="w-4 h-4" strokeWidth={2.5} />
                        <span>Origens</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('quality')}
                        className={`flex items-center space-x-2 py-3 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'quality'
                            ? 'border-wine-600 text-wine-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <BarChart2 className="w-4 h-4" strokeWidth={2.5} />
                        <span>Qualidade vs Rendimento</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('yields')}
                        className={`flex items-center space-x-2 py-3 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'yields'
                            ? 'border-wine-600 text-wine-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                        <span>Rendimento Real (Kg/ha)</span>
                    </button>
                </div>

                {/* Content Area Rendering */}
                {activeTab === 'analytics' ? (
                    <Analytics data={filteredData} />
                ) : activeTab === 'origens' ? (
                    <OrigensAnalytics data={filteredData} />
                ) : activeTab === 'quality' ? (
                    <QualityAnalytics data={filteredData} />
                ) : activeTab === 'yields' ? (
                    <YieldAnalytics data={filteredData} />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
                        <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-900">Registos Detalhados</h2>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{filteredData.length} Resultados</span>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-sm border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Sócio</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Campanha</th>
                                        <th className="px-4 py-3">Casta</th>
                                        <th className="px-4 py-3">Processo</th>
                                        <th className="px-4 py-3">Propriedade</th>
                                        <th className="px-4 py-3">Parcela</th>
                                        <th className="px-4 py-3 text-right">Peso (Kg)</th>
                                        <th className="px-4 py-3 text-right">Grau</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {filteredData.slice(0, 100).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{row.CodSocio}</div>
                                                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{row.nome}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-600">
                                                {row.DescricaoSubFamilia || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">{row.Campanha}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-wine-800">{row.DescricaoCasta}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{row.DescricaoProcesso}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{row.DescricaoPropriedade || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{row.DescricaoParcela || '-'}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.PesoLiquido?.toLocaleString('pt-PT')}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px - 2 py - 1 rounded - md text - [10px] font - bold border ${(row.Grau || 0) > 13 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'} `}>
                                                    {row.Grau?.toFixed(1) || '0.0'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length > 100 && (
                                <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100 bg-slate-50/50">
                                    Mostrando os primeiros 100 registos de {filteredData.length}. Use os filtros para refinar.
                                </div>
                            )}
                            {filteredData.length === 0 && (
                                <div className="p-8 text-center text-slate-500 font-medium">
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
