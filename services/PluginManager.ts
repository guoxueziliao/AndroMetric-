
export interface Plugin {
    id: string;
    name: string;
    version: string;
    init: () => void;
    onDataChange?: (data: any) => void;
}

class PluginManager {
    plugins: Plugin[] = [];

    register(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    initAll() {
        this.plugins.forEach(p => p.init());
    }
}

export const pluginManager = new PluginManager();
