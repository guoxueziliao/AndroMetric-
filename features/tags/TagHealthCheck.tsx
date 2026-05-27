import React, { useMemo } from 'react';
import type { LogEntry, TagType } from '../../domain';
import { Info, ShieldCheck, ArrowRight, Activity, Tag, ShieldAlert } from 'lucide-react';
import { validateTag, SYNONYMS } from '../../shared/lib';

interface TagHealthCheckProps {
    logs: LogEntry[];
    onNavigateToTag: (tag: string, type: TagType) => void;
}

type Severity = 'High' | 'Medium' | 'Low';

interface Issue {
    id: string;
    tag: string;
    type: TagType;
    count: number;
    severity: Severity;
    issueType: string;
    message: string;
    suggestion?: string;
}

const TagHealthCheck: React.FC<TagHealthCheckProps> = ({ logs, onNavigateToTag }) => {
    
    // --- 1. Data Aggregation & Analysis ---
    const analysis = useMemo(() => {
        const tagMap: Record<string, { count: number, type: TagType, lastUsed: number }> = {};
        
        // Helper to track tags
        const track = (tag: string, type: TagType, date: string) => {
            if (!tag) return;
            const ts = new Date(date).getTime();
            if (!tagMap[tag]) {
                tagMap[tag] = { count: 0, type, lastUsed: ts };
            }
            tagMap[tag].count++;
            if (ts > tagMap[tag].lastUsed) tagMap[tag].lastUsed = ts;
        };

        // Scan all logs
        logs.forEach(log => {
            // XP
            log.masturbation?.forEach(m => m.assets?.categories?.forEach(c => track(c, 'xp', log.date)));
            // Event
            log.dailyEvents?.forEach(e => track(e, 'event', log.date));
            // Symptom
            log.health?.symptoms?.forEach(s => track(s, 'symptom', log.date));
        });

        const issues: Issue[] = [];
        const stats = { total: 0, xp: 0, event: 0, symptom: 0, health_check: 0, highRisk: 0, medRisk: 0, lowRisk: 0 };
        const now = Date.now();
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;

        Object.entries(tagMap).forEach(([tag, info]) => {
            stats.total++;
            stats[info.type]++;

            // --- A. Run Base Validator (P0/P1 -> High Risk) ---
            const res = validateTag(tag, info.type);
            
            // H1, H2, H3: High Risk (P0/P1 from validators)
            if (res.level === 'P0' || res.level === 'P1') {
                let issueType = '风险标签';
                if (res.message?.includes('复合')) issueType = '复合语义';
                else if (res.message?.includes('维度')) issueType = '维度冲突';
                else if (res.message?.includes('状态')) issueType = '类型错放';
                else if (res.message?.includes('非法')) issueType = '非法格式';

                issues.push({
                    id: `${tag}-high`,
                    tag, type: info.type, count: info.count,
                    severity: 'High',
                    issueType,
                    message: res.message || '存在高风险问题',
                    suggestion: res.suggestion
                });
                stats.highRisk++;
                return; // Stop processing lower risks if high risk found
            }

            // --- B. Medium Risk Rules ---
            
            // M1: Synonyms (Non-standard)
            // Check against exported SYNONYMS keys
            const lowerTag = tag.toLowerCase();
            if (Object.keys(SYNONYMS).some(k => lowerTag.includes(k) || lowerTag === k)) {
                // Find strict match or inclusion
                const standard = SYNONYMS[lowerTag] || Object.entries(SYNONYMS).find(([k]) => lowerTag.includes(k))?.[1];
                if (standard && lowerTag !== standard) {
                    issues.push({
                        id: `${tag}-synonym`,
                        tag, type: info.type, count: info.count,
                        severity: 'Medium',
                        issueType: '非标准词',
                        message: `存在更标准的标签 "${standard}"`,
                        suggestion: `建议合并至: ${standard}`
                    });
                    stats.medRisk++;
                    return;
                }
            }

            // M2: Low Frequency (Count <= 1)
            // Only flag if created > 30 days ago? (Approximated by lastUsed if count is 1, lastUsed == firstUsed)
            // Simple logic: if count <= 1 and lastUsed is old, it's definitely abandoned.
            // If count <= 1 and lastUsed is recent, might be new.
            // Let's stick to "Count <= 1" as primary trigger, maybe filter out very fresh ones.
            if (info.count <= 1 && (now - info.lastUsed) > (7 * 24 * 60 * 60 * 1000)) {
                issues.push({
                    id: `${tag}-lowfreq`,
                    tag, type: info.type, count: info.count,
                    severity: 'Medium',
                    issueType: '极低频',
                    message: '仅使用过 1 次，且非近期创建',
                    suggestion: '建议确认是否为一次性标签'
                });
                stats.medRisk++;
                return;
            }

            // --- C. Low Risk Rules ---

            // L1: Naming (Spaces)
            if (/\s/.test(tag.trim())) {
                issues.push({
                    id: `${tag}-naming`,
                    tag, type: info.type, count: info.count,
                    severity: 'Low',
                    issueType: '命名规范',
                    message: '包含空格，建议使用紧凑格式',
                    suggestion: '移除空格'
                });
                stats.lowRisk++;
            }

            // L2: Long Term Unused
            if ((now - info.lastUsed) > ninetyDays) {
                issues.push({
                    id: `${tag}-unused`,
                    tag, type: info.type, count: info.count,
                    severity: 'Low',
                    issueType: '长期闲置',
                    message: '超过 90 天未被使用',
                    suggestion: '考虑归档或删除'
                });
                stats.lowRisk++;
            }
        });

        // Sort issues: High -> Medium -> Low, then by count (desc)
        const severityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
        issues.sort((a, b) => {
            const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
            if (scoreDiff !== 0) return scoreDiff;
            return b.count - a.count;
        });

        return { stats, issues };
    }, [logs]);

    const lastCheckTime = new Date().toLocaleDateString();

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            {/* 1. Overview Section */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-muted p-4 rounded-2xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-text-muted uppercase">标签总数</div>
                    <div className="text-3xl font-black text-text-primary">{analysis.stats.total}</div>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-surface-card/50 px-1.5 py-0.5 rounded flex items-center text-chart-tertiary font-bold"><Tag size={10} className="mr-1"/>{analysis.stats.xp}</span>
                        <span className="text-[10px] bg-surface-card/50 px-1.5 py-0.5 rounded flex items-center text-state-info-text font-bold"><Activity size={10} className="mr-1"/>{analysis.stats.event}</span>
                        <span className="text-[10px] bg-surface-card/50 px-1.5 py-0.5 rounded flex items-center text-state-danger-text font-bold"><ShieldAlert size={10} className="mr-1"/>{analysis.stats.symptom}</span>
                    </div>
                </div>
                <div className="bg-surface-card border border-surface-border p-4 rounded-2xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-text-muted uppercase">体检报告</div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black ${analysis.issues.length > 0 ? 'text-state-warning-text' : 'text-state-success-text'}`}>{analysis.issues.length}</span>
                            <span className="text-xs text-text-muted font-bold">个问题</span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-1">最近检查: {lastCheckTime}</div>
                    </div>
                </div>
            </div>

            {/* Risk Distribution Bar */}
            {analysis.issues.length > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden w-full bg-surface-muted">
                    <div className="bg-state-danger-text transition-all duration-slow" style={{ flex: analysis.stats.highRisk }}></div>
                    <div className="bg-state-warning-text transition-all duration-slow" style={{ flex: analysis.stats.medRisk }}></div>
                    <div className="bg-state-info-text transition-all duration-slow" style={{ flex: analysis.stats.lowRisk }}></div>
                </div>
            )}

            {/* 2. Issues List */}
            {analysis.issues.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center text-state-success-text bg-surface-card rounded-3xl border border-dashed border-state-success-text/20">
                    <ShieldCheck size={48} className="mb-4 opacity-50"/>
                    <span className="font-bold text-lg">系统非常纯净</span>
                    <p className="text-xs text-state-success-text/70 mt-2 max-w-[200px]">未发现语义冲突、命名不规范或冗余标签。</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase ml-1 flex items-center">
                        <Info size={14} className="mr-1.5"/> 待处理项 ({analysis.issues.length})
                    </h4>
                    
                    {analysis.issues.map((issue) => (
                        <div 
                            key={issue.id} 
                            onClick={() => onNavigateToTag(issue.tag, issue.type)}
                            className="bg-surface-card border border-surface-border p-4 rounded-2xl group hover:border-accent/50 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {/* Severity Badge */}
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                        issue.severity === 'High' ? 'bg-state-danger-bg text-state-danger-text' :
                                        issue.severity === 'Medium' ? 'bg-state-warning-bg text-state-warning-text' :
                                        'bg-state-info-bg text-state-info-text'
                                    }`}>
                                        {issue.severity === 'High' ? '高风险' : issue.severity === 'Medium' ? '中风险' : '低风险'}
                                    </span>
                                    
                                    {/* Issue Type */}
                                    <span className="text-[10px] font-bold text-text-muted border border-surface-border px-1.5 py-0.5 rounded">
                                        {issue.issueType}
                                    </span>
                                </div>
                                <div className="text-accent flex items-center text-xs font-bold">
                                    管理 <ArrowRight size={12} className="ml-1"/>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-base text-text-primary">{issue.tag}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    issue.type === 'xp' ? 'bg-surface-muted text-chart-tertiary' :
                                    issue.type === 'event' ? 'bg-state-info-bg text-state-info-text' :
                                    'bg-state-danger-bg text-state-danger-text'
                                }`}>
                                    {issue.type}
                                </span>
                                <span className="text-[10px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded-full">{issue.count}次</span>
                            </div>

                            <p className="text-xs text-text-secondary leading-relaxed">
                                {issue.message}。
                                {issue.suggestion && <span className="font-bold text-accent ml-1">{issue.suggestion}</span>}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-surface-muted p-4 rounded-xl text-[10px] text-text-muted leading-relaxed border border-surface-border">
                <p className="font-bold mb-1">💡 为什么体检很重要？</p>
                <p>随着记录增多，标签系统容易出现熵增（混乱）。定期体检能防止“人妻”和“人妻出轨”同时存在，或“SP”和“打屁股”混用，确保长期统计的准确性。系统只提供建议，所有修改权在您手中。</p>
            </div>
        </div>
    );
};

export default TagHealthCheck;
