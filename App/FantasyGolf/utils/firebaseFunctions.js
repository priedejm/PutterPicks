import { getDatabase, ref, get, update } from 'firebase/database';

// Player earnings mapping
const playerEarnings = {
  Justin: 30285823,   // 28680365 + 1605458
  Davis: 21667056,    // 18676640 + 2990416
  Connor: 30212596,   // 29865175 + 347421
  Cameron: 29461195,  // 28132215 + 1328880
  Griffin: 18283567,  // 17393182 + 890385
  Greg: 23746957,     // 23254779 + 492178
  Henry: 22490952,    // 22134994 + 355958
  Jack: 20622329,     // 20149860 + 472469
  Charlie: 24672175,  // 24231719 + 440456
  Wesley: 25708755,   // 24168086 + 1540669
  Tom: 16632289       // 16159820 + 472469
};

// Update seasonWinnings for each user with the array above
export const updateUsersSeasonWinnings = async (users, poolName) => {
  const db = getDatabase();

  try {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const poolsObj = data.pools;

    if (!poolsObj) return;

    const poolEntries = Object.entries(poolsObj);
    const [poolKey, pool] = poolEntries.find(
      ([_, pool]) => pool.name === poolName
    ) || [];

    if (!pool || !pool.users) return;

    const latestTournament = pool.tournaments.length - 1;

    pool.tournaments[latestTournament].weeklyEarnings = { ...playerEarnings };

    // Update the latest tournament in the pool with new weekly earnings
    const poolRef = ref(db, `pools/${poolKey}/tournaments/${latestTournament}`);
    update(poolRef, { weeklyEarnings: playerEarnings }).catch((error) => {
      console.error("Error updating latest tournament weekly earnings:", error);
    });

    const poolUsers = pool.users;

    users.forEach((user) => {
      const userKey = Object.keys(poolUsers).find(
        (key) => poolUsers[key].username === user.username
      );

      if (userKey && playerEarnings[user.username]) {
        const userRef = ref(db, `pools/${poolKey}/users/${userKey}`);
        update(userRef, {
          seasonWinnings: playerEarnings[user.username],
        }).catch((error) => {
          console.error(`Error updating ${user.username}:`, error);
        });
      }
    });
  } catch (error) {
    console.error("Error updating users' season winnings:", error);
  }
};




// Reset picks and update pickHistory and their counts
export const resetUserPicks = async (users, poolName) => {
  const db = getDatabase();

  try {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const poolsObj = data.pools;

    if (!poolsObj) return;

    const poolEntries = Object.entries(poolsObj); // [ [key, pool], ... ]

    // Find the pool entry by name
    const [poolKey, pool] = poolEntries.find(
      ([_, pool]) => pool.name === poolName
    ) || [];

    if (!pool || !pool.users) {
      console.error(`Pool or users not found for poolName: ${poolName}`);
      return;
    }

    const poolUsers = pool.users;

    for (const key of Object.keys(poolUsers)) {
      const user = poolUsers[key];

      // Only reset for users provided
      if (!users.some(u => u.username === user.username)) {
        continue;
      }

      const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];

      picks.forEach((pick) => {
        if (pick) {
          const existingPlayerIndex = user.pickHistory.findIndex(p => p.player === pick);
          if (existingPlayerIndex !== -1) {
            user.pickHistory[existingPlayerIndex].used += 1;
          } else {
            user.pickHistory.push({ player: pick, used: 1 });
          }
        }
      });

      const userRef = ref(db, `pools/${poolKey}/users/${key}`);
      await update(userRef, {
        pick1: "",
        pick2: "",
        pick3: "",
        pick4: "",
        pick5: "",
        pick6: "",
        alt1: "",
        alt2: "",
        pickHistory: user.pickHistory,
      });

      // console.log(`Reset picks and updated pickHistory for user: ${user.username}`);
    }

  } catch (error) {
    console.error("Error resetting user picks:", error);
  }
};

// adds current entries to the latest tournament - have payouts if we want to add that
export const syncPicksToTournament = async (players, calculatePayouts, poolName, users) => {
  if (!players || players.length === 0 || !poolName) return;

  const db = getDatabase();

  try {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const { pools } = data;

    if (!pools || !users) return;

    // Find the matching pool by name
    // Convert pools object to array with keys
    const poolEntries = Object.entries(pools);    

    // Find index and key of the desired pool
    const poolEntry = poolEntries.find(([key, pool]) => pool.name === poolName);
    if (!poolEntry) {
      console.error(`Pool with name "${poolName}" not found.`);
      return;
    }   

    const [poolKey, selectedPool] = poolEntry;
    const { tournaments } = selectedPool;
    if (!tournaments || tournaments.length === 0) return;   

    const latestIndex = tournaments.length - 1;
    const latestTournament = tournaments[latestIndex];
    if (latestTournament.entries) return;   

    // Construct entries
    const entries = users.map(user => ({
      username: user.username,
      pick1: user.pick1,
      pick2: user.pick2,
      pick3: user.pick3,
      pick4: user.pick4,
      pick5: user.pick5,
      pick6: user.pick6,
    }));    

    // Update the selected tournament
    pools[poolKey].tournaments[latestIndex] = {
      ...latestTournament,
      entries,
    };    

    await update(ref(db), { pools });


    // //console.log('User picks successfully synced to pool tournament');
  } catch (error) {
    console.error('Error syncing user picks to tournament:', error);
  }
};

