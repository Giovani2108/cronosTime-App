import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task, Difficulty } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onPress?: (task: Task) => void;
}



const formatTaskDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    // Create new Date objects for comparison to avoid modifying the originals/current time components affecting result
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const t = new Date(today);
    t.setHours(0, 0, 0, 0);

    const diffTime = d.getTime() - t.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    // Within next 7 days (2 to 6 days ahead)
    if (diffDays >= 2 && diffDays < 7) {
        return d.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return d.toLocaleDateString();
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onPress }) => {
    const { colors } = useTheme();
    const isOverdue = new Date(task.dueDate) < new Date() && !task.isCompleted;

    const getDifficultyColor = (difficulty: Difficulty) => {
        switch (difficulty) {
            case 'trivial': return '#9E9E9E';
            case 'easy': return colors.primary; // User requested "Normal theme color"
            case 'medium': return '#4caf50'; // Green
            case 'hard': return '#f44336'; // Red
            case 'custom': return '#9C27B0'; // Purple
            default: return '#9E9E9E';
        }
    };

    const difficultyColor = getDifficultyColor(task.difficulty);

    return (
        <View style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
            task.isCompleted && { opacity: 0.9 }
        ]}>
            <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkContainer}>
                <View style={[
                    styles.checkbox,
                    task.isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: difficultyColor }
                ]}>
                    {task.isCompleted && <Icon name="check" size={16} color="#FFF" />}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.content}
                onPress={() => onPress && onPress(task)}
                activeOpacity={onPress ? 0.7 : 1}
            >
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.title,
                        { color: colors.text },
                        task.isCompleted && styles.completedText
                    ]}>
                        {task.title}
                    </Text>

                    {task.description ? (
                        <Text style={[styles.description, { color: colors.subText }]} numberOfLines={1}>
                            {task.description}
                        </Text>
                    ) : null}

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="event" size={16} color={isOverdue ? '#f44336' : colors.subText} />
                            <Text style={[
                                styles.metaText,
                                { color: isOverdue ? '#f44336' : colors.subText }
                            ]}>
                                {formatTaskDate(task.dueDate)}
                            </Text>
                        </View>

                        {task.recurrence !== 'none' && (
                            <View style={styles.metaItem}>
                                <Icon name="repeat" size={12} color={colors.subText} />
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.coinContainer}>
                    <Icon name="monetization-on" size={16} color={difficultyColor} />
                    <Text style={[styles.coinText, { color: difficultyColor }]}>+{task.coinsReward}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteBtn}>
                {/*  Optional delete action if needed */}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    checkContainer: {
        marginRight: 15,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    description: {
        fontSize: 12,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    metaText: {
        fontSize: 14,
        marginLeft: 6,
    },
    deleteBtn: {
        padding: 5,
    },
    coinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor removed for subtlety
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 10,
    },
    coinText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFB300', // Slightly darker amber for better contrast on white, still gold-ish
        marginLeft: 4,
    }
});

export default TaskItem;
