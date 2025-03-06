import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../constants/configFirebase';
import { ref, onValue, set, update, push, remove, get } from 'firebase/database';

// Helper functions for data validation and safer object handling
const safelyParseJSON = (jsonString, fallback = null) => {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

const ensureArray = (possibleArray, fallback = []) => {
  return Array.isArray(possibleArray) ? possibleArray : fallback;
};

const ensureNumber = (possibleNumber, fallback = 0) => {
  if (typeof possibleNumber === 'number' && !isNaN(possibleNumber)) {
    return possibleNumber;
  }
  if (typeof possibleNumber === 'string') {
    const parsed = parseFloat(possibleNumber);
    return !isNaN(parsed) ? parsed : fallback;
  }
  return fallback;
};

const ensureDate = (possibleDate, fallback = new Date()) => {
  if (possibleDate instanceof Date) {
    return possibleDate;
  }
  try {
    const date = new Date(possibleDate);
    return isNaN(date.getTime()) ? fallback : date;
  } catch (error) {
    return fallback;
  }
};

// Create context with default values to avoid "uninitialized variable" errors
const WalletContext = createContext({
  balance: 0,
  expenses: [],
  subscriptions: [],
  monthlyBudget: 0,
  dataLoaded: false,
  hasError: false,
  addExpense: async () => false,
  deleteExpense: async () => false,
  addSubscription: async () => null,
  deleteSubscription: async () => false,
  clearAllSubscriptions: async () => false,
  processSubscriptionPayment: async () => false,
  updateMonthlyBudget: async () => false,
  updateBalance: async () => false,
  resetDatabase: async () => false,
  initializeDatabaseStructure: async () => false,
});

// Create a safe wrapper for function calls that prevents uninitialized variable errors
const createSafeFunction = (fn, name = 'unknown', fallbackReturn = false) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (e) {
      console.error(`Error in safe function ${name}:`, e);
      return fallbackReturn;
    }
  };
};

