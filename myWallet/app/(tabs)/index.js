import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../../context/WalletContext';
import { useMemo, useState, useCallback } from 'react';

export default function Page() {
  const { balance, monthlyBudget, expenses, addExpense, deleteExpense } = useWallet();

  // Transaction modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeModal, setActiveModal] = useState(null);

  // Add the date picker state
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Add these state variables at the top of the component with other state variables
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Categories for transactions
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

  // Calculate total monthly expenses and income
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(expense => new Date(expense.date) >= firstDayOfMonth)
      .reduce((totals, transaction) => {
        if (transaction.type === 'income') {
          totals.income += Math.abs(transaction.amount);
        } else {
          totals.expense += Math.abs(transaction.amount);
        }
        return totals;
      }, { income: 0, expense: 0 });
  }, [expenses]);

  // Create a budget object from the monthly totals and budget amount
  const budgetData = useMemo(() => {
    // If monthlyBudget is a number (Firebase structure), create an object from it
    const budgetAmount = typeof monthlyBudget === 'number' ? monthlyBudget : 
                        (monthlyBudget?.total || 0);
    
    return {
      total: budgetAmount,
      spent: monthlyTotals.expense,
      remaining: Math.max(0, budgetAmount - monthlyTotals.expense)
    };
  }, [monthlyBudget, monthlyTotals]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  // Open expense modal
  const handleAddExpense = () => {
    setAmount('');
    setNote('');
    setSelectedCategory(null);
    setValidationMessage('');
    setSelectedDate(new Date());
    setActiveModal('expense');
    setIsExpenseModalOpen(true);
  };

  // Open income modal
  const handleAddIncome = () => {
    setAmount('');
    setNote('');
    setSelectedCategory(null);
    setValidationMessage('');
    setSelectedDate(new Date());
    setActiveModal('income');
    setIsIncomeModalOpen(true);
  };

  // Navigate to budgets screen
  const handleBudgets = () => {
    router.push('/budgets');
  };

  // Navigate to analytics screen
  const handleAnalytics = () => {
    router.push('/analytics');
  };

  // Navigate to settings
  const handleSettings = () => {
    router.push('/settings');
  };

  // Validate transaction form
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

  // Close all modals
  const closeModals = () => {
    setIsExpenseModalOpen(false);
    setIsIncomeModalOpen(false);
    setActiveModal(null);
  };

  // Update the toggleDatePicker function to use a web-compatible approach
  const toggleDatePicker = () => {
    // Only work with document if in browser environment
    if (typeof document !== 'undefined') {
      if (activeModal === 'expense') {
        const dateInput = document.getElementById('expense-date-input');
        if (dateInput) {
          dateInput.focus();
          dateInput.click();
        }
      } else if (activeModal === 'income') {
        const dateInput = document.getElementById('income-date-input');
        if (dateInput) {
          dateInput.focus();
          dateInput.click();
        }
      }
    }
  };

  // Update the onDateChange function to close the picker after date selection
  const onDateChange = (dateString) => {
    if (dateString) {
      // Parse the date from the input field
      const selectedDateValue = new Date(dateString);
      if (!isNaN(selectedDateValue.getTime())) {
        setSelectedDate(selectedDateValue);
        
        // Hide any browser date picker that might be open
        if (document.activeElement) {
          document.activeElement.blur();
        }
        
        // Close any calendar that might be open
        setIsDatePickerVisible(false);
      }
    }
  };

  // Handle selection of a date from the calendar
  const handleSelectDate = (day) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    
    // Force close any date pickers
    setIsDatePickerVisible(false);
    
    // For web browsers, blur any focused input elements
    if (typeof document !== 'undefined') {
      // Close any native input elements that might be showing a date picker
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
      
      // Force any open native pickers to close by manipulating focus
      const expenseDateInput = document.getElementById('expense-date-input');
      const incomeDateInput = document.getElementById('income-date-input');
      
      if (expenseDateInput) {
        expenseDateInput.blur();
      }
      
      if (incomeDateInput) {
        incomeDateInput.blur();
      }
    }
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const currentDate = new Date(selectedDate);
    const newMonth = currentDate.getMonth() + direction;
    const newDate = new Date(currentDate.getFullYear(), newMonth, 1);
    setSelectedDate(newDate);
  };

  // Get month name
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    let days = [];
    // Add empty spaces for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Handle transaction submission
  const handleSubmitTransaction = async (type) => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        category: selectedCategory,
        note: note.trim(),
        date: selectedDate.toISOString(), // Use the selected date
      };

      // Add the transaction to the wallet
      await addExpense(transactionData);
      
      // Close modals immediately after successful submission
      closeModals();
      
      // Show success message
      Alert.alert(
        'Success',
        `${type === 'expense' ? 'Expense' : 'Income'} added successfully!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert(
        'Error',
        `Failed to add ${type}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
      
      // Reset form state
      setAmount('');
      setNote('');
      setSelectedCategory(null);
      setValidationMessage('');
      setSelectedDate(new Date());
    }
  };

  // Get recent expenses
  const recentExpenses = useMemo(() => {
    return expenses
      .filter(expense => expense.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [expenses]);
  
  // Filter categories by type
  const getFilteredCategories = (type) => {
    return CATEGORIES.filter(category => category.type === type);
  };

  // Add a helper function to format date for input field (YYYY-MM-DD format)
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Add the handleDeleteExpense function to handle deletion request
  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalVisible(true);
  };

  // Add the confirmDeleteExpense function to handle confirmation
  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      // Delete the expense using your wallet context
      await deleteExpense(expenseToDelete.id);
      
      // Show success message
      Alert.alert(
        'Success',
        'Expense deleted successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert(
        'Error',
        'Failed to delete expense. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Reset state
      setIsDeleteModalVisible(false);
      setExpenseToDelete(null);
    }
  };

  // Add the cancelDeleteExpense function to handle cancellation
  const cancelDeleteExpense = () => {
    setIsDeleteModalVisible(false);
    setExpenseToDelete(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>My Wallet</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={[
              styles.balanceAmount, 
              { color: balance >= 0 ? '#4CAF50' : '#E91E63' }
            ]}>
              €{balance.toFixed(2)}
            </Text>
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatLabel}>Income</Text>
                <Text style={styles.monthlyStatAmount}>€{monthlyTotals.income.toFixed(2)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatLabel}>Expenses</Text>
                <Text style={styles.monthlyStatAmount}>€{monthlyTotals.expense.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAddExpense}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E91E63' }]}>
                <Ionicons name="remove-circle" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAddIncome}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="add-circle" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/analytics')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="bar-chart" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleBudgets}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="wallet" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Budgets</Text>
            </TouchableOpacity>
          </View>

          {/* Monthly Budget Overview */}
          <View style={styles.budgetOverview}>
            <View style={styles.budgetHeader}>
              <Text style={styles.sectionTitle}>Budget Overview</Text>
              <View style={styles.budgetHeaderRight}>
                <Text style={styles.viewAllText}>{new Date().toLocaleString('default', { month: 'long' })}</Text>
              </View>
            </View>
            
            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(budgetData.spent / (budgetData.total || 1)) * 100}%`,
                      backgroundColor: budgetData.spent > budgetData.total ? '#E91E63' : '#4CAF50'
                    }
                  ]}
                />
              </View>
              <View style={styles.budgetStats}>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Spent</Text>
                  <Text style={styles.budgetStatAmount}>€{budgetData.spent.toFixed(2)}</Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Remaining</Text>
                  <Text style={[styles.budgetStatAmount, { color: '#4CAF50' }]}>
                    €{budgetData.remaining.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Total Budget</Text>
                  <Text style={styles.budgetStatAmount}>€{budgetData.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity 
                style={styles.calendarButton}
                onPress={() => router.push('/(tabs)/calendar')}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={24} color="#2196F3" />
              </TouchableOpacity>
            </View>
            
            {recentExpenses.length === 0 ? (
              <Text style={styles.noExpenses}>No recent expenses</Text>
            ) : (
              recentExpenses.map((expense) => (
                <TouchableOpacity 
                  key={expense.id} 
                  style={styles.transactionItem}
                  onLongPress={() => handleDeleteExpense(expense)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: expense.category?.color || '#888888' }]}>
                      <Ionicons 
                        name={expense.category?.icon || 'cart'} 
                        size={20} 
                        color="white" 
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{expense.category?.name || 'Expense'}</Text>
                      {expense.note ? (
                        <Text style={styles.transactionNote}>{expense.note}</Text>
                      ) : null}
                      <Text style={styles.transactionDate}>{formatDate(expense.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>-€{expense.amount.toFixed(2)}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(expense)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
        
        {/* Expense Modal */}
        <Modal
          visible={isExpenseModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModals}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {/* Amount Input */}
                <Text style={styles.inputLabel}>Amount (€)</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999"
                  />
                </View>
                
                {/* Date Selection */}
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.datePickerWrapper}>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={toggleDatePicker}
                  >
                    <Ionicons name="calendar" size={20} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                  
                  {/* Hidden input for web compatibility */}
                  <input 
                    type="date" 
                    id="expense-date-input"
                    style={{ 
                      position: 'absolute', 
                      opacity: 0,
                      pointerEvents: 'none',
                      height: 0
                    }}
                    value={formatDateForInput(selectedDate)}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={formatDateForInput(new Date())} 
                  />
                </View>
                
                {/* Category Selection */}
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoriesGrid}>
                  {getFilteredCategories('expense').map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory?.id === category.id && styles.selectedCategoryItem
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon} size={20} color="white" />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Note Input */}
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note"
                  placeholderTextColor="#999"
                  multiline
                />
                
                {/* Validation Message */}
                {validationMessage ? (
                  <Text style={styles.validationMessage}>{validationMessage}</Text>
                ) : null}
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModals}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: '#E91E63' }]}
                  onPress={() => handleSubmitTransaction('expense')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Income Modal */}
        <Modal
          visible={isIncomeModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModals}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Income</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {/* Amount Input */}
                <Text style={styles.inputLabel}>Amount (€)</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999"
                  />
                </View>
                
                {/* Date Selection */}
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.datePickerWrapper}>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={toggleDatePicker}
                  >
                    <Ionicons name="calendar" size={20} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                  
                  {/* Hidden input for web compatibility */}
                  <input 
                    type="date" 
                    id="income-date-input"
                    style={{ 
                      position: 'absolute', 
                      opacity: 0,
                      pointerEvents: 'none',
                      height: 0
                    }}
                    value={formatDateForInput(selectedDate)}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={formatDateForInput(new Date())} 
                  />
                </View>
                
                {/* Category Selection */}
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoriesGrid}>
                  {getFilteredCategories('income').map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory?.id === category.id && styles.selectedCategoryItem
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon} size={20} color="white" />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Note Input */}
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note"
                  placeholderTextColor="#999"
                  multiline
                />
                
                {/* Validation Message */}
                {validationMessage ? (
                  <Text style={styles.validationMessage}>{validationMessage}</Text>
                ) : null}
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModals}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleSubmitTransaction('income')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Expense Delete Confirmation Modal */}
        <Modal
          visible={isDeleteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cancelDeleteExpense}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Expense</Text>
              
              {expenseToDelete && (
                <>
                  <View style={styles.expenseSummary}>
                    <View style={[styles.categoryIcon, { backgroundColor: expenseToDelete.category?.color || '#888888' }]}>
                      <Ionicons 
                        name={expenseToDelete.category?.icon || 'cart'} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.summaryDetails}>
                      <Text style={styles.summaryName}>{expenseToDelete.category?.name || 'Expense'}</Text>
                      <Text style={styles.summaryAmount}>{formatCurrency(expenseToDelete.amount)}</Text>
                      <Text style={styles.summaryDate}>
                        {formatDate(expenseToDelete.date)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.warningText}>
                    Are you sure you want to delete this expense? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={cancelDeleteExpense}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={confirmDeleteExpense}
                    >
                      <Text style={styles.deleteButtonText}>
                        Delete Expense
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  monthlyStat: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  monthlyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  monthlyStatAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 2,
    height: '100%',
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
  },
  budgetOverview: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  budgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#666',
  },
  budgetProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetStat: {
    alignItems: 'center',
    flex: 1,
  },
  budgetStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetStatAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
    marginRight: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noExpenses: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  expenseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  summaryDetails: {
    marginLeft: 16,
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E91E63',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E91E63',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 56,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    height: 56,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    fontSize: 16,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  validationMessage: {
    color: '#E91E63',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  calendarContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    marginTop: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayButton: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  selectedDayButton: {
    backgroundColor: '#2196F3',
    borderRadius: 18,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayButton: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignSelf: 'center',
  },
  todayButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

