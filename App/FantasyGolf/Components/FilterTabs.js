import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

function CreateScreen() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.text}>Create content goes here</Text>
    </View>
  );
}

function JoinScreen() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.text}>Join content goes here</Text>
    </View>
  );
}

export default function FilterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: 'white' },
        tabBarIndicatorStyle: { backgroundColor: '#305115' }
      }}
    >
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Join" component={JoinScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
  },
});
