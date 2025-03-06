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

  // Navigate to add transaction screen
  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  // Navigate to budgets screen
  const handleBudgets = () => {
    router.push('/budget');
  };

  // Navigate to analytics screen
  const handleAnalytics = () => {
    router.push('/analytics');
  };

  // Navigate to settings
  const handleSettings = () => {
    router.push('/settings');
  };

  // Get recent expenses
  const recentExpenses = useMemo(() => {
    return expenses
      .filter(expense => expense.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [expenses]);

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
            <Text style={styles.balanceAmount}>€{balance.toFixed(2)}</Text>
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
              onPress={handleAddTransaction}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="add" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Add Transaction</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 16,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
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
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyStat: {
    alignItems: 'center',
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
    width: 1,
    height: '100%',
    backgroundColor: '#f0f0f0',
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

