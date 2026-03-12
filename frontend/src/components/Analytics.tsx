import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import type { RececaoUva } from '../types';

interface AnalyticsProps {
    data: RececaoUva[];
}

const COLORS = ['#8f204d', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function Analytics({ data }: AnalyticsProps) {

    // 1. Data for Bar Chart (Peso Total por Casta)
    const castaData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(item => {
            if (item.DescricaoCasta) {
                map.set(item.DescricaoCasta, (map.get(item.DescricaoCasta) || 0) + (item.PesoLiquido || 0));
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 castas
    }, [data]);

    // 2. Data for Donut Chart (Processo de Vindima)
    const processoData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(item => {
            if (item.DescricaoProcesso) {
                map.set(item.DescricaoProcesso, (map.get(item.DescricaoProcesso) || 0) + (item.PesoLiquido || 0));
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value: Math.round(value) }));
    }, [data]);

    // 3. Data for Line Chart (Evolução Temporal do Peso Entregue)
    const timeData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(item => {
            if (item.DataMovimento) {
                // Group by Date (YYYY-MM-DD)
                const dateStr = new Date(item.DataMovimento).toISOString().split('T')[0];
                map.set(dateStr, (map.get(dateStr) || 0) + (item.PesoLiquido || 0));
            }
        });
        return Array.from(map.entries())
            .map(([date, peso]) => ({ date, peso: Math.round(peso) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    // 4. Data for Top Socios (Bar Chart Horizontal)
    const topSociosData = useMemo(() => {
        const map = new Map<string, { nome: string, peso: number }>();
        data.forEach(item => {
            if (item.CodSocio) {
                const current = map.get(item.CodSocio) || { nome: item.nome || item.CodSocio, peso: 0 };
                current.peso += (item.PesoLiquido || 0);
                map.set(item.CodSocio, current);
            }
        });
        return Array.from(map.entries())
            .map(([, info]) => ({ name: info.nome, peso: Math.round(info.peso) }))
            .sort((a, b) => b.peso - a.peso)
            .slice(0, 10); // Top 10 Socios
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
                Não há dados suficientes para gerar os gráficos.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label, unit = 'Kg' }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{label}</p>
                    <p className="text-wine-600 font-bold text-sm">
                        {payload[0].value.toLocaleString('pt-PT')} <span className="text-slate-500 font-medium text-xs">{unit}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gráfico de Peso por Casta */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-4">Top Castas (Peso Entregue)</h3>
                    <div className="h-[300px]">
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
                                    wrapperStyle={{ 
                                        paddingLeft: '20px', 
                                        fontSize: '12px', 
                                        fontFamily: 'inherit',
                                        maxHeight: '100%',
                                        overflowY: 'auto'
                                    }}
                                    content={(props) => {
                                        const { payload } = props;
                                        return (
                                            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                                                {[...(payload || [])].sort((a, b) => (b.payload?.value || 0) - (a.payload?.value || 0)).map((entry, index) => {
                                                    const val = entry.payload?.value || 0;
                                                    const total = castaData.reduce((acc, curr) => acc + curr.value, 0);
                                                    const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                                    
                                                    return (
                                                        <li key={`item-${index}`} className="flex items-center gap-2">
                                                            <div style={{ backgroundColor: entry.color, width: '12px', height: '12px', borderRadius: '2px' }} />
                                                            <span style={{ color: entry.color }} className="font-medium whitespace-nowrap">
                                                                {entry.value} ({percent}%)
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
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-4">Evolução Diária de Entregas</h3>
                    <div className="h-56">
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
                                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Sócios */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-4">Top 10 Sócios (Kg)</h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSociosData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis dataKey="name" type="category" width={280} interval={0} tick={{ fontSize: 10, fill: '#374151', fontWeight: 500 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="peso" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Processo de Vindima (Donut) */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h3 className="text-base font-semibold text-slate-800 mb-4 w-full text-left">Distribuição por Processo</h3>
                    <div className="h-56 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processoData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {processoData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
