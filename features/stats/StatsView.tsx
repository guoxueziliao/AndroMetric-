import React, { useMemo, useState } from 'react';
import { StatsEngine, METRICS } from './model/StatsEngine';
import type { MetricId } from './model/StatsEngine';
import { flattenLogsToEvents } from './model/eventAdapter';
import { calculateXpStats } from './model/xpStats';
import type { DimensionStat } from './model/xpStats';
import { generateInsights } from './model/insights';
import type { Insight, InsightCategory } from './model/insights';
import type { LogEntry } from '../../domain';
import { Activity, Zap, TrendingUp, BrainCircuit, Radar, CheckCircle, ArrowDown, AlertTriangle, Info, Tag, Sparkles } from 'lucide-react';
import { ErrorBoundary, useChartColors } from '../../shared/ui';
import ReviewSection from './ui/ReviewSection';
import PersonalNormalSection from './ui/PersonalNormalSection';
import DataQualityOverviewSection from './ui/DataQualityOverviewSection';
import StageReviewSection from './ui/StageReviewSection';
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

type StatsTab = 'overview' | 'sexual' | 'behavior' | 'review' | 'normal' | 'stage_review';
const STATS_TABS: { id: StatsTab; label: string }[] = [
    { id: 'overview', label: '总览' },
    { id: 'behavior', label: '习惯' },
    { id: 'sexual', label: '性爱' },
    { id: 'review', label: '复盘' },
    { id: 'normal', label: '常态' },
    { id: 'stage_review', label: '回顾' }
];

interface StatsViewProps {
    isDarkMode: boolean;
    logs: LogEntry[];
}

// --- Sub-Components ---

const chartColorWithAlpha = (color: string, alphaHex: string) => (
    color.startsWith('#') && color.length === 7 ? `${color}${alphaHex}` : color
);

