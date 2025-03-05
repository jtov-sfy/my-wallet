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
      backgroundColor: theme.surface,
    },
    container: {
      flex: 1,
      backgroundColor: theme.surface,
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
    typeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceVariant,
      borderRadius: 25,
      padding: 4,
      marginBottom: 24,
      alignSelf: 'center',
    },
    typeButton: {
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderRadius: 20,
      minWidth: 100,
    },
    selectedTypeButton: {
      backgroundColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      textAlign: 'center',
    },
    selectedTypeButtonText: {
      color: '#fff',
    },
    amountContainer: {
      marginBottom: 24,
      alignItems: 'center',
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
      borderRadius: 16,
      padding: 12,
      maxWidth: 200,
      width: '100%',
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginRight: 8,
      opacity: 0.7,
    },
    amountInput: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      padding: 0,
      textAlign: 'center',
      minWidth: 120,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    dateContainer: {
      marginBottom: 24,
      alignItems: 'center',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
      borderRadius: 16,
      padding: 12,
      maxWidth: 200,
      width: '100%',
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 8,
      textAlign: 'center',
      flex: 1,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
      marginBottom: 24,
    },
    categoryItem: {
      width: '25%',
      padding: 8,
      alignItems: 'center',
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    selectedCategory: {
      opacity: 0.6,
    },
    categoryName: {
      fontSize: 12,
      color: theme.text,
      textAlign: 'center',
    },
    noteInput: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: 12,
      padding: 12,
      height: 100,
      textAlignVertical: 'top',
      color: theme.text,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 25,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 16,
      marginTop: 'auto',
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
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
                textAlign="center"
              />
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateButton}>
                <Ionicons name="calendar" size={20} color={theme.text} style={{ opacity: 0.7 }} />
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
                    textAlign: 'center',
                    width: '120px',
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar" size={20} color={theme.text} style={{ opacity: 0.7 }} />
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