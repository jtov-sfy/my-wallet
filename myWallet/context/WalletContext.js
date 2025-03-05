import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState({
    total: 3000,
    spent: 0,
    remaining: 3000
  });

  // Load data when app starts
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const saveDataToStorage = async () => {
      try {
        console.log('Saving data to storage...');
        
        // Prepare expenses data
        const expensesToSave = expenses.map(expense => ({
          ...expense,
          date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
          id: expense.id || Date.now().toString()
        }));

        // Save each item separately to avoid potential conflicts
        await AsyncStorage.setItem('wallet_balance', balance.toString());
        await AsyncStorage.setItem('wallet_expenses', JSON.stringify(expensesToSave));
        await AsyncStorage.setItem('wallet_budget', JSON.stringify(monthlyBudget));

        console.log('Data saved successfully:', {
          balance,
          expensesCount: expenses.length,
          budget: monthlyBudget
        });
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    saveDataToStorage();
  }, [balance, expenses, monthlyBudget]);

  const loadData = async () => {
    try {
      console.log('Starting to load data...');
      
      // Load all data at once
      const [storedBalance, storedExpenses, storedBudget] = await Promise.all([
        AsyncStorage.getItem('wallet_balance'),
        AsyncStorage.getItem('wallet_expenses'),
        AsyncStorage.getItem('wallet_budget')
      ]);

      console.log('Loaded from storage:', {
        balance: storedBalance,
        expenses: storedExpenses,
        budget: storedBudget
      });

      // Set balance
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        console.log('Setting balance:', parsedBalance);
        setBalance(parsedBalance);
      }

      // Set expenses
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        console.log('Parsed expenses:', parsedExpenses);
        
        // Convert all dates to Date objects
        const expensesWithDates = parsedExpenses.map(expense => ({
          ...expense,
          date: new Date(expense.date),
          id: expense.id || Date.now().toString() // Ensure all expenses have IDs
        }));
        
        console.log('Setting expenses with dates:', expensesWithDates);
        setExpenses(expensesWithDates);
      }

      // Set budget
      if (storedBudget) {
        const parsedBudget = JSON.parse(storedBudget);
        console.log('Setting budget:', parsedBudget);
        setMonthlyBudget(parsedBudget);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Set default values on error
      setExpenses([]);
      setBalance(0);
      setMonthlyBudget({
        total: 3000,
        spent: 0,
        remaining: 3000
      });
    }
  };

  const addExpense = (expense) => {
    // Use the date from the expense object instead of creating a new date
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      // Ensure the date is a Date object if it's an ISO string
      date: expense.date instanceof Date ? expense.date : new Date(expense.date)
    };

    console.log('Adding expense with date:', newExpense.date);
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
    setBalance(prevBalance => prevBalance - expense.amount);
    
    // Update monthly budget
    setMonthlyBudget(prev => ({
      ...prev,
      spent: prev.spent + expense.amount,
      remaining: prev.total - (prev.spent + expense.amount)
    }));
  };

  const deleteExpense = async (expenseId) => {
    try {
      console.log('Starting delete operation for ID:', expenseId);
      
      // Find the expense to delete
      const expenseToDelete = expenses.find(e => e.id === expenseId);
      console.log('Found expense to delete:', expenseToDelete);
      
      if (!expenseToDelete) {
        console.error('No expense found with ID:', expenseId);
        return false;
      }

      // Calculate the updates
      const updatedExpenses = expenses.filter(e => e.id !== expenseId);
      const amount = Math.abs(expenseToDelete.amount);
      
      // Update balance based on transaction type
      const newBalance = expenseToDelete.type === 'income' ? 
        balance - amount : 
        balance + amount;
      
      // Update budget if it's an expense
      let newBudget = {...monthlyBudget};
      if (expenseToDelete.type !== 'income') {
        const newSpent = monthlyBudget.spent - amount;
        newBudget = {
          ...monthlyBudget,
          spent: newSpent,
          remaining: monthlyBudget.total - newSpent
        };
      }

      try {
        // Save all updates to AsyncStorage
        const expensesToSave = updatedExpenses.map(expense => ({
          ...expense,
          date: expense.date instanceof Date ? expense.date.toISOString() : expense.date
        }));

        await Promise.all([
          AsyncStorage.setItem('wallet_expenses', JSON.stringify(expensesToSave)),
          AsyncStorage.setItem('wallet_balance', newBalance.toString()),
          AsyncStorage.setItem('wallet_budget', JSON.stringify(newBudget))
        ]);

        // Update state after successful storage update
        setExpenses(updatedExpenses);
        setBalance(newBalance);
        if (expenseToDelete.type !== 'income') {
          setMonthlyBudget(newBudget);
        }

        console.log('Delete operation completed successfully');
        return true;
      } catch (error) {
        console.error('Failed to save to AsyncStorage:', error);
        return false;
      }
    } catch (error) {
      console.error('Error during delete operation:', error);
      return false;
    }
  };

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
  };

  const value = {
    balance,
    expenses,
    monthlyBudget,
    addExpense,
    deleteExpense,
    updateBalance,
    setMonthlyBudget
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 