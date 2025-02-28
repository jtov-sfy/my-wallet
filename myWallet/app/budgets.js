import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CATEGORIES } from '../constants/categories';

export default function Budgets() {
  // Mock data - in a real app, this would come from storage/backend
  const [budgets, setBudgets] = useState({
    shopping: { limit: 500, spent: 450 },
    food: { limit: 400, spent: 320.50 },
    transport: { limit: 200, spent: 150.75 },
    entertainment: { limit: 300, spent: 200.25 },
    bills: { limit: 1000, spent: 850 },
    health: { limit: 200, spent: 50 },
    subscriptions: { limit: 100, spent: 80 },
    other: { limit: 200, spent: 100 },
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const handleEditBudget = (categoryId) => {
    setEditingCategory(categoryId);
    setEditingValue(budgets[categoryId].limit.toString());
  };

  const handleSaveBudget = () => {
    if (!editingCategory) return;

    setBudgets(prev => ({
      ...prev,
      [editingCategory]: {
        ...prev[editingCategory],
        limit: parseFloat(editingValue) || 0
      }
    }));
    setEditingCategory(null);
    setEditingValue('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Monthly Budgets</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(CATEGORIES).map(([key, category]) => {
          const budget = budgets[category.id];
          const percentage = (budget.spent / budget.limit) * 100;
          const isOverBudget = percentage > 100;

          return (
            <View key={category.id} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={20} color="white" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                
                {editingCategory === category.id ? (
                  <View style={styles.editContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editingValue}
                      onChangeText={setEditingValue}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={handleSaveBudget}
                    >
                      <Ionicons name="checkmark" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.budgetLimit}
                    onPress={() => handleEditBudget(category.id)}
                  >
                    <Text style={styles.limitText}>
                      ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                    </Text>
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverBudget ? '#E91E63' : '#4CAF50'
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.percentageText,
                  isOverBudget && styles.overBudgetText
                ]}>
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  budgetLimit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentageText: {
    fontSize: 14,
    color: '#4CAF50',
    width: 60,
    textAlign: 'right',
  },
  overBudgetText: {
    color: '#E91E63',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
  },
  editInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
    padding: 4,
    minWidth: 80,
    marginRight: 8,
  },
  saveButton: {
    padding: 4,
  },
}); 