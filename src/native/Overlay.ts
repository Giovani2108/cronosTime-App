import { NativeModules } from 'react-native';

const { OverlayModule } = NativeModules;

export interface OverlayInterface {
    checkOverlayPermission(): Promise<boolean>;
    requestOverlayPermission(): void;
    checkNotificationPermission(): Promise<boolean>;
    requestNotificationPermission(): void;
    checkBatteryOptimization(): Promise<boolean>;
    requestBatteryOptimization(): void;
    startMonitoring(restrictedAppsJson: string): void;
    stopMonitoring(): void;
}

export default OverlayModule as OverlayInterface;
