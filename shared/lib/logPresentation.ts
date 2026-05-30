import type { ChangeDetail, LogEntry } from '../../domain';
import { LABELS } from './labels';
import { analyzeSleep, calculateSleepDuration, formatTime } from './dates';

/**
 * 把一条 LogEntry 渲染成展示用的 label/value 对列表。
 * 集中所有"晨勃 / 睡眠 / 生活 / 性 / 自慰 / 健康 / 备注"的中文展示规则。
 */
export const generateLogSummary = (log: Partial<LogEntry>): Array<{ label: string, value: string }> => {
    const summary: Array<{ label: string, value: string }> = [];
    const morning = log.morning;
    const sleepRec = log.sleep;

    // 1. Morning Wood
    const morningTxt = [];
    if (morning?.wokeWithErection) {
        morningTxt.push(`硬度: ${LABELS.hardness[morning.hardness || 3]}`);
        morningTxt.push(`维持: ${LABELS.retention[morning.retention || 'normal']}`);
        if(morning.wokenByErection) morningTxt.push('⚠️ 被晨勃弄醒');
    } else {
        morningTxt.push('无晨勃');
    }
    summary.push({ label: '晨勃情况', value: morningTxt.join(' | ') });

    // 2. Sleep & Naps
    const sleepTxt = [];
    if (sleepRec?.startTime && sleepRec?.endTime) {
        sleepTxt.push(`${formatTime(sleepRec.startTime)} - ${formatTime(sleepRec.endTime)} (${calculateSleepDuration(sleepRec.startTime, sleepRec.endTime)})`);
        const analysis = analyzeSleep(sleepRec.startTime, sleepRec.endTime);
        if (analysis) {
            const warnings = [];
            if (analysis.isLate) warnings.push('熬夜');
            if (analysis.isInsufficient) warnings.push('睡眠不足');
            if (warnings.length > 0) sleepTxt.push(`⚠️ ${warnings.join(', ')}`);
        }
        if (sleepRec.environment?.location) {
            sleepTxt.push(`地点: ${LABELS.sleepLocation[sleepRec.environment.location]}`);
        }
    } else if (sleepRec?.startTime) {
        sleepTxt.push(`${formatTime(sleepRec.startTime)} - ... (睡觉中)`);
    }

    if (sleepRec) sleepTxt.push(`评分: ${sleepRec.quality}星 | 睡衣: ${LABELS.attire[sleepRec.attire || 'light']}`);
    if (sleepRec?.hasDream) sleepTxt.push(`💭 梦境: ${sleepRec.dreamTypes?.join(',') || '有'}`);

    const sleepEvents = [];
    if (sleepRec?.naturalAwakening) sleepEvents.push('自然醒');
    if (sleepRec?.nocturnalEmission) sleepEvents.push('遗精');
    if (sleepEvents.length > 0) sleepTxt.push(`事件: ${sleepEvents.join(', ')}`);

    if (sleepRec?.naps && sleepRec.naps.length > 0) {
        const napSummary = sleepRec.naps.map(n => {
            if (n.ongoing) return `😴 进行中 (${n.startTime})`;
            const dreamStr = n.hasDream ? `(梦: ${n.dreamTypes?.join(',')})` : '';
            const locStr = n.location ? `@${LABELS.sleepLocation[n.location]}` : '';
            return `😴 ${n.startTime}-${n.endTime || '?'} (${n.duration}分) ${locStr} ${dreamStr}`;
        }).join('\n');
        sleepTxt.push(`午休:\n${napSummary}`);
    }
    summary.push({ label: '睡眠周期', value: sleepTxt.join('\n') });

    // 3. Environment & State
    const env = [];
    env.push(`天气: ${LABELS.weather[log.weather || 'sunny']}`);
    env.push(`地点: ${LABELS.location[log.location || 'home']}`);
    env.push(`心情: ${LABELS.mood[log.mood || 'neutral']}`);
    env.push(`压力: ${LABELS.stress[log.stressLevel || 2]}`);
    summary.push({ label: '身心环境', value: env.join(' | ') });

    // 4. Lifestyle
    const life = [];
    if (log.alcoholRecords && log.alcoholRecords.length > 0) {
        const total = log.alcoholRecords.reduce((s, r) => s + r.totalGrams, 0);
        const itemStr = log.alcoholRecords.map(r => `${r.items.map(i => i.name).join('+')} (${r.totalGrams}g)`).join(', ');
        life.push(`🍺 饮酒: 总计 ${total}g纯酒精 [${itemStr}]`);
    } else {
        life.push(`饮酒: 无`);
    }
    life.push(`色情使用: ${LABELS.porn[log.pornConsumption || 'none']}`);

    if (log.caffeineRecord && log.caffeineRecord.totalCount > 0) {
        const detailStr = log.caffeineRecord.items
            .map(i => `${i.name} ${i.volume}ml${i.count > 1 ? 'x'+i.count : ''}`)
            .join(', ');
        life.push(`☕ 提神饮品: ${log.caffeineRecord.totalCount}杯 [${detailStr}]`);
    } else {
        life.push(`☕ 提神饮品: 无`);
    }

    if (log.exercise && log.exercise.length > 0) {
        const exList = log.exercise.map((e, i) => {
            if (e.steps) return `${i+1}. ${e.type} (${e.steps}步)`;
            let str = `${i+1}. ${e.startTime} ${e.type} (${e.duration}分)`;
            if(e.bodyParts && e.bodyParts.length > 0) str += ` [${e.bodyParts.join(',')}]`;
            if(e.feeling) str += ` [${LABELS.exFeeling[e.feeling || 'ok']}]`;
            return str;
        });
        summary.push({ label: `运动 (${log.exercise.length})`, value: exList.join('\n') });
    } else {
        life.push('运动: 无');
        summary.push({ label: '生活习惯', value: life.join('\n') });
    }

    // 5. Sex Life
    if (log.sex && log.sex.length > 0) {
        const sexDetails = log.sex.map((r, i) => {
            const partner = r.interactions?.[0]?.partner || r.partner || '伴侣';
            let ejocInfo = r.ejaculation ? '射精' : '';
            if (r.ejaculation && r.ejaculationLocation) {
                ejocInfo += ` (${r.ejaculationLocation}${r.semenSwallowed ? '/吞' : ''})`;
            }
            return `${i + 1}. ${r.startTime} ${partner} (${r.duration}分) ${ejocInfo}`;
        });
        summary.push({ label: `性生活 (${log.sex.length})`, value: sexDetails.join('\n') });
    } else {
        summary.push({ label: '性生活', value: '无' });
    }

    // 6. Masturbation
    if (log.masturbation && log.masturbation.length > 0) {
        const mbDetails = log.masturbation.map((r, i) => {
            const tools = r.tools?.join(',') || '手';
            let extra = '';
            if (r.volumeForceLevel) extra += ` [射精Lv.${r.volumeForceLevel}]`;
            if (r.satisfactionLevel) extra += ` [满足:${LABELS.satisfaction[r.satisfactionLevel]}]`;
            if (r.contentItems && r.contentItems.length > 0) extra += ` [素材:${r.contentItems.length}]`;

            return `${i + 1}. ${r.startTime} ${tools} (${r.duration}分)${extra} ${r.status === 'inProgress' ? '[进行中]' : ''}`;
        });
        summary.push({ label: `自慰 (${log.masturbation.length})`, value: mbDetails.join('\n') });
    } else {
        summary.push({ label: `自慰`, value: '无' });
    }

    if (log.health) {
        let healthText = log.health.isSick
            ? `🔴 身体不适: ${log.health.discomfortLevel ? LABELS.discomfortLevel[log.health.discomfortLevel] : '未记录程度'}`
            : '🟢 身体健康';

        if (log.health.isSick) {
            if (log.health.symptoms && log.health.symptoms.length > 0) healthText += `\n症状: ${log.health.symptoms.join(', ')}`;
            if (log.health.medications && log.health.medications.length > 0) healthText += `\n用药: ${log.health.medications.join(', ')}`;
        }
        summary.push({ label: '健康状况', value: healthText });
    }

    if ((log.tags && log.tags.length > 0) || log.notes || (log.dailyEvents && log.dailyEvents.length > 0)) {
        const notes = [];
        if (log.dailyEvents && log.dailyEvents.length > 0) notes.push(`📅 事件: ${log.dailyEvents.join(' + ')}`);
        if (log.tags && log.tags.length > 0) notes.push(`标签: ${log.tags.join(', ')}`);
        if (log.notes) notes.push(`备注: ${log.notes}`);
        summary.push({ label: '备注信息', value: notes.join('\n') });
    }

    return summary;
};

