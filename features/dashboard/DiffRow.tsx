
import React from 'react';
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import type { ChangeDetail } from '../../domain';
import { formatHistoryValue } from '../../shared/lib';

interface DiffRowProps {
    diff: ChangeDetail;
}

export const DiffRow: React.FC<DiffRowProps> = ({ diff }) => {
    if (!diff) return null;
    const { field, oldValue, newValue } = diff;
    
    // Handle potentially undefined inputs for logic safely
    const sOld = oldValue === undefined || oldValue === null ? '' : String(oldValue);
    const sNew = newValue === undefined || newValue === null ? '' : String(newValue);

    // Detect operation type
    const isAdded = sOld === '无' || sOld === 'null' || sOld === '' || sOld === '0' || sOld === '0m' || sOld === 'false';
    const isDeleted = sNew === '删除' || sNew === '无' || sNew === '' || sNew === 'null';

    const formattedOld = isAdded ? null : formatHistoryValue(field, oldValue);
    const formattedNew = isDeleted ? (newValue === '删除' ? '已删除' : '—') : formatHistoryValue(field, newValue);

    return (
        <div className="flex items-center justify-between py-2.5 border-b border-surface-border/50 last:border-0 px-4 hover:bg-surface-muted/60 transition-colors group">
            {/* Field Label */}
            <div className="flex items-center gap-1.5 shrink-0 mr-4">
                <div className="w-1 h-1 rounded-full bg-surface-border"></div>
                <span className="text-[11px] font-bold text-text-muted truncate max-w-[140px]" title={field}>
                    {field || '未知字段'}
                </span>
            </div>

            {/* Values Area */}
            <div className="flex flex-col items-end gap-0.5 text-right min-w-0 flex-1">
                {/* Old Value (Top, Gray, Strikethrough) */}
                {!isAdded && (
                    <span className="text-[10px] text-text-muted line-through decoration-surface-border truncate max-w-full opacity-80">
                        {formattedOld}
                    </span>
                )}

                {/* New Value (Bottom, Colored, Bold) */}
                <div className={`flex items-center justify-end text-xs font-bold truncate max-w-full leading-tight ${
                    isDeleted 
                        ? 'text-state-danger-text'
                        : isAdded 
                            ? 'text-state-info-text'
                            : 'text-state-success-text'
                }`}>
                    {/* Semantic Icons */}
                    {isAdded && <Plus size={10} className="mr-1 stroke-[3]" />}
                    {!isAdded && !isDeleted && <ArrowUpRight size={10} className="mr-1 stroke-[3]" />} 
                    {isDeleted && <Trash2 size={10} className="mr-1 stroke-[3]" />}
                    
                    {formattedNew}
                </div>
            </div>
        </div>
    );
};
