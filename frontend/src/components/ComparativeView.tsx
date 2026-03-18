import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import type { RececaoUva } from '../types';

export default function ComparativeView() {
    const [data, setData] = useState<RececaoUva[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected state from react-select is an array of objects: { value: string, label: string }
    const [selectedCampanhas, setSelectedCampanhas] = useState<any[]>([]);
    const [selectedSocios, setSelectedSocios] = useState<any[]>([]);
    const [selectedCastas, setSelectedCastas] = useState<any[]>([]);

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
            borderRadius: '0.5rem',
            borderColor: state.isFocused ? '#8f204d' : '#e2e8f0',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(143, 32, 77, 0.2)' : 'none',
            '&:hover': {
                borderColor: '#cbd5e1'
            },
            padding: '2px',
            fontSize: '0.875rem',
            fontWeight: '500'
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: '#fdf2f8',
            borderRadius: '4px',
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: '#8f204d',
            fontWeight: '600',
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            color: '#be185d',
            ':hover': {
                backgroundColor: '#fce7f3',
                color: '#9d174d',
            },
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#94a3b8',
        })
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 px-6 py-4">
            
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Painel de Comparação</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Selecione as Campanhas e os Sócios que pretende confrontar para visualizar o desvio de entregas e qualidade.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative">
                    <div className="flex flex-col z-30">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Campanhas</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            options={optionsCampanhas}
                            value={selectedCampanhas}
                            onChange={(vals) => setSelectedCampanhas(vals as any[])}
                            placeholder="Épocas gráficas..."
                            noOptionsMessage={() => "Sem campanhas restantes."}
                        />
                    </div>
                    <div className="flex flex-col z-20">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Castas (Opcional)</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            options={optionsCastas}
                            value={selectedCastas}
                            onChange={(vals) => setSelectedCastas(vals as any[])}
                            placeholder="Todas as castas..."
                            noOptionsMessage={() => "Sem castas."}
                        />
                    </div>
                    <div className="flex flex-col z-10">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Sócios (Opcional)</label>
                        <Select
                            styles={customSelectStyles}
                            isMulti
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
                <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
                    Por favor, adicione pelo menos uma <strong className="text-wine-600">Campanha</strong> para iniciar a análise comparativa.
                </div>
            ) : (
                <div className="space-y-6">
                    
                    {/* Comparative Kg Graph */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-base font-bold text-slate-800 mb-6">
                            Comparativo de Entregas Totais (Kg)
                        </h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={kgData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="nome" 
                                        tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + "..." : val}
                                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} 
                                    />
                                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fill: '#64748b' }} />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    
                                    {campanhasAtivas.sort().map((campanha, idx) => (
                                        <Bar 
                                            key={`kg-${campanha}`} 
                                            dataKey={campanha} 
                                            name={campanha} 
                                            fill={getCampanhaColor(campanha, idx)} 
                                            radius={[4, 4, 0, 0]} 
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparative Quality Graph */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-base font-bold text-slate-800 mb-6">
                            Comparativo de Qualidade (Grau Médio Ponderado)
                        </h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={grauData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="nome" 
                                        tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + "..." : val}
                                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} 
                                    />
                                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b' }} />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    
                                    {campanhasAtivas.sort().map((campanha, idx) => (
                                        <Bar 
                                            key={`grau-${campanha}`} 
                                            dataKey={campanha} 
                                            name={campanha} 
                                            fill={getCampanhaColor(campanha, idx)} 
                                            radius={[4, 4, 0, 0]} 
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
