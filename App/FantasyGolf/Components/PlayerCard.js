import React from 'react';
import { View, Text, StyleSheet , Platform, Dimensions} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';  // For the checkmark icon
import {
  scale,
  ScaledSheet,
} from 'react-native-size-matters';

const screenWidth = Dimensions.get('window').width;
const isLargeScreen = screenWidth > 600;
const isIos = Platform.OS === 'ios';

const PlayerCard = ({ index, personalCard, user, calculatePayouts, totalScore, totalWinnings, isLoggedInUser, secretScoreboard, getPlayerScore, getPlayerPosition, getPlayerThruStatus, userRank, picksChosen, username, getPlayerRoundScore }) => {
  // Calculate player picks' scores and payouts once
  const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
  const payouts = calculatePayouts();
  const sortedPicks = [...picks].sort((a, b) => {
    // Find the payout for player A
    const payoutA = payouts.find((player) => player.name === a)?.payout.replace(/,/g, '') || 0;
    // Find the payout for player B
    const payoutB = payouts.find((player) => player.name === b)?.payout.replace(/,/g, '') || 0;
    
    // Parse the payouts as numbers to ensure proper sorting
    const numericPayoutA = parseFloat(payoutA);
    const numericPayoutB = parseFloat(payoutB);
    
    // Sort in descending order
    return numericPayoutB - numericPayoutA;
  });
  const playerScores = sortedPicks.map((pick) => getPlayerScore(pick));
  const thruStatuses = sortedPicks.map((pick) => getPlayerThruStatus(pick));

  const abbreviateNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'mil';  // Millions
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'k';      // Thousands
    } else {
      return num.toString();                     // Return number as is if less than 1k
    }
  };

  // Function to format player name
  const formatPlayerName = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' '); // In case of multiple last names
    return `${firstName.charAt(0)}. ${lastName}`;
  }
  return (
    <View style={{ width: '100%', backgroundColor: '#305115' }}>
      <View style={styles.playerCard}>
        <View style={styles.headerRow}>
          {!personalCard && <Text style={styles.position}>Pos</Text>}
          <Text style={styles.playerName}></Text>
          <Text style={styles.totalScore}>Total</Text>
        </View>
        <View style={[styles.row, {marginBottom: isLargeScreen ? 10 : scale(8)}]}>
        {!personalCard &&<Text style={styles.position}>{index + 1}</Text>}
          <Text style={styles.playerName}>{personalCard ? 'Yo bitchass is ' + userRank : user.username}</Text>
          <Text style={styles.totalScore}>{!secretScoreboard || isLoggedInUser ? `${totalScore === 0 ? 'E' : totalScore > 0 ? '+' + totalScore : totalScore} | ${personalCard ? abbreviateNumber(totalWinnings) : totalWinnings}` : null}</Text>
        </View>
        <View style={{width: '100%', flexDirection: 'row'}}>
          <Text style={styles.posHeader}>Pos</Text>
          <Text style={styles.playerHeader}>Player</Text>
          <Text style={styles.scoreHeader}>Score</Text>
          <Text style={styles.thruHeader}>Thru</Text>
          <Text style={styles.roundHeader}>Round</Text>
          <Text style={styles.earningsHeader}>$$$</Text>
        </View>
        <View style={styles.picksWrapper}>
          {sortedPicks.map((pick, i) => {
            let playerPayout = payouts.find((player) => player.name === pick)?.payout || 0;
            const playerPosition = getPlayerPosition(pick);
            const playerScore = playerScores[i];
  
            playerPayout = !playerPayout ? '' : abbreviateNumber(parseFloat(playerPayout?.replace(/,/g, '')))
            const playerName = formatPlayerName(pick);
            const playerRoundScore = getPlayerRoundScore(pick);
            return (
              <View style={styles.picksRow} key={i + 100}>
                <Text style={styles.pickLabel}>{playerPosition}:</Text>
                <View style={styles.pickInfo}>
                  <Text style={styles.pickPlayerName} numberOfLines={1}>
                    {(!pick && !secretScoreboard && !isLoggedInUser) && 'Pick'}
                    {(!pick && isLoggedInUser) && 'Pick'}
                    {secretScoreboard && !isLoggedInUser ? '?' : playerName}
                  </Text>
                  <Text style={styles.pickScoreValue}>
                    {secretScoreboard && !isLoggedInUser ? '?' : (playerScore > 0 ? '+' + playerScore : playerScore)}
                  </Text>
                  <Text style={styles.pickThru}>
                    {secretScoreboard && !isLoggedInUser ? '?' : thruStatuses[i]}
                  </Text>
                  <Text style={styles.pickRound}>
                    {secretScoreboard && !isLoggedInUser ? '?' : playerRoundScore === null ? 0 : playerRoundScore}
                  </Text>
                </View>
                <Text style={styles.pickPayout}>
                  {secretScoreboard && !isLoggedInUser ? '?' : '$' + playerPayout}
                </Text>
              </View>
            );
          })}
          {(!picksChosen && user.username === username) && 
            <View style={{ backgroundColor: 'white', position: 'absolute', height: '110%', width: '100%', justifyContent: 'center', alignItems: 'center', bottom: isIos ? scale(5) : 0 }}>
              <Text style={{ fontSize: 24, bottom: 20, textAlign: 'center', width: 200 }}>Need to make your picks brah</Text>
            </View>
          }
          {secretScoreboard && !isLoggedInUser && (
            <View style={{ backgroundColor: 'white', position: 'absolute', height: '110%', width: '100%', justifyContent: 'center', alignItems: 'center', bottom: 5 }}>
              <Text style={{ fontSize: 72, bottom: 20 }}>?</Text>
            </View>
          )}
        </View>
        {(picksChosen && secretScoreboard && user.username !== username) && (
          <View style={styles.checkmarkWrapper}>
            <MaterialIcons name="check-circle" size={24} color="green" style={styles.checkmark} />
          </View>
        )}
      </View>
    </View>
  );
};

