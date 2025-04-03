import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const Slider = (props) => {
  let transformX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.active) {
      Animated.timing(transformX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(transformX, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [props.active]);

  const rotationX = transformX.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 87],
  });

  return (
    <SafeAreaView style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', position: 'relative', height: 40, width: 200, borderRadius: 10, backgroundColor: '#FFFFFF', marginHorizontal: 5 }}>
        <Animated.View
          style={{
            position: 'absolute',
            height: 36,
            top: 2,
            bottom: 2,
            borderRadius: 10,
            width: 110,
            transform: [{ translateX: rotationX }],
            backgroundColor: '#d9d9d9',
          }}
        ></Animated.View>
        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => { props.onSelectTournamentScoreboard(); }}>
          <Text style={{ color: 'black' }}>Tourny</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => { props.onSelectSeasonalScoreboard(); }}>
          <Text style={{ color: 'black' }}>Season</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Slider;
