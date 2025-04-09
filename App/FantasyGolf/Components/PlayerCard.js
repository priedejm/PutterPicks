import React from 'react';
import { View, Text, StyleSheet , Platform} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';  // For the checkmark icon
const isIos = Platform.OS === 'ios';
const PlayerCard = ({ index, personalCard, user, calculatePayouts, totalScore, totalWinnings, isLoggedInUser, secretScoreboard, getPlayerScore, getPlayerPosition, getPlayerThruStatus, abbreviateNumber, userRank }) => {
  // Calculate player picks' scores and payouts once
  const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
  const playerScores = picks.map((pick) => getPlayerScore(pick));
  const payouts = calculatePayouts();
  const thruStatuses = picks.map((pick) => getPlayerThruStatus(pick));

      // Function to format player name
      const formatPlayerName = (name) => {
        if (!name) return '';
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' '); // In case of multiple last names
        return `${firstName.charAt(0)}. ${lastName}`;
      };

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
      
  return (
    <View style={{ width: '100%', backgroundColor: '#18453B' }}>
      <View style={styles.playerCard}>
        <View style={styles.headerRow}>
          {!personalCard && <Text style={styles.position}>Pos</Text>}
          <Text style={styles.playerName}></Text>
          <Text style={styles.totalScore}>Total</Text>
        </View>
        <View style={styles.row}>
        {!personalCard &&<Text style={styles.position}>{index + 1}</Text>}
          <Text style={styles.playerName}>{personalCard ? 'Yo bitchass in ' + userRank : user.username}</Text>
          <Text style={styles.totalScore}>{!secretScoreboard || isLoggedInUser ? `${totalScore === 0 ? 'E' : totalScore > 0 ? '+' + totalScore : totalScore} | ${personalCard ? abbreviateNumber(totalWinnings) : totalWinnings}` : null}</Text>
        </View>
        <View style={styles.picksWrapper}>
          {sortedPicks.map((pick, i) => {
            const playerPayout = payouts.find((player) => player.name === pick)?.payout || 0;
            const playerPosition = getPlayerPosition(pick);
            const playerScore = playerScores[i];
            
            const playerName = formatPlayerName(pick);
            return (
              <View style={styles.picksRow} key={i + 100}>
              <Text style={styles.pickLabel}>{playerPosition}:</Text>
              <View style={styles.pickInfo}>
                <Text style={styles.pickPlayerName}>
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
              </View>
              <Text style={styles.pickScore}>
                {secretScoreboard && !isLoggedInUser ? '?' : '$' + playerPayout}
              </Text>
            </View>
            
            );
          })}
          {secretScoreboard && !isLoggedInUser && (
            <View style={{ backgroundColor: 'white', position: 'absolute', height: '105%', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 72, bottom: 20 }}>?</Text>
            </View>
          )}
        </View>
        {(user.picksChosen && secretScoreboard) && (
          <View style={styles.checkmarkWrapper}>
            <MaterialIcons name="check-circle" size={24} color="green" style={styles.checkmark} />
          </View>
        )}
      </View>
    </View>
  );
};

export default PlayerCard;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#18453B',
    paddingVertical: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
  },
  scoreboardContainer: {
    width: 375,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  scoreboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#18453B',
    marginBottom: 20,
  },
  playerRow: {
    marginBottom: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18453B',
  },
  scrollView: {
    width: '100%',
    padding: 20,
  },
  tournamentHeader: {
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 375,
  },
  tournamentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#18453B',
  },
  tournamentDetails: {
    fontSize: 16,
    color: '#18453B',
  },
  playerCard: {
    width: 390, // Widened card
    padding: 20,
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
    color: '#18453B',
    width: '25%',
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18453B',
    width: '40%',
    textAlign: 'center',
    bottom: 20
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18453B',
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
    width: '68%',
    fontSize: 16,
    color: '#18453B',
  },
  pickScoreValue: {
    width: '20%',
    fontSize: 16,
    color: '#18453B',
    textAlign: 'center',
  },
  pickThru: {
    width: '12%',
    fontSize: 16,
    color: '#18453B',
    textAlign: 'left',
    left: 5
  },
  
  picksWrapper: {
    width: '100%',
    paddingTop: 10,
  },
  picksRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 5, // Space between pick rows
  },
  pickLabel: {
    width: '13%',
    fontSize: 16,
    color: '#18453B',
  },
  pickValue: {
    width: '55%',
    fontSize: 16,
    color: '#18453B',
  },
  pickScore: {
    width: '30%',
    fontSize: 16,
    color: '#18453B',
    textAlign: 'center',
  },
  topPlayersContainer: {  
    marginBottom: 20
  },
  topPlayer: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold'
  },  
  checkmarkWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  checkmark: {
    fontSize: 30,
  },
});