export default PlayerCard;

const scaledStyles = ScaledSheet.create({  
container: {
    flexGrow: 1,
    backgroundColor: '#305115',
    paddingVertical: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
  },
  playerCard: {
    width: '320@s', // Widened card
    padding: '8@s',
    marginBottom: '15@s',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'column', // Stack vertically for wider layout
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  position: {
    fontSize: '15@s',
    fontWeight: 'bold',
    color: '#305115',
    width: '25%',
    textAlign: 'center',
  },
  playerName: {
    fontSize: '15@s',
    fontWeight: 'bold',
    color: '#305115',
    width: '40%',
    textAlign: 'center',
    bottom: '17@s'

  },
  totalScore: {
    fontSize: '15@s',
    fontWeight: 'bold',
    color: '#305115',
    width: '35%',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingBottom: '8@s',
  },
  pickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '55%',
  },
  pickPlayerName: {
    width: '50%',
    fontSize: '13@s',
    color: '#305115',
      //backgroundColor: 'green'
  },
  pickScoreValue: {
    width: '20%',
    fontSize: '13@s',
    color: '#305115',
    textAlign: 'center',
      //backgroundColor: 'brown'
  },
  picksRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 5, // Space between pick rows
      //backgroundColor: 'orange'
  },
  pickLabel: {
    width: '13%',
    fontSize: '13@s',
    color: '#305115',
      //backgroundColor: 'grey'
  },
  pickPayout: {
    width: '17%',
    fontSize: '13@s',
    color: '#305115',
    textAlign: 'left',
    position: "absolute",
    right: '-5@s',
      //backgroundColor: 'pink'
  },
  pickThru: {
    width: '35%',
    fontSize: '13@s',
    color: '#305115',
    textAlign: 'center',
      // backgroundColor: 'yellow'
  },
  picksWrapper: {
    width: '100%',
    paddingTop: '8@s',
  },
  checkmarkWrapper: {
    position: 'absolute',
    top: '8@s',
    right: '8@s',
  },
  checkmark: {
    fontSize: '25@s',
  },
  pickRound: {
    width: '15%',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    textAlign: 'center',
    left: '5@s',
  // backgroundColor: 'red'
  },
  posHeader: {
    position: 'absolute',
    left: '0@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
  //backgroundColor: 'red'
  },
  playerHeader: {
    position: 'absolute',
    left: '40@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    textAlign: 'left',
    //backgroundColor: 'pink'
  },
  scoreHeader: {
    position: 'absolute',
    left: '125@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    //backgroundColor: 'yellow'
  },
  thruHeader: {
    position: 'absolute',
    left: '170@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    //backgroundColor: 'grey'
  },
  roundHeader: {
    position: 'absolute',
    left: '215@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    //backgroundColor: 'orange'
  },
  earningsHeader: {
    position: 'absolute',
    left: '268@s',
    bottom: '-5@s',
    fontSize: '13@s', // or just 15 in regularStyles
    color: '#305115',
    //backgroundColor: 'orange'
  },
});

