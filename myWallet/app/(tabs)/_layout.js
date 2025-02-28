import { Tabs } from 'expo-router';
import { View, Dimensions, Image } from 'react-native';

export default function TabsLayout() {
  const windowWidth = Dimensions.get('window').width;
  const tabBarWidth = 250;
  const leftPosition = (windowWidth - tabBarWidth) / 2;

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#002E14',
          borderTopWidth: 0,
          height: 80,
          width: tabBarWidth,
          position: 'absolute',
          bottom: 40,
          left: leftPosition,
          borderRadius: 80,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 5,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingHorizontal: 10,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: "/",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#4ADE80' : 'transparent',
              height: 60,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 100,
            }}>
              <Image
                source={focused ? require('../../assets/icons/homeLogo-selected.png') : require('../../assets/icons/homeLogo-unselected.png')}
                style={{ width: 45, height: 45 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: "/calendar",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#4ADE80' : 'transparent',
              height: 60,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 100,
            }}>
              <Image
                source={focused ? require('../../assets/icons/calendrierLogo-selected.png') : require('../../assets/icons/calendrierLogo-unselected.png')}
                style={{ width: 45, height: 45 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: "/settings",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#4ADE80' : 'transparent',
              height: 60,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 100,
            }}>
              <Image
                source={focused ? require('../../assets/icons/reglagesLogo-selected.png') : require('../../assets/icons/reglagesLogo-unselected.png')}
                style={{ width: 45, height: 45 }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
} 