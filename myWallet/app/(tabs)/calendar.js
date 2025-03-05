import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Calendar() {
  const { expenses, deleteExpense } = useWallet();
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [localExpenses, setLocalExpenses] = useState([]);
  const router = useRouter();
  const windowHeight = Dimensions.get('window').height;

  // Initialize local expenses from context
  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Get the day of week for the first day (0-6)
    const firstDayOfWeek = date.getDay();
    
    // Add empty days for padding
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  }, [selectedMonth]);

  // Get expenses for selected date
  const selectedDateExpenses = useMemo(() => {
    if (!selectedDate || !localExpenses.length) {
      console.log('No expenses or no selected date');
      return [];
    }
    
    console.log('Filtering expenses for date:', selectedDate);
    const filtered = localExpenses.filter(expense => {
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
      const match = 
        expenseDate.getFullYear() === selectedDate.getFullYear() &&
        expenseDate.getMonth() === selectedDate.getMonth() &&
        expenseDate.getDate() === selectedDate.getDate();
      console.log('Expense:', expense, 'Match:', match);
      return match;
    }).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB - dateA;
    });
    console.log('Filtered expenses:', filtered);
    return filtered;
  }, [selectedDate, localExpenses]);

  // Calculate total expenses for selected date
  const totalExpenses = useMemo(() => {
    return selectedDateExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [selectedDateExpenses]);

  // Get transactions for selected date
  const selectedDateTransactions = useMemo(() => {
    console.log('Recalculating selectedDateTransactions');
    console.log('Selected date:', selectedDate);
    console.log('Expenses length:', localExpenses.length);
    
    if (!selectedDate || !localExpenses.length) {
      console.log('No expenses or no selected date');
      return [];
    }
    
    // Set the selected date to noon for consistent comparison
    const compareDate = new Date(selectedDate);
    compareDate.setHours(12, 0, 0, 0);
    
    const filtered = localExpenses.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(12, 0, 0, 0);
      
      const isSameDate = 
        transactionDate.getFullYear() === compareDate.getFullYear() &&
        transactionDate.getMonth() === compareDate.getMonth() &&
        transactionDate.getDate() === compareDate.getDate();
      
      return isSameDate;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    console.log('Filtered transactions:', filtered.length);
    return filtered;
  }, [selectedDate, localExpenses]);

  // Check if a date has expenses
  const hasExpenses = (date) => {
    if (!localExpenses.length || !date) return false;
    
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
    return localExpenses.some(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getFullYear() === compareDate.getFullYear() &&
        transactionDate.getMonth() === compareDate.getMonth() &&
        transactionDate.getDate() === compareDate.getDate()
      );
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `€${amount.toFixed(2)}`;
  };

  // Format time
  const formatTime = (date) => {
    return date instanceof Date ? date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    }) : '';
  };

  // Handle day selection
  const handleDayPress = useCallback((date) => {
    if (date) {
      console.log('Day pressed:', date);
      const newDate = new Date(date);
      // Set the time to noon to avoid timezone issues
      newDate.setHours(12, 0, 0, 0);
      console.log('Setting new date:', newDate.toISOString());
      setSelectedDate(newDate);
      // Force refresh the view
      setRefreshKey(prev => prev + 1);
    }
  }, []);

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setSelectedMonth(newMonth);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setSelectedMonth(today);
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    console.log('Calculating monthly totals...');
    console.log('Current expenses:', localExpenses.length);
    console.log('Selected month:', selectedMonth.toISOString());
    
    if (!localExpenses.length) {
      console.log('No expenses to calculate');
      return { expenses: 0, income: 0 };
    }
    
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();
    
    const totals = localExpenses.reduce((acc, transaction) => {
      try {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          console.log('Including transaction in totals:', {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            date: transactionDate.toISOString()
          });
          
          if (transaction.type === 'income') {
            acc.income += Math.abs(Number(transaction.amount));
          } else {
            acc.expenses += Math.abs(Number(transaction.amount));
          }
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
      return acc;
    }, { expenses: 0, income: 0 });

    console.log('Final monthly totals:', totals);
    return totals;
  }, [localExpenses, selectedMonth]);

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    return selectedDateTransactions.reduce((totals, transaction) => {
      if (transaction.type === 'income' || transaction.amount < 0) {
        totals.income += Math.abs(transaction.amount);
      } else {
        totals.expenses += transaction.amount;
      }
      return totals;
    }, { expenses: 0, income: 0 });
  }, [selectedDateTransactions]);

  // Handle direct delete without confirmation
  const handleDirectDelete = useCallback((transactionId) => {
    console.log('Direct delete called for ID:', transactionId);
    
    if (!transactionId) {
      console.error('No transaction ID provided for deletion');
      return;
    }
    
    try {
      // Find the transaction to delete
      const transaction = localExpenses.find(t => t.id === transactionId);
      if (!transaction) {
        console.error('Transaction not found:', transactionId);
        return;
      }
      
      console.log('Found transaction to delete:', transaction);
      
      // Update local state immediately
      console.log('Updating local state...');
      const newExpenses = localExpenses.filter(t => t.id !== transactionId);
      setLocalExpenses(newExpenses);
      
      // Force refresh
      setRefreshKey(prev => prev + 1);
      
      // Call delete function in context
      deleteExpense(transactionId)
        .then(result => {
          console.log('Delete operation result:', result);
        })
        .catch(err => {
          console.error('Error in delete operation:', err);
        });
    } catch (error) {
      console.error('Unexpected error in handleDirectDelete:', error);
    }
  }, [localExpenses, deleteExpense]);

  // Update useEffect to handle refresh
  useEffect(() => {
    console.log('LocalExpenses or date changed, refreshing view...');
    setRefreshKey(prev => prev + 1);
  }, [localExpenses, selectedDate]);

  // Get filtered transactions for the selected date
  const getFilteredTransactions = useCallback(() => {
    if (!selectedDate || !localExpenses.length) return [];
    
    const compareDate = new Date(selectedDate);
    compareDate.setHours(12, 0, 0, 0);
    
    return localExpenses.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(12, 0, 0, 0);
      
      return (
        transactionDate.getFullYear() === compareDate.getFullYear() &&
        transactionDate.getMonth() === compareDate.getMonth() &&
        transactionDate.getDate() === compareDate.getDate()
      );
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  }, [selectedDate, localExpenses]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    topSection: {
      backgroundColor: theme.surface,
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 4,
    },
    monthText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    weekDays: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 2,
      width: '100%',
      maxWidth: 280,
      alignSelf: 'center',
    },
    weekDay: {
      width: 40,
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 10,
      fontWeight: '600',
    },
    calendar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 0,
      marginBottom: 4,
      width: '100%',
      maxWidth: 280,
      alignSelf: 'center',
    },
    day: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDay: {
      backgroundColor: 'transparent',
    },
    dayContainer: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
    },
    selectedDay: {
      backgroundColor: theme.primary,
      borderRadius: 18,
    },
    dayText: {
      fontSize: 12,
      color: theme.text,
    },
    selectedDayText: {
      color: '#fff',
      fontWeight: '600',
    },
    todayText: {
      color: theme.primary,
      fontWeight: '600',
    },
    hasExpensesDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.error,
      marginTop: 1,
    },
    calendarContainer: {
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: theme.surface,
    },
    middleSection: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    expensesContainer: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    expensesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    expensesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    expensesTotal: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.error,
    },
    expensesList: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    categoryGroup: {
      backgroundColor: theme.surface,
      marginBottom: 8,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.surfaceVariant,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    categoryTotal: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    expenseItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
      backgroundColor: theme.surface,
    },
    expenseLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    expenseInfo: {
      marginLeft: 12,
      flex: 1,
    },
    expenseCategory: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    expenseTime: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    expenseNote: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.error,
    },
    noExpenses: {
      textAlign: 'center',
      color: theme.textSecondary,
      padding: 20,
      backgroundColor: theme.surface,
    },
    monthlyTotals: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 12,
      backgroundColor: theme.surfaceVariant,
      marginBottom: 8,
    },
    totalItem: {
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    expenseTotal: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.error,
    },
    incomeTotal: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '500',
    },
    incomeAmount: {
      color: theme.primary,
    },
    expenseRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    deleteButton: {
      width: 50,
      height: 50,
      marginLeft: 10,
      padding: 5,
    },
    deleteButtonInner: {
      flex: 1,
      backgroundColor: theme.error,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} key={refreshKey}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>

          <View style={styles.monthlyTotals}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Monthly Expenses</Text>
              <Text style={styles.expenseTotal}>{`-${formatCurrency(monthlyTotals.expenses)}`}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Monthly Income</Text>
              <Text style={styles.incomeTotal}>{`+${formatCurrency(monthlyTotals.income)}`}</Text>
            </View>
          </View>

          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              onPress={() => navigateMonth(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity 
              onPress={() => navigateMonth(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {daysInMonth.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.day,
                    !date && styles.emptyDay,
                  ]}
                  onPress={() => date && handleDayPress(date)}
                  disabled={!date}
                  activeOpacity={0.7}
                >
                  {date && (
                    <View style={[
                      styles.dayContainer,
                      date && selectedDate && 
                      date.getDate() === selectedDate.getDate() && 
                      date.getMonth() === selectedDate.getMonth() && 
                      date.getFullYear() === selectedDate.getFullYear() && 
                      styles.selectedDay,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        date.getDate() === selectedDate.getDate() && 
                        date.getMonth() === selectedDate.getMonth() && 
                        date.getFullYear() === selectedDate.getFullYear() && 
                        styles.selectedDayText,
                        date.toDateString() === new Date().toDateString() && 
                        styles.todayText
                      ]}>
                        {date.getDate()}
                      </Text>
                      {hasExpenses(date) && (
                        <View style={styles.hasExpensesDot} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.expensesContainer}>
            <View style={styles.expensesHeader}>
              <Text style={styles.expensesTitle}>
                {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={styles.expenseTotal}>{`-${formatCurrency(dailyTotals.expenses)}`}</Text>
                <Text style={styles.incomeTotal}>{`+${formatCurrency(dailyTotals.income)}`}</Text>
              </View>
            </View>

            <ScrollView 
              style={styles.expensesList}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {getFilteredTransactions().length === 0 ? (
                <Text style={styles.noExpenses}>No transactions for this date</Text>
              ) : (
                getFilteredTransactions().map((transaction) => (
                  <View
                    key={transaction.id}
                    style={styles.expenseItem}
                  >
                    <View style={styles.expenseLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: transaction.category.color }]}>
                        <Ionicons name={transaction.category.icon} size={20} color="white" />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseCategory}>{transaction.category.name}</Text>
                        {transaction.note && (
                          <Text style={styles.expenseNote}>{transaction.note}</Text>
                        )}
                        <Text style={styles.expenseTime}>{formatTime(transaction.date)}</Text>
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={[
                        styles.transactionAmount,
                        transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                      ]}>
                        {`${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}`}
                      </Text>
                      
                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => {
                          console.log('Delete button pressed for:', transaction.id);
                          handleDirectDelete(transaction.id);
                        }}
                        activeOpacity={0.6}
                        style={{
                          width: 50,
                          height: 50,
                          backgroundColor: theme.error,
                          borderRadius: 25,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 10,
                        }}
                      >
                        <Ionicons name="trash-outline" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
} 