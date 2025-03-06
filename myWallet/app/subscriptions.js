import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Subscriptions() {
  const { subscriptions = [], processSubscriptionPayment, deleteSubscription, clearAllSubscriptions } = useWallet() || {};
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [localSubscriptions, setLocalSubscriptions] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);
  
  // Delete modal state
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  // Check for offline status and pending operations
  useEffect(() => {
    // Function to check connection status
    const checkConnection = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      console.log(`Network status: ${online ? 'online' : 'offline'}`);
    };
    
    // Check for pending operations in queue
    const checkPendingOperations = async () => {
      try {
        const queueJson = await AsyncStorage.getItem('operation_queue');
        if (queueJson) {
          const queue = JSON.parse(queueJson);
          setPendingOperations(queue.length);
          console.log(`Found ${queue.length} pending operations in queue`);
        } else {
          setPendingOperations(0);
        }
      } catch (error) {
        console.error('Error checking pending operations:', error);
      }
    };
    
    // Initial checks
    checkConnection();
    checkPendingOperations();
    
    // Set up listeners
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Periodic check for pending operations
    const intervalId = setInterval(checkPendingOperations, 10000);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(intervalId);
    };
  }, []);

  // Load data from context when the component mounts or subscriptions change
  useEffect(() => {
    console.log('Subscriptions screen - received subscriptions from context:', subscriptions.length);
    setLocalSubscriptions(subscriptions);
    setIsLoading(false);
  }, [subscriptions]);

  // Handle going back
  const handleGoBack = () => {
    try {
      // Use navigation to go back to previous screen
      router.back();
    } catch (error) {
      console.error('Error navigating back:', error);
      // Fallback to navigating to the home tab
      router.replace('/(tabs)');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `€${amount.toFixed(2)}`;
  };

  // Format date to user-friendly string
  const formatDate = (date) => {
    if (!date) return 'Not set';
    
    try {
      // Parse date if it's a string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return 'Invalid date';
      }
      
      // Format the date
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Error';
    }
  };

  // Handle processing a subscription payment
  const handleProcessPayment = useCallback((subscriptionId) => {
    Alert.alert(
      'Process Payment',
      'Do you want to process this subscription payment?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Process',
          style: 'default',
          onPress: async () => {
            if (isLoading) return;
            setIsLoading(true);
            console.log('Attempting to process payment for:', subscriptionId);
            try {
              const result = await processSubscriptionPayment(subscriptionId);
              if (result) {
                Alert.alert('Success', 'Subscription payment processed successfully');
              } else {
                Alert.alert('Error', 'Failed to process subscription payment');
              }
            } catch (error) {
              console.error('Error when processing payment:', error);
              Alert.alert('Error', 'An unexpected error occurred while processing the payment');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [processSubscriptionPayment, isLoading]);

  // Handle deleting a subscription
  const handleDeleteSubscription = useCallback((subscriptionId) => {
    console.log('Starting delete process for subscription ID:', subscriptionId);
    
    // Exit early if no valid ID
    if (!subscriptionId) {
      console.error('Cannot delete subscription: No ID provided');
      Alert.alert('Error', 'Unable to delete this subscription - no ID found.');
      return;
    }
    
    // Look up the subscription by ID to display its name
    const subscription = localSubscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      Alert.alert('Error', 'Cannot find this subscription in your list.');
      return;
    }
    
    // Set the subscription to delete and show the modal
    setSubscriptionToDelete(subscription);
    setDeleteModalVisible(true);
  }, [localSubscriptions]);
  
  // Confirm delete in the modal
  const confirmDeleteSubscription = useCallback(async () => {
    if (!subscriptionToDelete) return;
    
    // Get subscription name for messages
    const subscriptionName = subscriptionToDelete.name || 'Unnamed Subscription';
    
    setIsLoading(true);
    console.log('User confirmed deletion of subscription:', subscriptionToDelete.id);
    
    try {
      console.log('Calling deleteSubscription with ID:', subscriptionToDelete.id);
      const result = await deleteSubscription(subscriptionToDelete.id);
      console.log('Delete operation result:', result);
      
      // Close the modal
      setDeleteModalVisible(false);
      
      if (result) {
        // Success - show confirmation
        Alert.alert(
          'Success',
          `"${subscriptionName}" has been deleted successfully.`,
          [{ text: 'OK' }]
        );
      } else {
        // Failed - show error
        Alert.alert(
          'Error',
          'Failed to delete subscription. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error handling
      console.error('Exception when deleting subscription:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while deleting the subscription: ' + error.message,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionToDelete, deleteSubscription]);
  
  // Cancel delete in the modal
  const cancelDeleteSubscription = useCallback(() => {
    setDeleteModalVisible(false);
    setSubscriptionToDelete(null);
    console.log('Delete subscription cancelled by user');
  }, []);

  // Handle clearing all subscriptions
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Subscriptions',
      'Are you sure you want to delete ALL subscriptions? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (isLoading) return;
            setIsLoading(true);
            
            // Optimistic UI update
            setLocalSubscriptions([]);
            
            try {
              // Use context function to clear subscriptions
              const result = await clearAllSubscriptions();
              
              if (!result) {
                // Rollback if failed
                setLocalSubscriptions(subscriptions);
                Alert.alert('Error', 'Failed to clear subscriptions');
              } else {
                console.log('All subscriptions cleared successfully');
              }
            } catch (error) {
              // Rollback if error
              setLocalSubscriptions(subscriptions);
              console.error('Error clearing subscriptions:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [clearAllSubscriptions, subscriptions, isLoading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            testID="backButton"
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Subscriptions ({(subscriptions?.length || 0)})
          </Text>
          
          <TouchableOpacity 
            onPress={handleClearAll}
            style={styles.clearButton}
            disabled={isLoading}
            testID="clearAllButton"
          >
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
        
        {/* Network Status Indicator */}
        {(!isOnline || pendingOperations > 0) && (
          <View style={[styles.offlineBar, { backgroundColor: isOnline ? theme.warning : theme.error }]}>
            <Ionicons 
              name={isOnline ? "cloud-upload" : "cloud-offline"} 
              size={16} 
              color="white" 
            />
            <Text style={styles.offlineText}>
              {!isOnline 
                ? "You're offline. Changes will sync when you're back online." 
                : `Syncing ${pendingOperations} pending ${pendingOperations === 1 ? 'change' : 'changes'}...`
              }
            </Text>
          </View>
        )}
        
        <ScrollView style={styles.scrollView}>
          {localSubscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar" size={50} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>No subscriptions yet</Text>
              <Text style={[styles.emptyStateSubText, { color: theme.textSecondary }]}>
                Add a subscription by tapping the calendar button on a transaction
              </Text>
              
              <View style={styles.helpContainer}>
                <Text style={[styles.helpTitle, { color: theme.text }]}>How to add a subscription</Text>
                <View style={styles.helpStep}>
                  <Text style={[styles.helpStepNumber, { color: theme.primary }]}>1</Text>
                  <Text style={[styles.helpStepText, { color: theme.textSecondary }]}>
                    Go to Calendar tab
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={[styles.helpStepNumber, { color: theme.primary }]}>2</Text>
                  <Text style={[styles.helpStepText, { color: theme.textSecondary }]}>
                    Find the transaction you want to add as subscription
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={[styles.helpStepNumber, { color: theme.primary }]}>3</Text>
                  <Text style={[styles.helpStepText, { color: theme.textSecondary }]}>
                    Tap the calendar icon <Ionicons name="calendar-outline" size={16} color={theme.primary} /> next to the transaction
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              {localSubscriptions.map((subscription, index) => (
                <View key={subscription.id || index} style={[styles.subscriptionItem, { backgroundColor: theme.cardBackground }]}>
                  <View style={styles.subscriptionLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: subscription.category?.color || '#888888' }]}>
                      <Ionicons 
                        name={subscription.category?.icon || 'calendar'} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.subscriptionInfo}>
                      <Text style={[styles.subscriptionName, { color: theme.text }]}>
                        {subscription.name || 'Unnamed Subscription'}
                      </Text>
                      <Text style={[styles.subscriptionDate, { color: theme.textSecondary }]}>
                        Since: {formatDate(subscription.startDate)}
                      </Text>
                      {subscription.lastBilledDate && (
                        <Text style={[styles.subscriptionLastBilled, { color: theme.textSecondary }]}>
                          Last billed: {formatDate(subscription.lastBilledDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.subscriptionRight}>
                    <Text style={[styles.subscriptionAmount, { color: theme.error }]}>
                      {formatCurrency(subscription.amount || 0)}
                    </Text>
                    <View style={styles.subscriptionActions}>
                      <TouchableOpacity
                        onPress={() => handleProcessPayment(subscription.id)}
                        style={styles.actionButton}
                        disabled={isLoading}
                      >
                        <Ionicons name="card-outline" size={22} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSubscription(subscription.id)}
                        style={styles.actionButton}
                        disabled={isLoading}
                      >
                        <Ionicons name="trash-outline" size={22} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        
        {/* Subscription Delete Confirmation Modal */}
        <Modal
          visible={isDeleteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cancelDeleteSubscription}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Subscription</Text>
              
              {subscriptionToDelete && (
                <>
                  <View style={styles.subscriptionSummary}>
                    <View style={[styles.categoryIcon, { backgroundColor: subscriptionToDelete.category?.color || '#888888' }]}>
                      <Ionicons 
                        name={subscriptionToDelete.category?.icon || 'calendar'} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.summaryDetails}>
                      <Text style={styles.summaryName}>{subscriptionToDelete.name || 'Unnamed Subscription'}</Text>
                      <Text style={styles.summaryAmount}>{formatCurrency(subscriptionToDelete.amount || 0)}</Text>
                      <Text style={styles.summaryFrequency}>
                        {subscriptionToDelete.billingCycle || 'monthly'} since {formatDate(subscriptionToDelete.startDate)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.warningText}>
                    Are you sure you want to delete this subscription? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={cancelDeleteSubscription}
                      disabled={isLoading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={confirmDeleteSubscription}
                      disabled={isLoading}
                    >
                      <Text style={styles.deleteButtonText}>
                        {isLoading ? 'Deleting...' : 'Delete Subscription'}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  helpContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpStepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  helpStepText: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: undefined,
        shadowOffset: undefined,
        shadowOpacity: undefined,
        shadowRadius: undefined,
        elevation: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 12,
    color: '#999',
  },
  subscriptionLastBilled: {
    fontSize: 12,
    color: '#999',
  },
  subscriptionRight: {
    alignItems: 'flex-end',
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e63946',
    marginBottom: 8,
  },
  subscriptionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'center',
    width: '100%',
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  subscriptionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryDetails: {
    marginLeft: 12,
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryAmount: {
    fontSize: 18,
    color: '#E91E63',
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryFrequency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  warningText: {
    fontSize: 14,
    color: '#E91E63',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#E91E63',
    marginLeft: 8,
    opacity: function(props) {
      return props.disabled ? 0.5 : 1;
    },
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 