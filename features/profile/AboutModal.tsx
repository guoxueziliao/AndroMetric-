import React, { useEffect, useMemo, useState } from 'react';
import { Database, FileText, Info, ShieldCheck } from 'lucide-react';
import { marked } from 'marked';
import { APP_VERSION } from '../../app/appConfig';
import { estimateStorage, formatBytes, LATEST_VERSION, db, type StorageEstimateInfo } from '../../core/storage';
import { Modal } from '../../shared/ui';
import changelogMarkdown from '../../CHANGELOG.md?raw';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataVersion: number;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractVersionSection = (markdown: string, version: string) => {
  const pattern = new RegExp(`## \\[${escapeRegExp(version)}\\][\\s\\S]*?(?=\\n## \\[|$)`);
  const match = markdown.match(pattern);
  return match?.[0] || '## 当前版本\n\n- 暂无更新摘要。';
};

const renderMarkdown = (markdown: string) => marked.parse(markdown, { async: false }) as string;

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, dataVersion }) => {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimateInfo | null>(null);
  const currentVersionMarkdown = useMemo(() => extractVersionSection(changelogMarkdown, APP_VERSION), []);
  const currentVersionHtml = useMemo(() => renderMarkdown(currentVersionMarkdown), [currentVersionMarkdown]);
  const fullHistoryHtml = useMemo(() => renderMarkdown(changelogMarkdown), []);
  const effectiveDataVersion = dataVersion > 0 ? dataVersion : LATEST_VERSION;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    estimateStorage().then((estimate) => {
      if (!cancelled) setStorageEstimate(estimate);
    }).catch(() => {
      if (!cancelled) setStorageEstimate(null);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="关于"
        footer={
          <button onClick={onClose} className="w-full py-3 bg-surface-muted text-text-primary font-bold rounded-xl hover:bg-surface-border transition-colors">
            关闭
          </button>
        }
      >
        <div className="space-y-5 py-1">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-text-on-accent">
                <Info size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary">Hardness Diary</h3>
                <p className="text-xs font-bold text-text-muted">v{APP_VERSION} • Local-first PWA</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-surface-border bg-surface-muted p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase text-text-muted">
                <FileText size={12} /> 数据版本
              </div>
              <div className="text-lg font-black text-text-primary">v{effectiveDataVersion}</div>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-muted p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase text-text-muted">
                <Database size={12} /> IndexedDB
              </div>
              <div className="text-lg font-black text-text-primary">v{db.verno}</div>
            </div>
            <div className="col-span-2 rounded-2xl border border-surface-border bg-surface-muted p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase text-text-muted">
                <Database size={12} /> 本地存储
              </div>
              <div className="text-sm font-black text-text-primary">
                {storageEstimate
                  ? `${formatBytes(storageEstimate.usage)} / ${formatBytes(storageEstimate.quota)} (${Math.round(storageEstimate.ratio * 100)}%)`
                  : '当前浏览器未提供用量'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-state-success-text/20 bg-state-success-bg p-4 text-xs font-bold leading-relaxed text-state-success-text">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck size={15} />
              <span>隐私优先</span>
            </div>
            所有数据保存在本设备，不上传任何服务器。
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-text-primary">本版更新</h4>
              <button onClick={() => setShowFullHistory(true)} className="text-xs font-black text-accent hover:underline">
                查看完整更新历史
              </button>
            </div>
            <div
              className="space-y-2 rounded-2xl border border-surface-border bg-surface-card p-4 text-sm leading-relaxed text-text-secondary [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-black [&_h3]:mt-3 [&_h3]:text-xs [&_h3]:font-black [&_h3]:uppercase [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: currentVersionHtml }}
            />
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={showFullHistory}
        onClose={() => setShowFullHistory(false)}
        title="完整更新历史"
        footer={
          <button onClick={() => setShowFullHistory(false)} className="w-full py-3 bg-surface-muted text-text-primary font-bold rounded-xl hover:bg-surface-border transition-colors">
            返回
          </button>
        }
      >
        <div
          className="space-y-3 text-sm leading-relaxed text-text-secondary [&_h1]:text-xl [&_h1]:font-black [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-black [&_h3]:mt-3 [&_h3]:text-xs [&_h3]:font-black [&_h3]:uppercase [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: fullHistoryHtml }}
        />
      </Modal>
    </>
  );
};

export default AboutModal;
