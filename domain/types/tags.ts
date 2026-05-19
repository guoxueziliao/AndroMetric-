export type TagType = 'xp' | 'event' | 'symptom';

export interface TagEntry {
    name: string;
    category: TagType;
    dimension?: string; // 仅对 XP 标签有效，如 "角色"、"玩法"
    createdAt: number;
}
