import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';

class NotificationService {
    constructor() {
        this.createChannel();
    }

    async createChannel() {
        // Create a channel (required for Android)
        await notifee.createChannel({
            id: 'task-reminders',
            name: 'Task Reminders',
            importance: AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    async requestPermissions() {
        await notifee.requestPermission();
    }

    async scheduleNotification(id: string, title: string, message: string, date: Date) {
        // Ensure permissions
        await this.requestPermissions();

        // Create a time-based trigger
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: date.getTime(),
        };

        // Create a trigger notification
        await notifee.createTriggerNotification(
            {
                id: id,
                title: title,
                body: message,
                android: {
                    channelId: 'task-reminders',
                    pressAction: {
                        id: 'default',
                    },
                    smallIcon: 'ic_launcher', // verify if this exists, otherwise defaults usually work or use 'ic_notification'
                },
            },
            trigger,
        );

        console.log(`Notification scheduled: ${title} at ${date}`);
    }

    async cancelNotification(id: string) {
        await notifee.cancelNotification(id);
    }
}

export default new NotificationService();
