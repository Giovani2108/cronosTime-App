import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { OverlayModule, UsageStatsModule } = NativeModules;

export interface AppItem {
    packageName: string;
    appName: string;
    icon: string; // Base64
    isRestricted: boolean;
    unlockCost: number;
    unlockDuration: number;
    usageTime?: number;
    avoidedLaunches: number;
    motivationalMessage: string;
    isMotivationEnabled: boolean;
}

interface AppContextType {
    apps: AppItem[];
    toggleRestriction: (packageName: string) => void;
    updateAppConfig: (packageName: string, config: Partial<AppItem>) => void;
    incrementAvoidedLaunches: (packageName: string) => void;
    loadApps: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
    apps: [],
    toggleRestriction: () => { },
    updateAppConfig: () => { },
    incrementAvoidedLaunches: () => { },
    loadApps: async () => { },
});

import { useWallet } from './WalletContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apps, setApps] = useState<AppItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { coins } = useWallet();

    useEffect(() => {
        // Initial load of apps
        loadApps();

        // Reload apps when coming to foreground to get fresh stats (like avoidedLaunches)
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                loadApps();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        // Sync with native service whenever apps or coins change
        syncWithNativeService(apps, coins);
    }, [apps, coins]);

    const sortApps = (appList: AppItem[]) => {
        return appList.sort((a, b) => {
            if (a.isRestricted !== b.isRestricted) {
                return a.isRestricted ? -1 : 1;
            }
            // If both are restricted or both are unrestricted, sort by usage time (descending)
            const usageA = a.usageTime || 0;
            const usageB = b.usageTime || 0;
            return usageB - usageA;
        });
    };

    const syncWithNativeService = async (appList: AppItem[], currentCoins: number) => {
        const restrictedAppsConfig: { [key: string]: any } = {};

        // We need to process apps sequentially to fetch usage stats
        for (const a of appList.filter(a => a.isRestricted)) {
            let usageHistory = [0, 0, 0, 0, 0, 0, 0];
            try {
                const history = await NativeModules.UsageStatsModule.getWeeklyUsage(a.packageName);
                // Convert history to simple array of minutes for the last 7 days
                // History comes as [{date: number, usage: number}, ...]
                // We'll assume the native module returns ordered data or we just take the usage values
                // For simplicity in this sync function, let's just map the usage to minutes
                if (Array.isArray(history)) {
                    usageHistory = history.slice(0, 7).map((item: any) => Math.round(item.usage / 1000 / 60));
                }
            } catch (e) {
                console.error("Failed to fetch usage for sync", e);
            }

            restrictedAppsConfig[a.packageName] = {
                cost: a.unlockCost,
                duration: a.unlockDuration,
                message: a.motivationalMessage,
                showMessage: a.isMotivationEnabled,
                appName: a.appName,
                icon: a.icon,
                usageHistory: usageHistory
            };
        }

        // Pass coins as a separate top-level key or inside each app config? 
        // MonitorService expects a map of packageName -> config. 
        // We can add a special key "GLOBAL_CONFIG" or just embed coins in every app config.
        // Embedding in every app config is easier for the current MonitorService structure.
        Object.keys(restrictedAppsConfig).forEach(key => {
            restrictedAppsConfig[key].walletCoins = currentCoins;
        });

        OverlayModule.startMonitoring(JSON.stringify(restrictedAppsConfig));
    };

    const loadApps = async () => {
        try {
            // 1. Load from cache first
            const cachedApps = await AsyncStorage.getItem('cached_apps');
            if (cachedApps) {
                const parsedApps = JSON.parse(cachedApps);
                setApps(parsedApps);
                syncWithNativeService(parsedApps, coins);
            }

            // 2. Fetch from native (background update)
            const installedApps = await UsageStatsModule.getInstalledApps();

            setApps(prevApps => {
                const newApps = installedApps.map((app: any) => {
                    const existing = prevApps.find(a => a.packageName === app.packageName);
                    return {
                        ...app,
                        isRestricted: existing ? existing.isRestricted : false,
                        unlockCost: existing ? existing.unlockCost : 10,
                        unlockDuration: existing ? existing.unlockDuration : 10 * 60 * 1000, // Default 10 mins
                        // Use the fresh count from native (app.avoidedLaunches), fallback to existing only if missing
                        avoidedLaunches: app.avoidedLaunches !== undefined ? app.avoidedLaunches : (existing ? existing.avoidedLaunches || 0 : 0),
                        motivationalMessage: existing ? existing.motivationalMessage || "Between stimulus and response there is a sacred space. In that space is the power to choose." : "Between stimulus and response there is a sacred space. In that space is the power to choose.",
                        isMotivationEnabled: existing ? existing.isMotivationEnabled !== false : true, // Default true
                    };
                });

                const sortedApps = sortApps(newApps);
                // Save to cache
                AsyncStorage.setItem('cached_apps', JSON.stringify(sortedApps));
                syncWithNativeService(sortedApps, coins);
                return sortedApps;
            });

        } catch (error) {
            console.error("Failed to load apps", error);
        }
    };

    const toggleRestriction = async (packageName: string) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, isRestricted: !app.isRestricted } : app
            );
            const sortedApps = sortApps(newApps);
            AsyncStorage.setItem('cached_apps', JSON.stringify(sortedApps));
            syncWithNativeService(sortedApps, coins);
            return sortedApps;
        });
    };

    const updateAppConfig = async (packageName: string, config: Partial<AppItem>) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, ...config } : app
            );
            AsyncStorage.setItem('cached_apps', JSON.stringify(newApps));
            syncWithNativeService(newApps, coins);
            return newApps;
        });
    };

    const incrementAvoidedLaunches = async (packageName: string) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, avoidedLaunches: (app.avoidedLaunches || 0) + 1 } : app
            );
            AsyncStorage.setItem('cached_apps', JSON.stringify(newApps));
            return newApps;
        });
    };

    return (
        <AppContext.Provider value={{ apps, toggleRestriction, updateAppConfig, incrementAvoidedLaunches, loadApps }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApps = () => useContext(AppContext);
