
import { Plugin } from '../services/PluginManager';
import { updateAlcoholModel } from '../utils/alcoholHelpers';

export const AlcoholAnalysisPlugin: Plugin = {
    id: 'core-alcohol-analysis',
    name: 'Alcohol Impact Predictor',
    version: '1.0.0',
    init: () => {
        // Any specific initialization if needed
    },
    onDataChange: (allLogs) => {
        // Trigger the ML model update whenever data changes
        updateAlcoholModel(allLogs);
    }
};

// Future plugins (e.g., CycleTracking, SpermWar) can be defined here or in separate files
