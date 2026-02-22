import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { StatsEngine, MetricId, METRICS } from '../utils/StatsEngine';
import { calculateXpStats, DimensionStat } from '../utils/xpStats';
import { generateInsights, Insight } from '../utils/insights';
import { Activity, Zap, TrendingUp, Moon, BrainCircuit, Clock, Radar, CheckCircle, ArrowDown, AlertTriangle, Info, BarChart3, LayoutGrid, Tag, Eye, EyeOff, Sparkles } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { getMasturbationRecommendations } from '../utils/recommendationEngine';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, Tooltip, Legend, Filler, ScatterController, LineController, BubbleController, ArcElement, PieController, DoughnutController, RadialLinearScale, RadarController, PolarAreaController } from 'chart.js';
import { Line, Bar, Doughnut, Radar as RadarChart } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, ScatterController, LineController, BubbleController, ArcElement, PieController, DoughnutController, RadialLinearScale, RadarController, PolarAreaController, Tooltip, Legend, Filler);

// --- Interfaces ---

interface ChartCardProps {
    title: string;
    icon?: React.ElementType;
    // Fix: Made children optional to resolve TS error where JSX nesting is not recognized as passing a required children prop
    children?: React.ReactNode;
    subtext?: string;
    className?: string;
}

interface KPICardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    colorClass?: string;
}

// --- Sub-Components ---

const ChartCard = ({ title, icon: Icon, children, subtext, className }: ChartCardProps) => (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[350px] ${className || ''}`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-brand-text dark:text-slate-200 flex items-center text-sm">
                {Icon && <Icon size={16} className="mr-2 text-brand-accent"/>}
                {title}
            </h3>
        </div>
        <div className="flex-1 relative flex flex-col items-center justify-center w-full">{children}</div>
        {subtext && <p className="text-xs text-slate-400 mt-3 text-center">{subtext}</p>}
    </div>
);

const KPICard = ({ label, value, unit, icon: Icon, colorClass = "text-brand-text" }: KPICardProps) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-brand-primary dark:bg-slate-800 rounded-2xl">
                <Icon size={20} className="text-brand-accent" />
            </div>
        </div>
        <div>
            <p className="text-xs text-brand-muted dark:text-slate-400 font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-black mt-1 ${colorClass}`}>{value}<span className="text-sm font-bold text-brand-muted dark:text-slate-500 ml-1">{unit}</span></p>
        </div>
    </div>
);

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
    const bgMap = {
        positive: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50',
        negative: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50',
        warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50',
        neutral: 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
    };
    const iconMap = {
        positive: <CheckCircle size={18} className="text-green-600"/>,
        negative: <ArrowDown size={18} className="text-red-600"/>,
        warning: <AlertTriangle size={18} className="text-orange-500"/>,
        neutral: <Info size={18} className="text-blue-500"/>
    };
    return (
        <div className={`p-4 rounded-2xl border ${bgMap[insight.type]} animate-in slide-in-from-bottom-2`}>
            <div className="flex items-center gap-2 mb-2">
                {iconMap[insight.type]}
                <h4 className="font-bold text-sm text-brand-text dark:text-slate-200">{insight.title}</h4>
            </div>
            <p className="text-xs text-brand-muted dark:text-slate-400 leading-relaxed">{insight.description}</p>
        </div>
    );
};

