import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl, Image, Dimensions, TouchableOpacity } from 'react-native';
import {
  scale,
  ScaledSheet,
} from 'react-native-size-matters';
import { useUser } from '../context/UserContext'; // Import the UserContext
import SeasonLongLeaderboard from './GameModes/SeasonLongLeaderboard';
import MajorsOnlyLeaderboard from './GameModes/MajorsOnlyLeaderboard';

const Leaderboard = () => {
  const { selectedPool } = useUser();

  return (
    <View style={styles.wrapper}>
      {selectedPool.mode === "Season Long League" ? <SeasonLongLeaderboard/> : 
       selectedPool.mode === "Majors Only" ? <MajorsOnlyLeaderboard/> : null}
      
    </View>
  );
};
const styles = ScaledSheet.create({  
  wrapper: {
    flex: 1,
    backgroundColor: '#305115',
  },
});



export default Leaderboard;
