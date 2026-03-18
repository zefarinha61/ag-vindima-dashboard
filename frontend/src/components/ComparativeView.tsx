import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2, AlertCircle, FileDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { RececaoUva } from '../types';

export default function ComparativeView() {
    const [data, setData] = useState<RececaoUva[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected state from react-select is an array of objects: { value: string, label: string }
    const [selectedCampanhas, setSelectedCampanhas] = useState<any[]>([]);
    const [selectedSocios, setSelectedSocios] = useState<any[]>([]);
    const [selectedCastas, setSelectedCastas] = useState<any[]>([]);

    // PDF Export Ref
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Comparativo_AGVindima`,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            @media print {
                html, body {
                    width: 297mm;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
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
                setError('Ocorreu um erro ao carregar os dados da Análise Comparativa. Verifique o servidor local.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Extrair opções únicas para os selectores
    const optionsCampanhas = useMemo(() => {
        const unique = Array.from(new Set(data.map(item => item.Campanha))).filter(Boolean).sort();
        return unique.map(c => ({ value: c, label: c }));
    }, [data]);

    const optionsCastas = useMemo(() => {
        const unique = Array.from(new Set(data.map(item => item.DescricaoCasta))).filter(Boolean).sort();
        return unique.map(c => ({ value: c, label: c }));
    }, [data]);

    const optionsSocios = useMemo(() => {
        const uniqueMap = new Map<string, string>();
        data.forEach(item => {
            if (item.CodSocio) {
                uniqueMap.set(item.CodSocio, item.nome || item.CodSocio);
            }
        });
        return Array.from(uniqueMap.entries())
            .map(([id, nome]) => ({ value: id, label: `${nome} (${id})` }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [data]);

    // O Dataset filtrado
    const campanhasAtivas = selectedCampanhas.map(c => c.value);
    const sociosAtivos = selectedSocios.map(s => s.value);
    const castasAtivas = selectedCastas.map(c => c.value);

    // Filter relevant data
    const relevantData = useMemo(() => {
        if (campanhasAtivas.length === 0) return [];
        return data.filter(item => 
            campanhasAtivas.includes(item.Campanha) && 
            (sociosAtivos.length === 0 || sociosAtivos.includes(item.CodSocio)) &&
            (castasAtivas.length === 0 || castasAtivas.includes(item.DescricaoCasta))
        );
    }, [data, selectedCampanhas, selectedSocios, selectedCastas]);

    // BarChart Data: Kg per Socio per Campanha (Ou desdobrado por Casta)
    const kgData = useMemo(() => {
        const result: any[] = [];
        const entidades = sociosAtivos.length > 0 ? sociosAtivos : ['GLOBAL'];

        entidades.forEach(socioId => {
            const isGlobal = socioId === 'GLOBAL';
            const socioObj = isGlobal ? null : optionsSocios.find(s => s.value === socioId);
            const baseName = isGlobal ? 'Total Global' : (socioObj ? socioObj.label : socioId);

            if (castasAtivas.length > 0) {
                // Desdobrar por Casta
                castasAtivas.forEach(casta => {
                    const row: any = { socioId, casta };
                    row.nome = entidades.length === 1 ? casta : `${isGlobal ? 'Global' : baseName.split('(')[0].trim()} - ${casta}`;

                    campanhasAtivas.forEach(campanha => {
                        const soma = relevantData
                            .filter(d => (isGlobal || d.CodSocio === socioId) && d.Campanha === campanha && d.DescricaoCasta === casta)
                            .reduce((acc, curr) => acc + (curr.PesoLiquido || 0), 0);
                        row[campanha] = Math.round(soma);
                    });
                    result.push(row);
                });
            } else {
                // Visão Geral do Sócio (ou Total Global)
                const row: any = { socioId };
                row.nome = baseName;

                campanhasAtivas.forEach(campanha => {
                    const soma = relevantData
                        .filter(d => (isGlobal || d.CodSocio === socioId) && d.Campanha === campanha)
                        .reduce((acc, curr) => acc + (curr.PesoLiquido || 0), 0);
                    row[campanha] = Math.round(soma);
                });
                result.push(row);
            }
        });
        return result;
    }, [relevantData, sociosAtivos, campanhasAtivas, castasAtivas, optionsSocios]);

    // Quality Data (Grau Medio): Média Ponderada Grau per Socio per Campanha
    const grauData = useMemo(() => {
        const result: any[] = [];
        const entidades = sociosAtivos.length > 0 ? sociosAtivos : ['GLOBAL'];

        entidades.forEach(socioId => {
            const isGlobal = socioId === 'GLOBAL';
            const socioObj = isGlobal ? null : optionsSocios.find(s => s.value === socioId);
            const baseName = isGlobal ? 'Total Global' : (socioObj ? socioObj.label : socioId);

            if (castasAtivas.length > 0) {
                castasAtivas.forEach(casta => {
                    const row: any = { socioId, casta };
                    row.nome = entidades.length === 1 ? casta : `${isGlobal ? 'Global' : baseName.split('(')[0].trim()} - ${casta}`;

                    campanhasAtivas.forEach(campanha => {
                        const subset = relevantData.filter(d => (isGlobal || d.CodSocio === socioId) && d.Campanha === campanha && d.DescricaoCasta === casta);
                        
                        const pesoTotalComGrau = subset.reduce((acc, curr) => acc + (curr.Grau && curr.Grau > 0 ? (curr.PesoLiquido || 0) : 0), 0);
                        const somaProd = subset.reduce((acc, curr) => acc + ((curr.PesoLiquido || 0) * (curr.Grau || 0)), 0);
                        
                        row[campanha] = pesoTotalComGrau > 0 ? Number((somaProd / pesoTotalComGrau).toFixed(2)) : 0;
                    });
                    result.push(row);
                });
            } else {
                const row: any = { socioId };
                row.nome = baseName;

                campanhasAtivas.forEach(campanha => {
                    const subset = relevantData.filter(d => (isGlobal || d.CodSocio === socioId) && d.Campanha === campanha);
                    
                    const pesoTotalComGrau = subset.reduce((acc, curr) => acc + (curr.Grau && curr.Grau > 0 ? (curr.PesoLiquido || 0) : 0), 0);
                    const somaProd = subset.reduce((acc, curr) => acc + ((curr.PesoLiquido || 0) * (curr.Grau || 0)), 0);
                    
                    row[campanha] = pesoTotalComGrau > 0 ? Number((somaProd / pesoTotalComGrau).toFixed(2)) : 0;
                });
                result.push(row);
            }
        });
        return result;
    }, [relevantData, sociosAtivos, campanhasAtivas, castasAtivas, optionsSocios]);

    // Cores das Campanhas Comparativas
    const COLORS = ['#8f204d', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
    const getCampanhaColor = (campanha: string, index: number) => {
        return COLORS[index % COLORS.length];
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center text-wine-800">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <h2 className="text-xl font-semibold">A carregar dados comparativos...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100 flex flex-col items-center text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro de Conexão</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                </div>
            </div>
        );
    }

    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            borderColor: state.isFocused ? '#8f204d' : 'transparent',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(143, 32, 77, 0.15)' : '0 2px 10px rgba(0,0,0,0.02)',
            backgroundColor: '#ffffff',
            '&:hover': {
                borderColor: '#e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            },
            padding: '4px',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: '#f8e4eb',
            borderRadius: '6px',
            padding: '2px'
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: '#771d43',
            fontWeight: '700',
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            color: '#aa2d61',
            borderRadius: '4px',
            ':hover': {
                backgroundColor: '#f2ccda',
                color: '#641b3a',
            },
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#94a3b8',
            fontWeight: '500'
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-6 py-8" ref={componentRef}>
            
            {/* Print Title Only Visible on PDF */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-black text-wine-900">Relatório Comparativo (AG Vindima)</h1>
                <p className="text-slate-500 mt-2 font-bold">Gerado a: {new Date().toLocaleString('pt-PT')}</p>
            </div>
            
            {/* Control Panel Bento */}
            <div className="card-premium p-8 relative overflow-hidden z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-wine-50 rounded-bl-full -mr-32 -mt-32 opacity-50 z-0 pointer-events-none"></div>
                <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Painel de Comparação</h2>
                        <p className="text-sm font-bold text-slate-400 mt-2">
                            Selecione as Campanhas e os Sócios que pretende confrontar para visualizar o desvio de entregas e qualidade ao lado.
                        </p>
                    </div>
                    <button
                        onClick={handlePrint}
                        disabled={campanhasAtivas.length === 0}
                        className="print:hidden inline-flex items-center gap-2 px-4 py-2 bg-wine-600 hover:bg-wine-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-md"
                        title="Gerar Relatório Comparativo (PDF)"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF Comparativo</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
                    <div className="flex flex-col z-30">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 pl-1">Campanhas</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            menuPortalTarget={document.body}
                            menuPosition={'fixed'}
                            options={optionsCampanhas}
                            value={selectedCampanhas}
                            onChange={(vals) => setSelectedCampanhas(vals as any[])}
                            placeholder="Épocas gráficas..."
                            noOptionsMessage={() => "Sem campanhas restantes."}
                        />
                    </div>
                    <div className="flex flex-col z-20">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 pl-1">Castas (Opcional)</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            menuPortalTarget={document.body}
                            menuPosition={'fixed'}
                            options={optionsCastas}
                            value={selectedCastas}
                            onChange={(vals) => setSelectedCastas(vals as any[])}
                            placeholder="Todas as castas..."
                            noOptionsMessage={() => "Sem castas."}
                        />
                    </div>
                    <div className="flex flex-col z-10">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 pl-1">Sócios (Opcional)</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            menuPortalTarget={document.body}
                            menuPosition={'fixed'}
                            options={optionsSocios}
                            value={selectedSocios}
                            onChange={(vals) => setSelectedSocios(vals as any[])}
                            placeholder="Global da Adega..."
                            noOptionsMessage={() => "Nenhum sócio encontrado."}
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {campanhasAtivas.length === 0 ? (
                <div className="card-premium p-16 text-center text-slate-400 font-bold border-dashed border-2">
                    <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    Por favor, adicione pelo menos uma <strong className="text-wine-600">Campanha</strong> para iniciar a análise comparativa.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    
                    {/* Comparative Kg Graph */}
                    <div className="card-premium p-8">
                        <h3 className="text-lg font-extrabold text-slate-800 mb-8 flex items-center gap-2">
                            <span className="w-2 h-6 bg-wine-600 rounded-full inline-block"></span>
                            Comparativo de Entregas Totais (Kg)
                        </h3>
                        <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={kgData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        {campanhasAtivas.map((campanha, idx) => (
                                            <linearGradient key={`grad-${campanha}`} id={`color-${campanha}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={getCampanhaColor(campanha, idx)} stopOpacity={0.9} />
                                                <stop offset="95%" stopColor={getCampanhaColor(campanha, idx)} stopOpacity={0.6} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="nome" 
                                        tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + "..." : val}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '13px' }} iconType="circle" />
                                    
                                    {campanhasAtivas.sort().map((campanha, idx) => (
                                        <Bar 
                                            key={`kg-${campanha}`} 
                                            dataKey={campanha} 
                                            name={campanha} 
                                            fill={`url(#color-${campanha})`}
                                            radius={[6, 6, 0, 0]} 
                                            barSize={32}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparative Quality Graph */}
                    <div className="card-premium p-8">
                        <h3 className="text-lg font-extrabold text-slate-800 mb-8 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
                            Comparativo de Qualidade (Grau Médio)
                        </h3>
                        <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={grauData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="nome" 
                                        tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + "..." : val}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '13px' }} iconType="circle" />
                                    
                                    {campanhasAtivas.sort().map((campanha, idx) => (
                                        <Bar 
                                            key={`grau-${campanha}`} 
                                            dataKey={campanha} 
                                            name={campanha} 
                                            fill={`url(#color-${campanha})`}
                                            radius={[6, 6, 0, 0]} 
                                            barSize={32}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
