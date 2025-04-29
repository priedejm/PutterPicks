import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { scale, ScaledSheet } from 'react-native-size-matters';
import CreateScreen from './CreatePool';
import JoinPool from './JoinPool';

const tabWidth = scale(300); // YOUR MODAL WIDTH
const tabs = ['Create', 'Join'];

export default function FilterTabs({user}) {
  const [activeTab, setActiveTab] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const switchTab = (index) => {
    setActiveTab(index);
    Animated.spring(translateX, {
      toValue: -index * tabWidth,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(-activeTab * tabWidth + gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = tabWidth / 4;
        if (gesture.dx < -threshold && activeTab < tabs.length - 1) {
          switchTab(activeTab + 1);
        } else if (gesture.dx > threshold && activeTab > 0) {
          switchTab(activeTab - 1);
        } else {
          switchTab(activeTab);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Tab Headers */}
      <View style={styles.tabHeader}>
        {tabs.map((label, index) => (
          <TouchableOpacity key={index} style={styles.tabButton} onPress={() => switchTab(index)}>
            <Text style={[styles.tabLabel, activeTab === index && styles.activeLabel]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated Tab Content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.tabContentWrapper,
          { width: tabWidth * tabs.length, transform: [{ translateX }] },
        ]}
      >
        <View style={[styles.page, { width: tabWidth, height: scale(410),  }]}>
          <CreateScreen user={user}/>
        </View>
        <View style={[{ width: tabWidth, height: scale(410), }]}>
          <JoinPool/>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'white' },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 16,
    color: '#666',
  },
  activeLabel: {
    color: '#305115',
    fontWeight: 'bold',
  },
  tabContentWrapper: {
    flexDirection: 'row',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