/**
 * 自上次"释放"(射精/性生活/自慰/遗精)至今的累计时长,渲染成"X天 Y小时"。
 */
export const calculateInventory = (logs: LogEntry[] = []): string => {
    if (!logs || !Array.isArray(logs)) return '未知';
    let lastEjaculationTime: number | null = null;

    const sortedLogs = [...logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const log of sortedLogs) {
        const dateStr = log.date;

        if (log.sex) {
            for (let i = log.sex.length - 1; i >= 0; i--) {
                const s = log.sex[i];
                if (s.ejaculation) {
                    const time = s.startTime || '22:00';
                    lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
                    break;
                }
            }
        }
        if (lastEjaculationTime) break;

        if (log.masturbation) {
            for (let i = log.masturbation.length - 1; i >= 0; i--) {
                const m = log.masturbation[i];
                if (m.ejaculation) {
                    const time = m.startTime || '23:00';
                    lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
                    break;
                }
            }
        }
        if (lastEjaculationTime) break;

        if (log.sleep?.nocturnalEmission) {
             const time = log.sleep.endTime || '07:00';
             lastEjaculationTime = new Date(`${dateStr}T${time}:00`).getTime();
             break;
        }
    }

    if (!lastEjaculationTime) return '未知';

    const now = Date.now();
    const diffMs = now - lastEjaculationTime;
    if (diffMs < 0) return '刚刚';

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHrs / 24);
    const hours = diffHrs % 24;

    return `${days}天 ${hours}小时`;
};

