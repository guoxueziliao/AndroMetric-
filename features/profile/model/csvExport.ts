import type { AlcoholItem, CycleEvent, GoalCheckin, LogEntry, PartnerProfile, PregnancyEvent, PornUseEvent, MasturbationEvent, SexEvent, Snapshot, TagEntry, TrainingGoal } from '../../../domain';
import type { ExportDataset, ExportDimensions } from './exportOptions';

export interface CsvExportFile {
  name: string;
  content: string;
  addBom?: boolean;
}

export interface CsvExportMetadata {
  appVersion: string;
  dataVersion: number;
  exportedAt: string;
}

const CSV_MIME_TYPE = 'text/csv;charset=utf-8';
const ZIP_MIME_TYPE = 'application/zip';
const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const UTF8_FLAG = 0x0800;

const DAYS_HEADERS = [
  'date',
  'status',
  'morning_woke_with_erection',
  'morning_hardness',
  'morning_retention',
  'sleep_start',
  'sleep_end',
  'sleep_hours',
  'sleep_quality',
  'sex_count',
  'masturbation_count',
  'exercise_minutes_total',
  'alcohol_grams_total',
  'caffeine_total_count',
  'mood',
  'stress_level',
  'location',
  'weather',
  'notes'
];

const SEX_HEADERS = [
  'date',
  'id',
  'start_time',
  'duration_minutes',
  'partner',
  'location',
  'protection',
  'state',
  'orgasm',
  'partner_orgasm',
  'ejaculation',
  'ejaculation_location',
  'semen_swallowed',
  'partner_score',
  'mood',
  'notes',
  'interaction_partners',
  'interaction_locations',
  'acts',
  'positions',
  'toys',
  'costumes'
];

const MASTURBATION_HEADERS = [
  'date',
  'id',
  'start_time',
  'duration_minutes',
  'status',
  'tools',
  'content_types',
  'content_platforms',
  'xp_tags',
  'edging',
  'edging_count',
  'lubricant',
  'use_condom',
  'ejaculation',
  'orgasm_intensity',
  'satisfaction_level',
  'mood',
  'stress_level',
  'energy_level',
  'interrupted',
  'interruption_reasons',
  'volume_force_level',
  'post_mood',
  'fatigue',
  'post_fatigue',
  'location',
  'notes'
];

const EXERCISE_HEADERS = [
  'date',
  'id',
  'type',
  'start_time',
  'duration_minutes',
  'intensity',
  'body_parts',
  'steps',
  'feeling',
  'ongoing',
  'notes'
];

const ALCOHOL_HEADERS = [
  'date',
  'record_id',
  'time',
  'start_time',
  'duration_minutes',
  'is_late',
  'drunk_level',
  'alcohol_scene',
  'ongoing',
  'item_key',
  'item_name',
  'volume_ml',
  'abv',
  'count',
  'pure_alcohol_grams',
  'record_total_grams'
];

const PARTNER_HEADERS = [
  'id',
  'name',
  'type',
  'first_encounter_date',
  'social_tags',
  'sensitive_spots',
  'stimulation_preferences',
  'liked_positions',
  'notes'
];

const TAG_HEADERS = [
  'name',
  'category',
  'dimension',
  'created_at'
];

const CYCLE_EVENT_HEADERS = [
  'id',
  'partner_id',
  'date',
  'kind',
  'source',
  'confidence',
  'notes',
  'payload_json'
];

const PREGNANCY_EVENT_HEADERS = [
  'id',
  'partner_id',
  'date',
  'kind',
  'source',
  'notes',
  'payload_json'
];

const SNAPSHOT_HEADERS = [
  'id',
  'timestamp',
  'description',
  'kind',
  'data_version',
  'app_version',
  'logs_count',
  'partners_count',
  'tags_count',
  'cycle_events_count',
  'pregnancy_events_count'
];

