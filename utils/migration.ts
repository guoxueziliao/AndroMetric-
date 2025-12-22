
import { StoredData, LogEntry, SexRecordDetails, MasturbationRecordDetails, SexInteraction, SexAction, ExerciseRecord, MorningRecord, SleepRecord, ContentItem } from '../types';

// The latest version of our data structure.
export const LATEST_VERSION = 38;

/**
 * MIGRATION UTILITIES
 */

// Helper to safely parse dates during migrations
const safeDate = (d: any) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

/**
 * INDIVIDUAL MIGRATION SCRIPTS
 * Each function transforms data from Version N to Version N+1
 */

function migrateV1toV2(logs: any[]): any[] {
    return logs.map(log => {
        const logDate = new Date(log.date + 'T12:00:00');
        let sleepDateTime = log.sleepDateTime;
        let wakeUpDateTime = log.wakeUpDateTime;
        if (log.sleepTime && typeof log.sleepTime === 'string') {
            const [sleepHours, sleepMinutes] = log.sleepTime.split(':').map(Number);
            const sleepDate = new Date(logDate);
            sleepDate.setDate(sleepDate.getDate() - 1);
            sleepDate.setHours(sleepHours, sleepMinutes, 0, 0);
            sleepDateTime = sleepDate.toISOString();
        }
        if (log.wakeUpTime && typeof log.wakeUpTime === 'string') {
            const [wakeHours, wakeMinutes] = log.wakeUpTime.split(':').map(Number);
            const wakeDate = new Date(logDate);
            wakeDate.setHours(wakeHours, wakeMinutes, 0, 0);
            wakeUpDateTime = wakeDate.toISOString();
        }
        const { sleepTime, wakeUpTime, ...restOfLog } = log;
        const newLog: any = { ...restOfLog, status: 'completed' };
        if (sleepDateTime !== undefined) newLog.sleepDateTime = sleepDateTime;
        if (wakeUpDateTime !== undefined) newLog.wakeUpDateTime = wakeUpDateTime;
        return newLog;
    });
}