/**
 * 对比两版日志,返回 ChangeDetail[](带中文 field 名,用于历史展示)。
 * 字段名包含 UI 文案,所以不在 domain/rules 而在 shared/lib。
 */
export const calculateLogDiff = (oldLog: LogEntry, newLog: LogEntry): ChangeDetail[] => {
    const diffs: ChangeDetail[] = [];

    if (oldLog.morning?.hardness !== newLog.morning?.hardness) {
        diffs.push({
            field: '晨勃硬度',
            oldValue: String(oldLog.morning?.hardness || '无'),
            newValue: String(newLog.morning?.hardness || '无'),
            category: 'morning'
        });
    }

    if (oldLog.sleep?.startTime !== newLog.sleep?.startTime) {
        diffs.push({
            field: '入睡时间',
            oldValue: formatTime(oldLog.sleep?.startTime) || '无',
            newValue: formatTime(newLog.sleep?.startTime) || '无',
            category: 'sleep'
        });
    }
    if (oldLog.sleep?.endTime !== newLog.sleep?.endTime) {
        diffs.push({
            field: '起床时间',
            oldValue: formatTime(oldLog.sleep?.endTime) || '无',
            newValue: formatTime(newLog.sleep?.endTime) || '无',
            category: 'sleep'
        });
    }

    const oldAlc = (oldLog.alcoholRecords || []).reduce((s, r) => s + r.totalGrams, 0);
    const newAlc = (newLog.alcoholRecords || []).reduce((s, r) => s + r.totalGrams, 0);
    if (oldAlc !== newAlc) {
        diffs.push({
            field: '酒精摄入',
            oldValue: `${oldAlc}g`,
            newValue: `${newAlc}g`,
            category: 'lifestyle'
        });
    }

    const sexDiff = (newLog.sex?.length || 0) - (oldLog.sex?.length || 0);
    if (sexDiff !== 0) {
        diffs.push({
            field: '性生活',
            oldValue: `${oldLog.sex?.length || 0}次`,
            newValue: `${newLog.sex?.length || 0}次`,
            category: 'sex'
        });
    }

    if (diffs.length === 0 && JSON.stringify(oldLog) !== JSON.stringify(newLog)) {
         diffs.push({ field: '记录详情', oldValue: '...', newValue: '已更新', category: 'meta' });
    }

    return diffs;
};