const StatsView: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const { logs: rawLogs } = useData();
    const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
    const [activeTab, setActiveTab] = useState<'overview' | 'sexual' | 'behavior'>('overview');
    const [trendComparison, setTrendComparison] = useState<MetricId>('sleep');

    const displayLogs = useMemo(() => {
        return [...logs].filter(l => l.status === 'completed' && !isNaN(new Date(l.date).getTime()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [logs]);

    const statsEngine = useMemo(() => new StatsEngine(displayLogs), [displayLogs]);
    const insights = useMemo(() => generateInsights(displayLogs), [displayLogs]);
    const xpStats = useMemo(() => calculateXpStats(displayLogs), [displayLogs]);
    const recommendations = useMemo(() => getMasturbationRecommendations(displayLogs), [displayLogs]);

    const theme = useMemo(() => ({
        grid: isDarkMode ? '#1e293b' : '#f1f5f9', 
        text: isDarkMode ? '#94a3b8' : '#64748b', 
        primary: isDarkMode ? '#60a5fa' : '#3b82f6', 
    }), [isDarkMode]);

    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const, labels: { color: theme.text, boxWidth: 10, usePointStyle: true, padding: 15, font: { size: 11 } } } },
        scales: { 
            y: { ticks: { color: theme.text, font: { size: 10 } }, grid: { color: theme.grid }, border: { display: false } }, 
            x: { ticks: { color: theme.text, font: { size: 10 } }, grid: { display: false }, border: { display: false } } 
        }
    };

    const stats = useMemo(() => {
        const hardnessSeries = statsEngine.getSeries('hardness');
        const labels = hardnessSeries.map(d => `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`);
        const hardnessSMA = statsEngine.getSMA('hardness', 7);
        const comparisonData = statsEngine.getSeries(trendComparison).map(d => d.value);
        const hardnessDist = [0,0,0,0,0];
        displayLogs.forEach(l => { if(l.morning?.wokeWithErection && l.morning.hardness) hardnessDist[l.morning.hardness - 1]++; });
        const avgH = hardnessSeries.reduce((a,b)=>a+b.value,0) / (hardnessSeries.length || 1);
        return { trends: { labels, hardnessSMA, comparisonData }, kpis: { avgHardness: avgH.toFixed(1), totalActivity: displayLogs.reduce((a,b) => a + (b.sex?.length||0) + (b.masturbation?.length||0), 0) }, hardnessDist };
    }, [displayLogs, trendComparison, statsEngine]);

    const comparisonConfig = useMemo(() => {
        const conf = METRICS[trendComparison];
        return { label: `${conf.label} (${conf.unit})`, yMax: trendComparison === 'sleep' ? 12 : trendComparison === 'alcohol' ? 100 : 6 };
    }, [trendComparison]);

    return (
        <ErrorBoundary>
            <div className="space-y-6 pb-24">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-2xl font-bold text-brand-text dark:text-slate-100">数据洞察</h2>
                </div>

                <div className="flex p-1 bg-brand-primary dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                    {[{ id: 'overview', label: '总览' }, { id: 'behavior', label: '习惯' }, { id: 'sexual', label: '性爱' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-brand-accent shadow-sm' : 'text-brand-muted dark:text-slate-500'}`}>{tab.label}</button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard label="硬度评分" value={stats.kpis.avgHardness} icon={Zap} colorClass="text-brand-accent dark:text-blue-400"/>
                            <KPICard label="近期活跃" value={stats.kpis.totalActivity} unit="次" icon={Activity} colorClass="text-pink-500 dark:text-pink-400"/>
                        </div>
                        <ChartCard title="趋势对比分析" icon={TrendingUp} subtext="均线：硬度等级 | 柱状：对比指标">
                            <div className="w-full h-[250px]">
                                <Line 
                                    data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            { label: '硬度均线', data: stats.trends.hardnessSMA as any, borderColor: '#8b5cf6', borderWidth: 3, pointRadius: 0, tension: 0.4, fill: false, yAxisID: 'y' },
                                            { type: 'bar' as const, label: comparisonConfig.label, data: stats.trends.comparisonData as any, backgroundColor: 'rgba(59, 130, 246, 0.4)', borderRadius: 4, yAxisID: 'y1' }
                                        ]
                                    } as any} 
                                    options={{ 
                                        ...commonOptions, 
                                        scales: { 
                                            ...commonOptions.scales, 
                                            y: { ...commonOptions.scales.y, min: 0, max: 6 }, 
                                            y1: { position: 'right', display: true, min: 0, max: comparisonConfig.yMax, grid: {display:false}, ticks: {color: theme.text, font: {size: 10}} } 
                                        } 
                                    } as any} 
                                />
                            </div>
                        </ChartCard>
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center px-1"><BrainCircuit size={16} className="mr-2"/> 智能分析</h3>
                            {insights.slice(0, 3).map(insight => <InsightCard key={insight.id} insight={insight} />)}
                        </div>
                    </div>
                )}

                {activeTab === 'behavior' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {recommendations.length > 0 && (
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 p-5 rounded-3xl border border-pink-100 dark:border-pink-900/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles size={16} className="text-pink-500" />
                                    <span className="text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">为你推荐 (Based on History)</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.map(rec => (
                                        <div 
                                            key={`${rec.type}-${rec.value}`}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2"
                                        >
                                            <span>{rec.value}</span>
                                            <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{rec.type === 'tag' ? '标签' : '工具'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <ChartCard title="偏好雷达 (XP维度)" icon={Radar}>
                            <div className="w-full h-[300px] flex items-center justify-center">
                                <RadarChart 
                                    data={{
                                        labels: ['角色', '身体', '装扮', '玩法', '剧情', '风格'],
                                        datasets: [{
                                            label: '维度强度',
                                            data: [
                                                (xpStats.dimensionStats['角色'] as DimensionStat)?.recordCount || 0,
                                                (xpStats.dimensionStats['身体'] as DimensionStat)?.recordCount || 0,
                                                (xpStats.dimensionStats['装扮'] as DimensionStat)?.recordCount || 0,
                                                (xpStats.dimensionStats['玩法'] as DimensionStat)?.recordCount || 0,
                                                (xpStats.dimensionStats['剧情'] as DimensionStat)?.recordCount || 0,
                                                (xpStats.dimensionStats['风格'] as DimensionStat)?.recordCount || 0
                                            ],
                                            backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: '#ec4899', pointBackgroundColor: '#ec4899',
                                        }]
                                    } as any} 
                                    options={{ 
                                        ...commonOptions, 
                                        scales: { 
                                            r: { angleLines: { color: theme.grid }, grid: { color: theme.grid }, pointLabels: { color: theme.text, font: { size: 11, weight: 'bold' } }, ticks: { display: false, backdropColor: 'transparent' } } 
                                        } 
                                    } as any} 
                                />
                            </div>
                        </ChartCard>
                        <ChartCard title="高频偏好 Top 10" icon={Tag} subtext="按记录去重统计">
                            <div className="w-full h-[300px]">
                                <Bar 
                                    data={{
                                        labels: xpStats.topTags.slice(0, 10).map(t => t.tag),
                                        datasets: [{ label: '频次', data: xpStats.topTags.slice(0, 10).map(t => t.count), backgroundColor: 'rgba(139, 92, 246, 0.6)', borderRadius: 4, barThickness: 16 }]
                                    } as any} 
                                    options={{ 
                                        ...commonOptions, 
                                        indexAxis: 'y' as const, 
                                        plugins: { legend: { display: false } } 
                                    } as any} 
                                />
                            </div>
                        </ChartCard>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default React.memo(StatsView);