const PORN_USE_EVENT_HEADERS = [
  'id',
  'target_date',
  'started_at',
  'duration_minutes',
  'ejaculation',
  'exceeded_time',
  'control_feeling',
  'led_to_masturbation',
  'linked_masturbation_ids',
  'linked_sex_ids',
  'notes'
];

const MASTURBATION_EVENT_HEADERS = [
  'id',
  'target_date',
  'started_at',
  'duration_minutes',
  'ejaculation',
  'edging',
  'hardness',
  'satisfaction',
  'linked_porn_use_ids',
  'linked_sex_ids',
  'notes'
];

const SEX_EVENT_HEADERS = [
  'id',
  'target_date',
  'started_at',
  'duration_minutes',
  'ejaculation',
  'porn_involved',
  'hardness',
  'satisfaction',
  'fatigue',
  'partner_ids',
  'linked_porn_use_ids',
  'linked_masturbation_ids',
  'notes'
];

const ADULT_EVENT_LINK_HEADERS = [
  'source_type',
  'source_id',
  'target_type',
  'target_id',
  'link_direction'
];

const TRAINING_GOAL_HEADERS = [
  'id',
  'title',
  'category',
  'status',
  'target_window_days',
  'start_date',
  'source',
  'linked_insight_id',
  'description',
  'created_at',
  'updated_at'
];

const GOAL_CHECKIN_HEADERS = [
  'id',
  'goal_id',
  'target_date',
  'status',
  'cycle_feeling',
  'note',
  'window_start_date',
  'window_end_date',
  'created_at'
];

const encoder = new TextEncoder();
let crcTable: Uint32Array | null = null;

const normalizeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return String(value);
};

