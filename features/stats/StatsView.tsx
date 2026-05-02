import React, { useMemo, useState } from 'react';
import { StatsEngine, METRICS } from './model/StatsEngine';
import type { MetricId } from './model/StatsEngine';
import { flattenLogsToEvents } from './model/eventAdapter';
import { calculateXpStats } from './model/xpStats';
import type { DimensionStat } from './model/xpStats';
import { generateInsights } from './model/insights';
import type { Insight } from './model/insights';
import type { LogEntry } from '../../domain';
import { Activity, Zap, TrendingUp, BrainCircuit, Radar, CheckCircle, ArrowDown, AlertTriangle, Info, Tag, Sparkles } from 'lucide-react';
import { ErrorBoundary } from '../../shared/ui';
import {
    getMasturbationRecommendationsFromEvents,
    getSexRecommendationsFromEvents,
    type P3Recommendation
} from './model/p3Recommendations';
import { getFatigueSummaryFromEvents } from './model/p3Fatigue';
import { getWindowsFromEvents } from './model/p3Windows';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, Tooltip, Legend, Filler, ScatterController, LineController, BubbleController, ArcElement, PieController, DoughnutController, RadialLinearScale, RadarController, PolarAreaController } from 'chart.js';
import { Line, Bar, Radar as RadarChart } from 'react-chartjs-2';

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

interface P3ListCardProps {
    title: string;
    badge: string;
    items: Array<{ title: string; meta?: string; detail: string }>;
    emptyText: string;
}

type StatsTab = 'overview' | 'sexual' | 'behavior';
const STATS_TABS: { id: StatsTab; label: string }[] = [
    { id: 'overview', label: '总览' },
    { id: 'behavior', label: '习惯' },
    { id: 'sexual', label: '性爱' }
];

interface StatsViewProps {
    isDarkMode: boolean;
    logs: LogEntry[];
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

const P3ListCard = ({ title, badge, items, emptyText }: P3ListCardProps) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-brand-text dark:text-slate-200 text-sm">{title}</h3>
            <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{badge}</span>
        </div>
        {items.length > 0 ? (
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={`${title}-${item.title}-${item.meta || item.detail}`} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-brand-text dark:text-slate-200">{item.title}</p>
                            {item.meta && <span className="text-[10px] font-bold text-slate-400">{item.meta}</span>}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.detail}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-6 text-center text-xs font-medium text-slate-400">
                {emptyText}
            </div>
        )}
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

