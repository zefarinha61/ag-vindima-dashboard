import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import type { RececaoUva } from '../types';

interface YieldAnalyticsProps {
    data: RececaoUva[];
}

export default function YieldAnalytics({ data }: YieldAnalyticsProps) {
    const [selectedCasta, setSelectedCasta] = useState<string>('');

    // Extrair Castas Únicas
    const castas = useMemo(() => {
        return Array.from(new Set(data.map(item => item.DescricaoCasta))).filter(Boolean).sort();
    }, [data]);

    const effectiveCasta = castas.includes(selectedCasta)
        ? selectedCasta
        : (castas.length > 0 ? castas[0] : '');

    // Calcular Rendimentos
    const yieldData = useMemo(() => {
        if (!effectiveCasta) return null;

        // Filtrar dados pela casta selecionada
        const castaData = data.filter(item => item.DescricaoCasta === effectiveCasta);

        // Map para agregar dados por Sócio
        const socioMap = new Map<string, {
            nome: string,
            pesoReal: number,
            areaTotal: number
        }>();

        castaData.forEach(item => {
            if (!item.CodSocio) return;

            const socioId = item.CodSocio;
            const socioNome = item.nome || socioId;
            const peso = item.PesoLiquido || 0;
            const area = item.AreaPlantadaHa || 0;

            if (!socioMap.has(socioId)) {
                socioMap.set(socioId, { nome: socioNome, pesoReal: 0, areaTotal: 0 });
            }
            const socioRef = socioMap.get(socioId)!;
            socioRef.pesoReal += peso;
            if (area > 0) {
                socioRef.areaTotal = area; // Since the same total area comes in every movement, overwriting is fine
            }
        });

        // Calcular Média Global da Casta (Kg / Ha)
        let totalGlobalArea = 0;
        let totalGlobalPeso = 0;

        socioMap.forEach(info => {
            totalGlobalPeso += info.pesoReal;
            totalGlobalArea += info.areaTotal;
        });

        const globalMedia = totalGlobalArea > 0 ? totalGlobalPeso / totalGlobalArea : 0;

        // Calcular Rendimento por Sócio
        const sociosYield = Array.from(socioMap.entries()).map(([, info]) => {
            const rendimento = info.areaTotal > 0 ? info.pesoReal / info.areaTotal : 0;

            return {
                nome: info.nome.slice(0, 35) + (info.nome.length > 35 ? '...' : ''),
                rendimento: Math.round(rendimento),
                pesoTotal: info.pesoReal,
                areaTotal: info.areaTotal
            };
        }).filter(s => s.rendimento > 0) // Apenas mostrar quem tem área registada
            .sort((a, b) => b.rendimento - a.rendimento)
            .slice(0, 15); // Top 15 sócios

        return {
            globalMedia: Math.round(globalMedia),
            sociosYield
        };

    }, [data, effectiveCasta]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const rowData = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-xl">
                    <p className="font-semibold text-slate-800 text-sm mb-2">{rowData.nome}</p>
                    <div className="space-y-1">
                        <p className="text-wine-600 font-bold text-sm">
                            {payload[0].value.toLocaleString('pt-PT')} <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Kg/ha</span>
                        </p>
                        <p className="text-slate-600 text-xs">
                            <span className="font-medium">Total Entregue:</span> {rowData.pesoTotal.toLocaleString('pt-PT')} Kg
                        </p>
                        <p className="text-slate-600 text-xs">
                            <span className="font-medium">Área Declarada:</span> {rowData.areaTotal.toFixed(2)} ha
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
            {/* Header / Filtro */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Rendimento Real (Kg/ha)</h2>
                    <p className="text-xs font-medium text-slate-500">
                        Comparação do rendimento efetivo por Sócio face à Média Global da Adega.
                    </p>
                </div>

                <div className="flex w-full md:w-auto">
                    <select
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full md:w-64 p-2 outline-none font-medium shadow-sm cursor-pointer"
                        value={effectiveCasta}
                        onChange={(e) => setSelectedCasta(e.target.value)}
                        disabled={castas.length === 0}
                    >
                        {castas.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
                {!yieldData ? (
                    <div className="h-64 flex items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100">
                        Sem dados para calcular rendimentos.
                    </div>
                ) : yieldData.sociosYield.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="text-lg mb-2">Sem registo de Áreas (Hectares)</span>
                        <span className="text-sm font-normal text-slate-400">
                            A casta {effectiveCasta} não tem áreas definidas nos terrenos dos sócios filtrados.
                        </span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* KPI Bar */}
                        <div className="bg-wine-50 rounded-xl p-4 border border-wine-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-wine-800 font-semibold text-sm">Média Global da Adega ({effectiveCasta})</h3>
                                <p className="text-xs text-wine-600/80 mt-0.5">Média ponderada do rendimento de todos os sócios com área registada.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-wine-700">{yieldData.globalMedia.toLocaleString('pt-PT')}</span>
                                <span className="text-wine-600 font-medium text-sm ml-1">Kg/ha</span>
                            </div>
                        </div>

                        {/* Gráfico */}
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yieldData.sociosYield} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <YAxis
                                        dataKey="nome"
                                        type="category"
                                        width={200}
                                        tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                                    />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />

                                    <ReferenceLine
                                        x={yieldData.globalMedia}
                                        stroke="#8f204d"
                                        strokeDasharray="4 4"
                                        strokeWidth={2}
                                        label={{
                                            position: 'top',
                                            value: 'Média Global',
                                            fill: '#8f204d',
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}
                                    />

                                    <Bar dataKey="rendimento" radius={[0, 4, 4, 0]} barSize={20}>
                                        {yieldData.sociosYield.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.rendimento >= yieldData.globalMedia ? '#10b981' : '#f59e0b'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-center space-x-6 text-xs text-slate-500 font-medium mt-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span>Acima da Média</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span>Abaixo da Média</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 border-b-2 border-wine-700 border-dashed"></div>
                                <span>Média da Adega</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
