import { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { RececaoUva } from '../types';

interface QualityAnalyticsProps {
    data: RececaoUva[];
    viewMode: 'kg' | 'eur';
}

export default function QualityAnalytics({ data, viewMode }: QualityAnalyticsProps) {
    // Process Data: Agrupar por Casta
    // Necessitamos do Peso Total (Volume/Valor) e do Grau Médio (Qualidade)
    const castasData = useMemo(() => {
        const map = new Map<string, { peso: number, pesoGrau: number, somaProdutoGrau: number }>();

        data.forEach(item => {
            const casta = item.DescricaoCasta || item.CDU_Casta || 'Sem Casta';

            if (!map.has(casta)) {
                map.set(casta, { peso: 0, pesoGrau: 0, somaProdutoGrau: 0 });
            }

            const current = map.get(casta)!;
            const pesoItem = viewMode === 'eur' ? (item.ValorTotalTalao || 0) : (item.PesoLiquido || 0);
            current.peso += pesoItem;

            if (item.Grau && item.Grau > 0) {
                current.somaProdutoGrau += (item.Grau * pesoItem);
                current.pesoGrau += pesoItem;
            }
        });

        return Array.from(map.entries())
            .map(([name, info]) => {
                const mediaGrau = info.pesoGrau > 0 ? (info.somaProdutoGrau / info.pesoGrau) : 0;
                return {
                    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                    peso: Math.round(info.peso),
                    grau: Number(mediaGrau.toFixed(2))
                };
            })
            // Apenas Castas com peso relevante, ordenadas por Peso
            .filter(c => c.peso > 0)
            .sort((a, b) => b.peso - a.peso)
            .slice(0, 15); // Top 15 castas para o gráfico ser legível
    }, [data]);

    // Process Data: Agrupar por Hora de Movimento
    const hourlyData = useMemo(() => {
        const map = new Map<number, { peso: number, pesoGrau: number, somaProdutoGrau: number }>();

        data.forEach(item => {
            let hour = -1;
            if (item.HoraMovimento) {
                const val = String(item.HoraMovimento);
                if (val.includes('T')) {
                    // Extrair hora local do Timestamp ISO
                    hour = new Date(val).getHours();
                } else if (val.includes(':')) {
                    // Fallback para strings isoladas HH:mm:ss
                    hour = parseInt(val.split(':')[0], 10);
                }
            }

            if (hour >= 0 && hour <= 23) {
                if (!map.has(hour)) {
                    map.set(hour, { peso: 0, pesoGrau: 0, somaProdutoGrau: 0 });
                }
                const current = map.get(hour)!;
                const pesoItem = viewMode === 'eur' ? (item.ValorTotalTalao || 0) : (item.PesoLiquido || 0);
                current.peso += pesoItem;

                if (item.Grau && item.Grau > 0) {
                    current.somaProdutoGrau += (item.Grau * pesoItem);
                    current.pesoGrau += pesoItem;
                }
            }
        });

        const result = [];
        const hoursSorted = Array.from(map.keys()).sort((a, b) => a - b);
        const minHour = hoursSorted.length > 0 ? Math.max(0, hoursSorted[0] - 1) : 6;
        const maxHour = hoursSorted.length > 0 ? Math.min(23, hoursSorted[hoursSorted.length - 1] + 1) : 22;

        for (let h = minHour; h <= maxHour; h++) {
            const info = map.get(h);
            if (info && (info.peso > 0 || info.pesoGrau > 0)) {
                const mediaGrau = info.pesoGrau > 0 ? (info.somaProdutoGrau / info.pesoGrau) : null;
                result.push({
                    name: `${h.toString().padStart(2, '0')}h`,
                    peso: Math.round(info.peso),
                    grau: mediaGrau !== null ? Number(mediaGrau.toFixed(2)) : null
                });
            }
        }
        return result;
    }, [data]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => {
                        let labelName = entry.name;
                        let formattedValue = entry.value;

                        if (entry.name === 'Peso (Kg)' || entry.name === 'Valor (€)') {
                            labelName = viewMode === 'eur' ? 'Valor (€)' : 'Peso (Kg)';
                            formattedValue = viewMode === 'eur' 
                                ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(entry.value)
                                : `${entry.value.toLocaleString('pt-PT')} Kg`;
                        } else {
                            formattedValue = `${entry.value}º`;
                        }

                        return (
                            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                                {labelName}: {formattedValue}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    const CustomXAxisTick = (props: any) => {
        const { x, y, payload } = props;
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={11}
                    fontWeight={500}
                    transform="rotate(-45)"
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    return (
        <div className="grid grid-cols-1 print:grid-cols-1 gap-6 mt-4">
            {/* Gráfico 1: Qualidade vs Rendimento por Casta */}
            <div className="card-premium overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-white/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Qualidade vs Rendimento por Casta</h2>
                        <p className="text-xs font-medium text-slate-500">
                            Top 15 Castas: Comparativo do {viewMode === 'eur' ? 'Valor Talão' : 'Volume Entregue'} (Barras) com o Grau Médio (Linha)
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    {castasData.length > 0 ? (
                        <div className="h-[450px] print:h-[400px] w-full">
                            <ResponsiveContainer width="99%" height="100%">
                                <ComposedChart
                                    data={castasData}
                                    margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                                >
                                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        interval={0}
                                        height={100}
                                        tick={<CustomXAxisTick />}
                                    />
                                    {/* Eixo Y Esquerdo: Peso (Barras) */}
                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={(value) => viewMode === 'eur' ? `${(value / 1000).toFixed(0)}k€` : `${(value / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: 11, fill: '#8b5cf6' }}
                                        orientation="left"
                                    />
                                    {/* Eixo Y Direito: Grau (Linha) */}
                                    <YAxis
                                        yAxisId="right"
                                        tick={{ fontSize: 11, fill: '#10b981' }}
                                        orientation="right"
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar
                                        yAxisId="left"
                                        name={viewMode === 'eur' ? 'Valor (€)' : 'Peso (Kg)'}
                                        dataKey="peso"
                                        fill="#8b5cf6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    />
                                    <Line
                                        yAxisId="right"
                                        name="Grau Médio (º)"
                                        type="monotone"
                                        dataKey="grau"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100 p-6 text-center">
                            Nenhum dado encontrado com volume ou grau suficiente para análise.
                        </div>
                    )}
                </div>
            </div>

            {/* Gráfico 2: Análise Horária da Qualidade */}
            <div className="card-premium overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-white/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="w-2 h-6 bg-amber-500 rounded-full inline-block"></span>
                            Análise Horária da Entrega e Qualidade Térmica
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                            Volume de receção ao longo do dia comparado com o Grau da uva (Manhã vs. Tarde)
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    {hourlyData.length > 0 ? (
                        <div className="h-[400px] print:h-[350px] w-full">
                            <ResponsiveContainer width="99%" height="100%">
                                <ComposedChart
                                    data={hourlyData}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                >
                                    <defs>
                                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    {/* Eixo Y Esquerdo: Peso (Área/Barras) */}
                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={(value) => viewMode === 'eur' ? `${(value / 1000).toFixed(0)}k€` : `${(value / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: 11, fill: '#f59e0b', fontWeight: 600 }}
                                        orientation="left"
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    {/* Eixo Y Direito: Grau (Linha) */}
                                    <YAxis
                                        yAxisId="right"
                                        tick={{ fontSize: 11, fill: '#ef4444', fontWeight: 600 }}
                                        orientation="right"
                                        domain={['auto', 'auto']}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={10}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '13px' }} />
                                    <Bar
                                        yAxisId="left"
                                        name={viewMode === 'eur' ? 'Valor (€)' : 'Peso (Kg)'}
                                        dataKey="peso"
                                        fill="url(#colorPeso)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={40}
                                    />
                                    <Line
                                        yAxisId="right"
                                        name="Grau Médio (º)"
                                        type="monotone"
                                        dataKey="grau"
                                        stroke="#ef4444"
                                        strokeWidth={4}
                                        dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: '#ef4444' }}
                                        activeDot={{ r: 7, strokeWidth: 0, fill: '#ef4444' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100 p-6 text-center">
                            <span className="text-lg mb-2">Sem Registo Horário</span>
                            <span className="text-sm font-normal text-slate-400">
                                As uvas filtradas não dispõem de Hora de Movimento para calcular o impacto térmico.
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
