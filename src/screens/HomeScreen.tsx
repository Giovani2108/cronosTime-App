import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity, NativeModules, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { useTasks, Task } from '../context/TaskContext';
import { CompactHeader, TaskItem } from '../components';
import AddTaskModal from '../components/AddTaskModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { strings } from '../utils/i18n';

const { SoundModule } = NativeModules;

const HomeScreen = () => {
    const { colors } = useTheme();
    const { tasks, loadTasks, completeTask, addTask, updateTask, deleteTask, firstDayOfWeek } = useTasks();
    const { addCoins } = useWallet();
    const [modalVisible, setModalVisible] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Filter tasks
    // Group tasks
    const activeSections = useMemo(() => {
        const sections = [
            { title: strings.today, data: [] as Task[] },
            { title: strings.thisWeek, data: [] as Task[] },
            { title: strings.upcoming, data: [] as Task[] }
        ];

        const today = new Date();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Calculate end of the current week based on firstDayOfWeek
        // firstDayOfWeek: 'Sunday' (0), 'Monday' (1), 'Saturday' (6)
        const targetDayIndex = firstDayOfWeek === 'Sunday' ? 0 : firstDayOfWeek === 'Monday' ? 1 : 6;
        const currentDayIndex = today.getDay();

        // Calculate days until the start of the NEXT week
        let daysToNextWeekStart = targetDayIndex - currentDayIndex;
        if (daysToNextWeekStart <= 0) {
            daysToNextWeekStart += 7;
        }

        // The end of the current week is the day before the start of the next week
        const endOfWeekDate = new Date(today);
        endOfWeekDate.setDate(today.getDate() + daysToNextWeekStart - 1);
        endOfWeekDate.setHours(23, 59, 59, 999);

        tasks.filter(t => !t.isCompleted).forEach(task => {
            const dueDate = new Date(task.dueDate);

            if (dueDate >= todayStart && dueDate <= todayEnd) {
                sections[0].data.push(task);
            } else if (dueDate > todayEnd && dueDate <= endOfWeekDate) {
                sections[1].data.push(task);
            } else if (dueDate > endOfWeekDate) {
                sections[2].data.push(task);
            }
            // Tasks before today (overdue) are typically shown in Today or separate. 
            // For now, let's put overdue in Today or handle them? 
            // User didn't specify, but standard behavior is usually Today or Overdue. 
            // Current logic puts them nowhere if < todayStart.
            // Let's assume overdue goes to Today for visibility.
            else if (dueDate < todayStart) {
                sections[0].data.push(task);
            }
        });

        // Always return all sections, even if empty
        return sections;
    }, [tasks, firstDayOfWeek]);

    const completedTasks = useMemo(() => tasks.filter(t => t.isCompleted), [tasks]);

    const handleToggleTask = async (taskId: string) => {
        if (SoundModule?.playBubblePop) {
            SoundModule.playBubblePop();
        }
        Vibration.vibrate(50);
        await completeTask(taskId);
    };

    const handleTaskPress = (task: Task) => {
        setEditingTask(task);
        setModalVisible(true);
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setModalVisible(true);
    };

    const handleEarnCoins = () => {
        addCoins(10);
        Vibration.vibrate(50);
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt'>) => {
        if (editingTask) {
            // Merge existing task with updates
            const updatedTask: Task = {
                ...editingTask,
                ...taskData
            };
            await updateTask(updatedTask);
        } else {
            await addTask(taskData);
        }
        setModalVisible(false);
        setEditingTask(null);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingTask(null);
    };

    const renderHeader = () => (
        <View style={{ marginBottom: 10 }}>
            {/* Empty container removed as we now show empty sections */}
        </View>
    );

    const renderFooter = () => (
        <View>
            {completedTasks.length > 0 && (
                <View style={styles.completedSection}>
                    <TouchableOpacity
                        style={[styles.showCompletedBtn, { backgroundColor: colors.surface }]}
                        onPress={() => setShowCompleted(!showCompleted)}
                    >
                        <Text style={[styles.showCompletedText, { color: colors.text }]}>
                            {showCompleted ? "Hide completed tasks" : "Show completed tasks"}
                        </Text>
                        <Icon name={showCompleted ? "expand-less" : "expand-more"} size={20} color={colors.text} />
                    </TouchableOpacity>

                    {showCompleted && (
                        <FlatList
                            data={completedTasks}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TaskItem
                                    task={item}
                                    onToggle={() => handleToggleTask(item.id)}
                                    onPress={handleTaskPress}
                                    onDelete={() => deleteTask(item.id)}
                                />
                            )}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <CompactHeader onEarnCoins={handleEarnCoins} />
            <View style={styles.listContainer}>
                <SectionList
                    sections={activeSections}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TaskItem
                            task={item}
                            onToggle={() => handleToggleTask(item.id)}
                            onPress={handleTaskPress}
                            onDelete={() => deleteTask(item.id)}
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionHeaderText, { color: colors.subText }]}>{title}</Text>
                        </View>
                    )}
                    renderSectionFooter={({ section }) => {
                        if (section.data.length > 0) return null;

                        let emptyText = '';
                        if (section.title === strings.today) emptyText = strings.noTasksToday;
                        else if (section.title === strings.thisWeek) emptyText = strings.noTasksWeek;
                        else if (section.title === strings.upcoming) emptyText = strings.noTasksUpcoming;

                        return (
                            <View style={styles.emptySection}>
                                <Text style={[styles.emptySectionText, { color: colors.subText }]}>{emptyText}</Text>
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    stickySectionHeadersEnabled={false}
                />
            </View>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={handleCreateTask}
            >
                <Icon name="add" size={30} color="#FFF" />
            </TouchableOpacity>

            <AddTaskModal
                visible={modalVisible}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
                onDelete={(taskId) => {
                    deleteTask(taskId);
                    handleCloseModal();
                }}
                taskToEdit={editingTask}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContent: {
        paddingTop: 20,
        paddingBottom: 100, // Space for FAB
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    completedSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    showCompletedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 10,
        opacity: 0.6,
        borderRadius: 8,
    },
    showCompletedText: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 5,
    },
    sectionHeader: {
        marginTop: 15,
        marginBottom: 10,
        paddingVertical: 5,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptySection: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySectionText: {
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.8,
    }
});

export default HomeScreen;
