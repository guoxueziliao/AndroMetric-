import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../../../core/storage';
import type { PornUseEvent, MasturbationEvent, SexEvent, LogEntry } from '../../../domain';
import { getActivityTargetDate } from '../../../shared/lib/targetDate';
import {
  buildReviewInputForWindow,
  type ReviewWindowKind,
} from '../model/adultBehaviorReviewInput';
import type { AdultBehaviorWindowFacts } from '../model/adultBehaviorReviewFacts';
import { buildWindowFacts } from '../model/adultBehaviorReviewFacts';
import type { GatedInsight } from '../model/adultBehaviorReviewConfidence';
import { generateReviewInsights } from '../model/adultBehaviorReviewInsights';
import {
  buildReviewReport,
  buildMarkdownReport,
  buildReportFileName,
  SENSITIVE_EXPORT_WARNING,
} from '../model/adultBehaviorReviewReport';
import { Activity, Zap, Moon, Heart, AlertCircle, TrendingDown, Download } from 'lucide-react';
import TrainingSection from './TrainingSection';

// ── Window options ───────────────────────────────────────────────────────────

const WINDOW_OPTIONS: { kind: ReviewWindowKind; label: string; description: string }[] = [
  { kind: 'rolling_7d', label: '7天', description: '近期状态快照，重点看最近变化和记录完整度' },
  { kind: 'rolling_14d', label: '14天', description: '短周期对比，适合训练目标和生活节律' },
  { kind: 'rolling_30d', label: '30天', description: '月内趋势，重点看稳定性、波动和长期状态' },
  { kind: 'week', label: '周报', description: '自然周回顾，周一到周日总结' },
  { kind: 'month', label: '月报', description: '自然月回顾，适合阶段性回看' },
];

// ── Sub-components ───────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className }) => (
  <div className={`bg-surface-card p-4 rounded-2xl border border-surface-border ${className ?? ''}`}>
    <h3 className="text-sm font-bold text-text-primary flex items-center mb-3">
      {Icon && <Icon size={14} className="mr-1.5 text-accent" />}
      {title}
    </h3>
    {children}
  </div>
);

const MetricRow: React.FC<{
  label: string;
  value: string | number | null;
  unit?: string;
  sampleSize?: number;
  warn?: boolean;
}> = ({ label, value, unit, sampleSize, warn }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-xs text-text-secondary">{label}</span>
    <div className="flex items-center gap-1.5">
      {value != null ? (
        <span className={`text-sm font-bold ${warn ? 'text-warning' : 'text-text-primary'}`}>
          {value}{unit && <span className="text-xs text-text-muted ml-0.5">{unit}</span>}
        </span>
      ) : (
        <span className="text-xs text-text-muted">--</span>
      )}
      {sampleSize != null && sampleSize > 0 && (
        <span className="text-[10px] text-text-muted">n={sampleSize}</span>
      )}
    </div>
  </div>
);

const MissingDataBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2.5 py-1.5 rounded-xl">
      <AlertCircle size={12} />
      <span>{count} 条数据缺口</span>
    </div>
  );
};

