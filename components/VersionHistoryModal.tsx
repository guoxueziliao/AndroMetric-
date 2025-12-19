
import React from 'react';
import Modal from './Modal';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface VersionEntry {
    version: string;
    date: string;
    summary: string;
    changes: Array<{ type: string; text: string }>;
}

const HISTORY: VersionEntry[] = [
    {
        version: '0.0.6',
        date: '2025-12-12',
        summary: '架构加固：引入标签治理体系与素材原子化模型。',
        changes: [
            { type: 'new', text: '全局时间轴 (Global Timeline)：自动串联全天生理轨迹' },
            { type: 'new', text: '标签体检中心：发现并处理复合标签与语义冲突' },
            { type: 'new', text: '素材结构 2.0：支持单一语义 ContentItem，告别大杂烩记录' },
            { type: 'improve', text: '数据质量评分：动态计算每日记录的科学价值' },
            { type: 'fix', text: '修复了多设备导入时可能产生的 ID 冲突问题' }
        ]
    }
];

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="版本历史">
            <div className="space-y-6">
                {HISTORY.map((entry) => (
                    <div key={entry.version} className="border-l-2 border-blue-500 pl-4 py-1">
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-brand-text dark:text-slate-100">v{entry.version}</h3>
                            <span className="text-xs text-brand-muted">{entry.date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-2">{entry.summary}</p>
                        <ul className="space-y-1">
                            {entry.changes.map((change, i) => (
                                <li key={i} className="text-[11px] text-slate-400 leading-relaxed">• <span className="text-blue-500 font-bold">[{change.type.toUpperCase()}]</span> {change.text}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default VersionHistoryModal;