const escapeCsvValue = (value: unknown) => {
  const normalized = normalizeCsvValue(value);
  if (!/[",\r\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
};

const toCsv = (headers: string[], rows: unknown[][]) => (
  `${headers.join(',')}\r\n${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')}${rows.length > 0 ? '\r\n' : ''}`
);

const joinList = (values: Array<string | undefined | null>) => values.filter((value): value is string => !!value).join('|');

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const round = (value: number) => Math.round(value * 100) / 100;

const getSleepHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return '';
  return round((endTime - startTime) / 3_600_000);
};

const getInteractionsField = (interactions: LogEntry['sex'][number]['interactions'], field: 'partner' | 'location') => (
  joinList(interactions.map((interaction) => interaction[field]))
);

const getInteractionActions = (interactions: LogEntry['sex'][number]['interactions'], type: 'act' | 'position') => (
  joinList(interactions.flatMap((interaction) => interaction.chain.filter((action) => action.type === type).map((action) => action.name)))
);

const getContentTags = (record: LogEntry['masturbation'][number]) => (
  joinList(record.contentItems.flatMap((item) => item.xpTags || []))
);

const createDaysCsv = (logs: LogEntry[]): CsvExportFile => ({
  name: 'days.csv',
  content: toCsv(DAYS_HEADERS, logs.map((log) => [
    log.date,
    log.status,
    log.morning?.wokeWithErection,
    log.morning?.hardness,
    log.morning?.retention,
    log.sleep?.startTime,
    log.sleep?.endTime,
    getSleepHours(log.sleep?.startTime, log.sleep?.endTime),
    log.sleep?.quality,
    log.sex.length,
    log.masturbation.length,
    sum(log.exercise.map((record) => record.duration || 0)),
    round(sum(log.alcoholRecords.map((record) => record.totalGrams || 0))),
    log.caffeineRecord?.totalCount,
    log.mood,
    log.stressLevel,
    log.location,
    log.weather,
    '' // notes excluded for privacy
  ]))
});

const createSexCsv = (logs: LogEntry[]): CsvExportFile => ({
  name: 'sex.csv',
  content: toCsv(SEX_HEADERS, logs.flatMap((log) => log.sex.map((record) => [
    log.date,
    record.id,
    record.startTime,
    record.duration,
    record.partner,
    record.location,
    record.protection,
    record.state,
    record.indicators.orgasm,
    record.indicators.partnerOrgasm,
    record.ejaculation,
    record.ejaculationLocation,
    record.semenSwallowed,
    record.partnerScore,
    record.mood,
    '', // notes excluded for privacy
    getInteractionsField(record.interactions, 'partner'),
    getInteractionsField(record.interactions, 'location'),
    record.acts?.join('|') || getInteractionActions(record.interactions, 'act'),
    record.positions?.join('|') || getInteractionActions(record.interactions, 'position'),
    joinList(record.interactions.flatMap((interaction) => interaction.toys)),
    joinList(record.interactions.flatMap((interaction) => interaction.costumes))
  ])))
});

const createMasturbationCsv = (logs: LogEntry[]): CsvExportFile => ({
  name: 'masturbation.csv',
  content: toCsv(MASTURBATION_HEADERS, logs.flatMap((log) => log.masturbation.map((record) => [
    log.date,
    record.id,
    record.startTime,
    record.duration,
    record.status,
    record.tools.join('|'),
    joinList(record.contentItems.map((item) => item.type)),
    joinList(record.contentItems.map((item) => item.platform)),
    getContentTags(record),
    record.edging,
    record.edgingCount,
    record.lubricant,
    record.useCondom,
    record.ejaculation,
    record.orgasmIntensity,
    record.satisfactionLevel,
    record.mood,
    record.stressLevel,
    record.energyLevel,
    record.interrupted,
    record.interruptionReasons.join('|'),
    record.volumeForceLevel,
    record.postMood,
    record.fatigue,
    record.postFatigue,
    record.location,
    '' // notes excluded for privacy
  ])))
});

const createExerciseCsv = (logs: LogEntry[]): CsvExportFile => ({
  name: 'exercise.csv',
  content: toCsv(EXERCISE_HEADERS, logs.flatMap((log) => log.exercise.map((record) => [
    log.date,
    record.id,
    record.type,
    record.startTime,
    record.duration,
    record.intensity,
    record.bodyParts?.join('|'),
    record.steps,
    record.feeling,
    record.ongoing,
    '' // notes excluded for privacy
  ])))
});

const createAlcoholRows = (log: LogEntry, record: LogEntry['alcoholRecords'][number]) => {
  const items: AlcoholItem[] = record.items.length > 0 ? record.items : [{
    key: '',
    name: '',
    volume: 0,
    abv: 0,
    count: 0,
    pureAlcohol: record.totalGrams
  }];

  return items.map((item) => [
    log.date,
    record.id,
    record.time,
    record.startTime,
    record.durationMinutes,
    record.isLate,
    record.drunkLevel,
    record.alcoholScene,
    record.ongoing,
    item.key,
    item.name,
    item.volume,
    item.abv,
    item.count,
    item.pureAlcohol,
    record.totalGrams
  ]);
};

const createAlcoholCsv = (logs: LogEntry[]): CsvExportFile => ({
  name: 'alcohol.csv',
  content: toCsv(ALCOHOL_HEADERS, logs.flatMap((log) => log.alcoholRecords.flatMap((record) => createAlcoholRows(log, record))))
});

const createPartnersCsv = (partners: PartnerProfile[]): CsvExportFile => ({
  name: 'partners.csv',
  content: toCsv(PARTNER_HEADERS, partners.map((partner) => [
    partner.id,
    partner.name,
    partner.type,
    partner.firstEncounterDate,
    partner.socialTags.join('|'),
    partner.sensitiveSpots.join('|'),
    partner.stimulationPreferences.join('|'),
    partner.likedPositions.join('|'),
    '' // notes excluded for privacy
  ]))
});

const createTagsCsv = (tags: TagEntry[]): CsvExportFile => ({
  name: 'tags.csv',
  content: toCsv(TAG_HEADERS, tags.map((tag) => [
    tag.name,
    tag.category,
    tag.dimension,
    tag.createdAt
  ]))
});

const createCycleEventsCsv = (events: CycleEvent[]): CsvExportFile => ({
  name: 'cycle_events.csv',
  content: toCsv(CYCLE_EVENT_HEADERS, events.map((event) => [
    event.id,
    event.partnerId,
    event.date,
    event.kind,
    event.source,
    event.confidence,
    '', // notes excluded for privacy
    event.payload ? JSON.stringify(event.payload) : ''
  ]))
});

const createPregnancyEventsCsv = (events: PregnancyEvent[]): CsvExportFile => ({
  name: 'pregnancy_events.csv',
  content: toCsv(PREGNANCY_EVENT_HEADERS, events.map((event) => [
    event.id,
    event.partnerId,
    event.date,
    event.kind,
    event.source,
    '', // notes excluded for privacy
    event.payload ? JSON.stringify(event.payload) : ''
  ]))
});

const createSnapshotsCsv = (snapshots: Snapshot[]): CsvExportFile => ({
  name: 'snapshots.csv',
  content: toCsv(SNAPSHOT_HEADERS, snapshots.map((snapshot) => [
    snapshot.id,
    snapshot.timestamp,
    snapshot.description,
    snapshot.kind,
    snapshot.dataVersion,
    snapshot.appVersion,
    snapshot.data.logs.length,
    snapshot.data.partners.length,
    snapshot.data.tags.length,
    snapshot.data.cycleEvents.length,
    snapshot.data.pregnancyEvents.length
  ]))
});

const createPornUseEventsCsv = (events: PornUseEvent[]): CsvExportFile => ({
  name: 'porn_use_events.csv',
  content: toCsv(PORN_USE_EVENT_HEADERS, events.map((e) => [
    e.id,
    e.targetDate,
    e.startedAt,
    e.durationMinutes,
    e.ejaculated,
    e.exceededIntendedTime,
    e.controlFeeling,
    e.ledToMasturbation,
    joinList(e.linkedMasturbationEventIds),
    joinList(e.linkedSexEventIds),
    '' // notes excluded for privacy
  ]))
});

const createMasturbationEventsCsv = (events: MasturbationEvent[]): CsvExportFile => ({
  name: 'masturbation_events.csv',
  content: toCsv(MASTURBATION_EVENT_HEADERS, events.map((e) => [
    e.id,
    e.targetDate,
    e.startedAt,
    e.durationMinutes,
    e.ejaculated,
    e.edging,
    e.hardnessLevel,
    e.satisfaction,
    joinList(e.linkedPornUseEventIds),
    joinList(e.linkedSexEventIds),
    '' // notes excluded for privacy
  ]))
});

const createSexEventsCsv = (events: SexEvent[]): CsvExportFile => ({
  name: 'sex_events.csv',
  content: toCsv(SEX_EVENT_HEADERS, events.map((e) => [
    e.id,
    e.targetDate,
    e.startedAt,
    e.durationMinutes,
    e.ejaculated,
    e.pornInvolved,
    e.hardnessLevel,
    e.satisfaction,
    e.fatigueAfter,
    joinList(e.partnerIds),
    joinList(e.linkedPornUseEventIds),
    joinList(e.linkedMasturbationEventIds),
    '' // notes excluded for privacy
  ]))
});

const createAdultEventLinksCsv = (
  pornEvents: PornUseEvent[],
  mbEvents: MasturbationEvent[],
  sexEvents: SexEvent[]
): CsvExportFile => {
  const rows: unknown[][] = [];
  for (const e of pornEvents) {
    for (const tid of e.linkedMasturbationEventIds) rows.push(['porn_use', e.id, 'masturbation', tid, 'forward']);
    for (const tid of e.linkedSexEventIds) rows.push(['porn_use', e.id, 'sex', tid, 'forward']);
  }
  for (const e of mbEvents) {
    for (const tid of e.linkedPornUseEventIds) rows.push(['masturbation', e.id, 'porn_use', tid, 'forward']);
    for (const tid of e.linkedSexEventIds) rows.push(['masturbation', e.id, 'sex', tid, 'forward']);
  }
  for (const e of sexEvents) {
    for (const tid of e.linkedPornUseEventIds) rows.push(['sex', e.id, 'porn_use', tid, 'forward']);
    for (const tid of e.linkedMasturbationEventIds) rows.push(['sex', e.id, 'masturbation', tid, 'forward']);
  }
  return { name: 'adult_event_links.csv', content: toCsv(ADULT_EVENT_LINK_HEADERS, rows) };
};

const createTrainingGoalsCsv = (goals: TrainingGoal[]): CsvExportFile => ({
  name: 'training_goals.csv',
  content: toCsv(TRAINING_GOAL_HEADERS, goals.map((g) => [
    g.id,
    g.title,
    g.category,
    g.status,
    g.targetWindowDays,
    g.startDate,
    g.source,
    g.linkedInsightId ?? '',
    g.description ?? '',
    g.createdAt,
    g.updatedAt
  ]))
});

const createGoalCheckinsCsv = (checkins: GoalCheckin[]): CsvExportFile => ({
  name: 'goal_checkins.csv',
  content: toCsv(GOAL_CHECKIN_HEADERS, checkins.map((c) => [
    c.id,
    c.goalId,
    c.targetDate,
    c.status,
    c.cycleFeeling ?? '',
    '', // note excluded for privacy
    c.windowStartDate ?? '',
    c.windowEndDate ?? '',
    c.createdAt
  ]))
});

const getSortedLogs = (logs: LogEntry[]) => [...logs].sort((a, b) => a.date.localeCompare(b.date));

const createMetaJson = (metadata: CsvExportMetadata): CsvExportFile => ({
  name: 'meta.json',
  content: `${JSON.stringify(metadata, null, 2)}\n`,
  addBom: false
});

export const buildCsvExportFiles = (logs: LogEntry[], metadata?: CsvExportMetadata): CsvExportFile[] => {
  const sortedLogs = getSortedLogs(logs);
  const files = [
    createDaysCsv(sortedLogs),
    createSexCsv(sortedLogs),
    createMasturbationCsv(sortedLogs),
    createExerciseCsv(sortedLogs),
    createAlcoholCsv(sortedLogs)
  ];

  return metadata ? [createMetaJson(metadata), ...files] : files;
};

export const buildCsvExportFilesFromDataset = (
  dataset: ExportDataset,
  dimensions: ExportDimensions,
  metadata?: CsvExportMetadata
): CsvExportFile[] => {
  const sortedLogs = getSortedLogs(dataset.logs);
  const files: CsvExportFile[] = [];

  if (dimensions.logs) {
    files.push(
      createDaysCsv(sortedLogs),
      createSexCsv(sortedLogs),
      createMasturbationCsv(sortedLogs),
      createExerciseCsv(sortedLogs),
      createAlcoholCsv(sortedLogs)
    );
  }

  if (dimensions.partners) files.push(createPartnersCsv(dataset.partners));
  if (dimensions.tags) files.push(createTagsCsv(dataset.tags));
  if (dimensions.cycleEvents) files.push(createCycleEventsCsv(dataset.cycleEvents));
  if (dimensions.pregnancyEvents) files.push(createPregnancyEventsCsv(dataset.pregnancyEvents));
  if (dimensions.snapshots) files.push(createSnapshotsCsv(dataset.snapshots));

  // Adult behavior events (always included when present)
  const pornEvents = dataset.pornUseEvents ?? [];
  const mbEvents = dataset.masturbationEvents ?? [];
  const sxEvents = dataset.sexEvents ?? [];
  if (pornEvents.length > 0 || mbEvents.length > 0 || sxEvents.length > 0) {
    if (pornEvents.length > 0) files.push(createPornUseEventsCsv(pornEvents));
    if (mbEvents.length > 0) files.push(createMasturbationEventsCsv(mbEvents));
    if (sxEvents.length > 0) files.push(createSexEventsCsv(sxEvents));
    files.push(createAdultEventLinksCsv(pornEvents, mbEvents, sxEvents));
  }

  // Training data (always included when present)
  const goals = dataset.trainingGoals ?? [];
  const checkins = dataset.goalCheckins ?? [];
  if (goals.length > 0) files.push(createTrainingGoalsCsv(goals));
  if (checkins.length > 0) files.push(createGoalCheckinsCsv(checkins));

  return metadata ? [createMetaJson(metadata), ...files] : files;
};

const getCrcTable = () => {
  if (crcTable) return crcTable;

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[i] = value >>> 0;
  }
  crcTable = table;
  return table;
};

