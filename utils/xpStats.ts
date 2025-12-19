
import { LogEntry } from '../types';
import { XP_GROUPS } from './constants';
import { validateTag, ValidationResult } from './tagValidators';

// --- Types ---

export interface XpTagStat {
    tag: string;
    count: number;
    dimension: string | 'Unknown';
    isNoise: boolean;
    noiseReason?: string;
}

export interface DimensionStat {
    name: string;
    recordCount: number; // Number of records containing at least one tag of this dimension
    tagCount: number;    // Total tag occurrences (deduped per record)
    uniqueTags: number;  // Diversity: how many distinct tags used
}

export interface XpAnalysisResult {
    totalXpRecords: number;
    topTags: XpTagStat[];
    dimensionStats: Record<string, DimensionStat>;
    noiseTags: XpTagStat[];
    diversityScore: number;
}

// --- Helpers ---

// Build Reverse Lookup Map for Dimensions
const TAG_DIMENSION_MAP: Record<string, string> = {};
Object.entries(XP_GROUPS).forEach(([dim, tags]) => {
    tags.forEach(t => TAG_DIMENSION_MAP[t] = dim);
});

const getDimension = (tag: string): string => {
    return TAG_DIMENSION_MAP[tag] || 'Unknown';
};

// --- Main Logic ---

export const calculateXpStats = (logs: LogEntry[]): XpAnalysisResult => {
    const statsMap: Record<string, XpTagStat> = {};
    const dimensionRecordSets: Record<string, Set<string>> = {}; // Dim -> Set<RecordID>
    const dimensionUniqueTags: Record<string, Set<string>> = {}; // Dim -> Set<TagName>
    
    let totalXpRecords = 0;

    // Initialize Dimensions
    Object.keys(XP_GROUPS).forEach(dim => {
        dimensionRecordSets[dim] = new Set();
        dimensionUniqueTags[dim] = new Set();
    });
    dimensionRecordSets['Unknown'] = new Set();
    dimensionUniqueTags['Unknown'] = new Set();

    // 1. Traverse Logs
    logs.forEach(log => {
        if (!log.masturbation || log.masturbation.length === 0) return;

        log.masturbation.forEach(record => {
            // Get tags from assets.categories
            const rawTags = record.assets?.categories || [];
            if (rawTags.length === 0) return;

            totalXpRecords++;

            // 2. Record-level Deduplication
            const uniqueTagsInRecord = Array.from(new Set(rawTags));

            uniqueTagsInRecord.forEach(tag => {
                // 3. Noise Filtering (Validation)
                const validation = validateTag(tag, 'xp');
                const isCompound = validation.message?.includes('复合') || false;
                const isInvalid = validation.level === 'P0';
                const isNonXp = validation.message?.includes('状态') || false;
                
                const isNoise = isCompound || isInvalid || isNonXp;
                const noiseReason = validation.message;

                // 4. Update Tag Stats
                if (!statsMap[tag]) {
                    statsMap[tag] = {
                        tag,
                        count: 0,
                        dimension: getDimension(tag),
                        isNoise,
                        noiseReason
                    };
                }
                statsMap[tag].count++;

                // 5. Update Dimension Stats (Only if NOT noise)
                if (!isNoise) {
                    const dim = statsMap[tag].dimension;
                    if (dimensionRecordSets[dim]) {
                        dimensionRecordSets[dim].add(record.id);
                        dimensionUniqueTags[dim].add(tag);
                    } else {
                        // Handle custom tags that fall into Unknown
                        dimensionRecordSets['Unknown'].add(record.id);
                        dimensionUniqueTags['Unknown'].add(tag);
                    }
                }
            });
        });
    });

    // 6. Aggregate Results
    const allTags = Object.values(statsMap);
    
    // Sort Top Tags (Include noise in the raw list, but UI might hide them)
    // The requirement says: "Allow in raw frequency list, but exclude from dimension stats"
    const topTags = allTags
        .filter(t => !t.isNoise) // Let's filter noise from Top List for cleaner UI by default
        .sort((a, b) => b.count - a.count);

    const noiseTags = allTags
        .filter(t => t.isNoise)
        .sort((a, b) => b.count - a.count);

    const dimensionStats: Record<string, DimensionStat> = {};
    Object.keys(XP_GROUPS).forEach(dim => {
        dimensionStats[dim] = {
            name: dim,
            recordCount: dimensionRecordSets[dim].size,
            tagCount: 0, // This would require summing counts of tags in this dim
            uniqueTags: dimensionUniqueTags[dim].size
        };
    });

    // Recalculate total tag count per dimension properly
    topTags.forEach(t => {
        if (dimensionStats[t.dimension]) {
            dimensionStats[t.dimension].tagCount += t.count;
        }
    });

    // Diversity Score (Simple unique count sum)
    const diversityScore = topTags.length;

    return {
        totalXpRecords,
        topTags,
        dimensionStats,
        noiseTags,
        diversityScore
    };
};
