import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import type { RececaoUva } from '../types';

interface SocioViewProps {
    data: RececaoUva[];
    viewMode: 'kg' | 'eur';
}

const COLORS = ['#8f204d', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function SocioView({ data, viewMode }: SocioViewProps) {
    const [selectedSocio, setSelectedSocio] = useState<string>('');
    const getValue = (item: RececaoUva) => viewMode === 'eur' ? (item.ValorTotalTalao || 0) : (item.PesoLiquido || 0);

    const sociosDisponiveis = useMemo(() => {
        const unique = new Map<string, string>();
        data.forEach(item => {
            if (item.CodSocio) {
                unique.set(item.CodSocio, item.nome || item.CodSocio);
            }
        });
        return Array.from(unique.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [data]);

    const effectiveSocio = selectedSocio || (sociosDisponiveis.length > 0 ? sociosDisponiveis[0][0] : '');

    const socioData = useMemo(() => {
        return data.filter(item => item.CodSocio === effectiveSocio);
    }, [data, effectiveSocio]);

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
            {/* Sócio Selector */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Análise Automática do Sócio</h2>
                    <p className="text-xs font-medium text-slate-500">Selecione o sócio para visualizar a distribuição dos seus dados de entrega.</p>
                </div>
                <div className="mt-4 md:mt-0 w-full md:w-96">
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full p-2.5 outline-none font-medium shadow-sm cursor-pointer"
                        value={effectiveSocio}
                        onChange={(e) => setSelectedSocio(e.target.value)}
                    >
                        {sociosDisponiveis.map(([id, nome]) => (
                            <option key={id} value={id}>{nome} ({id})</option>
                        ))}
                    </select>
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
