
export const Logger = {
    log: (msg: string, ...args: any[]) => console.log(`[Log] ${msg}`, ...args),
    error: (msg: string, error?: any, ...args: any[]) => console.error(`[Error] ${msg}`, error, ...args),
};