const ChartCard = ({ title, icon: Icon, children, subtext, className }: ChartCardProps) => (
    <div className={`bg-surface-card p-5 rounded-3xl shadow-soft border border-surface-border flex flex-col min-h-[350px] ${className || ''}`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-text-primary flex items-center text-sm">
                {Icon && <Icon size={16} className="mr-2 text-accent"/>}
                {title}
            </h3>
        </div>
        <div className="flex-1 relative flex flex-col items-center justify-center w-full">{children}</div>
        {subtext && <p className="text-xs text-text-muted mt-3 text-center">{subtext}</p>}
    </div>
);

const KPICard = ({ label, value, unit, icon: Icon, colorClass = "text-text-primary" }: KPICardProps) => (
    <div className="bg-surface-card p-5 rounded-3xl shadow-soft border border-surface-border flex flex-col justify-between transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-surface-muted rounded-2xl">
                <Icon size={20} className="text-accent" />
            </div>
        </div>
        <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-black mt-1 ${colorClass}`}>{value}<span className="text-sm font-bold text-text-muted ml-1">{unit}</span></p>
        </div>
    </div>
);

const P3ListCard = ({ title, badge, items, emptyText }: P3ListCardProps) => (
    <div className="bg-surface-card p-5 rounded-3xl shadow-soft border border-surface-border space-y-4">
        <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-text-primary text-sm">{title}</h3>
            <span className="px-2 py-1 rounded-full bg-surface-muted text-[10px] font-black text-text-muted uppercase tracking-wider">{badge}</span>
        </div>
        {items.length > 0 ? (
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={`${title}-${item.title}-${item.meta || item.detail}`} className="rounded-2xl border border-surface-border bg-surface-muted px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-text-primary">{item.title}</p>
                            {item.meta && <span className="text-[10px] font-bold text-text-muted">{item.meta}</span>}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.detail}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="rounded-2xl border border-dashed border-surface-border px-4 py-6 text-center text-xs font-medium text-text-muted">
                {emptyText}
            </div>
        )}
    </div>
);

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
    const bgMap = {
        positive: 'bg-state-success-bg border-state-success-text/20',
        negative: 'bg-state-danger-bg border-state-danger-text/20',
        warning: 'bg-state-warning-bg border-state-warning-text/20',
        neutral: 'bg-state-info-bg border-state-info-text/20'
    };
    const iconMap = {
        positive: <CheckCircle size={18} className="text-state-success-text"/>,
        negative: <ArrowDown size={18} className="text-state-danger-text"/>,
        warning: <AlertTriangle size={18} className="text-state-warning-text"/>,
        neutral: <Info size={18} className="text-state-info-text"/>
    };
    return (
        <div className={`p-4 rounded-2xl border ${bgMap[insight.type]} animate-in slide-in-from-bottom-2`}>
            <div className="flex items-center gap-2 mb-2">
                {iconMap[insight.type]}
                <h4 className="font-bold text-sm text-text-primary">{insight.title}</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{insight.description}</p>
        </div>
    );
};

const StatsView: React.FC<StatsViewProps> = ({ logs: rawLogs }) => {
    const logs = useMemo(() => Array.isArray(rawLogs) ? rawLogs : [], [rawLogs]);
    const [activeTab, setActiveTab] = useState<StatsTab>('overview');
    const [trendComparison, setTrendComparison] = useState<MetricId>('sleep');
    const theme = useChartColors();

    const comparisonOptions = useMemo<readonly MetricId[]>(() => (
        ['sleep', 'exercise', 'alcohol', 'stress', 'screenTime']
    ), []);

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
                    <h2 className="text-2xl font-bold text-text-primary">数据洞察</h2>
                </div>

                {displayLogs.length < 3 ? (
                    <div className="rounded-3xl border border-dashed border-surface-border bg-surface-card/50 p-8 text-center space-y-3">
                        <div className="text-base font-black text-text-primary">数据不足以生成图表</div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            至少需要 3 条已完成的日记才能跑出趋势、相关性与维度雷达。<br/>
                            目前已完成 <span className="font-bold text-accent">{displayLogs.length}</span> 条。
                        </p>
                        <p className="text-xs text-text-muted">
                            继续记录,本页会自动解锁。
                        </p>
                    </div>
                ) : (
                <>
                <div className="flex p-1 bg-surface-muted rounded-2xl border border-surface-border overflow-x-auto scrollbar-hide">
                    {STATS_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-h-[44px] py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-surface-card text-accent shadow-sm' : 'text-text-muted'}`}>{tab.label}</button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard label="硬度评分" value={stats.kpis.avgHardness} icon={Zap} colorClass="text-accent"/>
                            <KPICard label="近期活跃" value={stats.kpis.totalActivity} unit="次" icon={Activity} colorClass="text-accent-vivid"/>
                            <KPICard label="平均睡眠" value={stats.kpis.avgSleep} unit="h" icon={TrendingUp} colorClass="text-chart-primary"/>
                            <KPICard label="健康分" value={stats.kpis.avgHealthScore} unit="分" icon={CheckCircle} colorClass="text-chart-secondary"/>
                        </div>
                        <ChartCard title="趋势对比分析" icon={TrendingUp} subtext="均线：硬度等级 | 柱状：对比指标">
                            <div className="flex flex-wrap gap-1.5 mb-3" role="tablist" aria-label="对比指标">
                                {comparisonOptions.map(metricId => {
                                    const isActive = trendComparison === metricId;
                                    return (
                                        <button
                                            key={metricId}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            onClick={() => setTrendComparison(metricId)}
                                            className={`min-h-[44px] px-3 text-xs font-bold rounded-xl transition-colors ${
                                                isActive
                                                    ? 'bg-accent text-text-on-accent shadow-sm'
                                                    : 'bg-surface-muted text-text-secondary hover:bg-surface-border'
                                            }`}
                                        >
                                            {METRICS[metricId].label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="w-full h-[250px]">
                                <Line 
                                    data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            { label: '硬度均线', data: stats.trends.hardnessSMA as any, borderColor: theme.tertiary, borderWidth: 3, pointRadius: 0, tension: 0.4, fill: false, yAxisID: 'y' },
                                            { type: 'bar' as const, label: comparisonConfig.label, data: stats.trends.comparisonData as any, backgroundColor: chartColorWithAlpha(theme.primary, '66'), borderRadius: 4, yAxisID: 'y1' }
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
                                                borderColor: theme.secondary,
                                                backgroundColor: chartColorWithAlpha(theme.secondary, '1f'),
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
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center px-1"><BrainCircuit size={16} className="mr-2"/> 智能分析</h3>
                            {(() => {
                                const groups: Array<{ key: InsightCategory; label: string }> = [
                                    { key: 'correlation', label: '相关性' },
                                    { key: 'anomaly', label: '异常事件' },
                                    { key: 'pattern', label: '行为模式' },
                                    { key: 'preference', label: '偏好趋势' }
                                ];
                                const sectionsRendered = groups
                                    .map(g => ({ ...g, items: insights.filter(i => i.category === g.key).slice(0, 3) }))
                                    .filter(g => g.items.length > 0);
                                if (sectionsRendered.length === 0) {
                                    return (
                                        <div className="rounded-2xl border border-dashed border-surface-border px-4 py-6 text-center text-xs font-medium text-text-muted">
                                            样本不足或无显著发现，继续记录以解锁洞察。
                                        </div>
                                    );
                                }
                                return sectionsRendered.map(group => (
                                    <div key={group.key} className="space-y-2">
                                        <div className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{group.label}</div>
                                        {group.items.map(insight => <InsightCard key={insight.id} insight={insight} />)}
                                    </div>
                                ));
                            })()}
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
                                            { label: '睡眠(h)', data: stats.trends.sleepSeries as any, backgroundColor: chartColorWithAlpha(theme.primary, '8c'), borderRadius: 4 },
                                            { label: '运动(min)', data: stats.trends.exerciseSeries as any, backgroundColor: chartColorWithAlpha(theme.secondary, '8c'), borderRadius: 4 },
                                            { label: '屏幕(h)', data: stats.trends.screenTimeSeries as any, backgroundColor: chartColorWithAlpha(theme.quaternary, '8c'), borderRadius: 4 }
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
                                                borderColor: theme.secondary,
                                                backgroundColor: chartColorWithAlpha(theme.secondary, '1f'),
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
                            <KPICard label="性爱均分" value={sexualStats.averageSexScore} unit="分" icon={Sparkles} colorClass="text-accent-vivid" />
                            <KPICard label="自慰均分" value={sexualStats.averageMasturbationScore} unit="分" icon={Zap} colorClass="text-chart-tertiary" />
                            <KPICard label="当前疲劳状态" value={sexualStats.currentFatigueState} icon={BrainCircuit} colorClass="text-state-warning-text" />
                            <KPICard label="可用样本数" value={sexualStats.usableSamples} unit="条" icon={CheckCircle} colorClass="text-chart-secondary" />
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
                                            backgroundColor: chartColorWithAlpha(theme.quaternary, '33'), borderColor: theme.quaternary, pointBackgroundColor: theme.quaternary,
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
                        <ChartCard title="维度详情" icon={Radar} subtext="记录数 / 标签出现次数 / 独立标签数">
                            {(() => {
                                const dims: string[] = ['角色', '身体', '装扮', '玩法', '剧情', '风格'];
                                const rows = dims
                                    .map(d => ({ name: d, stat: xpStats.dimensionStats[d] as DimensionStat | undefined }))
                                    .filter((r): r is { name: string; stat: DimensionStat } => !!r.stat);
                                const maxRecord = Math.max(1, ...rows.map(r => r.stat.recordCount));
                                if (rows.every(r => r.stat.recordCount === 0)) {
                                    return (
                                        <div className="rounded-2xl border border-dashed border-surface-border px-4 py-6 text-center text-xs font-medium text-text-muted w-full">
                                            尚未录入带维度标签的记录
                                        </div>
                                    );
                                }
                                return (
                                    <div className="w-full space-y-3">
                                        {rows.map(r => {
                                            const pct = (r.stat.recordCount / maxRecord) * 100;
                                            return (
                                                <div key={r.name} className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-text-secondary">{r.name}</span>
                                                        <span className="font-mono tabular-nums text-text-muted">
                                                            {r.stat.recordCount} 记录 · {r.stat.tagCount} 标签 · {r.stat.uniqueTags} 独立
                                                        </span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                                                        <div className="h-full bg-gradient-to-r from-accent-vivid to-chart-tertiary" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </ChartCard>
                        <ChartCard title="高频偏好 Top 10" icon={Tag} subtext="按记录去重统计">
                            <div className="w-full h-[300px]">
                                <Bar 
                                    data={{
                                        labels: xpStats.topTags.slice(0, 10).map(t => t.tag),
                                        datasets: [{ label: '频次', data: xpStats.topTags.slice(0, 10).map(t => t.count), backgroundColor: chartColorWithAlpha(theme.tertiary, '99'), borderRadius: 4, barThickness: 16 }]
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
                {activeTab === 'review' && (
                    <ReviewSection logs={displayLogs} />
                )}
                {activeTab === 'normal' && (
                    <div className="space-y-4">
                        <DataQualityOverviewSection logs={displayLogs} />
                        <PersonalNormalSection logs={displayLogs} />
                    </div>
                )}
                {activeTab === 'stage_review' && (
                    <StageReviewSection logs={displayLogs} />
                )}
                </>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default React.memo(StatsView);
