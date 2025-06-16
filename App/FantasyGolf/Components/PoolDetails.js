import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';

const PoolDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { pool } = route.params;

  const rosterFormat = pool?.settings?.rosterFormat !== undefined
    ? pool.settings.rosterFormat ? 'Tiered' : 'Salary Cap'
    : null;
  const amountOfTiers = pool?.settings?.amountOfTiers;
  const playerPickLimit = pool?.settings?.playerPickLimit;

  const modeDescription = (mode) => {
    switch (mode) {
      case 'Season Long League':
        return 'Run your pool as a weekly challenge or stretch it across the entire season. You’ll have access to a variety of customization options for scoring and formats. Leaderboards are updated weekly, along with an ongoing season total.';
      case 'Majors Only':
        return 'Focus your pool on the PGA’s biggest events — choose one or more Majors to include. Each participant builds a roster by picking one golfer from each of six groups. Scores are tracked per event and across the selected Majors to crown the top player.';
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#305115' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(20), marginTop: scale(20) }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pool Details</Text>
        </View>

        {pool?.name && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Pool Name</Text>
            <Text style={styles.settingValue}>{pool.name}</Text>
          </View>
        )}

        {pool?.mode && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Mode</Text>
            <Text style={styles.settingValue}>{pool.mode}</Text>
            <View style={{ backgroundColor: 'rgba(128, 128, 128, 0.25)', borderRadius: scale(5), justifyContent: 'center', alignItems: 'center', padding: scale(3), marginTop: scale(6) }}>
              {modeDescription(pool.mode) && (
                <Text style={styles.modeDescription}>{modeDescription(pool.mode)}</Text>
              )}
            </View>
          </View>
        )}

        {rosterFormat && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Roster Format</Text>
            <Text style={styles.settingValue}>{rosterFormat}</Text>
          </View>
        )}

        {amountOfTiers !== undefined && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Amount of Tiers</Text>
            <Text style={styles.settingValue}>{amountOfTiers}</Text>
          </View>
        )}

        {playerPickLimit !== undefined && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Player Pick Limit</Text>
            <Text style={styles.settingValue}>{playerPickLimit}</Text>
          </View>
        )}

        {pool?.users && Object.values(pool.users).length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>Participants</Text>
            {Object.values(pool.users).map((user, index) => (
              <Text key={index} style={styles.settingValue}>
                {user.username ?? 'Unnamed User'}
              </Text>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#305115',
    padding: scale(20),
    marginTop: scale(15),
  },
  backButton: {
    marginRight: scale(10),
  },
  backButtonText: {
    color: 'white',
    fontSize: scale(20),
  },
  title: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: 'white',
  },
  settingItem: {
    marginBottom: scale(15),
  },
  settingKey: {
    fontSize: scale(16),
    fontWeight: '600',
    color: 'white',
  },
  settingValue: {
    fontSize: scale(14),
    color: 'white',
    marginTop: scale(4),
  },
  modeDescription: {
    fontSize: scale(13),
    color: '#D1D5DB',
    lineHeight: scale(18),
  },
  divider: {
    marginVertical: scale(30),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  subtitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(10),
    color: 'white',
  },
});

export default PoolDetails;
