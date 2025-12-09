import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Task, Difficulty, RecurrenceType, useTasks } from '../context/TaskContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NotificationService from '../utils/NotificationService';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    onDelete?: (taskId: string) => void;
    taskToEdit?: Task | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onSave, onDelete, taskToEdit }) => {
    const { colors } = useTheme();
    const { firstDayOfWeek, nextWeekBehavior } = useTasks();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [customReward, setCustomReward] = useState('1');
    const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'nextWeek' | 'custom'>('today');
    const [customDate, setCustomDate] = useState(new Date());
    const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date());

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (visible) {
            setShowDeleteConfirm(false);
            if (taskToEdit) {
                // Populate fields for editing
                setTitle(taskToEdit.title);
                setDescription(taskToEdit.description || '');
                setDifficulty(taskToEdit.difficulty);
                setRecurrence(taskToEdit.recurrence || 'none');
                setSelectedDays(taskToEdit.selectedDays || []);
                setReminderEnabled(!!taskToEdit.reminderTime);
                if (taskToEdit.reminderTime) {
                    setReminderTime(new Date(taskToEdit.reminderTime));
                }

                // Determine date option
                const dueDate = new Date(taskToEdit.dueDate);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);

                if (dueDate.toDateString() === today.toDateString()) {
                    setDateOption('today');
                } else if (dueDate.toDateString() === tomorrow.toDateString()) {
                    setDateOption('tomorrow');
                } else if (Math.abs(dueDate.getTime() - nextWeek.getTime()) < 86400000) { // Approx match
                    setDateOption('nextWeek');
                } else {
                    setDateOption('custom');
                    setCustomDate(dueDate);
                }

                // Custom reward handling
                if (taskToEdit.difficulty === 'custom') {
                    setCustomReward(taskToEdit.coinsReward?.toString() || '0');
                }
            } else {
                // Reset fields for new task
                setTitle('');
                setDescription('');
                setDifficulty('easy');
                setCustomReward('1');
                setDateOption('today');
                setCustomDate(new Date());
                setRecurrence('none');
                setSelectedDays([]);
                setReminderEnabled(false);
                setReminderTime(new Date());
            }
        }
    }, [visible, taskToEdit]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        let finalDueDate = new Date();
        if (dateOption === 'tomorrow') {
            finalDueDate.setDate(finalDueDate.getDate() + 1);
        } else if (dateOption === 'nextWeek') {
            if (nextWeekBehavior === 'sameDay') {
                finalDueDate.setDate(finalDueDate.getDate() + 7);
            } else {
                // startOfWeek behavior
                const targetDayIndex = firstDayOfWeek === 'Sunday' ? 0 : firstDayOfWeek === 'Monday' ? 1 : 6;
                const currentDayIndex = finalDueDate.getDay();
                let daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
                if (daysToAdd === 0) daysToAdd = 7; // If today is the start day, next week's start is +7
                finalDueDate.setDate(finalDueDate.getDate() + daysToAdd);
            }
        } else if (dateOption === 'custom') {
            finalDueDate = customDate;
        }

        // Calculate reward
        let finalReward = 1;
        if (difficulty === 'easy') finalReward = 1;
        else if (difficulty === 'medium') finalReward = 3;
        else if (difficulty === 'hard') finalReward = 5;
        else if (difficulty === 'custom') finalReward = parseInt(customReward) || 0;

        const taskData = {
            title,
            description,
            difficulty,
            coinsReward: finalReward,
            dueDate: finalDueDate.toISOString(),
            recurrence,
            selectedDays,
            reminderEnabled,
            reminderTime: reminderEnabled ? reminderTime.toISOString() : undefined,
        };

        onSave(taskData);
    };

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIndex));
        } else {
            setSelectedDays([...selectedDays, dayIndex]);
        }
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setCustomDate(selectedDate);
            setDateOption('custom');
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setReminderTime(selectedTime);
        }
    };

    const openNativeDatePicker = () => setShowDatePicker(true);
    const openNativeTimePicker = () => setShowTimePicker(true);

    const handleDelete = () => {
        if (!taskToEdit || !onDelete) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (taskToEdit && onDelete) {
            onDelete(taskToEdit.id);
            onClose();
        }
    };

    const difficulties: { type: Difficulty, label: string, icon: string, color: string }[] = [
        { type: 'easy', label: 'Easy', icon: 'monetization-on', color: colors.primary },
        { type: 'medium', label: 'Medium', icon: 'monetization-on', color: '#4caf50' },
        { type: 'hard', label: 'Hard', icon: 'monetization-on', color: '#f44336' },
        { type: 'custom', label: 'Custom', icon: 'edit', color: '#9C27B0' },
    ];

    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {taskToEdit ? "Edit Task" : "New Task"}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {taskToEdit && onDelete && (
                                <TouchableOpacity onPress={handleDelete} style={{ marginRight: 15 }}>
                                    <Icon name="delete" size={24} color={colors.primary} style={{ opacity: 0.7 }} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder="Title"
                            placeholderTextColor={colors.subText}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <TextInput
                            style={[styles.textArea, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder="Description (Optional)"
                            placeholderTextColor={colors.subText}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />

                        {/* Date Selection */}
                        <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => setDateOption('today')}
                                style={[styles.chip, dateOption === 'today' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, dateOption === 'today' && { color: '#FFF' }]}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDateOption('tomorrow')}
                                style={[styles.chip, dateOption === 'tomorrow' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, dateOption === 'tomorrow' && { color: '#FFF' }]}>Tomorrow</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDateOption('nextWeek')}
                                style={[styles.chip, dateOption === 'nextWeek' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, dateOption === 'nextWeek' && { color: '#FFF' }]}>Next Week</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={openNativeDatePicker}
                                style={[styles.chip, dateOption === 'custom' && { backgroundColor: colors.primary }]}>
                                <Icon name="event" size={16} color={dateOption === 'custom' ? '#FFF' : '#333'} style={{ marginRight: 4 }} />
                                <Text style={[styles.chipText, dateOption === 'custom' && { color: '#FFF' }]}>
                                    {dateOption === 'custom' ? customDate.toLocaleDateString() : 'Custom'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Difficulty */}
                        <Text style={[styles.label, { color: colors.text }]}>Difficulty & Reward</Text>
                        <View style={styles.difficultyRow}>
                            {difficulties.map(d => (
                                <TouchableOpacity
                                    key={d.type}
                                    onPress={() => setDifficulty(d.type)}
                                    style={[
                                        styles.difficultyCard,
                                        { borderColor: difficulty === d.type ? d.color : 'transparent', borderWidth: 2, backgroundColor: colors.background }
                                    ]}
                                >
                                    <View style={styles.coinReward}>
                                        <Icon name={d.icon} size={20} color={d.color} />
                                        <Text style={[styles.rewardText, { color: d.color, fontSize: 14, fontWeight: 'bold' }]}>
                                            {d.type === 'custom' ? '?' : d.type === 'easy' ? '+1' : d.type === 'medium' ? '+3' : '+5'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.diffLabel, { color: d.color, marginTop: 4 }]}>{d.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {difficulty === 'custom' && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>Reward Amount (Coins)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    placeholder="Enter amount"
                                    placeholderTextColor={colors.subText}
                                    keyboardType="numeric"
                                    value={customReward}
                                    onChangeText={setCustomReward}
                                />
                            </View>
                        )}

                        {/* Recurrence */}
                        <Text style={[styles.label, { color: colors.text }]}>Repeat</Text>
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => setRecurrence('none')} style={[styles.chip, recurrence === 'none' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, recurrence === 'none' && { color: '#FFF' }]}>None</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setRecurrence('daily')} style={[styles.chip, recurrence === 'daily' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, recurrence === 'daily' && { color: '#FFF' }]}>Daily</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setRecurrence('weekly')} style={[styles.chip, recurrence === 'weekly' && { backgroundColor: colors.primary }]}>
                                <Text style={[styles.chipText, recurrence === 'weekly' && { color: '#FFF' }]}>Weekly</Text>
                            </TouchableOpacity>
                        </View>
                        {recurrence === 'weekly' && (
                            <View style={styles.daysRow}>
                                {days.map((day, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.dayCircle, selectedDays.includes(idx) && { backgroundColor: colors.primary }]}
                                        onPress={() => toggleDay(idx)}
                                    >
                                        <Text style={[styles.dayText, selectedDays.includes(idx) && { color: '#FFF' }]}>{day}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Reminder */}
                        <View style={styles.reminderRow}>
                            <View style={styles.reminderLabel}>
                                <Icon name="notifications" size={20} color={colors.text} />
                                <Text style={[styles.label, { color: colors.text, marginTop: 0, marginLeft: 8 }]}>Remind me</Text>
                            </View>
                            <Switch
                                value={reminderEnabled}
                                onValueChange={setReminderEnabled}
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={"#f4f3f4"}
                            />
                        </View>

                        {reminderEnabled && (
                            <TouchableOpacity style={[styles.timeButton, { backgroundColor: colors.background }]} onPress={openNativeTimePicker}>
                                <Text style={{ color: colors.text }}>
                                    at {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Icon name="access-time" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        )}

                        {!showDeleteConfirm && (
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{taskToEdit ? "Update Task" : "Save Task"}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {/* Delete Confirmation Overlay */}
                    {showDeleteConfirm && (
                        <View style={styles.deleteOverlay}>
                            <View style={[styles.deletePopup, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.deleteTitle, { color: colors.text }]}>Eliminar Tarea</Text>
                                <Text style={[styles.deleteMessage, { color: colors.subText }]}>
                                    ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
                                </Text>
                                <View style={styles.deleteButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.deleteBtnCancel, { borderColor: colors.border }]}
                                        onPress={() => setShowDeleteConfirm(false)}
                                    >
                                        <Text style={{ color: colors.text }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.deleteBtnConfirm, { backgroundColor: '#FF3B30' }]}
                                        onPress={confirmDelete}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>

            {showDatePicker && (
                <RNDateTimePicker
                    value={customDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
            {showTimePicker && (
                <RNDateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onTimeChange}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 14,
        height: 80,
        textAlignVertical: 'top',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        marginRight: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    chipText: {
        fontSize: 12,
        color: '#333',
    },
    difficultyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    difficultyCard: {
        width: '23%',
        padding: 8,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    diffLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    coinReward: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    rewardText: {
        fontSize: 10,
        marginLeft: 2,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dayCircle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 12,
        color: '#333',
        fontWeight: 'bold',
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reminderLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    saveBtn: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 15,
    },
    deleteOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    deletePopup: {
        width: '85%',
        padding: 20,
        borderRadius: 15,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    deleteTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    deleteMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    deleteButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    deleteBtnCancel: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
    },
    deleteBtnConfirm: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 8,
    }
});

export default AddTaskModal;
