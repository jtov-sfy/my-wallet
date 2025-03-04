import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import CalendarPicker from 'react-native-calendar-picker';

const CATEGORIES = [
  { id: 1, name: 'Shopping', icon: 'cart', color: '#E91E63', type: 'expense' },
  { id: 2, name: 'Food', icon: 'fast-food', color: '#FF9800', type: 'expense' },
  { id: 3, name: 'Transport', icon: 'car', color: '#2196F3', type: 'expense' },
  { id: 4, name: 'Entertainment', icon: 'game-controller', color: '#9C27B0', type: 'expense' },
  { id: 5, name: 'Bills', icon: 'receipt', color: '#4CAF50', type: 'expense' },
  { id: 6, name: 'Other Expense', icon: 'ellipsis-horizontal', color: '#607D8B', type: 'expense' },
  { id: 7, name: 'Salary', icon: 'cash', color: '#4CAF50', type: 'income' },
  { id: 8, name: 'Freelance', icon: 'laptop', color: '#2196F3', type: 'income' },
  { id: 9, name: 'Investment', icon: 'trending-up', color: '#FF9800', type: 'income' },
  { id: 10, name: 'Other Income', icon: 'ellipsis-horizontal', color: '#607D8B', type: 'income' },
];

export default function AddTransaction() {
  const { addExpense } = useWallet();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
  const { theme } = useTheme();

  const filteredCategories = CATEGORIES.filter(category => category.type === transactionType);

  const handleDateChange = (selectedDate) => {
    if (Platform.OS === 'web') {
      // For web, create a new date object from the selected date string
      const newDate = new Date(selectedDate);
      // Set the time to noon to avoid timezone issues
      newDate.setHours(12, 0, 0, 0);
      console.log('Web selected date:', newDate.toISOString());
      setDate(newDate);
    } else {
      // For mobile, handle the moment object from CalendarPicker
      const newDate = selectedDate.toDate();
      // Set the time to noon to avoid timezone issues
      newDate.setHours(12, 0, 0, 0);
      console.log('Mobile selected date:', newDate.toISOString());
      setDate(newDate);
    }
    setShowCalendar(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Create a new date object from the selected date and set time to noon
    const transactionDate = new Date(date);
    transactionDate.setHours(12, 0, 0, 0);
    console.log('Submitting transaction with date:', transactionDate.toISOString());

    const expense = {
      amount: transactionType === 'expense' ? numAmount : -numAmount,
      category: selectedCategory,
      note,
      date: transactionDate.toISOString(), // Store as ISO string
      type: transactionType,
      id: Date.now().toString(),
    };

    console.log('Adding transaction:', expense);
    addExpense(expense);

    router.replace('/(tabs)');
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    amountContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.text,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
      paddingBottom: 8,
    },
    currencySymbol: {
      fontSize: 24,
      color: theme.text,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 24,
      color: theme.text,
    },
    dateContainer: {
      marginBottom: 24,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.surfaceVariant,
      borderRadius: 8,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 8,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 24,
    },
    categoryItem: {
      width: '33.33%',
      padding: 8,
      alignItems: 'center',
    },
    selectedCategory: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: 8,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    categoryName: {
      fontSize: 12,
      color: theme.text,
      textAlign: 'center',
    },
    noteInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      height: 100,
      textAlignVertical: 'top',
      marginBottom: 24,
    },
    submitButton: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 8,
      margin: 16,
    },
    submitButtonText: {
      color: theme.onPrimary,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      ...(Platform.OS === 'web' ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } : {}),
    },
    calendarContainer: {
      backgroundColor: theme.surface,
      padding: 20,
      borderRadius: 12,
      width: Platform.OS === 'web' ? '400px' : '90%',
      maxWidth: 400,
      ...(Platform.OS === 'web' ? {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      } : {}),
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
      padding: 10,
    },
    typeSelector: {
      flexDirection: 'row',
      marginBottom: 24,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.surfaceVariant,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    selectedTypeButton: {
      backgroundColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    selectedTypeButtonText: {
      color: theme.onPrimary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'expense' && styles.selectedTypeButton,
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === 'expense' && styles.selectedTypeButtonText,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.selectedTypeButton,
              ]}
              onPress={() => setTransactionType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === 'income' && styles.selectedTypeButtonText,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateButton}>
                <Ionicons name="calendar" size={24} color={theme.text} />
                <input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    color: theme.text,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar" size={24} color={theme.text} />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {Platform.OS !== 'web' && (
            <Modal
              visible={showCalendar}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.calendarContainer}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <CalendarPicker
                    onDateChange={handleDateChange}
                    selectedStartDate={date}
                    maxDate={new Date()}
                    selectedDayColor={theme.primary}
                    selectedDayTextColor={theme.onPrimary}
                    todayBackgroundColor={theme.surfaceVariant}
                    textStyle={{ color: theme.text }}
                    previousTitle="Previous"
                    nextTitle="Next"
                    previousTitleStyle={{ color: theme.primary }}
                    nextTitleStyle={{ color: theme.primary }}
                    monthTitleStyle={{ color: theme.text }}
                    yearTitleStyle={{ color: theme.text }}
                  />
                </View>
              </View>
            </Modal>
          )}

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === category.id && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={24} color="white" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add {transactionType === 'expense' ? 'Expense' : 'Income'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 