const crc32 = (data: Uint8Array) => {
  const table = getCrcTable();
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
const writeUint32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value, true);

const createLocalHeader = (nameBytes: Uint8Array, dataBytes: Uint8Array, crc: number) => {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  writeUint32(view, 0, ZIP_LOCAL_FILE_HEADER);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, UTF8_FLAG);
  writeUint16(view, 8, 0);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint32(view, 14, crc);
  writeUint32(view, 18, dataBytes.length);
  writeUint32(view, 22, dataBytes.length);
  writeUint16(view, 26, nameBytes.length);
  writeUint16(view, 28, 0);
  header.set(nameBytes, 30);
  return header;
};

const createCentralDirectoryHeader = (nameBytes: Uint8Array, dataBytes: Uint8Array, crc: number, localHeaderOffset: number) => {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  writeUint32(view, 0, ZIP_CENTRAL_DIRECTORY_HEADER);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, 20);
  writeUint16(view, 8, UTF8_FLAG);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint16(view, 14, 0);
  writeUint32(view, 16, crc);
  writeUint32(view, 20, dataBytes.length);
  writeUint32(view, 24, dataBytes.length);
  writeUint16(view, 28, nameBytes.length);
  writeUint16(view, 30, 0);
  writeUint16(view, 32, 0);
  writeUint16(view, 34, 0);
  writeUint16(view, 36, 0);
  writeUint32(view, 38, 0);
  writeUint32(view, 42, localHeaderOffset);
  header.set(nameBytes, 46);
  return header;
};

