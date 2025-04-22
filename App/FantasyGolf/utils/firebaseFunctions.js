import { getDatabase, ref, get, update } from 'firebase/database';

// Player earnings mapping
const playerEarnings = {
  Justin: 17857526,   // 15579269 + 2287257
  Davis: 11926164,    // 9890764 + 2035400
  Connor: 17395031,   // 14872231 + 2306800
  Cameron: 16229417,  // 14914773 + 1315644
  Griffin: 10022828,  // 5833456 + 4189372
  Greg: 11664285,     // 10246999 + 1386286
  Henry: 13543595,    // 12611021 + 1293574
  Jack: 11869184,     // 10578740 + 1296444
  Charlie: 11963675,  // 8973231 + 2990444
  Wesley: 14513103,   // 9956215 + 4556888
  Tom: 10005460       // 9147060 + 858400
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

    // Convert pools from object to array while preserving keys
    const poolEntries = Object.entries(poolsObj); // [ [key, pool], ... ]

    // Find the entry with the matching name
    const [poolKey, pool] = poolEntries.find(
      ([_, pool]) => pool.name === poolName
    ) || [];

    if (!pool || !pool.users) return;

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
export const resetUserPicks = async (users) => {
  const db = getDatabase();
  try {
    for (const key of Object.keys(users)) {
      const user = users[key];
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

      const userRef = ref(db, `users/${key}`);
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

      //console.log(`Updated pickHistory for user: ${user.username}`);
    }
  } catch (error) {
    console.error("Error updating pickHistory:", error);
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
    const poolIndex = pools.findIndex(pool => pool.name === poolName);
    if (poolIndex === -1) {
      console.error(`Pool with name "${poolName}" not found.`);
      return;
    }

    const selectedPool = pools[poolIndex];
    const { tournaments } = selectedPool;

    if (!tournaments || tournaments.length === 0) return;

    const latestIndex = tournaments.length - 1;
    const latestTournament = tournaments[latestIndex];

    // Skip if entries already exist
    if (latestTournament.entries) return;

    const payouts = calculatePayouts(); // Include if used elsewhere

    const entries = users.map(user => ({
      username: user.username,
      pick1: user.pick1,
      pick2: user.pick2,
      pick3: user.pick3,
      pick4: user.pick4,
      pick5: user.pick5,
      pick6: user.pick6,
    }));

    // Update the tournament with entries
    pools[poolIndex].tournaments[latestIndex] = {
      ...latestTournament,
      entries,
    };

    await update(ref(db), { pools });

    // //console.log('User picks successfully synced to pool tournament');
  } catch (error) {
    console.error('Error syncing user picks to tournament:', error);
  }
};