const InsightCard: React.FC<{ insight: GatedInsight }> = ({ insight }) => (
  <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-bold text-text-primary">{insight.summary}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
        insight.confidence === 'medium' ? 'bg-accent/15 text-accent' :
        insight.confidence === 'low' ? 'bg-warning/15 text-warning' :
        'bg-surface-border text-text-muted'
      }`}>
        {insight.confidence === 'medium' ? '初步可看' : insight.confidence === 'low' ? '样本少' : insight.confidence}
      </span>
    </div>
    {insight.supportingFacts.length > 0 && (
      <ul className="space-y-0.5 mb-1.5">
        {insight.supportingFacts.slice(0, 3).map((fact, i) => (
          <li key={i} className="text-[10px] text-text-muted flex items-start gap-1">
            <span className="text-accent mt-0.5">-</span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    )}
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted">n={insight.sampleSize}</span>
      {insight.limitations.length > 0 && (
        <span className="text-[10px] text-text-muted truncate max-w-[200px]">
          · {insight.limitations[0]}
        </span>
      )}
    </div>
  </div>
);

const TimelineDayRow: React.FC<{
  day: AdultBehaviorWindowFacts['timeline'][0];
}> = ({ day }) => {
  const adultEvents = day.events.filter(
    (e) => e.kind === 'porn_use' || e.kind === 'masturbation' || e.kind === 'sex',
  );
  const hasMH = day.events.some((e) => e.kind === 'morning_hardness');
  const hasSleep = day.events.some((e) => e.kind === 'sleep');

  const kindLabel: Record<string, string> = {
    porn_use: '色情使用', masturbation: '自慰', sex: '性爱',
    morning_hardness: '硬度', sleep: '睡眠', alcohol: '酒精',
    exercise: '运动', mood: '心情', stress: '压力',
  };

  const dateLabel = (() => {
    const d = new Date(day.targetDate + 'T12:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  })();

  return (
    <div className="flex items-start gap-2 py-2 border-b border-surface-border last:border-b-0">
      <span className="text-xs font-mono text-text-muted w-10 shrink-0 pt-0.5">{dateLabel}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1">
          {day.events.map((evt) => (
            <span
              key={evt.id}
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                evt.privacyLevel === 'sensitive'
                  ? 'bg-adult-soft/15 text-adult'
                  : 'bg-surface-muted text-text-secondary'
              }`}
            >
              {kindLabel[evt.kind] ?? evt.kind}
            </span>
          ))}
        </div>
        {adultEvents.length > 0 && (
          <div className="text-[10px] text-text-muted">
            {adultEvents.map((e) => {
              const dur = e.summaryFacts.find((f) => f.key === 'duration');
              const ejac = e.summaryFacts.find((f) => f.key === 'ejaculated' && f.value === true);
              const parts = [
                dur ? `${dur.value}${dur.unit ?? ''}` : null,
                ejac ? '射精' : null,
              ].filter(Boolean);
              return parts.length > 0 ? parts.join(' · ') : null;
            }).filter(Boolean).join(' | ')}
          </div>
        )}
        {(day.missingData.length > 0) && (
          <div className="flex items-center gap-1 mt-0.5">
            {day.missingData.map((m, i) => (
              <span key={i} className="text-[9px] text-warning">⚠ {m.key === 'orphan_linked_id' ? '未补全关联' : m.key === 'no_daily_log' ? '无记录' : m.key === 'no_morning_hardness' ? '无硬度' : m.key === 'no_sleep_record' ? '无睡眠' : m.key}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasMH && <span className="text-[9px] text-accent">MH</span>}
        {hasSleep && <span className="text-[9px] text-chart-primary">SL</span>}
        {day.dayFacts.some((f) => f.key === 'ejaculationCount') && (
          <span className="text-[9px] text-adult">E</span>
        )}
      </div>
    </div>
  );
};

// ── File download helper ─────────────────────────────────────────────────────

const downloadFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Main component ───────────────────────────────────────────────────────────

interface ReviewSectionProps {
  logs: LogEntry[];
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ logs }) => {
  const [windowKind, setWindowKind] = useState<ReviewWindowKind>('rolling_14d');
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [pendingExport, setPendingExport] = useState<ReviewWindowKind | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [events, setEvents] = useState<{
    porn: PornUseEvent[];
    mb: MasturbationEvent[];
    sx: SexEvent[];
  }>({ porn: [], mb: [], sx: [] });

  // Load events from StorageService
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [porn, mb, sx] = await Promise.all([
        StorageService.pornUseEvents.queries.all(),
        StorageService.masturbationEvents.queries.all(),
        StorageService.sexEvents.queries.all(),
      ]);
      if (!cancelled) {
        setEvents({ porn, mb, sx });
        setEventsLoaded(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const anchorDate = useMemo(() => getActivityTargetDate(new Date()), []);

  const reviewInput = useMemo(() => buildReviewInputForWindow(
    windowKind, logs, events.porn, events.mb, events.sx, anchorDate,
  ), [windowKind, logs, events, anchorDate]);

  const facts: AdultBehaviorWindowFacts = useMemo(
    () => buildWindowFacts(reviewInput),
    [reviewInput],
  );

  const insights: GatedInsight[] = useMemo(
    () => generateReviewInsights(facts, reviewInput.dailyLogs),
    [facts, reviewInput.dailyLogs],
  );

  const missingCount = facts.missingData.filter((m) => m.severity === 'warning').length;

  const timelineDays = showFullTimeline ? facts.timeline : facts.timeline.slice(-5);

  const handleExportMarkdown = (kind: ReviewWindowKind) => {
    setPendingExport(kind);
    setShowExportConfirm(true);
  };

  const confirmExport = () => {
    if (!pendingExport) return;
    const exportInput = pendingExport === windowKind
      ? reviewInput
      : buildReviewInputForWindow(pendingExport, logs, events.porn, events.mb, events.sx, anchorDate);
    const exportFacts = pendingExport === windowKind ? facts : buildWindowFacts(exportInput);
    const exportInsights = generateReviewInsights(exportFacts, exportInput.dailyLogs);
    const report = buildReviewReport(exportFacts, exportInsights, pendingExport);

    // Add relationship context summary (non-private aggregate only)
    const exportSxEvents = events.sx;
    const withCtx = exportSxEvents.filter((e) => e.relationshipContext);
    if (withCtx.length > 0) {
      report.relationshipContext = {
        recordsWithContext: withCtx.length,
        withCommunication: withCtx.filter((e) => e.relationshipContext?.communicationBefore && e.relationshipContext.communicationBefore !== 'not_recorded').length,
        withBoundary: withCtx.filter((e) => e.relationshipContext?.boundaryConfirmed && e.relationshipContext.boundaryConfirmed !== 'not_recorded').length,
        withFeedback: withCtx.filter((e) => e.relationshipContext?.partnerFeedback && e.relationshipContext.partnerFeedback !== 'not_recorded').length,
        needsFollowUp: withCtx.filter((e) => e.relationshipContext?.needsFollowUp).length,
        withCycleContext: withCtx.filter((e) => e.relationshipContext?.cycleContext && e.relationshipContext.cycleContext !== 'unknown').length,
      };
    }

    const md = buildMarkdownReport(report);
    const fileName = buildReportFileName(report.reportType, report.window);
    downloadFile(md, fileName, 'text/markdown;charset=utf-8');
    setShowExportConfirm(false);
    setPendingExport(null);
  };

  if (!eventsLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-text-muted">加载复盘数据...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Window switcher */}
      <div className="flex p-1 bg-surface-muted rounded-xl border border-surface-border overflow-x-auto scrollbar-hide">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            onClick={() => setWindowKind(opt.kind)}
            className={`flex-1 min-h-[36px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              windowKind === opt.kind
                ? 'bg-surface-card text-accent shadow-sm'
                : 'text-text-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Window description */}
      <p className="text-[10px] text-text-muted px-1">
        {WINDOW_OPTIONS.find((o) => o.kind === windowKind)?.description}
      </p>

      {/* Primary summary */}
      <SectionCard title="硬度与恢复" icon={Zap}>
        <MetricRow
          label="晨间硬度均值"
          value={facts.recovery.morningHardnessMean?.toFixed(1) ?? null}
          unit="/5"
          sampleSize={facts.recovery.morningHardnessSampleSize}
        />
        <MetricRow
          label="睡眠均值"
          value={facts.recovery.sleepMeanMinutes != null
            ? (facts.recovery.sleepMeanMinutes / 60).toFixed(1)
            : null}
          unit="h"
          sampleSize={facts.recovery.sleepSampleSize}
        />
        <MetricRow
          label="记录天数"
          value={facts.recordDays}
        />
        <div className="mt-2">
          <MissingDataBadge count={missingCount} />
        </div>
      </SectionCard>

      {/* Behavior load */}
      <SectionCard title="行为负荷" icon={Activity}>
        <div className="grid grid-cols-2 gap-x-4">
          <MetricRow label="色情使用" value={facts.pornUse.count} unit="次" />
          {facts.pornUse.totalDurationMinutes != null && (
            <MetricRow label="色情时长" value={facts.pornUse.totalDurationMinutes} unit="分" />
          )}
          <MetricRow label="自慰" value={facts.masturbation.count} unit="次" />
          <MetricRow label="性爱" value={facts.sex.count} unit="次" />
          <MetricRow
            label="射精"
            value={facts.pornUse.ejaculationCount + facts.masturbation.ejaculationCount + facts.sex.ejaculationCount}
            unit="次"
          />
          <MetricRow label="边缘控制" value={facts.masturbation.edgingCount} unit="次" />
        </div>
      </SectionCard>

      {/* Missing data section */}
      {missingCount > 0 && (
        <SectionCard title="数据缺口" icon={AlertCircle} className="border-warning/30">
          <div className="space-y-1">
            {(() => {
              const grouped = new Map<string, number>();
              for (const m of facts.missingData.filter((d) => d.severity === 'warning')) {
                grouped.set(m.key, (grouped.get(m.key) ?? 0) + 1);
              }
              return [...grouped.entries()].map(([key, count]) => (
                <div key={key} className="text-xs text-text-secondary flex items-center gap-1.5">
                  <span className="text-warning">⚠</span>
                  <span>{key === 'no_daily_log' ? `缺少日记记录 ${count} 天` :
                    key === 'orphan_linked_id' ? `${count} 条事件关联未补全` :
                    `${key}: ${count}`}</span>
                </div>
              ));
            })()}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            补充记录后，后续复盘会更稳定。
          </p>
        </SectionCard>
      )}

      {/* Insight preview */}
      {insights.length > 0 && (
        <SectionCard title="观察提示" icon={TrendingDown}>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Timeline preview */}
      {facts.timeline.length > 0 && (
        <SectionCard title="事件时间线" icon={Moon}>
          <div>
            {timelineDays.map((day) => (
              <TimelineDayRow key={day.targetDate} day={day} />
            ))}
          </div>
          {facts.timeline.length > 5 && !showFullTimeline && (
            <button
              onClick={() => setShowFullTimeline(true)}
              className="mt-2 text-xs text-accent hover:underline w-full text-center"
            >
              展开全部 {facts.timeline.length} 天
            </button>
          )}
          {showFullTimeline && facts.timeline.length > 5 && (
            <button
              onClick={() => setShowFullTimeline(false)}
              className="mt-2 text-xs text-accent hover:underline w-full text-center"
            >
              收起
            </button>
          )}
        </SectionCard>
      )}

      {/* Relationship context summary */}
      {events.sx.some((e) => e.relationshipContext) && (
        <SectionCard title="关系上下文" icon={Heart}>
          <div className="space-y-1 text-xs text-text-secondary">
            {(() => {
              const withCtx = events.sx.filter((e) => e.relationshipContext);
              const comm = withCtx.filter((e) => e.relationshipContext?.communicationBefore && e.relationshipContext.communicationBefore !== 'not_recorded');
              const boundary = withCtx.filter((e) => e.relationshipContext?.boundaryConfirmed && e.relationshipContext.boundaryConfirmed !== 'not_recorded');
              const feedback = withCtx.filter((e) => e.relationshipContext?.partnerFeedback && e.relationshipContext.partnerFeedback !== 'not_recorded');
              const followUp = withCtx.filter((e) => e.relationshipContext?.needsFollowUp);
              const cycle = withCtx.filter((e) => e.relationshipContext?.cycleContext && e.relationshipContext.cycleContext !== 'unknown');
              return (
                <>
                  <p>{withCtx.length} 条记录包含关系上下文。</p>
                  {comm.length > 0 && <p>沟通记录：{comm.length} 条。</p>}
                  {boundary.length > 0 && <p>边界确认：{boundary.length} 条。</p>}
                  {feedback.length > 0 && <p>伴侣反馈：{feedback.length} 条。</p>}
                  {followUp.length > 0 && <p className="text-warning">{followUp.length} 条需要后续沟通。</p>}
                  {cycle.length > 0 && <p>周期关怀上下文：{cycle.length} 条。</p>}
                  {withCtx.length < events.sx.length && (
                    <p className="text-text-muted">{events.sx.length - withCtx.length} 条记录暂无关系上下文。</p>
                  )}
                </>
              );
            })()}
          </div>
        </SectionCard>
      )}

      {/* Empty state */}
      {facts.timeline.length === 0 && facts.pornUse.count === 0 && facts.masturbation.count === 0 && facts.sex.count === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center space-y-2">
          <Heart size={24} className="mx-auto text-text-muted" />
          <p className="text-sm text-text-secondary">
            窗口内暂无成人行为记录。
          </p>
          <p className="text-xs text-text-muted">
            继续记录硬度、睡眠和成人行为后，复盘会自动出现。
          </p>
        </div>
      )}

      {/* Training section */}
      <TrainingSection facts={facts} insights={insights} />

      {/* Export actions */}
      <SectionCard title="导出" icon={Download}>
        <p className="text-[10px] text-text-muted mb-2">导出当前窗口数据，格式为 JSON 完整备份或 CSV 可读导出。</p>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-surface-muted rounded-xl border border-surface-border text-text-secondary hover:text-accent transition-colors"
            onClick={() => handleExportMarkdown(windowKind)}
          >
            <Download size={12} />
            导出当前窗口
          </button>
        </div>
      </SectionCard>

      {/* Export confirm modal */}
      {showExportConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowExportConfirm(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowExportConfirm(false); }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          ref={(el) => { if (el) el.focus(); }}
        >
          <div className="bg-surface-card rounded-2xl p-5 max-w-sm w-full border border-surface-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-text-primary mb-2">导出确认</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              {SENSITIVE_EXPORT_WARNING}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 text-xs font-medium text-text-muted rounded-xl border border-surface-border hover:bg-surface-muted"
                onClick={() => setShowExportConfirm(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-xs font-medium text-white bg-accent rounded-xl hover:opacity-90"
                onClick={confirmExport}
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