const createEndOfCentralDirectory = (fileCount: number, centralDirectorySize: number, centralDirectoryOffset: number) => {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  writeUint32(view, 0, ZIP_END_OF_CENTRAL_DIRECTORY);
  writeUint16(view, 4, 0);
  writeUint16(view, 6, 0);
  writeUint16(view, 8, fileCount);
  writeUint16(view, 10, fileCount);
  writeUint32(view, 12, centralDirectorySize);
  writeUint32(view, 16, centralDirectoryOffset);
  writeUint16(view, 20, 0);
  return header;
};

export const buildCsvZipBlob = (files: CsvExportFile[]) => {
  const localParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(`${file.addBom === false ? '' : '\uFEFF'}${file.content}`);
    const crc = crc32(dataBytes);
    const localHeader = createLocalHeader(nameBytes, dataBytes, crc);
    const centralDirectoryHeader = createCentralDirectoryHeader(nameBytes, dataBytes, crc, offset);

    localParts.push(localHeader, dataBytes);
    centralDirectoryParts.push(centralDirectoryHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectoryParts.reduce((total, part) => total + part.length, 0);
  const endHeader = createEndOfCentralDirectory(files.length, centralDirectorySize, centralDirectoryOffset);

  const blobParts = [...localParts, ...centralDirectoryParts, endHeader].map((part) => {
    const copy = new Uint8Array(part.byteLength);
    copy.set(part);
    return copy.buffer;
  });

  return new Blob(blobParts, { type: ZIP_MIME_TYPE });
};

export const createCsvExportBlob = (logs: LogEntry[], metadata?: CsvExportMetadata) => buildCsvZipBlob(buildCsvExportFiles(logs, metadata));
export const createCsvExportBlobFromDataset = (
  dataset: ExportDataset,
  dimensions: ExportDimensions,
  metadata?: CsvExportMetadata
) => buildCsvZipBlob(buildCsvExportFilesFromDataset(dataset, dimensions, metadata));
export const csvExportMimeType = CSV_MIME_TYPE;