export function WalletProvider({ children }) {
  // Wrap all code in a top-level try block to ensure the component never crashes
  try {
    // Initialize state with safe default values
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Add a queue system for operations that need to be performed later
    const [operationQueue, setOperationQueue] = useState([]);
    const [isOnline, setIsOnline] = useState(true);
    
    // Check network status and Firebase availability
    const checkFirebaseAvailability = useCallback(async () => {
      try {
        // Check if Firebase is working by writing a small test value
        if (database) {
          const testRef = ref(database, 'connectivity_test');
          await set(testRef, { timestamp: new Date().toISOString() });
          await remove(testRef);
          console.log('Firebase is available');
          return true;
        }
        return false;
      } catch (error) {
        console.log('Firebase is currently unavailable:', error.message);
        return false;
      }
    }, [database]);
    
    // Load operations queue from AsyncStorage
    const loadOperationQueue = useCallback(async () => {
      try {
        const queueJson = await AsyncStorage.getItem('operation_queue');
        if (queueJson) {
          const queue = safelyParseJSON(queueJson, []);
          console.log(`Loaded ${queue.length} pending operations from AsyncStorage`);
          setOperationQueue(queue);
          return queue;
        }
        return [];
      } catch (error) {
        console.error('Error loading operation queue:', error);
        return [];
      }
    }, []);
    
    // Save operations queue to AsyncStorage
    const saveOperationQueue = useCallback(async (queue) => {
      try {
        await AsyncStorage.setItem('operation_queue', JSON.stringify(queue));
        console.log(`Saved ${queue.length} operations to queue`);
      } catch (error) {
        console.error('Error saving operation queue:', error);
      }
    }, []);
    
    // Add an operation to the queue
    const addToOperationQueue = useCallback(async (operation) => {
      try {
        const newQueue = [...operationQueue, operation];
        setOperationQueue(newQueue);
        await saveOperationQueue(newQueue);
        console.log(`Added operation to queue: ${operation.type}`);
      } catch (error) {
        console.error('Error adding operation to queue:', error);
      }
    }, [operationQueue, saveOperationQueue]);
    
    // Process the operation queue when online
    const processOperationQueue = useCallback(async () => {
      if (!isOnline || operationQueue.length === 0) return;
      
      console.log(`Processing operation queue (${operationQueue.length} items)...`);
      
      // Check if Firebase is available now
      const isFirebaseAvailable = await checkFirebaseAvailability();
      if (!isFirebaseAvailable) {
        console.log('Firebase still unavailable, will retry later');
        return;
      }
      
      // Process each operation
      const newQueue = [...operationQueue];
      const completedOperations = [];
      
      for (let i = 0; i < newQueue.length; i++) {
        const operation = newQueue[i];
        try {
          console.log(`Processing operation: ${operation.type} (ID: ${operation.id})`);
          
          switch (operation.type) {
            case 'add_subscription':
              // Create subscription reference
              const subscriptionsRef = ref(database, 'wallet/subscriptions');
              
              // If we have an ID, use it, otherwise generate a new one
              let subscriptionRef;
              if (operation.localId && operation.localId.startsWith('local_')) {
                // Generate new Firebase key
                subscriptionRef = push(subscriptionsRef);
                console.log(`Generated new Firebase ID ${subscriptionRef.key} for local ID ${operation.localId}`);
              } else if (operation.id) {
                // Use existing ID
                subscriptionRef = ref(database, `wallet/subscriptions/${operation.id}`);
              } else {
                // Generate new Firebase key as fallback
                subscriptionRef = push(subscriptionsRef);
              }
              
              // Save data to Firebase
              await set(subscriptionRef, operation.data);
              console.log(`Synced subscription to Firebase with ID: ${subscriptionRef.key}`);
              completedOperations.push(i);
              break;
              
            case 'delete_subscription':
              // Delete from Firebase
              const deleteRef = ref(database, `wallet/subscriptions/${operation.id}`);
              await remove(deleteRef);
              console.log(`Synced subscription deletion to Firebase: ${operation.id}`);
              completedOperations.push(i);
              break;
              
            case 'update_balance':
              // Update balance in Firebase
              const balanceRef = ref(database, 'wallet/balance');
              await set(balanceRef, operation.data);
              console.log(`Synced balance update to Firebase: ${operation.data}`);
              completedOperations.push(i);
              break;
              
            case 'update_budget':
              // Update budget in Firebase
              const budgetRef = ref(database, 'wallet/monthlyBudget');
              await set(budgetRef, operation.data);
              console.log(`Synced budget update to Firebase: ${operation.data}`);
              completedOperations.push(i);
              break;
              
            default:
              console.warn(`Unknown operation type: ${operation.type}`);
              completedOperations.push(i); // Skip unknown operations
          }
        } catch (error) {
          console.error(`Error processing operation ${operation.type}:`, error);
          // Keep the operation in the queue to retry later
        }
      }
      
      // Remove completed operations from queue
      const filteredQueue = newQueue.filter((_, index) => !completedOperations.includes(index));
      setOperationQueue(filteredQueue);
      await saveOperationQueue(filteredQueue);
      
      console.log(`Processed ${completedOperations.length} operations, ${filteredQueue.length} remaining`);
      
      // Update UI with the latest data by triggering a reload from Firebase
      if (completedOperations.length > 0) {
        console.log('Refreshing data from Firebase after sync');
        // Data will be automatically refreshed by Firebase listeners
      }
    }, [isOnline, operationQueue, saveOperationQueue, checkFirebaseAvailability]);
    
    // Handle online/offline status
    useEffect(() => {
      // Load any pending operations when the app starts
      loadOperationQueue();
      
      // Set up listeners for online/offline status
      const handleConnectionChange = () => {
        const newOnlineStatus = navigator.onLine;
        console.log(`Connection status changed: ${newOnlineStatus ? 'online' : 'offline'}`);
        setIsOnline(newOnlineStatus);
        
        // Process queue when coming back online
        if (newOnlineStatus) {
          processOperationQueue();
        }
      };
      
      // Check connection status immediately
      setIsOnline(navigator.onLine);
      
      // Set up listeners for online/offline events
      window.addEventListener('online', handleConnectionChange);
      window.addEventListener('offline', handleConnectionChange);
      
      // Set up a timer to periodically try to process the operation queue
      const intervalId = setInterval(() => {
        if (operationQueue.length > 0) {
          processOperationQueue();
        }
      }, 30000); // Try every 30 seconds
      
      // Cleanup
      return () => {
        window.removeEventListener('online', handleConnectionChange);
        window.removeEventListener('offline', handleConnectionChange);
        clearInterval(intervalId);
      };
    }, [loadOperationQueue, processOperationQueue, operationQueue.length]);

    // Function to initialize database structure if needed
    const initializeDatabaseStructure = useCallback(async () => {
      try {
        console.log('Initializing database structure...');
        
        // Create references to all main paths
        const walletRef = ref(database, 'wallet');
        const snapshot = await get(walletRef);
        
        // If the wallet node doesn't exist, initialize all paths
        if (!snapshot.exists()) {
          console.log('Creating initial database structure');
          
          // Set up initial structure
          const initialStructure = {
            balance: 0,
            monthlyBudget: 0,
            expenses: {},
            subscriptions: {}
          };
          
          await set(walletRef, initialStructure);
          console.log('Database structure initialized successfully');
        } else {
          console.log('Database structure already exists');
          
          // Check for subscriptions node, create if missing
          const subscriptionsRef = ref(database, 'wallet/subscriptions');
          const subsSnapshot = await get(subscriptionsRef);
          if (!subsSnapshot.exists()) {
            await set(subscriptionsRef, {});
            console.log('Created missing subscriptions node');
          }
          
          // Check for expenses node, create if missing
          const expensesRef = ref(database, 'wallet/expenses');
          const expSnapshot = await get(expensesRef);
          if (!expSnapshot.exists()) {
            await set(expensesRef, {});
            console.log('Created missing expenses node');
          }
          
          // Check for budget, create if missing
          const budgetRef = ref(database, 'wallet/monthlyBudget');
          const budgetSnapshot = await get(budgetRef);
          if (!budgetSnapshot.exists()) {
            await set(budgetRef, 0);
            console.log('Created missing monthlyBudget node');
          }
          
          // Check for balance, create if missing
          const balanceRef = ref(database, 'wallet/balance');
          const balanceSnapshot = await get(balanceRef);
          if (!balanceSnapshot.exists()) {
            await set(balanceRef, 0);
            console.log('Created missing balance node');
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error initializing database structure:', error);
        return false;
      }
    }, []);
    
    // Initialize the database on app startup
    useEffect(() => {
      if (database) {
        initializeDatabaseStructure().then(() => {
          console.log('Database structure check completed');
        });
      }
    }, [database, initializeDatabaseStructure]);

    // Load data when app starts - now from Firebase
    useEffect(() => {
      console.log('Initial data loading started from Firebase');
      try {
        console.log('Setting up Firebase listeners for real-time data');
      
        // Listen for balance changes
        const balanceRef = ref(database, 'wallet/balance');
        const balanceListener = onValue(balanceRef, (snapshot) => {
          if (snapshot.exists()) {
            const value = snapshot.val();
            console.log('Received balance from Firebase:', value);
            setBalance(ensureNumber(value, 0));
          } else {
            // Initialize with 0 if no balance exists
            set(balanceRef, 0);
            setBalance(0);
            console.log('Initialized balance in Firebase');
          }
        }, (error) => {
          console.error('Error loading balance from Firebase:', error);
          setBalance(0);
        });
        
        // Listen for expense changes
        const expensesRef = ref(database, 'wallet/expenses');
        const expensesListener = onValue(expensesRef, (snapshot) => {
          if (snapshot.exists()) {
            // Convert from Firebase object to array
            const expensesData = snapshot.val();
            const expensesArray = Object.keys(expensesData).map(key => {
              const expense = expensesData[key];
              return {
                id: key,
                amount: ensureNumber(expense.amount, 0),
                date: expense.date ? new Date(expense.date) : new Date(),
                note: String(expense.note || ''),
                type: String(expense.type || 'expense'),
                category: expense.category ? {
                  id: expense.category.id || '',
                  name: String(expense.category.name || ''),
                  icon: String(expense.category.icon || 'cash'),
                  color: String(expense.category.color || '#888888')
                } : {
                  id: 'uncategorized',
                  name: 'Uncategorized',
                  icon: 'cash',
                  color: '#888888'
                }
              };
            });
            console.log(`Loaded ${expensesArray.length} expenses from Firebase`);
            setExpenses(expensesArray);
          } else {
            // Initialize with empty object
            set(expensesRef, {});
            console.log('Initialized expenses in Firebase');
            setExpenses([]);
          }
        }, (error) => {
          console.error('Error loading expenses from Firebase:', error);
          setExpenses([]);
        });
        
        // Listen for budget changes
        const budgetRef = ref(database, 'wallet/monthlyBudget');
        const budgetListener = onValue(budgetRef, (snapshot) => {
          if (snapshot.exists()) {
            const value = snapshot.val();
            console.log('Received monthly budget from Firebase:', value);
            setMonthlyBudget(ensureNumber(value, 0));
          } else {
            // Initialize with 0 if no budget exists
            set(budgetRef, 0);
            setMonthlyBudget(0);
            console.log('Initialized monthly budget in Firebase');
          }
        }, (error) => {
          console.error('Error loading monthly budget from Firebase:', error);
          setMonthlyBudget(0);
        });
        
        // Listen for subscription changes
        const subscriptionsRef = ref(database, 'wallet/subscriptions');
        const subscriptionsListener = onValue(subscriptionsRef, (snapshot) => {
          if (snapshot.exists()) {
            // Convert from Firebase object to array with ids
            const subscriptionsData = snapshot.val();
            console.log('Raw subscriptions data:', JSON.stringify(subscriptionsData).slice(0, 200) + '...');
            const subscriptionsArray = Object.keys(subscriptionsData).map(key => {
              const subscription = subscriptionsData[key];
              return {
                id: key, // Include the Firebase key as the ID
                name: String(subscription.name || 'Unnamed Subscription'),
                amount: ensureNumber(subscription.amount, 0),
                category: subscription.category ? {
                  id: subscription.category.id || '',
                  name: String(subscription.category.name || 'Uncategorized'),
                  icon: String(subscription.category.icon || 'calendar'),
                  color: String(subscription.category.color || '#888888')
                } : {
                  id: 'uncategorized',
                  name: 'Uncategorized',
                  icon: 'calendar',
                  color: '#888888'
                },
                note: subscription.note ? String(subscription.note) : '',
                startDate: ensureDate(subscription.startDate),
                lastBilledDate: subscription.lastBilledDate ? ensureDate(subscription.lastBilledDate) : null,
                billingCycle: String(subscription.billingCycle || 'monthly')
              };
            });
            console.log(`Loaded ${subscriptionsArray.length} subscriptions from Firebase with IDs:`, 
                       subscriptionsArray.map(s => s.id).join(', '));
            setSubscriptions(subscriptionsArray);
          } else {
            // Initialize with empty object
            set(subscriptionsRef, {});
            console.log('Initialized subscriptions in Firebase');
            setSubscriptions([]);
          }
        }, (error) => {
          console.error('Error loading subscriptions from Firebase:', error);
          setSubscriptions([]);
        });
        
        // Mark data as loaded once Firebase listeners are set up
        setDataLoaded(true);
        console.log('Firebase data loading completed');
        
        // Clean up Firebase listeners when component unmounts
        return () => {
          // Detach listeners
          balanceListener();
          expensesListener();
          budgetListener();
          subscriptionsListener();
          console.log('Firebase listeners detached');
        };
      } catch (error) {
        console.error('Fatal error setting up Firebase listeners:', error);
        setDataLoaded(true);
        setHasError(true);
      }
    }, []);

    // Function to add an expense - now using Firebase
    const addExpense = async (expense) => {
      try {
        console.log('addExpense called with:', expense ? JSON.stringify(expense).slice(0, 100) : 'undefined expense');
        
        // Validate expense object
        if (!expense) {
          console.error('Expense object is undefined or null');
          return false;
        }
        
        // Validate required fields
        if (expense.amount === undefined || expense.amount === null) {
          console.error('Expense amount is required');
          return false;
        }
        
        if (!expense.type) {
          console.error('Expense type is required');
          return false;
        }
        
        // Create a sanitized copy of the expense with safe defaults for any missing properties
        const newExpense = {
          amount: ensureNumber(expense.amount),
          type: String(expense.type),
          date: expense.date instanceof Date ? expense.date.toISOString() : (
            typeof expense.date === 'string' ? expense.date : new Date().toISOString()
          ),
          // Ensure category exists with required properties
          category: expense.category ? {
            id: String(expense.category.id || ''),
            name: String(expense.category.name || 'Uncategorized'),
            icon: String(expense.category.icon || 'help-circle'),
            color: String(expense.category.color || '#888888')
          } : {
            id: 'uncategorized',
            name: 'Uncategorized',
            icon: 'help-circle',
            color: '#888888'
          },
          note: typeof expense.note === 'string' ? expense.note : ''
        };
        
        console.log('Created sanitized expense:', JSON.stringify(newExpense).slice(0, 100));
        
        // Save to Firebase Realtime Database
        const expensesRef = ref(database, 'wallet/expenses');
        const newExpenseRef = push(expensesRef);
        
        await set(newExpenseRef, newExpense);
        console.log('Expense saved to Firebase successfully');
        
        // Update balance in Firebase
        const balanceRef = ref(database, 'wallet/balance');
        const currentBalance = ensureNumber(balance);
        
        // We need to ensure income adds to the balance and expense subtracts
        // This is the critical logic for handling transaction impact on balance
        let amountChange;
        if (newExpense.type === 'income') {
          // For income: Add the amount (positive change)
          amountChange = Math.abs(newExpense.amount);
          console.log(`Income transaction: +${amountChange}`);
        } else {
          // For expense: Subtract the amount (negative change)
          amountChange = -Math.abs(newExpense.amount);
          console.log(`Expense transaction: ${amountChange}`);
        }
        
        const newBalance = currentBalance + amountChange;
        
        await set(balanceRef, newBalance);
        console.log(`Balance updated in Firebase: ${currentBalance} -> ${newBalance}, Change: ${amountChange} (${newExpense.type})`);
        
        // Update monthly budget if it's an expense
        if (newExpense.type === 'expense') {
          const budgetRef = ref(database, 'wallet/monthlyBudget');
          const currentBudget = { ...monthlyBudget };
          const newSpent = ensureNumber(currentBudget) + newExpense.amount;
          const newRemaining = ensureNumber(currentBudget) - newSpent;
          
          await set(budgetRef, newSpent);
          console.log(`Budget updated in Firebase: spent ${currentBudget} -> ${newSpent}`);
        }
        
        return true;
      } catch (error) {
        console.error('Error adding expense to Firebase:', error);
        return false;
      }
    };
    
    // Function to delete expense - now using Firebase
    const deleteExpense = async (expenseId) => {
      try {
        if (!expenseId) {
          console.error('No expense ID provided for deletion');
          return false;
        }
        
        // Get the expense to delete first
        const expenseRef = ref(database, `wallet/expenses/${expenseId}`);
        
        // Get a one-time snapshot to read the expense data
        return new Promise((resolve, reject) => {
          onValue(expenseRef, async (snapshot) => {
            try {
              const expense = snapshot.val();
              
              if (!expense) {
                console.error('Expense not found for deletion:', expenseId);
                resolve(false);
                return;
              }
              
              console.log('Found expense to delete:', expense);
              
              // Calculate balance adjustment - when deleting, we need to reverse the effect:
              // For an income: Remove the amount from balance (negative adjustment)
              // For an expense: Add the amount back to balance (positive adjustment)
              let amountChange;
              if (expense.type === 'income') {
                // For income deletion: Subtract the amount (negative change)
                amountChange = -Math.abs(expense.amount);
                console.log(`Deleting income transaction: ${amountChange}`);
              } else {
                // For expense deletion: Add the amount back (positive change)
                amountChange = Math.abs(expense.amount);
                console.log(`Deleting expense transaction: +${amountChange}`);
              }
              
              const currentBalance = ensureNumber(balance);
              const newBalance = currentBalance + amountChange;
              
              // Delete from Firebase
              await remove(expenseRef);
              console.log('Expense deleted from Firebase successfully');
              
              // Update balance
              const balanceRef = ref(database, 'wallet/balance');
              await set(balanceRef, newBalance);
              console.log(`Balance updated in Firebase after deletion: ${currentBalance} -> ${newBalance}, Change: ${amountChange} (${expense.type})`);
              
              // Update monthly budget if it's an expense
              if (expense.type === 'expense') {
                const budgetRef = ref(database, 'wallet/monthlyBudget');
                const currentBudget = { ...monthlyBudget };
                const newSpent = Math.max(0, ensureNumber(currentBudget) - expense.amount);
                const newRemaining = ensureNumber(currentBudget) - newSpent;
                
                await set(budgetRef, newSpent);
                console.log(`Budget updated in Firebase after deletion: spent ${currentBudget} -> ${newSpent}`);
              }
              
              resolve(true);
            } catch (error) {
              console.error('Error processing expense deletion:', error);
              reject(error);
            }
          }, {
            onlyOnce: true // Get data once, not listening for changes
          });
        });
      } catch (error) {
        console.error('Error deleting expense from Firebase:', error);
        return false;
      }
    };
    
    // Function to add a subscription - now with offline support
    const addSubscription = useCallback(async (expense) => {
      try {
        console.log('addSubscription called with expense:', expense ? JSON.stringify(expense).substring(0, 300) : 'undefined');
        
        if (!expense) {
          console.error('No expense data provided for subscription');
          return null;
        }
        
        // Ensure we have valid category data
        const category = expense.category || {
          id: 'default',
          name: 'Subscription',
          icon: 'calendar',
          color: '#888888'
        };
        
        // Create a new subscription from the expense with sanitized data
        const newSubscription = {
          name: String(expense.note || category.name || 'Unnamed Subscription'),
          amount: ensureNumber(expense.amount, 0),
          category: {
            id: category.id || '',
            name: String(category.name || 'Uncategorized'),
            icon: String(category.icon || 'calendar'),
            color: String(category.color || '#888888')
          },
          startDate: typeof expense.date === 'string' ? expense.date : 
                    (expense.date instanceof Date ? expense.date.toISOString() : new Date().toISOString()),
          lastBilledDate: null, // New subscriptions haven't been billed yet
          billingCycle: expense.billingCycle || 'monthly', // Use provided billing cycle or default to monthly
          note: String(expense.additionalNote || expense.note || '')
        };
        
        console.log('Prepared subscription data:', JSON.stringify(newSubscription));
        
        // Check if Firebase is available
        const isFirebaseAvailable = await checkFirebaseAvailability();
        
        if (!isFirebaseAvailable) {
          console.log('Firebase unavailable, using AsyncStorage and queueing for later sync');
          
          // Generate a local ID
          const localId = 'local_' + new Date().getTime();
          
          // Save to AsyncStorage
          try {
            // Get existing subscriptions
            const existingSubscriptionsJson = await AsyncStorage.getItem('wallet_subscriptions');
            const existingSubscriptions = safelyParseJSON(existingSubscriptionsJson, []);
            
            // Add the new subscription with local ID
            const subscriptionWithId = { ...newSubscription, id: localId };
            const updatedSubscriptions = [...existingSubscriptions, subscriptionWithId];
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('wallet_subscriptions', JSON.stringify(updatedSubscriptions));
            
            console.log('Subscription saved to AsyncStorage with local ID:', localId);
            
            // Don't update local state - the Firebase listener will handle this
            // This prevents duplicate entries in the UI
            
            // Add to operation queue for later sync
            await addToOperationQueue({
              type: 'add_subscription',
              data: newSubscription,
              localId: localId,
              timestamp: new Date().toISOString(),
              id: null // Will be generated by Firebase when synced
            });
            
            return localId;
          } catch (asyncError) {
            console.error('Failed to save subscription to AsyncStorage:', asyncError);
            return null;
          }
        }
        
        // Firebase is available, proceed with normal flow
        try {
          console.log('Creating new subscription in Firebase');
          
          // Ensure the wallet node exists
          const walletRef = ref(database, 'wallet');
          const walletSnapshot = await get(walletRef);
          
          if (!walletSnapshot.exists()) {
            console.log('Creating wallet node in Firebase');
            await set(walletRef, {
              balance: 0,
              monthlyBudget: 0,
              expenses: {},
              subscriptions: {}
            });
          }
          
          // Create subscription in Firebase
          const subscriptionsRef = ref(database, 'wallet/subscriptions');
          const newSubscriptionRef = push(subscriptionsRef);
          const subscriptionId = newSubscriptionRef.key;
          
          console.log('Generated new subscription ID:', subscriptionId);
          
          await set(newSubscriptionRef, newSubscription);
          console.log('Subscription saved to Firebase with ID:', subscriptionId);
          
          // Verify it was saved
          const verifySnapshot = await get(newSubscriptionRef);
          if (verifySnapshot.exists()) {
            console.log('Verified subscription was saved');
            
            // Don't manually update the state - the Firebase listener will handle this
            // This prevents duplicate entries in the UI
            
            return subscriptionId;
          } else {
            console.error('Verification failed - subscription not found after save');
            return null;
          }
        } catch (firebaseError) {
          console.error('Firebase error saving subscription:', firebaseError);
          
          // Fallback to AsyncStorage and queue for later
          const localId = 'local_' + new Date().getTime();
          
          // Save to AsyncStorage
          try {
            const existingSubscriptionsJson = await AsyncStorage.getItem('wallet_subscriptions');
            const existingSubscriptions = safelyParseJSON(existingSubscriptionsJson, []);
            
            const subscriptionWithId = { ...newSubscription, id: localId };
            const updatedSubscriptions = [...existingSubscriptions, subscriptionWithId];
            
            await AsyncStorage.setItem('wallet_subscriptions', JSON.stringify(updatedSubscriptions));
            
            console.log('Subscription saved to AsyncStorage after Firebase failure, local ID:', localId);
            
            // Don't update local state - AsyncStorage will be used if needed
            
            // Add to operation queue for later sync
            await addToOperationQueue({
              type: 'add_subscription',
              data: newSubscription,
              localId: localId,
              timestamp: new Date().toISOString(),
              id: null
            });
            
            return localId;
          } catch (asyncError) {
            console.error('Failed to save subscription to AsyncStorage after Firebase error:', asyncError);
            return null;
          }
        }
      } catch (error) {
        console.error('Error in addSubscription:', error);
        return null;
      }
    }, [checkFirebaseAvailability, addToOperationQueue]);
    
    // Function to delete a subscription - now with offline support
    const deleteSubscription = async (subscriptionId) => {
      console.log('deleteSubscription called with ID:', subscriptionId);
      
      try {
        if (!subscriptionId) {
          console.error('No subscription ID provided for deletion');
          return false;
        }
        
        // Check if Firebase is available
        const isFirebaseAvailable = await checkFirebaseAvailability();
        
        if (!isFirebaseAvailable) {
          console.log('Firebase unavailable, using AsyncStorage and queueing for later sync');
          
          // Delete from AsyncStorage
          try {
            const subscriptionsJson = await AsyncStorage.getItem('wallet_subscriptions');
            if (subscriptionsJson) {
              const existingSubscriptions = safelyParseJSON(subscriptionsJson, []);
              const filteredSubscriptions = existingSubscriptions.filter(
                sub => sub.id !== subscriptionId
              );
              
              await AsyncStorage.setItem('wallet_subscriptions', JSON.stringify(filteredSubscriptions));
              console.log('Subscription removed from AsyncStorage');
              
              // Update local state
              setSubscriptions(prevSubscriptions => 
                prevSubscriptions.filter(sub => sub.id !== subscriptionId)
              );
              
              // Add to operation queue for later sync
              // Only if it's not a local ID (which hasn't been synced to Firebase yet)
              if (!subscriptionId.startsWith('local_')) {
                await addToOperationQueue({
                  type: 'delete_subscription',
                  id: subscriptionId,
                  timestamp: new Date().toISOString()
                });
              }
              
              return true;
            }
          } catch (asyncError) {
            console.error('AsyncStorage operation failed:', asyncError);
            return false;
          }
        }
        
        // Firebase is available, proceed with normal flow
        try {
          // Check if the subscription exists first
          const subscriptionRef = ref(database, `wallet/subscriptions/${subscriptionId}`);
          const snapshot = await get(subscriptionRef);
          
          if (!snapshot.exists()) {
            console.error('Subscription not found for deletion, ID:', subscriptionId);
            return false;
          }
          
          // Get subscription details for logging
          const subscription = snapshot.val();
          console.log('Found subscription to delete:', subscription.name);
          
          // Delete from Firebase
          await remove(subscriptionRef);
          console.log('Subscription deleted from Firebase successfully, ID:', subscriptionId);
          
          // Update local state
          setSubscriptions(prevSubscriptions => 
            prevSubscriptions.filter(sub => sub.id !== subscriptionId)
          );
          
          return true;
        } catch (firebaseError) {
          console.error('Firebase error deleting subscription:', firebaseError);
          
          // Fallback to AsyncStorage and queue for later
          try {
            const subscriptionsJson = await AsyncStorage.getItem('wallet_subscriptions');
            if (subscriptionsJson) {
              const existingSubscriptions = safelyParseJSON(subscriptionsJson, []);
              const filteredSubscriptions = existingSubscriptions.filter(
                sub => sub.id !== subscriptionId
              );
              
              await AsyncStorage.setItem('wallet_subscriptions', JSON.stringify(filteredSubscriptions));
              console.log('Subscription removed from AsyncStorage after Firebase failure');
              
              // Update local state
              setSubscriptions(prevSubscriptions => 
                prevSubscriptions.filter(sub => sub.id !== subscriptionId)
              );
              
              // Add to operation queue for later sync
              if (!subscriptionId.startsWith('local_')) {
                await addToOperationQueue({
                  type: 'delete_subscription',
                  id: subscriptionId,
                  timestamp: new Date().toISOString()
                });
              }
              
              return true;
            }
          } catch (asyncError) {
            console.error('AsyncStorage operation failed after Firebase error:', asyncError);
            return false;
          }
        }
      } catch (error) {
        console.error('Error in deleteSubscription:', error);
        return false;
      }
    };
    
    // Function to clear all subscriptions - now using Firebase
    const clearAllSubscriptions = async () => {
      try {
        // Clear all subscriptions from Firebase
        const subscriptionsRef = ref(database, 'wallet/subscriptions');
        await set(subscriptionsRef, {});
        console.log('All subscriptions cleared from Firebase successfully');
        
        return true;
      } catch (error) {
        console.error('Error clearing subscriptions from Firebase:', error);
        return false;
      }
    };
    
    // Function to process a subscription payment - now using Firebase
    const processSubscriptionPayment = useCallback(async (subscriptionId) => {
      try {
        if (!subscriptionId) {
          console.error('No subscription ID provided for processing payment');
          return false;
        }
        
        console.log('Processing payment for subscription:', subscriptionId);
        
        // Get the current subscription
        const subscriptionRef = ref(database, `wallet/subscriptions/${subscriptionId}`);
        const snapshot = await get(subscriptionRef);
        
        if (!snapshot.exists()) {
          console.error('Subscription not found for payment processing');
          return false;
        }
        
        const subscription = snapshot.val();
        console.log('Loaded subscription for payment:', subscription.name);
        
        // Create a new expense from the subscription
        const newExpense = {
          amount: ensureNumber(subscription.amount, 0),
          date: new Date().toISOString(),
          type: 'expense',
          note: `${subscription.name} (Subscription)`,
          category: subscription.category || {
            id: 'subscription',
            name: 'Subscription',
            icon: 'calendar',
            color: '#FF9800'
          }
        };
        
        // Save the new expense to Firebase
        try {
          const expensesRef = ref(database, 'wallet/expenses');
          const newExpenseRef = push(expensesRef);
          
          await set(newExpenseRef, newExpense);
          console.log('New expense created from subscription with ID:', newExpenseRef.key);
          
          // Update the subscription's last billed date
          const updates = {
            lastBilledDate: new Date().toISOString()
          };
          
          await update(subscriptionRef, updates);
          console.log('Subscription lastBilledDate updated successfully');
          
          // Update balance
          const balanceRef = ref(database, 'wallet/balance');
          const balanceSnapshot = await get(balanceRef);
          
          if (balanceSnapshot.exists()) {
            const currentBalance = ensureNumber(balanceSnapshot.val(), 0);
            const newBalance = currentBalance - newExpense.amount;
            
            await set(balanceRef, newBalance);
            console.log(`Balance updated: ${currentBalance} -> ${newBalance}`);
          }
          
          return true;
        } catch (firebaseError) {
          console.error('Firebase error during subscription payment processing:', firebaseError);
          return false;
        }
      } catch (error) {
        console.error('Error processing subscription payment:', error);
        return false;
      }
    }, []);
    
    // Update monthly budget with offline support
    const updateMonthlyBudget = useCallback(async (newBudget) => {
      try {
        console.log('Updating monthly budget to:', newBudget);
        
        // Validate the new budget
        let budgetValue = ensureNumber(newBudget, 0);
        
        // Check if Firebase is available
        const isFirebaseAvailable = await checkFirebaseAvailability();
        
        // Update local state immediately for responsive UI
        setMonthlyBudget(budgetValue);
        
        if (!isFirebaseAvailable) {
          console.log('Firebase unavailable, storing budget update in AsyncStorage');
          
          // Store in AsyncStorage
          await AsyncStorage.setItem('wallet_monthly_budget', budgetValue.toString());
          
          // Queue for later sync
          await addToOperationQueue({
            type: 'update_budget',
            data: budgetValue,
            timestamp: new Date().toISOString()
          });
          
          return true;
        }
        
        // Update Firebase
        try {
          const budgetRef = ref(database, 'wallet/monthlyBudget');
          await set(budgetRef, budgetValue);
          console.log('Monthly budget updated in Firebase successfully');
          return true;
        } catch (firebaseError) {
          console.error('Firebase error updating budget:', firebaseError);
          
          // Store in AsyncStorage as fallback
          await AsyncStorage.setItem('wallet_monthly_budget', budgetValue.toString());
          
          // Queue for later sync
          await addToOperationQueue({
            type: 'update_budget',
            data: budgetValue,
            timestamp: new Date().toISOString()
          });
          
          return true; // Return true because local state was updated
        }
      } catch (error) {
        console.error('Error updating monthly budget:', error);
        return false;
      }
    }, [checkFirebaseAvailability, addToOperationQueue]);
    
    // Update balance with offline support
    const updateBalance = useCallback(async (newBalance) => {
      try {
        const validatedBalance = ensureNumber(newBalance);
        console.log('Updating balance to:', validatedBalance);
        
        // Update local state immediately for responsive UI
        setBalance(validatedBalance);
        
        // Check if Firebase is available
        const isFirebaseAvailable = await checkFirebaseAvailability();
        
        if (!isFirebaseAvailable) {
          console.log('Firebase unavailable, storing balance update in AsyncStorage');
          
          // Store in AsyncStorage
          await AsyncStorage.setItem('wallet_balance', validatedBalance.toString());
          
          // Queue for later sync
          await addToOperationQueue({
            type: 'update_balance',
            data: validatedBalance,
            timestamp: new Date().toISOString()
          });
          
          return true;
        }
        
        // Update in Firebase
        try {
          const balanceRef = ref(database, 'wallet/balance');
          await set(balanceRef, validatedBalance);
          console.log('Balance updated in Firebase successfully');
          return true;
        } catch (firebaseError) {
          console.error('Firebase error updating balance:', firebaseError);
          
          // Store in AsyncStorage as fallback
          await AsyncStorage.setItem('wallet_balance', validatedBalance.toString());
          
          // Queue for later sync
          await addToOperationQueue({
            type: 'update_balance',
            data: validatedBalance,
            timestamp: new Date().toISOString()
          });
          
          return true; // Return true because local state was updated
        }
      } catch (error) {
        console.error('Error updating balance:', error);
        return false;
      }
    }, [checkFirebaseAvailability, addToOperationQueue]);
    
    // Function to reload subscriptions - now just returns true as Firebase handles real-time updates
    const reloadSubscriptions = useCallback(async () => {
      try {
        console.log('Reload subscriptions requested, but no action needed with Firebase');
        return true;
      } catch (error) {
        console.error('Error in reloadSubscriptions:', error);
        return false;
      }
    }, []);
    
    // Function to reset the database to a clean state (for emergencies)
    const resetDatabase = async () => {
      try {
        console.log('EMERGENCY: Resetting database to clean state');
        
        // Reset all data to default values
        await set(ref(database, 'wallet/balance'), 0);
        await set(ref(database, 'wallet/expenses'), {});
        await set(ref(database, 'wallet/monthlyBudget'), 0);
        await set(ref(database, 'wallet/subscriptions'), {});
        
        console.log('Database reset complete. App state will refresh automatically.');
        
        // State will be updated automatically through the Firebase listeners
        return true;
      } catch (error) {
        console.error('Failed to reset database:', error);
        return false;
      }
    };
    
    // Return the provider with all our state and functions
    return (
      <WalletContext.Provider
        value={{
          expenses,
          balance,
          monthlyBudget,
          subscriptions,
          dataLoaded,
          hasError,
          addExpense: createSafeFunction(addExpense, 'addExpense', null),
          deleteExpense: createSafeFunction(deleteExpense, 'deleteExpense', false),
          addSubscription: createSafeFunction(addSubscription, 'addSubscription', null),
          deleteSubscription: createSafeFunction(deleteSubscription, 'deleteSubscription', false),
          clearAllSubscriptions: createSafeFunction(clearAllSubscriptions, 'clearAllSubscriptions', false),
          processSubscriptionPayment: createSafeFunction(processSubscriptionPayment, 'processSubscriptionPayment', false),
          updateMonthlyBudget: createSafeFunction(updateMonthlyBudget, 'updateMonthlyBudget', false),
          updateBalance: createSafeFunction(updateBalance, 'updateBalance', false),
          resetDatabase: createSafeFunction(resetDatabase, 'resetDatabase', false),
          initializeDatabaseStructure: createSafeFunction(initializeDatabaseStructure, 'initializeDatabaseStructure', false),
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  } catch (error) {
    console.error('Catastrophic error in WalletProvider:', error);
    // Return emergency provider as absolute last resort
    return (
      <WalletContext.Provider value={{
        balance: 0,
        expenses: [],
        subscriptions: [],
        monthlyBudget: 0,
        dataLoaded: false,
        hasError: false,
        addExpense: async () => false,
        deleteExpense: async () => false,
        addSubscription: async () => null,
        deleteSubscription: async () => false,
        clearAllSubscriptions: async () => false,
        processSubscriptionPayment: async () => false,
        updateMonthlyBudget: async () => false,
        updateBalance: async () => false,
        resetDatabase: async () => false,
        initializeDatabaseStructure: async () => false,
      }}>
        {children}
      </WalletContext.Provider>
    );
  }
}

// Wrap the provider component with an error boundary wrapper
const withErrorBoundary = (Provider) => {
  return function ErrorBoundaryWrapper({ children }) {
    try {
      return <Provider>{children}</Provider>;
    } catch (error) {
      console.error('Fatal error in Provider wrapper:', error);
      
      // Return a minimal functional provider
      return (
        <WalletContext.Provider value={{
          balance: 0,
          expenses: [],
          subscriptions: [],
          monthlyBudget: 0,
          dataLoaded: false,
          hasError: false,
          addExpense: async () => false,
          deleteExpense: async () => false,
          addSubscription: async () => null,
          deleteSubscription: async () => false,
          clearAllSubscriptions: async () => false,
          processSubscriptionPayment: async () => false,
          updateMonthlyBudget: async () => false,
          updateBalance: async () => false,
          resetDatabase: async () => false,
          initializeDatabaseStructure: async () => false,
        }}>
          {children}
        </WalletContext.Provider>
      );
    }
  };
};

// Export the original provider wrapped with our error boundary
export const SafeWalletProvider = withErrorBoundary(WalletProvider);

export function useWallet() {
  const context = useContext(WalletContext);
  
  // Provide safe fallback if context is not available
  if (!context) {
    console.error('useWallet called outside of WalletProvider, returning fallback');
    // Return a minimal functional interface to prevent crashes
    return {
      balance: 0,
      expenses: [],
      subscriptions: [],
      monthlyBudget: 0,
      dataLoaded: false,
      hasError: false,
      addExpense: async () => false,
      deleteExpense: async () => false,
      addSubscription: async () => null,
      deleteSubscription: async () => false,
      clearAllSubscriptions: async () => false,
      processSubscriptionPayment: async () => false,
      updateMonthlyBudget: async () => false,
      updateBalance: async () => false,
      resetDatabase: async () => false,
      initializeDatabaseStructure: async () => false,
    };
  }
  
  return {
    ...context,
    reloadSubscriptions: context.reloadSubscriptions
  };
} 