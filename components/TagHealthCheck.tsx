
import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { validateTag, ValidationLevel } from '../utils/tagValidators';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface TagHealthCheckProps {
    logs: LogEntry[];
    onNavigateToTag: (tag: string) => void;
}

interface Issue {
    tag: string;
    count: number;
    level: ValidationLevel;
    message: string;
    suggestion?: string;
}

const TagHealthCheck: React.FC<TagHealthCheckProps> = ({ logs, onNavigateToTag }) => {
    const analysis = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                m.assets?.categories?.forEach(c => counts[c] = (counts[c] || 0) + 1);
            });
        });

        const issues: Issue[] = [];
        let totalTags = 0;
        let healthyTags = 0;

        Object.entries(counts).forEach(([tag, count]) => {
            totalTags++;
            const res = validateTag(tag);
            if (res.level !== 'OK') {
                issues.push({ tag, count, level: res.level, message: res.message || '', suggestion: res.suggestion });
            } else {
                healthyTags++;
            }
        });

        // Sort by severity (P0 > P1 > P2) then by usage count
        const levelWeight = { 'P0': 3, 'P1': 2, 'P2': 1, 'OK': 0 };
        issues.sort((a, b) => {
            const levelDiff = levelWeight[b.level] - levelWeight[a.level];
            if (levelDiff !== 0) return levelDiff;
            return b.count - a.count;
        });

        return { totalTags, healthyTags, issues };
    }, [logs]);

    const healthScore = analysis.totalTags > 0 ? Math.round((analysis.healthyTags / analysis.totalTags) * 100) : 100;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Score Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">标签系统健康度</h3>
                    <div className={`text-3xl font-black ${healthScore >= 90 ? 'text-green-500' : healthScore >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                        {healthScore}
                    </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                    <div>共检测 {analysis.totalTags} 个标签</div>
                    <div>{analysis.issues.length} 个潜在问题</div>
                </div>
            </div>

            {/* Issues List */}
            {analysis.issues.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center text-green-500">
                    <ShieldCheck size={48} className="mb-4 opacity-50"/>
                    <span className="font-bold">标签系统非常纯净</span>
                    <p className="text-xs text-green-600/70 mt-2">未发现语义冲突或违规格式</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase ml-1">诊断报告 ({analysis.issues.length})</h4>
                    {analysis.issues.map((issue) => (
                        <div 
                            key={issue.tag} 
                            onClick={() => onNavigateToTag(issue.tag)}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between group hover:border-brand-accent/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                    issue.level === 'P0' ? 'bg-red-100 text-red-600' : 
                                    issue.level === 'P1' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {issue.level === 'P0' ? <AlertCircle size={16}/> : 
                                     issue.level === 'P1' ? <AlertTriangle size={16}/> : <Info size={16}/>}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-brand-text dark:text-slate-200 truncate text-sm">{issue.tag}</span>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{issue.count}次</span>
                                    </div>
                                    <div className="text-xs text-slate-400 truncate mt-0.5">
                                        {issue.message}
                                        {issue.suggestion && <span className="ml-1 font-bold text-brand-accent">建议: {issue.suggestion}</span>}
                                    </div>
                                </div>
                            </div>
                            <button className="text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-bold">
                                <span>管理</span>
                                <ArrowRight size={14} className="ml-1"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
                <p className="font-bold mb-1">💡 关于标签治理</p>
                <p>系统不会自动修改您的数据。体检仅提供优化建议，请点击条目进入「标签管理」进行手动重命名或合并。</p>
            </div>
        </div>
    );
};

export default TagHealthCheck;
