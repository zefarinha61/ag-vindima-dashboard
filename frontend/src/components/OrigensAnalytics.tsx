import { useState, useMemo } from 'react';
import {
    Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import type { RececaoUva } from '../types';

interface OrigensAnalyticsProps {
    data: RececaoUva[];
}

const COLORS = ['#8f204d', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function OrigensAnalytics({ data }: OrigensAnalyticsProps) {
    const [selectedSocio, setSelectedSocio] = useState<string>('');
    const [selectedPropriedade, setSelectedPropriedade] = useState<string>('');

    // Extrair Sócios Únicos
    const socios = useMemo(() => {
        return Array.from(new Set(data.map(item => item.nome || item.CodSocio || ''))).filter(Boolean).sort();
    }, [data]);

    // Sócio Efetivo (se só houver 1 resultante dos filtros globais, auto-seleciona)
    const effectiveSocio = selectedSocio || (socios.length === 1 ? socios[0] : '');

    // Extrair Propriedades (Dependentes do Sócio Selecionado)
    const propriedades = useMemo(() => {
        if (!effectiveSocio) return [];
        return Array.from(
            new Set(
                data
                    .filter(item => (item.nome === effectiveSocio || item.CodSocio === effectiveSocio) && item.DescricaoPropriedade)
                    .map(item => item.DescricaoPropriedade)
            )
        ).sort();
    }, [data, effectiveSocio]);

    // Reset da Propriedade se o Sócio mudar
    function handleSocioChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedSocio(e.target.value);
        setSelectedPropriedade('');
    }

    // Criar os Dados para os Gráficos
    const chartData = useMemo(() => {
        if (!effectiveSocio) {
            return {
                type: 'empty',
                data: []
            };
        }

        // Cenário Específico por Sócio (Múltiplos PieCharts por Propriedade)
        // Group by Propriedade -> Group by Parcela
        const propriedadesMap = new Map<string, Map<string, number>>();

        data.forEach(item => {
            const matchSocio = item.nome === effectiveSocio || item.CodSocio === effectiveSocio;
            const matchPropriedade = selectedPropriedade === '' || item.DescricaoPropriedade === selectedPropriedade;

            if (matchSocio && matchPropriedade) {
                const prop = item.DescricaoPropriedade || 'Sem Propriedade Definida';
                const parc = item.DescricaoParcela || 'Sem Parcela Definida';

                if (!propriedadesMap.has(prop)) {
                    propriedadesMap.set(prop, new Map());
                }
                const parcMap = propriedadesMap.get(prop)!;
                parcMap.set(parc, (parcMap.get(parc) || 0) + (item.PesoLiquido || 0));
            }
        });

        // Convert Map of Maps to Array of Objects
        const groupedData = Array.from(propriedadesMap.entries()).map(([propName, parcMap]) => {
            const parcelas = Array.from(parcMap.entries())
                .map(([name, value]) => ({ name, value: Math.round(value) }))
                .sort((a, b) => b.value - a.value); // Ordena parcelas por maior peso na propriedade

            const totalPropriedade = parcelas.reduce((acc, curr) => acc + curr.value, 0);

            return {
                propriedade: propName,
                total: totalPropriedade,
                data: parcelas
            };
        }).sort((a, b) => b.total - a.total); // Ordena propriedades pela que teve mais entrega total

        return {
            type: 'pieGroup',
            data: groupedData
        };

    }, [data, effectiveSocio, selectedPropriedade]);

    // Tooltip Customizado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{label}</p>
                    <p className="text-wine-600 font-bold text-sm">
                        {payload[0].value.toLocaleString('pt-PT')} <span className="text-slate-500 font-medium text-xs">Kg</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">

            {/* Header / Filtros do Gráfico */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Análise por Propriedade e Parcela</h2>
                    <p className="text-xs font-medium text-slate-500">
                        {effectiveSocio && selectedPropriedade
                            ? `Exibindo Parcelas da propriedade ${selectedPropriedade} do sócio ${effectiveSocio}`
                            : effectiveSocio
                                ? `Exibindo a distribuição de Parcelas por cada Propriedade do sócio ${effectiveSocio}`
                                : 'A aguardar seleção de um Sócio...'}
                    </p>
                </div>

                <div className="flex space-x-3 w-full md:w-auto">
                    <select
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full md:w-48 p-2 outline-none font-medium shadow-sm cursor-pointer"
                        value={effectiveSocio !== selectedSocio && socios.length === 1 ? effectiveSocio : selectedSocio}
                        onChange={handleSocioChange}
                        disabled={socios.length <= 1}
                    >
                        <option value="">{socios.length === 1 ? effectiveSocio : 'Todos os Sócios'}</option>
                        {socios.length > 1 && socios.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 block w-full md:w-48 p-2 outline-none font-medium shadow-sm cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                        value={selectedPropriedade}
                        onChange={(e) => setSelectedPropriedade(e.target.value)}
                        disabled={!effectiveSocio || propriedades.length === 0}
                    >
                        <option value="">Todas as Propriedades</option>
                        {propriedades.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {/* Gráficos */}
            <div className="p-6">
                {!effectiveSocio && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100 p-6 text-center">
                        <span className="text-lg mb-2 block">Por favor, selecione um Sócio no filtro acima.</span>
                        <span className="text-sm font-normal text-slate-400">
                            Exemplo: Selecione a "Leopoldina Mari..." para ver 3 gráficos de queijo (um para cada propriedade) com as respetivas parcelas.
                        </span>
                    </div>
                )}

                {chartData.type === 'pieGroup' && chartData.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(chartData.data as any[]).map((propGroup, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                                <h3 className="text-sm font-semibold text-slate-800 tracking-tight text-center mb-1">
                                    {propGroup.propriedade}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mb-4">Total: {propGroup.total.toLocaleString('pt-PT')} Kg</p>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                            <Pie
                                                data={propGroup.data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={({ name, percent }) => (percent || 0) > 0.05 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
                                                labelLine={false}
                                            >
                                                {propGroup.data.map((_entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {effectiveSocio && chartData.type === 'pieGroup' && chartData.data.length === 0 && (
                    <div className="h-64 flex items-center justify-center text-slate-500 font-medium bg-slate-50/50 rounded-lg border border-slate-100">
                        Nenhum dado encontrado para a seleção atual.
                    </div>
                )}
            </div>

        </div>
    );
}
