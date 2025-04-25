import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { scale } from 'react-native-size-matters';

export default function CreateScreen() {
  const [step, setStep] = useState(1);
  const [poolName, setPoolName] = useState('');
  const [gameMode, setGameMode] = useState('season');
  const [focusedInput, setFocusedInput] = useState('');

  // State for season settings
  const [golfersPicked, setGolfersPicked] = useState('1');
  const [playerUseLimit, setPlayerUseLimit] = useState('4');

  // State for majors settings
  const [rosterFormat, setRosterFormat] = useState('tiered');
  const [selectedMajors, setSelectedMajors] = useState({
    Masters: false,
    PGA: false,
    USOpen: false,
    BritishOpen: false,
  });

  const handleNext = () => {
    if (step === 1 && poolName && gameMode) {
      setStep(2);
    }
  };

  const formatRosterFormat = (value) => {
    if (value === 'tiered') return 'Tiered';
    if (value === 'salaryCap') return 'Salary Cap';
    return value;
  };

  const formatPlayerUseLimit = (value) => {
    if (value === 'unlimited') return 'Unlmited';
    return value;
  };
  
  

  const handleFinalSubmit = () => {
    const payload = {
      poolName,
      gameMode,
      settings: gameMode === 'season'
        ? { golfersPicked, playerUseLimit }
        : { rosterFormat, selectedMajors },
    };

    // Replace this with your DB submission function
    Alert.alert('Pool Created!', JSON.stringify(payload, null, 2));
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: scale(20), height: '100%', marginTop: scale(5) }}>
        {step === 1 && (
          <>
            <Text style={styles.label}>Pool Name</Text>
            <TextInput
              style={styles.input}
              value={poolName}
              onChangeText={(text) => text.length <= 20 && setPoolName(text)}
              placeholder="Enter pool name"
              placeholderTextColor={'black'}
              onFocus={() => setFocusedInput('poolName')}
              onBlur={() => setFocusedInput('')}
            />

            <Text style={styles.label}>Game Mode</Text>
            <Picker
              selectedValue={gameMode}
              onValueChange={(itemValue) => setGameMode(itemValue)}
              style={styles.pickerSmall}
              itemStyle={{ fontSize: 18, backgroundColor: 'transparent', color: 'black' }}
              onFocus={() => setFocusedInput('gameMode')}
              onBlur={() => setFocusedInput('')}
            >
              <Picker.Item label="Season Long League" value="season" />
              <Picker.Item label="Majors Only" value="majors" />
            </Picker>

            <View style={styles.infoRow}>
              <Text style={styles.description}>
                {gameMode === 'season'
                  ? "Run your pool as a weekly challenge or stretch it across the entire season. You’ll have access to a variety of customization options for scoring and formats. Leaderboards are updated weekly, along with an ongoing season total."
                  : "Focus your pool on the PGA’s biggest events — choose one or more Majors to include. Each participant builds a roster by picking one golfer from each of six groups. Scores are tracked per event and across the selected Majors to crown the top player."}
              </Text>
            </View>

            <View style={{ position: 'absolute', bottom: scale(5), alignSelf: 'center', backgroundColor: '#305115', width: scale(150), opacity: !poolName || !gameMode ? 0.3 : 1, borderRadius: 6 }}>
              <TouchableOpacity onPress={handleNext} disabled={!poolName || !gameMode}>
                <Text style={{ color: 'white', fontSize: scale(18), paddingVertical: scale(7), textAlign: 'center' }}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 2 && gameMode === 'season' && (
          <SeasonLongSettings
            golfersPicked={golfersPicked}
            setGolfersPicked={setGolfersPicked}
            playerUseLimit={playerUseLimit}
            setPlayerUseLimit={setPlayerUseLimit}
            goNext={() => setStep(3)}
            goBack={() => setStep(1)}
          />
        )}

        {step === 2 && gameMode === 'majors' && (
          <MajorsOnlySettings
            rosterFormat={rosterFormat}
            setRosterFormat={setRosterFormat}
            selectedMajors={selectedMajors}
            setSelectedMajors={setSelectedMajors}
            goNext={() => setStep(3)}
            goBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <>
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Review Your Selections</Text>
            <View style={styles.infoRow}>
              <Text style={styles.description}>Pool Name: {poolName}</Text>
              <Text style={styles.description}>Game Mode: {gameMode === 'season' ? 'Season Long League' : 'Majors Only'}</Text>
              {gameMode === 'season' ? (
                <>
                  <Text style={styles.description}>Golfers Picked: {golfersPicked}</Text>
                  <Text style={styles.description}>Player Use Limit: {formatPlayerUseLimit(playerUseLimit)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.description}>Roster Format: {formatRosterFormat(rosterFormat)}</Text>
                  <Text style={styles.description}>
                    Selected Majors: {Object.keys(selectedMajors).filter(m => selectedMajors[m]).join(', ') || 'None'}
                  </Text>
                </>
              )}
            </View>
            <View style={[styles.createPoolContainer]}>
              <TouchableOpacity onPress={handleFinalSubmit}>
                <Text style={[styles.nextButtonText]}>Create Pool</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function SeasonLongSettings({
  golfersPicked,
  setGolfersPicked,
  playerUseLimit,
  setPlayerUseLimit,
  goBack,
  goNext
}) {
  const [activeDescription, setActiveDescription] = useState(null);

  const toggleDescription = (desc) => {
    setActiveDescription(activeDescription === desc ? null : desc);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.label}>Golfers Picked</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => toggleDescription('golfersPicked')}>
          <Text style={styles.infoIcon}>?</Text>
        </TouchableOpacity>
      </View>
      <Picker
        selectedValue={golfersPicked}
        onValueChange={setGolfersPicked}
        style={styles.pickerSmall}
        itemStyle={{ fontSize: 16, color: 'black' }}
      >
        {[...Array(6)].map((_, i) => (
          <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
        ))}
      </Picker>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.label}>Player Use Limit</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => toggleDescription('playerUseLimit')}>
          <Text style={styles.infoIcon}>?</Text>
        </TouchableOpacity>
      </View>
      <Picker
        selectedValue={playerUseLimit}
        onValueChange={setPlayerUseLimit}
        style={styles.pickerSmall}
        itemStyle={{ fontSize: 16, color: 'black' }}
      >
        {[...Array(5)].map((_, i) => (
          <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
        ))}
        <Picker.Item label="Unlimited" value="unlimited" />
      </Picker>

      {activeDescription === 'golfersPicked' && (
        <View style={styles.infoRow}>
          <Text style={styles.description}>
            This option determines the number of golfers your members must pick. If you pick weekly, this is the number of players they pick per week. If you pick once per season, it is the total roster size for the whole year.
          </Text>
        </View>
      )}
      {activeDescription === 'playerUseLimit' && (
        <View style={styles.infoRow}>
          <Text style={styles.description}>
            This option determines how many times a specific golfer can be picked in a season. For example, when set to 'Once', your members will not be able to pick the same golfer in more than one tournament.
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity onPress={goNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function MajorsOnlySettings({
  goBack,
  goNext,
  rosterFormat,
  setRosterFormat,
  selectedMajors,
  setSelectedMajors,
}) {
  const [rosterDescription, setRosterDescription] = useState('In a Tiered Pick Sheet, players select one golfer from each of several predefined groups. It ensures a balanced competition and spreads talent across the field.');

  const toggleMajor = (major) => {
    setSelectedMajors({ ...selectedMajors, [major]: !selectedMajors[major] });
  };

  return (
    <>
      <Text style={styles.label}>Roster Format</Text>
      <Picker
        selectedValue={rosterFormat}
        style={styles.pickerSmall}
        onValueChange={(value) => {
          setRosterFormat(value);
          setRosterDescription(
            value === 'tiered'
              ? 'In a Tiered Pick Sheet, players select one golfer from each of several predefined groups. It ensures a balanced competition and spreads talent across the field.'
              : 'In a Salary Cap Pick Sheet, players build a team under a budget. Each golfer has a value, and participants must assemble a roster without exceeding the cap.'
          );
        }}
      >
        <Picker.Item label="Tiered Pick Sheet" value="tiered" />
        <Picker.Item label="Salary Cap Pick Sheet" value="salaryCap" />
      </Picker>

      {rosterDescription !== '' && (
        <View style={styles.infoRow}>
          <Text style={styles.description}>{rosterDescription}</Text>
        </View>
      )}

      <Text style={styles.label}>Select Majors</Text>
      <View style={styles.majorsContainer}>
        {Object.entries(selectedMajors).map(([major, selected], index) => (
          <View key={major} style={major === 'Masters' || major === 'USOpen' ? styles.majorItem1 : styles.majorItem2}>
            <Text style={{ fontSize: 16, position: 'absolute', left: 0 }}>{major}</Text>
            <TouchableOpacity
              onPress={() => toggleMajor(major)}
              style={{
                padding: 4,
                borderRadius: 4,
                borderColor: '#305115',
                borderWidth: 1,
                backgroundColor: selected ? '#305115' : '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 0,
              }}
            >
              <Text style={{ color: selected ? 'white' : '#305115', fontSize: 13 }}>
                {selected ? '✓' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity onPress={goNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: scale(17),
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: scale(10),
    marginBottom: 12,
    fontSize: 18,
    borderRadius: scale(6),
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  description: {
    fontSize: 16,
    color: '#555',
    backgroundColor: '#f6f6f6',
    padding: 10,
    borderRadius: scale(6),
    marginTop: 8,
  },
  pickerSmall: {
    borderWidth: 1,
    borderColor: '#ccc',
    height: scale(70),
    marginBottom: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: scale(6),
  },
  pickerSmall2: {
    borderWidth: 1,
    borderColor: '#ccc',
    height: scale(50),
    marginBottom: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'white',
    borderRadius: scale(6),
  },
  createPoolContainer: {
    position: 'absolute',
    bottom: scale(5),
    alignSelf: 'center',
    backgroundColor: '#305115',
    width: scale(120),
    borderRadius: 6,
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: scale(5),
    alignSelf: 'center',
    backgroundColor: '#305115',
    width: scale(100),
    borderRadius: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: scale(18),
    paddingVertical: scale(7),
    textAlign: 'center',
  },
  infoIcon: {
    fontSize: scale(14),
    color: '#305115',
  },
  infoRow: {
    marginTop: 0,
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    bottom: scale(13),
    left: scale(20),
  },
  backButtonText: {
    color: '#305115',
    fontSize: scale(16),
  },
  infoButton: {
    backgroundColor: 'grey',
    borderRadius: 20,
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(5),
  },
  majorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  majorItem1: {
    width: '40%',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(20),
  },
  majorItem2: {
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(20),
  },
});