const StatsView: React.FC<StatsViewProps> = ({ isDarkMode, logs: rawLogs }) => {
    const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
    const [activeTab, setActiveTab] = useState<StatsTab>('overview');
    const [trendComparison] = useState<MetricId>('sleep');

    const displayLogs = useMemo(() => {
        return [...logs].filter(l => l.status === 'completed' && !isNaN(new Date(l.date).getTime()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [logs]);

    const statsEngine = useMemo(() => new StatsEngine(displayLogs), [displayLogs]);
    const eventStream = useMemo(() => flattenLogsToEvents(displayLogs), [displayLogs]);
    const insights = useMemo(() => generateInsights(displayLogs), [displayLogs]);
    const xpStats = useMemo(() => calculateXpStats(displayLogs), [displayLogs]);
    const sexRecommendations = useMemo(() => getSexRecommendationsFromEvents(eventStream), [eventStream]);
    const masturbationRecommendations = useMemo(() => getMasturbationRecommendationsFromEvents(eventStream), [eventStream]);
    const sexFatigue = useMemo(() => getFatigueSummaryFromEvents(eventStream, 'sex'), [eventStream]);
    const masturbationFatigue = useMemo(() => getFatigueSummaryFromEvents(eventStream, 'masturbation'), [eventStream]);
    const sexWindows = useMemo(() => getWindowsFromEvents(eventStream, 'sex'), [eventStream]);
    const masturbationWindows = useMemo(() => getWindowsFromEvents(eventStream, 'masturbation'), [eventStream]);

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
        const sleepSeries = statsEngine.getSeries('sleep');
        const exerciseSeries = statsEngine.getSeries('exercise');
        const screenTimeSeries = statsEngine.getSeries('screenTime');
        const healthScoreSeries = statsEngine.getSeries('healthScore');
        const labels = hardnessSeries.map(d => `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`);
        const hardnessSMA = statsEngine.getSMA('hardness', 7);
        const comparisonData = statsEngine.getSeries(trendComparison).map(d => d.value);
        const hardnessDist = [0,0,0,0,0];
        displayLogs.forEach(l => { if(l.morning?.wokeWithErection && l.morning.hardness) hardnessDist[l.morning.hardness - 1]++; });
        const avgH = hardnessSeries.reduce((a,b)=>a+b.value,0) / (hardnessSeries.length || 1);
        const avgSleep = sleepSeries.length > 0 ? sleepSeries.reduce((sum, item) => sum + item.value, 0) / sleepSeries.length : 0;
        const avgHealthScore = healthScoreSeries.filter(item => item.value > 0);
        const avgScreenTime = screenTimeSeries.length > 0 ? screenTimeSeries.reduce((sum, item) => sum + item.value, 0) / screenTimeSeries.length : 0;

        return {
            trends: {
                labels,
                hardnessSMA,
                comparisonData,
                sleepSeries: sleepSeries.map(item => item.value),
                exerciseSeries: exerciseSeries.map(item => item.value),
                screenTimeSeries: screenTimeSeries.map(item => item.value),
                healthScoreSeries: healthScoreSeries.map(item => item.value > 0 ? item.value : null)
            },
            kpis: {
                avgHardness: avgH.toFixed(1),
                totalActivity: displayLogs.reduce((a,b) => a + (b.sex?.length||0) + (b.masturbation?.length||0), 0),
                avgSleep: avgSleep.toFixed(1),
                avgScreenTime: avgScreenTime.toFixed(1),
                avgHealthScore: avgHealthScore.length > 0 ? (avgHealthScore.reduce((sum, item) => sum + item.value, 0) / avgHealthScore.length).toFixed(0) : '--'
            },
            hardnessDist
        };
    }, [displayLogs, trendComparison, statsEngine]);

    const comparisonConfig = useMemo(() => {
        const conf = METRICS[trendComparison];
        return { label: `${conf.label} (${conf.unit})`, yMax: trendComparison === 'sleep' ? 12 : trendComparison === 'alcohol' ? 100 : 6 };
    }, [trendComparison]);

    const sexualStats = useMemo(() => {
        const sexEvents = eventStream.filter(event => event.type === 'sex' && typeof event.metrics.score === 'number');
        const masturbationEvents = eventStream.filter(event => event.type === 'masturbation' && typeof event.metrics.score === 'number');
        const averageSexScore = sexEvents.length > 0
            ? (sexEvents.reduce((sum, event) => sum + (event.metrics.score || 0), 0) / sexEvents.length).toFixed(0)
            : '--';
        const averageMasturbationScore = masturbationEvents.length > 0
            ? (masturbationEvents.reduce((sum, event) => sum + (event.metrics.score || 0), 0) / masturbationEvents.length).toFixed(0)
            : '--';

        const fatigueRank = { normal: 0, light_intimacy: 1, rest: 2 } as const;
        const fatigueCandidates = [sexFatigue, masturbationFatigue].filter(summary => !summary.insufficient);
        const currentFatigueState = fatigueCandidates.length === 0
            ? '样本不足'
            : [...fatigueCandidates].sort((a, b) => fatigueRank[b.currentState] - fatigueRank[a.currentState])[0].currentStateLabel;

        return {
            averageSexScore,
            averageMasturbationScore,
            currentFatigueState,
            usableSamples: sexEvents.length + masturbationEvents.length,
            sexSamples: sexEvents.length,
            masturbationSamples: masturbationEvents.length
        };
    }, [eventStream, sexFatigue, masturbationFatigue]);

    const recommendationItems = (items: P3Recommendation[]) => items.map(item => ({
        title: item.value,
        meta: `${item.sampleSize}次 · ${item.confidence}`,
        detail: item.reason
    }));

    const fatigueItems = (summary: ReturnType<typeof getFatigueSummaryFromEvents>) => summary.insufficient
        ? []
        : summary.lines.map((line, index) => ({
            title: index === 0 ? '高疲劳模式' : index === 1 ? '低疲劳高质量模式' : '当前判断',
            meta: index === 2 ? summary.currentStateLabel : `${summary.sampleSize}条`,
            detail: line
        }));

    const windowItems = (items: ReturnType<typeof getWindowsFromEvents>) => items.map(item => ({
        title: item.label,
        meta: `${item.sampleSize}次 · ${item.confidence}`,
        detail: `平均体验 ${item.averageScore} 分，低疲劳占比 ${item.lowFatigueRate}%`
    }));

    return (
        <ErrorBoundary>
            <div className="space-y-6 pb-24">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-2xl font-bold text-brand-text dark:text-slate-100">数据洞察</h2>
                </div>

                <div className="flex p-1 bg-brand-primary dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                    {STATS_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-brand-accent shadow-sm' : 'text-brand-muted dark:text-slate-500'}`}>{tab.label}</button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard label="硬度评分" value={stats.kpis.avgHardness} icon={Zap} colorClass="text-brand-accent dark:text-blue-400"/>
                            <KPICard label="近期活跃" value={stats.kpis.totalActivity} unit="次" icon={Activity} colorClass="text-pink-500 dark:text-pink-400"/>
                            <KPICard label="平均睡眠" value={stats.kpis.avgSleep} unit="h" icon={TrendingUp} colorClass="text-blue-500 dark:text-blue-400"/>
                            <KPICard label="健康分" value={stats.kpis.avgHealthScore} unit="分" icon={CheckCircle} colorClass="text-emerald-500 dark:text-emerald-400"/>
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
                        <ChartCard title="健康分走势" icon={BrainCircuit} subtext="缺失记录不参与评分">
                            <div className="w-full h-[250px]">
                                <Line
                                    data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            {
                                                label: '健康分',
                                                data: stats.trends.healthScoreSeries as any,
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                borderWidth: 3,
                                                pointRadius: 3,
                                                tension: 0.35,
                                                fill: true
                                            }
                                        ]
                                    } as any}
                                    options={{
                                        ...commonOptions,
                                        scales: {
                                            ...commonOptions.scales,
                                            y: { ...commonOptions.scales.y, min: 0, max: 100 }
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
                        <ChartCard title="睡眠 / 运动 / 屏幕时间" icon={Activity} subtext="习惯类统计">
                            <div className="w-full h-[250px]">
                                <Bar
                                    data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            { label: '睡眠(h)', data: stats.trends.sleepSeries as any, backgroundColor: 'rgba(59, 130, 246, 0.55)', borderRadius: 4 },
                                            { label: '运动(min)', data: stats.trends.exerciseSeries as any, backgroundColor: 'rgba(16, 185, 129, 0.55)', borderRadius: 4 },
                                            { label: '屏幕(h)', data: stats.trends.screenTimeSeries as any, backgroundColor: 'rgba(249, 115, 22, 0.55)', borderRadius: 4 }
                                        ]
                                    } as any}
                                    options={commonOptions as any}
                                />
                            </div>
                        </ChartCard>
                        <ChartCard title="健康分走势" icon={BrainCircuit} subtext="习惯变化对状态的影响">
                            <div className="w-full h-[250px]">
                                <Line
                                    data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            {
                                                label: '健康分',
                                                data: stats.trends.healthScoreSeries as any,
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                borderWidth: 3,
                                                pointRadius: 3,
                                                tension: 0.35,
                                                fill: true
                                            }
                                        ]
                                    } as any}
                                    options={{
                                        ...commonOptions,
                                        scales: {
                                            ...commonOptions.scales,
                                            y: { ...commonOptions.scales.y, min: 0, max: 100 }
                                        }
                                    } as any}
                                />
                            </div>
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'sexual' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard label="性爱均分" value={sexualStats.averageSexScore} unit="分" icon={Sparkles} colorClass="text-pink-500 dark:text-pink-400" />
                            <KPICard label="自慰均分" value={sexualStats.averageMasturbationScore} unit="分" icon={Zap} colorClass="text-indigo-500 dark:text-indigo-400" />
                            <KPICard label="当前疲劳状态" value={sexualStats.currentFatigueState} icon={BrainCircuit} colorClass="text-amber-500 dark:text-amber-400" />
                            <KPICard label="可用样本数" value={sexualStats.usableSamples} unit="条" icon={CheckCircle} colorClass="text-emerald-500 dark:text-emerald-400" />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <P3ListCard
                                title="性爱推荐"
                                badge={`样本 ${sexualStats.sexSamples}`}
                                items={recommendationItems(sexRecommendations)}
                                emptyText="样本不足，暂不生成结论"
                            />
                            <P3ListCard
                                title="自慰推荐"
                                badge={`样本 ${sexualStats.masturbationSamples}`}
                                items={recommendationItems(masturbationRecommendations)}
                                emptyText="样本不足，暂不生成结论"
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <P3ListCard
                                title="性爱疲劳分析"
                                badge={sexFatigue.currentStateLabel}
                                items={fatigueItems(sexFatigue)}
                                emptyText="样本不足，暂不生成结论"
                            />
                            <P3ListCard
                                title="自慰疲劳分析"
                                badge={masturbationFatigue.currentStateLabel}
                                items={fatigueItems(masturbationFatigue)}
                                emptyText="样本不足，暂不生成结论"
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <P3ListCard
                                title="性爱高质量窗口"
                                badge={`Top ${Math.max(sexWindows.length, 0)}`}
                                items={windowItems(sexWindows)}
                                emptyText="样本不足，暂不生成结论"
                            />
                            <P3ListCard
                                title="自慰高质量窗口"
                                badge={`Top ${Math.max(masturbationWindows.length, 0)}`}
                                items={windowItems(masturbationWindows)}
                                emptyText="样本不足，暂不生成结论"
                            />
                        </div>

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
