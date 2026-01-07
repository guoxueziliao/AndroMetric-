
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { StatsEngine, MetricId, METRICS } from '../utils/StatsEngine';
import { calculateXpStats } from '../utils/xpStats';
import { generateInsights, Insight } from '../utils/insights';
import { Flame, Activity, HeartPulse, Zap, TrendingUp, Dumbbell, Beer, Moon, FlaskConical, Layers, Eye, EyeOff, BrainCircuit, Clock, Radar, CheckCircle, ArrowDown, AlertTriangle, Info, BarChart3, LayoutGrid, Sparkles, PieChart, Tag } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, Tooltip, Legend, Filler, ScatterController, LineController, BubbleController, ArcElement, PieController, DoughnutController, RadialLinearScale, RadarController, PolarAreaController } from 'chart.js';
import { Line, Bar, Doughnut, Radar as RadarChart } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, ScatterController, LineController, BubbleController, ArcElement, PieController, DoughnutController, RadialLinearScale, RadarController, PolarAreaController, Tooltip, Legend, Filler);

// --- Helpers & SubComponents ---
const ChartCard: React.FC<{ title: string, icon?: React.ElementType, children: React.ReactNode, subtext?: string, action?: React.ReactNode, className?: string }> = ({ title, icon: Icon, children, subtext, action, className }) => (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[350px] ${className || ''}`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-brand-text dark:text-slate-200 flex items-center text-sm">{Icon && <Icon size={16} className="mr-2 text-brand-accent"/>}{title}</h3>
            {action}
        </div>
        <div className="flex-1 relative flex flex-col items-center justify-center w-full">{children}</div>
        {subtext && <p className="text-xs text-slate-400 mt-3 text-center">{subtext}</p>}
    </div>
);

const KPICard: React.FC<{ label: string; value: string | number; unit?: string; icon: React.ElementType; colorClass?: string; }> = ({ label, value, unit, icon: Icon, colorClass = "text-brand-text" }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-brand-primary dark:bg-slate-800 rounded-2xl"><Icon size={20} className="text-brand-accent" /></div>
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

// --- Main Component ---

interface StatsViewProps {
    isDarkMode: boolean;
}

const StatsView: React.FC<StatsViewProps> = ({ isDarkMode }) => {
    const { logs } = useData();
    const [activeTab, setActiveTab] = useState<'overview' | 'sexual' | 'behavior'>('overview');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [timeRange, setTimeRange] = useState<number | 'all'>(30); 
    const [trendComparison, setTrendComparison] = useState<MetricId>('sleep');

    const displayLogs = useMemo(() => {
        const sorted = [...logs]
            .filter(l => l.status === 'completed' && !isNaN(new Date(l.date).getTime()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (timeRange === 'all') return sorted;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeRange);
        return sorted.filter(l => new Date(l.date) >= cutoff);
    }, [logs, timeRange]);

    const statsEngine = useMemo(() => new StatsEngine(displayLogs), [displayLogs]);
    const insights = useMemo(() => generateInsights(displayLogs), [displayLogs]);
    
    // New XP Stats Calculation
    const xpStats = useMemo(() => calculateXpStats(displayLogs), [displayLogs]);

    // Enhanced Theme for Dark Mode
    const theme = useMemo(() => ({
        grid: isDarkMode ? '#1e293b' : '#f1f5f9', 
        text: isDarkMode ? '#94a3b8' : '#64748b', 
        primary: isDarkMode ? '#60a5fa' : '#3b82f6', 
        secondary: isDarkMode ? '#f472b6' : '#ec4899', 
        tertiary: isDarkMode ? '#fbbf24' : '#f59e0b', 
        surface: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        tooltipBg: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        tooltipText: isDarkMode ? '#f8fafc' : '#0f172a',
    }), [isDarkMode]);

    const commonOptions = {
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
            legend: { 
                position: 'bottom' as const, 
                labels: { color: theme.text, boxWidth: 10, usePointStyle: true, padding: 15, font: { size: 11, family: 'sans-serif' } } 
            }, 
            title: { display: false },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                titleColor: theme.tooltipText,
                bodyColor: theme.tooltipText,
                borderColor: theme.grid,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' as const }
            }
        },
        scales: { 
            y: { 
                ticks: { color: theme.text, font: { size: 10 } }, 
                grid: { color: theme.grid },
                border: { display: false } 
            }, 
            x: { 
                ticks: { color: theme.text, font: { size: 10 } }, 
                grid: { display: false },
                border: { display: false }
            } 
        }
    };

    // --- Statistics Computation ---
    const stats = useMemo(() => {
        const hardnessSeries = statsEngine.getSeries('hardness');
        const labels = hardnessSeries.map(d => `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`);
        const hardnessRaw = hardnessSeries.map(d => d.value);
        const hardnessSMA = statsEngine.getSMA('hardness', 7);
        const comparisonData = statsEngine.getSeries(trendComparison).map(d => d.value);
        
        const avgH = hardnessRaw.reduce((a,b)=>a+b,0) / (hardnessRaw.length || 1);

        // Hardness Distribution
        const hardnessDist = [0,0,0,0,0];
        displayLogs.forEach(l => {
            if(l.morning?.wokeWithErection && l.morning.hardness) {
                hardnessDist[l.morning.hardness - 1]++;
            }
        });

        return {
            trends: { labels, hardnessRaw, hardnessSMA, comparisonData },
            kpis: { avgHardness: avgH.toFixed(1), totalActivity: displayLogs.reduce((a,b) => a + (b.sex?.length||0) + (b.masturbation?.length||0), 0) },
            hardnessDist
        };
    }, [displayLogs, trendComparison, statsEngine]);

    const comparisonConfig = useMemo(() => {
        const conf = METRICS[trendComparison];
        const color = trendComparison === 'sleep' ? theme.primary : trendComparison === 'alcohol' ? theme.tertiary : theme.secondary;
        return { 
            label: `${conf.label} (${conf.unit})`, 
            color: isDarkMode ? `${color}80` : `${color}90`, // Add transparency
            yMax: trendComparison === 'sleep' ? 12 : trendComparison === 'alcohol' ? 100 : 6 
        };
    }, [trendComparison, theme, isDarkMode]);

    const activeHoursData = useMemo(() => {
        const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        displayLogs.forEach(l => {
            [...(l.sex || []), ...(l.masturbation || [])].forEach(act => {
                const h = parseInt(act.startTime?.split(':')[0] || '0');
                if (h >= 5 && h < 12) buckets.morning++;
                else if (h >= 12 && h < 18) buckets.afternoon++;
                else if (h >= 18 && h < 22) buckets.evening++;
                else buckets.night++;
            });
        });
        return [buckets.morning, buckets.afternoon, buckets.evening, buckets.night];
    }, [displayLogs]);

    const { positionData, actsData } = useMemo(() => {
        const posCounts: Record<string, number> = {};
        const actCounts: Record<string, number> = {};
        
        displayLogs.forEach(l => l.sex?.forEach(s => {
            // Count positions
            (s.positions || []).forEach(p => posCounts[p] = (posCounts[p] || 0) + 1);
            // Count acts from interactions
            s.interactions?.forEach(i => i.chain.forEach(a => {
                if(a.type === 'act') actCounts[a.name] = (actCounts[a.name] || 0) + 1;
                else if(a.type === 'position') posCounts[a.name] = (posCounts[a.name] || 0) + 1;
            }));
        }));

        const sortedPos = Object.entries(posCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const sortedActs = Object.entries(actCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

        return { 
            positionData: { labels: sortedPos.map(s => s[0]), data: sortedPos.map(s => s[1]) },
            actsData: { labels: sortedActs.map(s => s[0]), data: sortedActs.map(s => s[1]) }
        };
    }, [displayLogs]);

    if (displayLogs.length < 3) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center text-brand-muted animate-in fade-in">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={32} className="opacity-50" />
            </div>
            <p className="font-bold text-lg dark:text-slate-300">数据积累中</p>
            <p className="text-sm mt-2 max-w-xs">请至少完成 3 天的记录以生成可视化图表。</p>
        </div>
    );

    const ComparisonSelector = () => (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {[
                { id: 'sleep', label: '睡眠', icon: Moon },
                { id: 'alcohol', label: '饮酒', icon: Beer },
                { id: 'exercise', label: '运动', icon: Dumbbell },
                { id: 'stress', label: '压力', icon: BrainCircuit }
            ].map((m) => (
                <button
                    key={m.id}
                    onClick={() => setTrendComparison(m.id as MetricId)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        trendComparison === m.id 
                        ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-brand-accent/50'
                    }`}
                >
                    <m.icon size={12} className="mr-1.5" />
                    {m.label}
                </button>
            ))}
        </div>
    );

    return (
        <ErrorBoundary>
            <div className="space-y-6 pb-24">
                <div className="flex flex-col gap-3 mb-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-text dark:text-slate-100">数据洞察</h2>
                        <button onClick={() => setPrivacyMode(!privacyMode)} className={`p-2 rounded-full transition-colors ${privacyMode ? 'bg-brand-accent text-white' : 'bg-white dark:bg-slate-800 text-brand-muted dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700'}`}>{privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                </div>

                <div className="flex p-1 bg-brand-primary dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                    {[{ id: 'overview', label: '总览' }, { id: 'behavior', label: '习惯' }, { id: 'sexual', label: '性爱' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-brand-accent shadow-sm' : 'text-brand-muted dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* Responsive Grid for KPIs */}
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard label="硬度评分" value={stats.kpis.avgHardness} icon={Zap} colorClass="text-brand-accent dark:text-blue-400"/>
                            <KPICard label="近期活跃" value={stats.kpis.totalActivity} unit="次" icon={Activity} colorClass="text-pink-500 dark:text-pink-400"/>
                        </div>
                        
                        {/* Hardness Distribution Chart */}
                        <ChartCard title="硬度分布 (1-5级)" icon={BarChart3} className="min-h-[250px]">
                            <div className="w-full h-[180px]">
                                <Bar 
                                    data={{
                                        labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
                                        datasets: [{
                                            label: '天数',
                                            data: stats.hardnessDist,
                                            backgroundColor: [
                                                'rgba(239, 68, 68, 0.7)', // Red
                                                'rgba(249, 115, 22, 0.7)', // Orange
                                                'rgba(59, 130, 246, 0.7)', // Blue
                                                'rgba(16, 185, 129, 0.7)', // Emerald
                                                'rgba(14, 165, 233, 0.7)', // Sky
                                            ],
                                            borderRadius: 6
                                        }]
                                    }}
                                    options={{
                                        ...commonOptions,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            ...commonOptions.scales,
                                            y: { display: false },
                                            x: { 
                                                ticks: { color: theme.text, font: { size: 10 } }, 
                                                grid: { display: false }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </ChartCard>

                        <ChartCard title="趋势对比分析" icon={TrendingUp} subtext="左轴: 硬度等级 (SMA-7) | 右轴: 对比指标">
                            <ComparisonSelector />
                            <div className="w-full h-[250px]">
                                <Line data={{
                                        labels: stats.trends.labels,
                                        datasets: [
                                            { 
                                                label: '硬度均线', 
                                                data: stats.trends.hardnessSMA, 
                                                borderColor: '#8b5cf6', // Violet
                                                borderWidth: 3, 
                                                pointRadius: 0,
                                                pointHoverRadius: 6,
                                                tension: 0.4, 
                                                fill: false, 
                                                yAxisID: 'y' 
                                            },
                                            { 
                                                type: 'bar' as const, 
                                                label: comparisonConfig.label, 
                                                data: stats.trends.comparisonData, 
                                                backgroundColor: comparisonConfig.color, 
                                                borderRadius: 4,
                                                yAxisID: 'y1' 
                                            }
                                        ]
                                    } as any}
                                    options={{ 
                                        ...commonOptions, 
                                        interaction: { mode: 'index', intersect: false },
                                        scales: { 
                                            ...commonOptions.scales,
                                            y: { ...commonOptions.scales.y, min: 0, max: 6, title: {display:false} }, 
                                            y1: { position: 'right', display: true, min: 0, max: comparisonConfig.yMax, grid: {display:false}, ticks: {color: theme.text, font: {size: 10}} } 
                                        } 
                                    } as any}
                                />
                            </div>
                        </ChartCard>
                        
                        {/* Smart Insights Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pl-1">
                                <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center"><BrainCircuit size={16} className="mr-2"/> 智能分析</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {insights.length > 0 ? (
                                    insights.slice(0, 3).map(insight => (
                                        <InsightCard key={insight.id} insight={insight} />
                                    ))
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center text-brand-muted">
                                        <div className="text-center">
                                            <Sparkles size={24} className="mx-auto mb-2 text-slate-300"/>
                                            <p className="text-xs">数据积累中，暂无显著关联性发现。</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'behavior' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* New XP Analysis Section */}
                        <ChartCard title="偏好雷达 (6维度)" icon={Radar} subtext="基于自慰记录的 XP 维度分布">
                            <div className="w-full h-[300px] flex items-center justify-center">
                                {Object.values(xpStats.dimensionStats).some(d => d.recordCount > 0) ? (
                                    <RadarChart 
                                        data={{
                                            labels: ['角色', '身体', '装扮', '玩法', '剧情', '风格'],
                                            datasets: [{
                                                label: '维度强度',
                                                data: [
                                                    xpStats.dimensionStats['角色'].recordCount,
                                                    xpStats.dimensionStats['身体'].recordCount,
                                                    xpStats.dimensionStats['装扮'].recordCount,
                                                    xpStats.dimensionStats['玩法'].recordCount,
                                                    xpStats.dimensionStats['剧情'].recordCount,
                                                    xpStats.dimensionStats['风格'].recordCount
                                                ],
                                                backgroundColor: 'rgba(236, 72, 153, 0.2)', // Pink
                                                borderColor: '#ec4899',
                                                pointBackgroundColor: '#ec4899',
                                                pointBorderColor: '#fff',
                                            }]
                                        }}
                                        options={{
                                            ...commonOptions,
                                            scales: {
                                                r: {
                                                    angleLines: { color: theme.grid },
                                                    grid: { color: theme.grid },
                                                    pointLabels: { color: theme.text, font: { size: 12, weight: 'bold' } },
                                                    ticks: { display: false, backdropColor: 'transparent' }
                                                }
                                            }
                                        } as any}
                                    />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <Layers size={32} className="mx-auto mb-2 opacity-50"/>
                                        <p className="text-xs">暂无维度数据，请在自慰记录中添加标签</p>
                                    </div>
                                )}
                            </div>
                        </ChartCard>

                        {/* Top Tags Bar Chart */}
                        <ChartCard title="高频偏好 Top 10" icon={Tag} subtext="统计口径：按记录去重 (Record-level)">
                            <div className="w-full h-[300px]">
                                {xpStats.topTags.length > 0 ? (
                                    <Bar 
                                        data={{
                                            labels: privacyMode ? xpStats.topTags.slice(0, 10).map((_, i) => `XP ${i+1}`) : xpStats.topTags.slice(0, 10).map(t => t.tag),
                                            datasets: [{
                                                label: '出现频次',
                                                data: xpStats.topTags.slice(0, 10).map(t => t.count),
                                                backgroundColor: 'rgba(139, 92, 246, 0.7)', // Violet
                                                borderRadius: 4,
                                                barThickness: 16
                                            }]
                                        }}
                                        options={{
                                            ...commonOptions,
                                            indexAxis: 'y' as const,
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Tag size={32} className="mb-2 opacity-50"/>
                                        <p className="text-xs">暂无标签数据</p>
                                    </div>
                                )}
                            </div>
                        </ChartCard>

                        {/* Diversity & Noise Note */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-brand-text dark:text-slate-300">丰富度: {xpStats.diversityScore}</span>
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Unique Tags</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Info size={12} className="text-slate-400"/>
                                <span>已自动过滤复合/低频噪声</span>
                            </div>
                        </div>

                        <ChartCard title="活跃时段分布" icon={Clock} subtext="早 (5-12) / 中 (12-18) / 晚 (18-22) / 夜 (22-5)">
                            <Bar 
                                data={{
                                    labels: ['早晨', '下午', '晚上', '深夜'],
                                    datasets: [{
                                        label: '活动次数',
                                        data: activeHoursData,
                                        backgroundColor: [
                                            'rgba(251, 191, 36, 0.7)', // Amber (Morning)
                                            'rgba(59, 130, 246, 0.7)', // Blue (Afternoon)
                                            'rgba(168, 85, 247, 0.7)', // Purple (Evening)
                                            'rgba(30, 41, 59, 0.7)'    // Slate (Night)
                                        ],
                                        borderRadius: 6
                                    }]
                                }}
                                options={commonOptions}
                            />
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'sexual' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <ChartCard title="常用体位 Top 5" icon={LayoutGrid} subtext="性爱记录中的姿势统计">
                            {positionData.data.length > 0 ? (
                                <div className="h-[250px] flex items-center justify-center">
                                    <Doughnut 
                                        data={{
                                            labels: privacyMode ? positionData.labels.map((_, i) => `Pos ${i+1}`) : positionData.labels,
                                            datasets: [{
                                                data: positionData.data,
                                                backgroundColor: [
                                                    'rgba(236, 72, 153, 0.8)', // Pink
                                                    'rgba(168, 85, 247, 0.8)', // Purple
                                                    'rgba(59, 130, 246, 0.8)', // Blue
                                                    'rgba(16, 185, 129, 0.8)', // Emerald
                                                    'rgba(245, 158, 11, 0.8)', // Amber
                                                ],
                                                borderWidth: 0
                                            }]
                                        }}
                                        options={{
                                            ...commonOptions,
                                            cutout: '70%',
                                            plugins: {
                                                ...commonOptions.plugins,
                                                legend: { position: 'right', labels: { usePointStyle: true, color: theme.text } }
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Info size={32} className="mb-2 opacity-50"/>
                                    <p className="text-xs">暂无体位数据</p>
                                </div>
                            )}
                        </ChartCard>

                        {/* Top Acts Chart */}
                        <ChartCard title="高频行为 Top 5" icon={Activity} subtext="性爱互动中的行为偏好">
                            {actsData.data.length > 0 ? (
                                <div className="w-full h-[200px]">
                                    <Bar 
                                        data={{
                                            labels: privacyMode ? actsData.labels.map((_, i) => `Act ${i+1}`) : actsData.labels,
                                            datasets: [{
                                                label: '次数',
                                                data: actsData.data,
                                                backgroundColor: 'rgba(139, 92, 246, 0.6)', // Violet
                                                borderRadius: 4,
                                                barThickness: 20
                                            }]
                                        }}
                                        options={{
                                            ...commonOptions,
                                            indexAxis: 'y' as const,
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Info size={32} className="mb-2 opacity-50"/>
                                    <p className="text-xs">暂无行为数据</p>
                                </div>
                            )}
                        </ChartCard>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default React.memo(StatsView);
