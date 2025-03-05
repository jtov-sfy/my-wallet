import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    saveDataToStorage();
  }, [balance, expenses, monthlyBudget]);

  const loadData = async () => {
    try {
      // Load all data at once
      const [storedBalance, storedExpenses, storedBudget] = await Promise.all([
        AsyncStorage.getItem('wallet_balance'),
        AsyncStorage.getItem('wallet_expenses'),
        AsyncStorage.getItem('wallet_budget')
      ]);

      // Set balance
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        setBalance(parsedBalance);
      }

      // Set expenses
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        
        // Convert all dates to Date objects
        const expensesWithDates = parsedExpenses.map(expense => ({
          ...expense,
          date: new Date(expense.date),
          id: expense.id || Date.now().toString() // Ensure all expenses have IDs
        }));
        
        setExpenses(expensesWithDates);
      }

      // Set budget
      if (storedBudget) {
        const parsedBudget = JSON.parse(storedBudget);
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

    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
    setBalance(prevBalance => prevBalance - expense.amount);
    
    // Update monthly budget
    setMonthlyBudget(prev => ({
      ...prev,
      spent: prev.spent + expense.amount,
      remaining: prev.total - (prev.spent + expense.amount)
    }));
  };

  const deleteExpense = useCallback(async (expenseId) => {
    try {
      // Find the expense to delete
      const expenseToDelete = expenses.find(exp => exp.id === expenseId);
      if (!expenseToDelete) {
        console.error('No expense found with ID:', expenseId);
        return false;
      }

      // Create new expenses array without the deleted expense
      const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);

      // Calculate new balance
      const amountChange = expenseToDelete.type === 'expense' ? expenseToDelete.amount : -expenseToDelete.amount;
      const newBalance = balance + amountChange;

      // Calculate new monthly budget if it's an expense
      let newMonthlyBudget = monthlyBudget;
      if (expenseToDelete.type === 'expense') {
        newMonthlyBudget = {
          ...monthlyBudget,
          spent: monthlyBudget.spent - expenseToDelete.amount,
          remaining: monthlyBudget.total - (monthlyBudget.spent - expenseToDelete.amount)
        };
      }

      // Save all updates to storage
      try {
        await Promise.all([
          AsyncStorage.setItem('wallet_expenses', JSON.stringify(updatedExpenses)),
          AsyncStorage.setItem('wallet_balance', newBalance.toString()),
          AsyncStorage.setItem('wallet_budget', JSON.stringify(newMonthlyBudget))
        ]);

        // Update state after successful storage update
        setExpenses(updatedExpenses);
        setBalance(newBalance);
        if (expenseToDelete.type === 'expense') {
          setMonthlyBudget(newMonthlyBudget);
        }

        return true;
      } catch (storageError) {
        console.error('Error saving to storage:', storageError);
        return false;
      }
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      return false;
    }
  }, [expenses, balance, monthlyBudget]);

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
    setMonthlyBudget,
    setExpenses,
    setBalance
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