// ... Keep existing migrations ...
function migrateV3toV4(logs: any[]): any[] { return logs.map(log => ({ ...log, updatedAt: log.updatedAt || Date.now(), tags: log.tags || [] })); }
// Fix: Added missing required properties for SexRecordDetails (state, semenSwallowed, postSexActivity, mood, notes)
function migrateV5toV6(logs: any[]): any[] { return logs.map(log => { if (log.sex && !Array.isArray(log.sex)) { const oldSex = log.sex; const newSexArray: SexRecordDetails[] = []; if (oldSex.details) { newSexArray.push({ ...oldSex.details, id: `migrated-${Date.now()}-${Math.random()}`, ejaculation: oldSex.ejaculation ?? true, interactions: [], state: '', semenSwallowed: false, postSexActivity: [], mood: 'neutral', notes: '' }); } else if (oldSex.count > 0) { for (let i = 0; i < oldSex.count; i++) { newSexArray.push({ id: `migrated-placeholder-${Date.now()}-${i}`, startTime: '22:00', duration: 15, ejaculation: oldSex.ejaculation ?? true, protection: '无保护措施', indicators: { lingerie: false, orgasm: true, partnerOrgasm: false, squirting: false, toys: false }, interactions: [], state: '', semenSwallowed: false, postSexActivity: [], mood: 'neutral', notes: '' }); } } return { ...log, sex: newSexArray.length > 0 ? newSexArray : undefined }; } return log; }); }
/* Fix: Removed non-existent properties 'materials' and 'props' from MasturbationRecordDetails */
function migrateV6toV7(logs: any[]): any[] { return logs.map(log => { if (log.masturbation && !Array.isArray(log.masturbation)) { const oldMb = log.masturbation; const newMbArray: MasturbationRecordDetails[] = []; if (oldMb.count > 0) { for (let i = 0; i < oldMb.count; i++) { newMbArray.push({ id: `migrated-mb-${Date.now()}-${i}`, startTime: '23:00', duration: 10, tools: ['手'], ejaculation: oldMb.ejaculation ?? true, orgasmIntensity: 3, notes: '', contentItems: [], status: 'completed', edging: 'none', edgingCount: 0, useCondom: false, mood: 'neutral', stressLevel: 3, energyLevel: 3, interrupted: false, interruptionReasons: [], lubricant: '无润滑' }); } } return { ...log, masturbation: newMbArray.length > 0 ? newMbArray : undefined }; } return log; }); }
function migrateV7toV8(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: any) => ({ ...record, acts: record.acts || [], interactions: record.interactions || [] })); return { ...log, sex: newSex }; } return log; }); }
// Fix: Added missing costumes and toys properties to SexInteraction
function migrateV8toV9(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: any) => { if (record.interactions && record.interactions.length > 0) { return record; } const chain: SexAction[] = []; if (record.acts && Array.isArray(record.acts)) { record.acts.forEach((act: string) => { chain.push({ id: `mig-act-${Math.random()}`, type: 'act', name: act }); }); } if (record.positions && Array.isArray(record.positions)) { record.positions.forEach((pos: string) => { chain.push({ id: `mig-pos-${Math.random()}`, type: 'position', name: pos }); }); } const interaction: SexInteraction = { id: `mig-int-${Math.random()}`, partner: record.partner || '', location: record.location || '', costumes: [], toys: [], chain: chain }; return { ...record, interactions: [interaction] }; }); return { ...log, sex: newSex }; } return log; }); }
function migrateV9toV10(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: SexRecordDetails) => ({ ...record, interactions: (record.interactions || []).map(i => ({ ...i, role: i.role || '' })) })); return { ...log, sex: newSex }; } return log; }); }
function migrateV10toV11(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: SexRecordDetails) => ({ ...record, interactions: (record.interactions || []).map(i => ({ ...i, costumes: i.costumes || [] })) })); return { ...log, sex: newSex }; } return log; }); }
function migrateV11toV12(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: SexRecordDetails) => ({ ...record, postSexActivity: record.postSexActivity || [] })); return { ...log, sex: newSex }; } return log; }); }
function migrateV12toV13(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: SexRecordDetails) => ({ ...record, interactions: (record.interactions || []).map(i => ({ ...i, toys: i.toys || [] })) })); return { ...log, sex: newSex }; } return log; }); }
function migrateV13toV14(logs: any[]): any[] { return logs.map(log => ({ ...log, changeHistory: log.changeHistory || [] })); }
function migrateV15toV16(logs: any[]): any[] { return logs.map(log => { if (log.sex && Array.isArray(log.sex)) { const newSex = log.sex.map((record: SexRecordDetails) => ({ ...record, state: record.state || '' })); return { ...log, sex: newSex }; } return log; }); }
function migrateV22toV23(logs: any[]): any[] { return logs.map(log => { if (log.exercise && !Array.isArray(log.exercise)) { const oldEx: any = log.exercise; const newExRecord: ExerciseRecord = { id: `migrated-ex-${Date.now()}-${Math.random()}`, type: oldEx.type || '运动', startTime: '18:00', duration: oldEx.duration || 30, intensity: oldEx.intensity || 'medium', bodyParts: oldEx.bodyParts }; return { ...log, exercise: [newExRecord] }; } return log; }); }
function migrateV24toV25(logs: any[]): any[] { const shifts = new Map<string, { alcohol?: any, pornConsumption?: any }>(); logs.forEach(log => { if ((log.alcohol && log.alcohol !== 'none') || (log.pornConsumption && log.pornConsumption !== 'none')) { const curr = new Date(log.date + 'T12:00:00'); const prev = new Date(curr); prev.setDate(prev.getDate() - 1); const y = prev.getFullYear(); const m = String(prev.getMonth() + 1).padStart(2, '0'); const d = String(prev.getDate()).padStart(2, '0'); const prevDateStr = `${y}-${m}-${d}`; shifts.set(prevDateStr, { alcohol: log.alcohol, pornConsumption: log.pornConsumption }); } }); const logMap = new Map(logs.map(l => [l.date, l])); const allDates = new Set([...logMap.keys(), ...shifts.keys()]); const mergedLogs: any[] = []; allDates.forEach(date => { const existingLog = logMap.get(date); const shiftedData = shifts.get(date); let newLog: any; if (existingLog) { newLog = { ...existingLog, alcohol: shiftedData?.alcohol || 'none', pornConsumption: shiftedData?.pornConsumption || 'none' }; } else { newLog = { date: date, updatedAt: Date.now(), status: 'completed', wokeWithErection: true, hardness: 3, wokenByErection: false, durationImpression: 'brief', retention: 'normal', naturalAwakening: true, sleepAttire: 'light', nocturnalEmission: false, preSleepState: 'calm', location: 'home', weather: 'sunny', alcohol: shiftedData?.alcohol || 'none', pornConsumption: shiftedData?.pornConsumption || 'none', exercise: [], sex: [], masturbation: [], tags: [], changeHistory: [] }; } mergedLogs.push(newLog); }); return mergedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); }
function migrateV25toV26(logs: any[]): any[] { return logs.map(log => ({ ...log, naps: log.naps || [] })); }
function migrateV26toV27(logs: any[]): any[] { return logs.map(log => ({ ...log, sleepWithPartner: log.sleepWithPartner || false, sex: log.sex?.map((s: any) => ({ ...s, partnerScore: s.partnerScore || undefined })) })); }
function migrateV28toV29(logs: any[]): any[] { return logs.map(log => ({ ...log, masturbation: log.masturbation?.map((m: any) => ({ ...m, assets: m.assets || { sources: [], platforms: [], categories: [] }, edging: m.edging || 'none', lubricant: m.lubricant || undefined })) })); }
function migrateV29toV30(logs: any[]): any[] { return logs.map(log => ({ ...log, masturbation: log.masturbation?.map((m: any) => ({ ...m, assets: { ...m.assets, actors: m.assets?.actors || [] } })) })); }
function migrateV30toV31(logs: any[]): any[] { return logs.map(log => ({ ...log, masturbation: log.masturbation?.map((m: any) => ({ ...m, materialsList: m.materialsList || [], useCondom: m.useCondom || false })) })); }