const regularStyles = StyleSheet.create({  
  container: {
      flexGrow: 1,
      backgroundColor: '#305115',
      paddingVertical: 10,
      alignItems: 'center',
      height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
    },
    playerCard: {
      width: 375, // Widened card
      padding: 10,
      marginBottom: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'column', // Stack vertically for wider layout
    },
    headerRow: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
    },
    position: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#305115',
      width: '25%',
      textAlign: 'center',
    },
    playerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#305115',
      width: '40%',
      textAlign: 'center',
      bottom: 20,
    },
    totalScore: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#305115',
      width: '35%',
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      paddingBottom: 10,
    },
    pickInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '55%',
    },
    pickPlayerName: {
      width: '120%',
      fontSize: 15,
      color: '#305115',
      //backgroundColor: "pink"
    },
    pickScoreValue: {
      width: '25%',
      fontSize: 15,
      color: '#305115',
      textAlign: 'center',
      //backgroundColor: "red"
    },
    picksRow: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: 5, // Space between pick rows
    },
    pickLabel: {
      width: '13%',
      fontSize: 15,
      color: '#305115',
      //backgroundColor: "grey"
    },
    pickPayout: {
      width: '20%',
      fontSize: 15,
      color: '#305115',
      textAlign: 'left',
      position: "absolute",
      right: -15,
      //backgroundColor: "yellow"
    },
    pickThru: {
      width: '65%',
      fontSize: 15,
      color: '#305115',
      textAlign: 'center',
      left: 20,
      //backgroundColor: "pink"
    },
    picksWrapper: {
      width: '100%',
      paddingTop: 10,
    },
    checkmarkWrapper: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
    checkmark: {
      fontSize: 30,
    },
    pickRound: {
      width: '25%',
      fontSize: 15, // or just 15 in regularStyles
      color: '#305115',
      textAlign: 'center',
      left: 40,
      //backgroundColor: 'red'
    },
    posHeader: {
      position: 'absolute',
      left: 0,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
    //backgroundColor: 'red'
    },
    playerHeader: {
      position: 'absolute',
      left: 45,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
      textAlign: 'left',
      //backgroundColor: 'pink'
    },
    scoreHeader: {
      position: 'absolute',
      left: 140,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
      //backgroundColor: 'yellow'
    },
    thruHeader: {
      position: 'absolute',
      left: 195,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
      //backgroundColor: 'grey'
    },
    roundHeader: {
      position: 'absolute',
      left: 250,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
      //backgroundColor: 'orange'
    },
    earningsHeader: {
      position: 'absolute',
      right: 15,
      bottom: -5,
      fontSize: 15,
      color: '#305115',
      //backgroundColor: 'orange'
    },
  });

const styles = !isIos ? regularStyles : scaledStyles;
