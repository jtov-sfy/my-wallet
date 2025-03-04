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
    saveData();
  }, [balance, expenses, monthlyBudget]);

  const loadData = async () => {
    try {
      const storedBalance = await AsyncStorage.getItem('balance');
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const storedBudget = await AsyncStorage.getItem('monthlyBudget');

      if (storedBalance) setBalance(parseFloat(storedBalance));
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        // Ensure all expense dates are proper Date objects
        const expensesWithDates = parsedExpenses.map(expense => ({
          ...expense,
          date: new Date(expense.date)
        }));
        setExpenses(expensesWithDates);
      }
      if (storedBudget) setMonthlyBudget(JSON.parse(storedBudget));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('balance', balance.toString());
      // Convert dates to ISO strings before saving
      const expensesToSave = expenses.map(expense => ({
        ...expense,
        date: expense.date instanceof Date ? expense.date.toISOString() : expense.date
      }));
      await AsyncStorage.setItem('expenses', JSON.stringify(expensesToSave));
      await AsyncStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget));
    } catch (error) {
      console.error('Error saving data:', error);
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

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
  };

  const value = {
    balance,
    expenses,
    monthlyBudget,
    addExpense,
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