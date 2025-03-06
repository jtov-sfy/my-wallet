import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CATEGORIES } from '../constants/categories';
import { useWallet } from '../context/WalletContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Budgets() {
  const { monthlyBudget, updateMonthlyBudget, expenses } = useWallet();
  
  // Keep track of the budget amount being edited
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  
  // Calculate total spent this month
  const [totalSpent, setTotalSpent] = useState(0);
  
  useEffect(() => {
    // Initialize budget value when component mounts
    if (typeof monthlyBudget === 'number') {
      setBudgetValue(monthlyBudget.toString());
    } else {
      setBudgetValue('0');
    }
    
    // Calculate total spent
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const spent = expenses
      .filter(expense => 
        expense.type === 'expense' && 
        new Date(expense.date) >= firstDayOfMonth
      )
      .reduce((total, expense) => total + Math.abs(expense.amount), 0);
    
    setTotalSpent(spent);
  }, [monthlyBudget, expenses]);
  
  const handleEditBudget = () => {
    setEditingBudget(true);
  };
  
  const handleSaveBudget = () => {
    const newBudget = parseFloat(budgetValue.replace(/[^0-9.]/g, '')) || 0;
    
    if (updateMonthlyBudget(newBudget)) {
      Alert.alert('Success', 'Monthly budget updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update monthly budget');
    }
    
    setEditingBudget(false);
  };
  
  const formatCurrency = (amount) => {
    return `€${amount.toFixed(2)}`;
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Monthly Budget</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>Monthly Budget</Text>
              {!editingBudget ? (
                <TouchableOpacity onPress={handleEditBudget}>
                  <Ionicons name="create-outline" size={24} color="#2196F3" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSaveBudget}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>
            
            {editingBudget ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.budgetInput}
                  value={budgetValue}
                  onChangeText={setBudgetValue}
                  keyboardType="numeric"
                  placeholder="Enter budget amount"
                  autoFocus
                />
              </View>
            ) : (
              <Text style={styles.budgetAmount}>
                {formatCurrency(typeof monthlyBudget === 'number' ? monthlyBudget : 0)}
              </Text>
            )}
            
            <View style={styles.budgetProgressContainer}>
              <View style={styles.budgetProgress}>
                <View 
                  style={[
                    styles.budgetProgressFill, 
                    { 
                      width: `${((totalSpent / (typeof monthlyBudget === 'number' ? monthlyBudget : 1)) * 100).toFixed(0)}%`,
                      backgroundColor: totalSpent > monthlyBudget ? '#E91E63' : '#4CAF50'
                    }
                  ]} 
                />
              </View>
              <View style={styles.budgetStats}>
                <Text style={styles.budgetStatLabel}>
                  {formatCurrency(totalSpent)} spent of {formatCurrency(typeof monthlyBudget === 'number' ? monthlyBudget : 0)}
                </Text>
                <Text style={styles.budgetStatPercent}>
                  {((totalSpent / (typeof monthlyBudget === 'number' ? monthlyBudget : 1)) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          
          {/* Category spending visuals would go here */}
          <View style={styles.notImplemented}>
            <Ionicons name="construct-outline" size={48} color="#ccc" />
            <Text style={styles.notImplementedText}>
              Category budgets coming soon
            </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTitle: {
    fontSize: 18,
    color: '#333',
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  editContainer: {
    marginBottom: 16,
  },
  budgetInput: {
    fontSize: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    padding: 8,
  },
  budgetProgressContainer: {
    marginTop: 8,
  },
  budgetProgress: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetStatLabel: {
    color: '#666',
    fontSize: 14,
  },
  budgetStatPercent: {
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  notImplemented: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  notImplementedText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
}); 