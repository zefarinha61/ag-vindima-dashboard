import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import type { RececaoUva } from '../types';

interface SocioViewProps {
    data: RececaoUva[];
    viewMode: 'kg' | 'eur';
    selectedSocio?: string;
}

const COLORS = ['#8f204d', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function SocioView({ data, viewMode, selectedSocio }: SocioViewProps) {
    const getValue = (item: RececaoUva) => viewMode === 'eur' ? (item.ValorTotalTalao || 0) : (item.PesoLiquido || 0);

    // No longer need internal filtering as Dashboard already filters the 'data' prop
    const socioData = data;
    
    // We can extract the socio name if it's a single socio
    const socioName = useMemo(() => {
        if (!selectedSocio) return 'Todos os Sócios';
        const found = data.find(d => d.CodSocio === selectedSocio);
        return found ? (found.nome || selectedSocio) : selectedSocio;
    }, [data, selectedSocio]);

    // 1. Data for Bar Chart (Peso Total por Casta do Socio)
    const castaData = useMemo(() => {
        const map = new Map<string, number>();
        socioData.forEach(item => {
            if (item.DescricaoCasta) {
                map.set(item.DescricaoCasta, (map.get(item.DescricaoCasta) || 0) + getValue(item));
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [socioData]);

    // 2. Data for Line Chart (Evolução Temporal do Peso Entregue pelo socio)
    const timeData = useMemo(() => {
        const map = new Map<string, number>();
        socioData.forEach(item => {
            if (item.DataMovimento) {
                const dateStr = new Date(item.DataMovimento).toISOString().split('T')[0];
                map.set(dateStr, (map.get(dateStr) || 0) + getValue(item));
            }
        });
        return Array.from(map.entries())
            .map(([date, peso]) => ({ date, peso: Math.round(peso) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [socioData]);

    // 3. Data for Propriedades (Bar Chart Horizontal) - Kg per Propriedade
    const propriedadeData = useMemo(() => {
        const map = new Map<string, number>();
        socioData.forEach(item => {
            const prop = item.DescricaoPropriedade || 'Sem Propriedade';
            map.set(prop, (map.get(prop) || 0) + getValue(item));
        });
        return Array.from(map.entries())
            .map(([name, peso]) => ({ name, peso: Math.round(peso) }))
            .sort((a, b) => b.peso - a.peso);
    }, [socioData]);

    // 4. Data for Parcelas (Bar Chart Horizontal) - Kg per Parcela
    const parcelaGrauData = useMemo(() => {
        const map = new Map<string, number>();
        socioData.forEach(item => {
            const propriedade = item.DescricaoPropriedade || 'Desconhecida';
            const parcelaInfo = item.DescricaoParcela || 'Sem Parcela';
            const parcela = `${propriedade} | ${parcelaInfo}`;
            const metric = viewMode === 'eur' ? (item.ValorTotalTalao || 0) : (item.PesoLiquido || 0) * (item.Grau || 0);
            map.set(parcela, (map.get(parcela) || 0) + metric);
        });
        return Array.from(map.entries())
            .map(([name, valor]) => ({ name, valor: Math.round(valor) }))
            .sort((a, b) => b.valor - a.valor);
    }, [socioData]);

    if (data.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium mt-4">
                Não há dados disponíveis.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label, unit }: any) => {
        if (active && payload && payload.length) {
            const displayUnit = unit || (viewMode === 'eur' ? '€' : 'Kg');
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{label}</p>
                    <p className="text-wine-600 font-bold text-sm">
                        {viewMode === 'eur' && (!unit || unit === '€')
                            ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(payload[0].value)
                            : `${payload[0].value.toLocaleString('pt-PT')} `}
                        {viewMode === 'kg' || unit ? <span className="text-slate-500 font-medium text-xs">{displayUnit}</span> : null}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 mt-4">
            {/* Header info for selected scope */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-wine-900 tracking-tight">Análise Gerada: {socioName}</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Dados agregados baseados nos filtros globais ativos.</p>
                    </div>
                    <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                         <span className="text-[10px] font-black text-slate-400 uppercase mr-2">Registos:</span>
                         <span className="text-sm font-black text-wine-600">{data.length}</span>
                    </div>
                </div>
            </div>

            {socioData.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
                    Não há entregas registadas para este sócio com os filtros atuais selecionados.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6">

                    {/* Gráfico de Peso por Casta */}
                    <div className="card-premium p-5 bg-white">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Castas Entregues ({viewMode === 'eur' ? '€' : 'Kg'})</h3>
                        <div className="h-[300px] print:h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={castaData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {castaData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right"
                                        wrapperStyle={{ paddingLeft: '20px', fontSize: '12px', fontFamily: 'inherit', maxHeight: '100%', overflowY: 'auto' }}
                                        content={(props) => {
                                            const { payload } = props;
                                            return (
                                                <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                                                    {[...(payload || [])].sort((a, b) => (b.payload?.value || 0) - (a.payload?.value || 0)).map((entry: any, index: number) => {
                                                        const val = entry.payload?.value || 0;
                                                        const total = castaData.reduce((acc, curr) => acc + curr.value, 0);
                                                        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                                        return (
                                                            <li key={`item-${index}`} className="flex items-center gap-2">
                                                                <div style={{ backgroundColor: entry.color, width: '12px', height: '12px', borderRadius: '2px' }} />
                                                                <span style={{ color: entry.color }} className="font-medium whitespace-nowrap">
                                                                    {entry.payload?.name} ({percent}%)
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Evolução Temporal */}
                    <div className="card-premium p-5 bg-white">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Evolução Diária ({viewMode === 'eur' ? '€' : 'Kg'})</h3>
                        <div className="h-[300px] print:h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <YAxis 
                                        tickFormatter={(value) => viewMode === 'eur' ? `${(value / 1000).toFixed(0)}k€` : `${(value / 1000).toFixed(0)}k`} 
                                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Propriedades */}
                    <div className="card-premium p-5 bg-white">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Entregas por Propriedade ({viewMode === 'eur' ? '€' : 'Kg'})</h3>
                        <div className="h-[450px] print:h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={propriedadeData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        type="number" 
                                        tickFormatter={(value) => viewMode === 'eur' ? `${(value / 1000).toFixed(0)}k€` : `${(value / 1000).toFixed(0)}k`} 
                                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                                    />
                                    <YAxis dataKey="name" type="category" width={180} interval={0} tick={{ fontSize: 10, fill: '#374151', fontWeight: 500 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="peso" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Parcelas */}
                    <div className="card-premium p-5 bg-white">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Qualidade por Parcela ({viewMode === 'eur' ? '€' : 'Kilograus'})</h3>
                        <div className="h-[450px] print:h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={parcelaGrauData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        type="number" 
                                        tickFormatter={(value) => viewMode === 'eur' ? `${(value / 1000).toFixed(0)}k€` : `${(value / 1000).toFixed(0)}k`} 
                                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                                    />
                                    <YAxis dataKey="name" type="category" width={180} interval={0} tick={{ fontSize: 10, fill: '#374151', fontWeight: 500 }} />
                                    <Tooltip content={<CustomTooltip unit={viewMode === 'eur' ? '€' : 'Kilograus'} />} />
                                    <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
