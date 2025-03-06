import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Settings() {
  const { monthlyBudget, updateMonthlyBudget, resetDatabase } = useWallet();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  const handleBudgetPress = () => {
    router.push('/budgets');
  };

  const handleSubscriptionsPress = () => {
    router.push('/subscriptions');
  };

  const handleResetDatabase = () => {
    Alert.alert(
      "Reset Database",
      "Are you sure you want to reset the entire database? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            const success = await resetDatabase();
            if (success) {
              Alert.alert("Success", "Database has been reset successfully.");
            } else {
              Alert.alert("Error", "Failed to reset database. Please try again.");
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    header: {
      padding: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
    },
    section: {
      marginTop: 24,
      backgroundColor: theme.surface,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      textTransform: 'uppercase',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    settingValue: {
      fontSize: 14,
      color: theme.primary,
      marginTop: 2,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    scrollView: {
      flex: 1,
    },
    dangerZone: {
      marginTop: 24,
      backgroundColor: theme.surface,
      paddingVertical: 8,
    },
    dangerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.error,
      paddingHorizontal: 16,
      paddingVertical: 8,
      textTransform: 'uppercase',
    },
    dangerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    dangerText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.error,
    },
  });

  // Settings options
  const settingsOptions = [
    {
      icon: 'wallet-outline',
      title: 'Budget Settings',
      onPress: handleBudgetPress,
    },
    {
      icon: 'calendar-outline',
      title: 'Subscriptions',
      onPress: handleSubscriptionsPress,
    },
    {
      icon: 'analytics-outline',
      title: 'Analytics',
      onPress: () => router.push('/analytics'),
    }
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return `€${Number(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="moon-outline" size={24} color={theme.text} />
                </View>
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor={"#f4f3f4"}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications-outline" size={24} color={theme.text} />
                </View>
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor={"#f4f3f4"}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleBudgetPress}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="wallet-outline" size={24} color={theme.text} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Monthly Budget</Text>
                  <Text style={styles.settingValue}>
                    {formatCurrency(typeof monthlyBudget === 'number' ? monthlyBudget : 0)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            
            {settingsOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.settingItem}
                onPress={option.onPress}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={option.icon} size={24} color={theme.text} />
                  </View>
                  <Text style={styles.settingText}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="information-circle-outline" size={24} color={theme.text} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Version</Text>
                  <Text style={styles.settingDescription}>1.0.0</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            
            <TouchableOpacity 
              style={styles.dangerItem}
              onPress={handleResetDatabase}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="trash-outline" size={24} color={theme.error} />
                </View>
                <Text style={styles.dangerText}>Reset Database</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.error} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} 