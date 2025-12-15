
export interface DataHealthIssue {
    id: string;
    date: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
}

export interface DataHealthReport {
    score: number;
    issues: DataHealthIssue[];
    totalRecords: number;
    canRepair: boolean;
}
