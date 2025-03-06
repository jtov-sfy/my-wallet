import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WalletProvider } from '../context/WalletContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="add-expense" 
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen 
            name="analytics" 
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen 
            name="budgets" 
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen 
            name="subscriptions" 
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </WalletProvider>
    </ThemeProvider>
  );
} 