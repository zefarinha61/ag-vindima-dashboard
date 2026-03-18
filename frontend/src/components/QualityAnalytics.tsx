import { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { RececaoUva } from '../types';

interface QualityAnalyticsProps {
    data: RececaoUva[];
}

export default function QualityAnalytics({ data }: QualityAnalyticsProps) {
    // Process Data: Agrupar por Casta
    // Necessitamos do Peso Total (Volume) e do Grau Médio (Qualidade)
    const castasData = useMemo(() => {
        const map = new Map<string, { peso: number, pesoGrau: number, somaProdutoGrau: number }>();

        data.forEach(item => {
            const casta = item.DescricaoCasta || item.CDU_Casta || 'Sem Casta';

            if (!map.has(casta)) {
                map.set(casta, { peso: 0, pesoGrau: 0, somaProdutoGrau: 0 });
            }

            const current = map.get(casta)!;
            const pesoItem = item.PesoLiquido || 0;
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

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name === 'Peso (Kg)'
                                ? `${entry.name}: ${entry.value.toLocaleString('pt-PT')} Kg`
                                : `${entry.name}: ${entry.value}º`}
                        </p>
                    ))}
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
        <div className="card-premium overflow-hidden mt-4">
            <div className="p-5 border-b border-slate-100 bg-white/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Qualidade vs Rendimento por Casta</h2>
                    <p className="text-xs font-medium text-slate-500">
                        Top 15 Castas: Comparativo do Volume Entregue (Barras) com o Grau Médio (Linha)
                    </p>
                </div>
            </div>

            <div className="p-6">
                {castasData.length > 0 ? (
                    <div className="h-[450px] w-full">
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
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
                                    name="Peso (Kg)"
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
    );
}
