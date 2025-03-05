import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../../context/WalletContext';
import { useMemo } from 'react';

export default function Page() {
  const { balance, monthlyBudget, expenses } = useWallet();

  // Calculate total monthly expenses and income
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(expense => new Date(expense.date) >= firstDayOfMonth)
      .reduce((totals, transaction) => {
        if (transaction.type === 'income' || transaction.amount < 0) {
          totals.income += Math.abs(transaction.amount);
        } else {
          totals.expenses += transaction.amount;
        }
        return totals;
      }, { expenses: 0, income: 0 });
  }, [expenses]);

  // Get recent expenses
  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 3);
  }, [expenses]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  const handleBudgets = () => {
    router.push('/budgets');
  };

  const handleAnalytics = () => {
    router.push('/analytics');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Monthly Totals Cards */}
          <View style={styles.monthlyCards}>
            <View style={[styles.balanceCard, styles.expenseCard, styles.halfCard]}>
              <Text style={styles.balanceLabel}>Monthly Expenses</Text>
              <Text style={[styles.balanceAmount, { color: '#E91E63', fontSize: 28 }]}>
                -{monthlyTotals.expenses.toFixed(2)}€
              </Text>
              <View style={styles.balanceChange}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.balanceChangeText}>This Month</Text>
              </View>
            </View>

            <View style={[styles.balanceCard, styles.incomeCard, styles.halfCard]}>
              <Text style={styles.balanceLabel}>Monthly Income</Text>
              <Text style={[styles.balanceAmount, { color: '#4CAF50', fontSize: 28 }]}>
                +{monthlyTotals.income.toFixed(2)}€
              </Text>
              <View style={styles.balanceChange}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.balanceChangeText}>This Month</Text>
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
                <Ionicons name="add-circle" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Transaction</Text>
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

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAnalytics}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="stats-chart" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Analytics</Text>
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
                      width: `${(monthlyBudget.spent / monthlyBudget.total) * 100}%`,
                      backgroundColor: monthlyBudget.spent > monthlyBudget.total ? '#E91E63' : '#4CAF50'
                    }
                  ]}
                />
              </View>
              <View style={styles.budgetStats}>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Spent</Text>
                  <Text style={styles.budgetStatAmount}>€{monthlyBudget.spent.toFixed(2)}</Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Remaining</Text>
                  <Text style={[styles.budgetStatAmount, { color: '#4CAF50' }]}>
                    €{monthlyBudget.remaining.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetStatLabel}>Total Budget</Text>
                  <Text style={styles.budgetStatAmount}>€{monthlyBudget.total.toFixed(2)}</Text>
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
                <View key={expense.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: expense.category.color }]}>
                      <Ionicons name={expense.category.icon} size={20} color="white" />
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{expense.category.name}</Text>
                      {expense.note ? (
                        <Text style={styles.transactionNote}>{expense.note}</Text>
                      ) : null}
                      <Text style={styles.transactionDate}>{formatDate(expense.date)}</Text>
                    </View>
                  </View>
                  <Text style={styles.transactionAmount}>-€{expense.amount.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  monthlyCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  halfCard: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4CAF50',
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeText: {
    marginLeft: 4,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  budgetOverview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#666',
    marginRight: 4,
  },
  budgetProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetStat: {
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  noExpenses: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

