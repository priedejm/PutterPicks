import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { getDatabase } from "firebase/database"; 
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, YAxis, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { View as SvgView } from 'react-native';
import { Path, Circle } from 'react-native-svg';
import { Text as SvgText } from 'react-native-svg';

const database = getDatabase(app);
const isIos = Platform.OS === 'ios';

const chartColors = [
  '#FF5733', '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728',
  '#9467BD', '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF'
];

const SeasonLeaderboard = ({ selectedPool }) => {
  const [users, setUsers] = useState([]); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Filter out tournaments without weeklyEarnings
  const validTournaments = (selectedPool.tournaments || []).filter(t => t.weeklyEarnings);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const username = await AsyncStorage.getItem('username');
      if (username) {
        setIsLoggedIn(true);
      }
      setUsers(selectedPool?.users);
      logSeasonWinnings(selectedPool?.users);
    };
    checkUserLoggedIn();
  }, []);

  const logSeasonWinnings = (usersData) => {
    usersData.forEach(user => {
      // console.log(`${user.username}: $${user.seasonWinnings.toLocaleString()}`);
    });
  };

  const getPlayerEarningsData = () => {
    if (validTournaments.length === 0) return [];

    const playerNames = Object.keys(validTournaments[0].weeklyEarnings || {});
  
    return playerNames.map((player) => {
      const earningsData = validTournaments.map((tournament) =>
        tournament.weeklyEarnings?.[player] ?? 0
      );
      return {
        player,
        data: [0, ...earningsData],
      };
    });
  };

  const renderUsers = () => {
    const sortedUsers = [...users].sort((a, b) => b.seasonWinnings - a.seasonWinnings);
    return sortedUsers.map((user, index) => (
      <View style={styles.row} key={index}>
        <Text style={[styles.cell, styles.posCell]}>{index + 1}</Text>
        <Text style={[styles.cell, styles.playerCell]}>{user.username}</Text>
        <Text style={[styles.cell, styles.winningsCell]}>
          {`$${user.seasonWinnings.toLocaleString()}`}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ width: 370, maxWidth: 500, alignSelf: 'center' }}>

          {(validTournaments.length > 0 && isIos) && (
            <View style={{ marginBottom: 30, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>Player Earnings Over Tournaments</Text>
              <SvgView style={{ height: 220, padding: 10, flexDirection: 'row' }}>
                <YAxis
                  data={[0, ...Object.values(validTournaments.at(-1)?.weeklyEarnings || {})]}
                  contentInset={{ top: 20, bottom: 20 }}
                  svg={{ fill: 'white', fontSize: 10 }}
                  numberOfTicks={6}
                  formatLabel={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <LineChart
                    style={{ height: 220, flex: 1, bottom: 20 }}
                    data={[0]}
                    yMin={0}
                    yMax={Math.max(...Object.values(validTournaments.at(-1)?.weeklyEarnings || { 0: 100 }))}
                    contentInset={{ top: 20, bottom: 20 }}
                  >
                    <Grid />
                    {getPlayerEarningsData().map((playerObj, index) => {
                      const max = Math.max(...Object.values(validTournaments.at(-1)?.weeklyEarnings || { 0: 1 }));
                      const line = shape
                        .line()
                        .x((_, i) => (i * (300 / (playerObj.data.length - 1)))) 
                        .y((d) => {
                          const yPosition = 200 - ((d / max) * 180);
                          return Math.max(yPosition, 0);
                        })(playerObj.data);
                      
                      return (
                        <React.Fragment key={index}>
                          <Path
                            d={line}
                            stroke={chartColors[index % chartColors.length]}
                            strokeWidth={2}
                            fill="none"
                          />
                          {playerObj.data.map((earnings, i) => {
                            const cy = 200 - ((earnings / max) * 180);
                            return (
                              <Circle
                                key={i}
                                cx={i * (300 / (playerObj.data.length - 1))}
                                cy={Math.max(cy, 0)}
                                r={4}
                                fill={chartColors[index % chartColors.length]}
                              />
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </LineChart>
                  <Grid />
                </View>
              </SvgView>
            </View>
          )}

          {isIos && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, justifyContent: 'center', marginBottom: 10 }}>
              {getPlayerEarningsData().map((playerObj, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 }}>
                  <View style={{ width: 10, height: 10, backgroundColor: chartColors[index % chartColors.length], marginRight: 4 }} />
                  <Text style={{ color: 'white', fontSize: 12 }}>{playerObj.player}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.header}>
            <Text style={[styles.headerText, styles.posHeader]}>Pos</Text>
            <Text style={[styles.headerText, styles.playerHeader]}>Player</Text>
            <Text style={[styles.headerText, styles.winningsHeader]}>Season Winnings</Text>
          </View>

          {renderUsers()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#305115',
  },
  container: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1,
    marginBottom: 50,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#305115',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  posHeader: {
    flex: 0.8,
  },
  playerHeader: {
    flex: 3.2,
    textAlign: 'left',
  },
  winningsHeader: {
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    paddingVertical: 20,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cell: {
    fontSize: 14,
    color: '#305115',
    textAlign: 'center',
  },
  posCell: {
    flex: 0.8,
  },
  playerCell: {
    fontSize: 14,
    color: '#305115',
    textAlign: 'left',
    flex: 3.2,
    marginLeft: 5,
  },
  winningsCell: {
    flex: 2,
  },
});

export default SeasonLeaderboard;
