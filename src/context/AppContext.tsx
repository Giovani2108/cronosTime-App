import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules } from 'react-native';
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apps, setApps] = useState<AppItem[]>([]);

    useEffect(() => {
        loadApps();
    }, []);

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

    const syncWithNativeService = (appList: AppItem[]) => {
        const restrictedAppsConfig: { [key: string]: { cost: number; duration: number; message?: string; showMessage?: boolean } } = {};
        appList.filter(a => a.isRestricted).forEach(a => {
            restrictedAppsConfig[a.packageName] = {
                cost: a.unlockCost,
                duration: a.unlockDuration,
                message: a.motivationalMessage,
                showMessage: a.isMotivationEnabled
            };
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
                syncWithNativeService(parsedApps);
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
                        avoidedLaunches: existing ? existing.avoidedLaunches || 0 : 0,
                        motivationalMessage: existing ? existing.motivationalMessage || "Between stimulus and response there is a sacred space. In that space is the power to choose." : "Between stimulus and response there is a sacred space. In that space is the power to choose.",
                        isMotivationEnabled: existing ? existing.isMotivationEnabled !== false : true, // Default true
                    };
                });

                const sortedApps = sortApps(newApps);
                // Save to cache
                AsyncStorage.setItem('cached_apps', JSON.stringify(sortedApps));
                syncWithNativeService(sortedApps);
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
            syncWithNativeService(sortedApps);
            return sortedApps;
        });
    };

    const updateAppConfig = async (packageName: string, config: Partial<AppItem>) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, ...config } : app
            );
            AsyncStorage.setItem('cached_apps', JSON.stringify(newApps));
            syncWithNativeService(newApps);
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
