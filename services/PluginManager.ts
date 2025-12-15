
import { LogEntry } from '../types';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  init?: () => void;
  /**
   * Called whenever the main log database is updated (save/delete/import).
   * Plugins can use this to update their own derived data stores or analytics models.
   */
  onDataChange?: (allLogs: LogEntry[]) => void;
}

class PluginManager {
  private plugins: Plugin[] = [];
  private isInitialized = false;

  register(plugin: Plugin) {
    // Prevent duplicate registration
    if (this.plugins.some(p => p.id === plugin.id)) {
        console.warn(`[PluginManager] Plugin ${plugin.id} is already registered.`);
        return;
    }
    
    this.plugins.push(plugin);
    console.log(`[PluginManager] Registered plugin: ${plugin.name} v${plugin.version}`);
    
    if (this.isInitialized && plugin.init) {
        try {
            plugin.init();
        } catch (e) {
            console.error(`[PluginManager] Failed to init plugin ${plugin.id}:`, e);
        }
    }
  }

  initAll() {
      if (this.isInitialized) return;
      this.plugins.forEach(p => {
          if (p.init) {
              try {
                  p.init();
              } catch (e) {
                  console.error(`[PluginManager] Failed to init plugin ${p.id}:`, e);
              }
          }
      });
      this.isInitialized = true;
  }

  notifyDataChange(allLogs: LogEntry[]) {
    this.plugins.forEach(p => {
        if (p.onDataChange) {
            // Run in background to not block UI/Storage
            setTimeout(() => {
                try {
                    p.onDataChange!(allLogs);
                } catch (e) {
                    console.error(`[PluginManager] Plugin ${p.id} failed onDataChange:`, e);
                }
            }, 0);
        }
    });
  }
  
  getPlugins() {
      return this.plugins;
  }
}

export const pluginManager = new PluginManager();
