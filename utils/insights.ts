
export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'warning' | 'neutral';
    title: string;
    description: string;
}

export const generateInsights = (logs: any[]): Insight[] => [];
