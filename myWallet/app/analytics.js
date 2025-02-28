import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Analytics() {
  // Mock data for the analytics
  const spendingCategories = [
    { name: 'Shopping', amount: 450.00, color: '#E91E63', icon: 'cart' },
    { name: 'Food', amount: 320.50, color: '#FF9800', icon: 'fast-food' },
    { name: 'Transport', amount: 150.75, color: '#2196F3', icon: 'car' },
    { name: 'Entertainment', amount: 200.25, color: '#9C27B0', icon: 'game-controller' },
  ];

  const totalSpending = spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spending</Text>
          <Text style={styles.totalAmount}>${totalSpending.toFixed(2)}</Text>
          <Text style={styles.periodLabel}>This Month</Text>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          
          {spendingCategories.map((category, index) => {
            const percentage = ((category.amount / totalSpending) * 100).toFixed(1);
            
            return (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={20} color="white" />
                  </View>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <View style={styles.percentageBar}>
                      <View 
                        style={[
                          styles.percentageFill, 
                          { 
                            backgroundColor: category.color,
                            width: `${percentage}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={styles.categoryAmount}>${category.amount.toFixed(2)}</Text>
                  <Text style={styles.categoryPercentage}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
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
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoriesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
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
    marginBottom: 4,
  },
  percentageBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    width: 100,
  },
  percentageFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
}); 