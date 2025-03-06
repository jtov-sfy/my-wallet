import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import CalendarPicker from 'react-native-calendar-picker';
import { useLocalSearchParams } from 'expo-router';

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
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  
  // Get the transaction type from route params if available
  const initialType = params.type || 'expense';
  
  // Transaction form state
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  
  // UI state
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [activeTransactionType, setActiveTransactionType] = useState(initialType); // Set initial type from params
  
  // Filter categories based on activeTransactionType for the modal
  const filteredCategories = CATEGORIES.filter(category => category.type === activeTransactionType);
  
  // Reset validation message when form changes
  useEffect(() => {
    setValidationMessage('');
  }, [amount, selectedCategory, note, date]);
  
  // Update selectedCategory if initialType changes and current category doesn't match
  useEffect(() => {
    if (selectedCategory && selectedCategory.type !== initialType) {
      setSelectedCategory(null);
    }
  }, [initialType, selectedCategory]);

  const handleDateChange = (selectedDate) => {
    let newDate;
    
    if (Platform.OS === 'web') {
      // Handle web date (which comes as a string)
      newDate = new Date(selectedDate);
    } else {
      // Handle native date picker result
      newDate = selectedDate || date;
    }
    
    // Set the date
    setDate(newDate);
    setShowCalendar(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  // Validate the transaction form
  const validateForm = () => {
    if (!amount || amount.trim() === '') {
      setValidationMessage('Please enter an amount');
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationMessage('Please enter a valid amount greater than zero');
      return false;
    }

    if (!selectedCategory) {
      setValidationMessage('Please select a category');
      return false;
    }

    return true;
  };

  // Show confirmation modal if validation passes
  const handleSubmitInitial = (transactionType) => {
    setActiveTransactionType(transactionType); // Set the type based on which button was clicked
    
    // Filter categories again with the newly selected type
    const matchingCategory = CATEGORIES.find(
      c => selectedCategory && c.id === selectedCategory.id && c.type === transactionType
    );
    
    // If category type doesn't match new transaction type, reset it
    if (selectedCategory && selectedCategory.type !== transactionType) {
      setSelectedCategory(null);
    }
    
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };
  
  // Submit the transaction to the wallet
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Create a new date object from the selected date and set time to noon
      const transactionDate = new Date(date);
      transactionDate.setHours(12, 0, 0, 0);
      
      // Determine the sign of the amount based on transaction type
      const numAmount = parseFloat(amount);
      const signedAmount = activeTransactionType === 'expense' ? numAmount : -numAmount;

      const transaction = {
        amount: signedAmount,
        category: selectedCategory,
        note,
        date: transactionDate.toISOString(), // Store as ISO string
        type: activeTransactionType,
        id: Date.now().toString(), // Generate a unique ID
      };

      console.log('Adding transaction:', JSON.stringify(transaction));
      
      // Add the transaction to the wallet
      await addExpense(transaction);
      
      // Show success message
      Alert.alert(
        'Success',
        `${activeTransactionType === 'expense' ? 'Expense' : 'Income'} added successfully!`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
      
      setIsSubmitting(false);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      setIsSubmitting(false);
      
      Alert.alert(
        'Error',
        'Failed to add transaction. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const cancelConfirmation = () => {
    setShowConfirmModal(false);
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
    categorySection: {
      marginBottom: 24,
    },
    categoryTypeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
      textAlign: 'center',
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
    validationMessage: {
      color: '#E91E63',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '500',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 16,
      marginHorizontal: 16,
    },
    actionButton: {
      flex: 1,
      borderRadius: 25,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...Platform.select({
        ios: {
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
    expenseButton: {
      backgroundColor: '#E91E63',
      marginRight: 8,
      shadowColor: '#E91E63',
    },
    incomeButton: {
      backgroundColor: '#4CAF50',
      marginLeft: 8,
      shadowColor: '#4CAF50',
    },
    buttonIcon: {
      marginRight: 8,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    confirmExpenseButton: {
      backgroundColor: '#E91E63',
      marginLeft: 8,
    },
    confirmIncomeButton: {
      backgroundColor: '#4CAF50',
      marginLeft: 8,
    },
    cancelButton: {
      backgroundColor: '#f5f5f5',
      marginRight: 8,
    },
    cancelButtonText: {
      color: '#333',
      fontWeight: 'bold',
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    calendarContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      width: '90%',
      maxWidth: 400,
    },
    closeButton: {
      alignSelf: 'flex-end',
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
    },
    confirmModalContent: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    confirmModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: '#333',
    },
    transactionSummary: {
      backgroundColor: '#f8f8f8',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: 14,
      color: '#333',
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: 8,
    },
    categorySummary: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    summaryIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    confirmModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    confirmModalButton: {
      padding: 14,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
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
          <View style={styles.amountContainer}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>€</Text>
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

          <View style={styles.categorySection}>
            <Text style={styles.categoryTypeLabel}>Expense Categories</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.filter(category => category.type === 'expense').map((category) => (
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

            <Text style={[styles.categoryTypeLabel, { marginTop: 16 }]}>Income Categories</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.filter(category => category.type === 'income').map((category) => (
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

          {validationMessage ? (
            <Text style={styles.validationMessage}>{validationMessage}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.expenseButton]} 
            onPress={() => handleSubmitInitial('expense')}
            disabled={isSubmitting}
          >
            <Ionicons name="remove-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.incomeButton]} 
            onPress={() => handleSubmitInitial('income')}
            disabled={isSubmitting}
          >
            <Ionicons name="add-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Add Income</Text>
          </TouchableOpacity>
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
        
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="slide"
          onRequestClose={cancelConfirmation}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalTitle}>
                Confirm {activeTransactionType === 'expense' ? 'Expense' : 'Income'}
              </Text>
              
              <View style={styles.transactionSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={[
                    styles.summaryValue, 
                    { color: activeTransactionType === 'expense' ? '#E91E63' : '#4CAF50' }
                  ]}>
                    {formatCurrency(amount)}
                  </Text>
                </View>
                
                {selectedCategory && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Category:</Text>
                    <View style={styles.categorySummary}>
                      <View style={[styles.summaryIcon, { backgroundColor: selectedCategory.color }]}>
                        <Ionicons name={selectedCategory.icon} size={16} color="white" />
                      </View>
                      <Text style={styles.summaryValue}>{selectedCategory.name}</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>{formatDate(date)}</Text>
                </View>
                
                {note && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Note:</Text>
                    <Text style={styles.summaryValue}>{note}</Text>
                  </View>
                )}
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={[
                    styles.summaryValue,
                    { color: activeTransactionType === 'expense' ? '#E91E63' : '#4CAF50' }
                  ]}>
                    {activeTransactionType === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.cancelButton]}
                  onPress={cancelConfirmation}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmModalButton, 
                    activeTransactionType === 'expense' ? styles.confirmExpenseButton : styles.confirmIncomeButton
                  ]}
                  onPress={handleConfirmSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
} 