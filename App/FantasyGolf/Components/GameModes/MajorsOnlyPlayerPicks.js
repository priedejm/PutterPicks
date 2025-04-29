import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { getDatabase, ref, get, onValue, update } from 'firebase/database';
import { app } from '../../config';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TieredPlayerPicks from './TieredPlayerPicks';
import SalaryCapPlayerPicks from './SalaryCapPlayerPicks';
import {
  scale,
  ScaledSheet,
} from 'react-native-size-matters';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const MajorsOnlyPlayerPicks = ({players, lockedPicks}) => {
  const { selectedPool, setSelectedPool } = useUser();
  

  return (
    <View style={styles.container}>
      {selectedPool.settings.rosterFormat === 'tiered' ? <TieredPlayerPicks selectedPool={selectedPool} players={players} lockedPicks={lockedPicks}/> : <SalaryCapPlayerPicks selectedPool={selectedPool} players={players} lockedPicks={lockedPicks}/>}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web

  },
});

export default MajorsOnlyPlayerPicks;
