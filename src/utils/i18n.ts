import { NativeModules, Platform } from 'react-native';

const getDeviceLanguage = () => {
    try {
        if (Platform.OS === 'ios') {
            return (
                NativeModules.SettingsManager?.settings?.AppleLocale ||
                NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                'en'
            );
        } else {
            return NativeModules.I18nManager?.localeIdentifier || 'en';
        }
    } catch (e) {
        return 'en';
    }
};

const deviceLanguage = getDeviceLanguage();
const isSpanish = (deviceLanguage || '').includes('es');

export const strings = {
    title: 'Crontime',
    currentBalance: isSpanish ? 'Saldo Actual' : 'Current Balance',
    coins: isSpanish ? 'Monedas' : 'Coins',
    earnCoins: isSpanish ? 'Ganar 10 Monedas (Demo)' : 'Earn 10 Coins (Demo)',
    configureApps: isSpanish ? 'Configurar Apps' : 'Configure Apps',
    selectApps: isSpanish ? 'Seleccionar Apps' : 'Select Apps',
    checkPermissions: isSpanish ? 'Verificar Permisos' : 'Check Permissions',
    refreshApps: isSpanish ? 'Recargar' : 'Refresh',
    noAppsFound: isSpanish ? 'No se encontraron apps' : 'No apps found',
    tapForDetails: isSpanish ? 'Toca para detalles' : 'Tap for details',
    appDetails: isSpanish ? 'Detalles de' : 'Details for',
    weeklyUsage: isSpanish ? 'Uso Semanal' : 'Weekly Usage',
    configuration: isSpanish ? 'Configuración' : 'Configuration',
    unlockCost: isSpanish ? 'Costo de Desbloqueo' : 'Unlock Cost',
    unlockDuration: isSpanish ? 'Duración (min)' : 'Duration (min)',
    saveClose: isSpanish ? 'Guardar y Cerrar' : 'Save & Close',
    restricted: isSpanish ? 'Restringida' : 'Restricted',
    allowed: isSpanish ? 'Permitida' : 'Allowed',
    costPerUnlock: isSpanish ? 'Costo por desbloqueo' : 'Cost per unlock',
    durationMinutes: isSpanish ? 'Duración (minutos)' : 'Duration (minutes)',
    loadingStats: isSpanish ? 'Cargando estadísticas...' : 'Loading stats...',
    save: isSpanish ? 'Guardar' : 'Save',
    permissionsTitle: isSpanish ? 'Permisos Requeridos' : 'Required Permissions',
    permissionsDesc: isSpanish ? 'Para que Digital Balance funcione correctamente, necesitamos los siguientes permisos:' : 'For Digital Balance to work correctly, we need the following permissions:',
    permUsage: isSpanish ? 'Acceso a Uso' : 'Usage Access',
    permOverlay: isSpanish ? 'Superposición' : 'Display over other apps',
    permNotif: isSpanish ? 'Notificaciones' : 'Notifications',
    permBattery: isSpanish ? 'Optimización de Batería' : 'Battery Optimization',
    today: isSpanish ? 'Hoy' : 'Today',
    thisWeek: isSpanish ? 'Esta semana' : 'This Week',
    upcoming: isSpanish ? 'Programadas' : 'Upcoming',
    grant: isSpanish ? 'Conceder' : 'Grant',
    granted: isSpanish ? 'Concedido' : 'Granted',
    continue: isSpanish ? 'Continuar' : 'Continue',
    noActiveTasks: isSpanish ? 'No hay tareas activas' : 'No active tasks',
    customize: isSpanish ? 'Personalizar' : 'Customize',
    firstDayOfWeek: isSpanish ? 'El primer día de la semana es' : 'First day of the week is',
    nextWeekBehavior: isSpanish ? 'Programar una tarea con Next Week significa' : 'Scheduling a task with Next Week means',
    sameDay: isSpanish ? 'Mismo día del registro + 1 semana' : 'Same day + 1 week',
    startOfWeek: isSpanish ? 'El primer día de la siguiente semana' : 'The first day of the next week',
    saturday: isSpanish ? 'Sábado' : 'Saturday',
    sunday: isSpanish ? 'Domingo' : 'Sunday',
    monday: isSpanish ? 'Lunes' : 'Monday',
    noTasksToday: isSpanish ? '¡Yuju!! No tienes tareas para hoy' : 'Woohoo!! No tasks for today',
    noTasksWeek: isSpanish ? '¡Yuju!! No tienes tareas para esta semana' : 'Woohoo!! No tasks for this week',
    noTasksUpcoming: isSpanish ? 'No tienes tareas programadas' : 'No upcoming tasks',
};
