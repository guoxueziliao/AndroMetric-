
import React, { useEffect, useMemo, useRef } from 'react';
import { LogEntry, MorningWoodRetention } from '../types';
import { analyzeSleep } from '../utils/helpers';
import { Chart, LineController, LineElement, PointElement, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip, Filler, ChartOptions, Plugin } from 'chart.js';
import { BarChart3 } from 'lucide-react';

Chart.register(LineController, LineElement, PointElement, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip, Filler);

interface HardnessChartProps {
    logs: LogEntry[];
    privacyMode: boolean;
    isDarkMode: boolean;
}

const retentionColors: Record<MorningWoodRetention, string> = {
    instant: '#ef4444', brief: '#f97316', normal: '#22c55e', extended: '#3b82f6'
};

const HardnessChart: React.FC<HardnessChartProps> = ({ logs, privacyMode, isDarkMode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    const sortedLogs = useMemo(() => {
        const validLogs = Array.isArray(logs) ? logs : [];
        const chartableLogs = validLogs.filter(log => log.status === 'completed' && !isNaN(new Date(log.date).getTime()));
        return chartableLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [logs]);
    
    const labels = useMemo(() => sortedLogs.map(log => {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }), [sortedLogs]);
    
    const hardnessData = useMemo(() => sortedLogs.map(log => {
        const m = log.morning;
        if (!m || !m.wokeWithErection) return 0;
        return m.hardness || 0;
    }), [sortedLogs]);

    const sleepData = useMemo(() => sortedLogs.map(log => {
        const s = log.sleep;
        if (!s || !s.startTime || !s.endTime) return 0;
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        if (end <= start) return 0;
        return Number(((end - start) / (1000 * 60 * 60)).toFixed(1));
    }), [sortedLogs]);
    
    const sleepBackgroundColors = useMemo(() => sortedLogs.map(log => {
        const analysis = analyzeSleep(log.sleep?.startTime, log.sleep?.endTime);
        if (!analysis) return isDarkMode ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.6)';
        if (analysis.isLate && analysis.isInsufficient) return 'rgba(239, 68, 68, 0.6)';
        if (analysis.isInsufficient) return 'rgba(249, 115, 22, 0.6)';
        if (analysis.isLate) return 'rgba(251, 191, 36, 0.6)';
        return isDarkMode ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.6)';
    }), [sortedLogs, isDarkMode]);

    const pointColors = useMemo(() => sortedLogs.map(log => {
        const m = log.morning;
        if (!m || !m.wokeWithErection) return isDarkMode ? '#475569' : '#cbd5e1';
        if (m.retention && retentionColors[m.retention]) return retentionColors[m.retention];
        return '#3b82f6';
    }), [sortedLogs, isDarkMode]);

    useEffect(() => {
        if (!canvasRef.current || sortedLogs.length < 2) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        if (chartRef.current) chartRef.current.destroy();

        const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
        const textColor = isDarkMode ? '#94a3b8' : '#64748b';
        const titleColor = isDarkMode ? '#e2e8f0' : '#3b82f6';
        const tooltipBg = isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
        const tooltipText = isDarkMode ? '#f1f5f9' : '#1e293b';
        const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';

        const options: ChartOptions = {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { bottom: 25 } },
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: 5.5, title: { display: true, text: '硬度等级 (1-5)', color: titleColor, font: { size: 10 } }, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
                y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: 12, grid: { drawOnChartArea: false }, title: { display: true, text: '睡眠时长 (小时)', color: textColor, font: { size: 10 } }, ticks: { color: textColor } },
                x: { ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } }
            },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, color: textColor } },
                tooltip: {
                    backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: tooltipBorder, borderWidth: 1, padding: 10, titleFont: { weight: 'bold' },
                    callbacks: {
                        title: (items) => sortedLogs[items[0].dataIndex].date,
                        label: (context) => {
                            let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) label += context.parsed.y;
                            if (context.dataset.yAxisID === 'y1') {
                                const analysis = analyzeSleep(sortedLogs[context.dataIndex].sleep?.startTime, sortedLogs[context.dataIndex].sleep?.endTime);
                                const tags = []; if (analysis?.isLate) tags.push('熬夜'); if (analysis?.isInsufficient) tags.push('不足'); if (tags.length > 0) label += ` (${tags.join(', ')})`;
                            }
                            if (context.dataset.yAxisID === 'y') {
                                const m = sortedLogs[context.dataIndex].morning;
                                if (m && m.wokeWithErection && m.retention) {
                                    const retentionMap: Record<string, string> = { instant: '瞬间消失', brief: '快速消退', normal: '正常', extended: '持久' };
                                    label += ` (${retentionMap[m.retention] || '-'})`;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        };

        const eventMarkersPlugin: Plugin = {
            id: 'eventMarkers',
            afterDatasetsDraw(chart) {
                if (privacyMode) return;
                const { ctx, scales: { x } } = chart;
                ctx.save(); ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                chart.data.labels?.forEach((_, index) => {
                    const log = sortedLogs[index]; if (!log) return;
                    const xPos = x.getPixelForValue(index); const yBase = chart.chartArea.bottom + 4;
                    let icons = [];
                    if (log.sex && log.sex.length > 0) icons.push('❤️'); else if (log.masturbation && log.masturbation.length > 0) icons.push('🖐️');
                    if (log.pornConsumption && log.pornConsumption !== 'none') icons.push('🎬'); if (log.alcohol && log.alcohol !== 'none') icons.push('🍺');
                    icons.slice(0, 2).forEach((icon, i) => { ctx.fillText(icon, xPos, yBase + (i * 12)); });
                });
                ctx.restore();
            }
        };

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { type: 'bar', label: '睡眠时长', data: sleepData, backgroundColor: sleepBackgroundColors, hoverBackgroundColor: isDarkMode ? 'rgba(226, 232, 240, 0.8)' : 'rgba(71, 85, 105, 0.8)', barPercentage: 0.6, yAxisID: 'y1', order: 2 },
                    { type: 'line', label: '晨勃硬度', data: hardnessData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3, borderWidth: 2, pointBackgroundColor: pointColors, pointBorderColor: isDarkMode ? '#1e293b' : '#ffffff', pointBorderWidth: 1, pointRadius: 5, pointHoverRadius: 7, yAxisID: 'y', fill: false, order: 1 }
                ]
            },
            options: options as any,
            plugins: [eventMarkersPlugin]
        });

        return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
    }, [labels, hardnessData, sleepData, pointColors, sleepBackgroundColors, sortedLogs, privacyMode, isDarkMode]);

    if (sortedLogs.length < 2) return <div className="flex flex-col items-center justify-center h-[300px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-3"><BarChart3 className="text-brand-muted opacity-50" size={32} /></div><p className="text-sm font-bold text-brand-text dark:text-slate-300">趋势图生成中...</p><p className="text-xs text-brand-muted mt-1">请至少完成 2 天的晨勃与睡眠记录</p></div>;

    return (
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
            <canvas ref={canvasRef}></canvas>
            <div className="absolute top-2 right-2 flex space-x-2 text-[10px] bg-white/80 dark:bg-slate-800/80 p-1 rounded border border-slate-100 dark:border-slate-700 pointer-events-none">
                <div className="flex items-center text-brand-text dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>秒软</div>
                <div className="flex items-center text-brand-text dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span>较快</div>
                <div className="flex items-center text-brand-text dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>正常</div>
                <div className="flex items-center text-brand-text dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>持久</div>
            </div>
        </div>
    );
};

export default HardnessChart;