// V32: Standardize Flat Fields into Domain Objects
// Fix: Added missing hasDream, dreamTypes, and environment properties to SleepRecord
function migrateV31toV32(logs: any[]): LogEntry[] {
    return logs.map(log => {
        // Construct MorningRecord
        const morning: MorningRecord = {
            id: `mr_${log.date}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date(log.date).getTime(),
            wokeWithErection: log.wokeWithErection ?? true,
            hardness: log.hardness,
            retention: log.retention,
            wokenByErection: log.wokenByErection,
            durationImpression: log.durationImpression
        };

        // Construct SleepRecord
        const sleep: SleepRecord = {
            id: `sr_${log.date}_${Math.random().toString(36).substr(2, 5)}`,
            startTime: log.sleepDateTime,
            endTime: log.wakeUpDateTime,
            quality: log.sleepQuality || 3,
            attire: log.sleepAttire,
            naturalAwakening: log.naturalAwakening,
            nocturnalEmission: log.nocturnalEmission,
            withPartner: log.sleepWithPartner,
            preSleepState: log.preSleepState,
            naps: log.naps || [],
            hasDream: log.hasDream ?? false,
            dreamTypes: log.dreamTypes || [],
            environment: log.environment || { location: 'home', temperature: 'comfortable' }
        };

        // Remove old fields
        const { 
            wokeWithErection, hardness, retention, wokenByErection, durationImpression,
            sleepDateTime, wakeUpDateTime, sleepQuality, sleepAttire, naturalAwakening, nocturnalEmission, sleepWithPartner, preSleepState, naps,
            ...rest 
        } = log;

        return {
            ...rest,
            morning,
            sleep
        };
    });
}

// V33: Initialize v0.0.5 New Fields (Environment, Dreams, Health Details, etc.)
function migrateV32toV33(logs: any[]): LogEntry[] {
    return logs.map(log => {
        if (log.sleep) {
            if (!log.sleep.environment) log.sleep.environment = { location: 'home', temperature: 'comfortable' };
            if (log.sleep.hasDream === undefined) log.sleep.hasDream = false;
            if (!log.sleep.dreamTypes) log.sleep.dreamTypes = [];
            if (log.sleep.naps) {
                log.sleep.naps = log.sleep.naps.map((n: any) => ({
                    ...n,
                    hasDream: n.hasDream ?? false,
                    dreamTypes: n.dreamTypes ?? []
                }));
            }
        }
        if (log.alcoholRecord) {
            log.alcoholRecord.drunkLevel = 'none';
            log.alcoholRecord.alcoholScene = '';
        }
        if (log.health) {
            log.health.feeling = log.health.isSick ? 'bad' : 'normal';
            log.health.symptoms = log.health.illnessType ? [log.health.illnessType] : [];
            log.health.medications = log.health.medicationName ? [log.health.medicationName] : [];
        }
        if (log.caffeineIntake === undefined) log.caffeineIntake = 'none';
        if (!log.dailyEvents) log.dailyEvents = [];
        if (log.exercise) {
            log.exercise = log.exercise.map((e: any) => ({ ...e, feeling: 'ok' }));
        }
        if (log.masturbation) {
            log.masturbation = log.masturbation.map((m: any) => ({ ...m, status: 'completed' }));
        }
        return log;
    });
}

// V34: v0.0.6 (CaffeineRecord, AlcoholTime, MB v2 fields)
function migrateV33toV34(logs: any[]): LogEntry[] {
    return logs.map(log => {
        if (!log.caffeineRecord) {
            log.caffeineRecord = { totalCount: 0, items: [] };
        }
        if (log.alcoholRecord && !log.alcoholRecord.time) {
            log.alcoholRecord.time = '20:00'; // Default time
        }
        if (log.masturbation) {
            log.masturbation = log.masturbation.map(m => ({
                ...m,
                volumeForceLevel: m.volumeForceLevel || (m.ejaculation ? 3 : undefined),
                postMood: m.postMood || undefined,
                fatigue: m.fatigue || undefined
            }));
        }
        return log;
    });
}

// V35: Fix legacy English symptoms (cold -> 感冒)
function migrateV34toV35(logs: any[]): LogEntry[] {
    const MAP: Record<string, string> = { 'cold': '感冒', 'fever': '发烧', 'headache': '头痛', 'other': '其他' };
    return logs.map(log => {
        if (log.health && Array.isArray(log.health.symptoms)) {
            log.health.symptoms = log.health.symptoms.map((s: string) => MAP[s] || s);
        }
        return log;
    });
}

// V36: Health Module Logic Refactor (discomfortLevel)
function migrateV35toV36(logs: any[]): LogEntry[] {
    return logs.map(log => {
        if (!log.health) return log;
        
        let discomfortLevel = undefined;
        // Map old feeling to new discomfortLevel if sick
        if (log.health.isSick) {
            if (log.health.feeling === 'minor_discomfort') discomfortLevel = 'mild';
            else if (log.health.feeling === 'bad') discomfortLevel = 'moderate';
            else discomfortLevel = 'mild'; // Default if sick but normal feeling
        } else {
            // Clean up if not sick
            log.health.symptoms = [];
            log.health.medications = [];
        }

        return {
            ...log,
            health: {
                ...log.health,
                discomfortLevel: discomfortLevel as any,
                // feeling is kept but deprecated, effectively replaced by logic above
            }
        };
    });
}

// V37: Migrate Content Assets to ContentItem[] (Strict No-Guessing)
function migrateV36toV37(logs: any[]): LogEntry[] {
    return logs.map(log => {
        if (!log.masturbation) return log;

        const newMasturbation = log.masturbation.map((m: any) => {
            // If already migrated, skip
            if (m.contentItems && m.contentItems.length > 0) return m;

            const contentItems: ContentItem[] = [];
            const assets = m.assets || {};
            const materialsList = m.materialsList || [];

            // Case A: Has materialsList (v0.0.5 structured data) -> Prefer this
            if (materialsList.length > 0) {
                materialsList.forEach((mat: any) => {
                    contentItems.push({
                        id: mat.id || `mig_${Date.now()}_${Math.random()}`,
                        type: '视频', // Default fallback, user can edit
                        platform: mat.publisher || undefined, // publisher maps somewhat to platform/studio
                        title: mat.label,
                        actors: mat.actors || [],
                        xpTags: mat.tags || [],
                        notes: '由旧版素材列表迁移'
                    });
                });
            } 
            // Case B: No materialsList, check assets (legacy flat arrays)
            else if (assets.sources || assets.platforms) {
                const types = assets.sources || [];
                const platforms = assets.platforms || [];
                
                const count = Math.max(types.length, platforms.length, 1);
                
                // If we need to split (count > 1), check logic
                const didSplit = count > 1 && (types.length > 1 || platforms.length > 1);

                for (let i = 0; i < count; i++) {
                    // Logic: If array length is 1, repeat it. If >1, index map. If index out of bounds, undefined.
                    const typeVal = types.length === 1 ? types[0] : types[i];
                    const platVal = platforms.length === 1 ? platforms[0] : platforms[i];
                    
                    // Skip empty creations if source arrays were empty
                    if (!typeVal && !platVal && count === 1) continue;

                    contentItems.push({
                        id: `mig_asset_${Date.now()}_${i}`,
                        type: typeVal || 'unknown',
                        platform: platVal,
                        title: assets.target || undefined, // target was often title/name
                        actors: assets.actors || [],
                        xpTags: assets.categories || [],
                        // Updated note text based on docs/content-item-migration-notes.md
                        notes: didSplit ? '此素材由旧版多选结构迁移生成，请检查类型与平台是否正确。' : undefined
                    });
                }
            }

            return {
                ...m,
                contentItems
            };
        });

        return { ...log, masturbation: newMasturbation };
    });
}

// V38: Add satisfactionLevel to Masturbation records
function migrateV37toV38(logs: any[]): LogEntry[] {
    return logs.map(log => {
        if (!log.masturbation) return log;
        return {
            ...log,
            masturbation: log.masturbation.map((m: any) => ({
                ...m,
                satisfactionLevel: m.satisfactionLevel ?? (m.ejaculation ? 3 : 1)
            }))
        };
    });
}

/**
 * REPAIR UTILS
 */
function repairLogs(logs: LogEntry[]): LogEntry[] {
    return logs.map(log => {
        if (!log.sleep) return log;
        // Basic check
        return log;
    });
}

/**
 * MIGRATION REGISTRY
 */
const MIGRATION_REGISTRY: Record<number, (logs: any[]) => any[]> = {
    2: migrateV1toV2,
    4: migrateV3toV4,
    6: migrateV5toV6,
    7: migrateV6toV7,
    8: migrateV7toV8,
    9: migrateV8toV9,
    10: migrateV9toV10,
    11: migrateV10toV11,
    12: migrateV11toV12,
    13: migrateV12toV13,
    14: migrateV13toV14,
    16: migrateV15toV16,
    23: migrateV22toV23,
    25: migrateV24toV25,
    26: migrateV25toV26,
    27: migrateV26toV27,
    29: migrateV28toV29,
    30: migrateV29toV30,
    31: migrateV30toV31,
    32: migrateV31toV32,
    33: migrateV32toV33,
    34: migrateV33toV34,
    35: migrateV34toV35,
    36: migrateV35toV36,
    37: migrateV36toV37,
    38: migrateV37toV38
};

export function runMigrations(data: any): StoredData {
  let currentVersion = 1;
  let rawLogs: any[] = [];

  if (typeof data === 'object' && data !== null && 'version' in data && 'logs' in data) {
    currentVersion = data.version;
    if (Array.isArray(data.logs)) rawLogs = data.logs;
    else if (data.logs && Array.isArray(data.logs.logs)) rawLogs = data.logs.logs;
  } else if (Array.isArray(data)) {
    currentVersion = 1;
    rawLogs = data;
  }

  const sanitizedLogs = rawLogs.filter((log): log is any => {
    return typeof log === 'object' && log !== null && typeof log.date === 'string' && !isNaN(new Date(log.date).getTime());
  });
  
  let migratedLogs = sanitizedLogs;

  for (let v = currentVersion + 1; v <= LATEST_VERSION; v++) {
      const migrationFn = MIGRATION_REGISTRY[v];
      if (migrationFn) {
          try {
              console.log(`[Migration] Running V${v-1} -> V${v}...`);
              migratedLogs = migrationFn(migratedLogs);
          } catch (e) {
              console.error(`[Migration] Failed at step V${v}:`, e);
              throw new Error(`Migration failed at version ${v}`);
          }
      }
  }

  migratedLogs = repairLogs(migratedLogs);

  return {
    version: LATEST_VERSION,
    logs: migratedLogs,
  };
}
