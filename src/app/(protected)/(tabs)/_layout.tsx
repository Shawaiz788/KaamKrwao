import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostJob, PostJobProvider } from '../../../provider/post-job';

export default function TabLayout() {
  return (
    <PostJobProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </PostJobProvider>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { openPostJob } = usePostJob();

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: (Platform.OS === 'ios' ? 68 : 60) + (insets.bottom > 0 ? insets.bottom : 8),
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const renderCenterButton = index === 2;

        const getIconName = (name: string, focused: boolean) => {
          switch (name) {
            case 'home':
              return focused ? 'home' : 'home-outline';
            case 'browse':
              return focused ? 'search' : 'search-outline';
            case 'messages':
              return focused ? 'chatbubble' : 'chatbubble-outline';
            case 'profile':
              return focused ? 'person' : 'person-outline';
            default:
              return 'alert-circle';
          }
        };

        return (
          <React.Fragment key={route.key}>
            {renderCenterButton && (
              <View style={styles.centerBtnContainer}>
                <Pressable style={styles.centerBtn} onPress={() => openPostJob()}>
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.tabItem}
              onPress={onPress}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={22}
                color={isFocused ? '#10B981' : '#6B7280'}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 48,
  },
  tabLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#10B981',
  },
  centerBtnContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28, // Pulls the center button up
  },
  centerBtn: {
    backgroundColor: '#10B981',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
