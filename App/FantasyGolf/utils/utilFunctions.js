export const calculatePayouts = (tournament, players, amateurPlayers, payoutPercentages, specialPayout,) => {
  if (!tournament || !tournament.purse) return [];
  if (!Array.isArray(players) || players.length === 0) return [];
  if (!Array.isArray(amateurPlayers)) return [];
  if (!Array.isArray(payoutPercentages) || payoutPercentages.length === 0) return [];
  if (!specialPayout) return [];
  // console.log("tournament", tournament)
  // console.log("players", players?.length)
  // console.log("amateurPlayers", amateurPlayers)
  // console.log("payoutPercentages", payoutPercentages)
  // console.log("specialPayout", specialPayout)
  
  // Filter players who are not amateurs and have a valid position and score
  const playersPaid = players.filter(
    (player) =>
      !amateurPlayers.includes(player.name) &&
      player.position !== 'CUT' &&
      player.position !== 'N/A' &&
      player.score !== '-'
  );

  // Create a position to player mapping, and count how many players are tied at each position
  const positionCounts = {};
  playersPaid.forEach((player) => {
    let position = player.position.startsWith('T')
      ? parseInt(player.position.slice(1), 10)
      : parseInt(player.position, 10);
    if (!positionCounts[position]) {
      positionCounts[position] = { count: 0, players: [] };
    }
    positionCounts[position].count += 1;
    positionCounts[position].players.push(player);
  });

  // Sort positions in ascending order (lowest position number comes first)
  const sortedPositions = Object.keys(positionCounts)
    .map(Number)
    .sort((a, b) => a - b);

  // Format number with commas, rounding to the nearest integer
  const formatPayout = (amount) => {
    const roundedAmount = Math.round(amount);
    return roundedAmount.toLocaleString('en-US');
  };

  const payouts = [];
  let adjustedPosition = 1;

  sortedPositions.forEach((position) => {
    const { count, players } = positionCounts[position];
    const payoutPercentageArray = payoutPercentages.slice(
      adjustedPosition - 1,
      adjustedPosition - 1 + count
    );

    const totalPayout = payoutPercentageArray.reduce((sum, percentage) => {
      return sum + (tournament.purse * percentage) / 100;
    }, 0);

    const amountForPlayer = totalPayout / count;

    players.forEach((player) => {
      let payout;

      if (specialPayout?.enabled && player.name === specialPayout.name) {
        payout = specialPayout.payout;
      } else {
        payout = formatPayout(amountForPlayer);
      }

      payouts.push({
        name: player.name,
        position: player.position,
        score: player.score,
        payout: String(payout) === 'NaN' ? '0' : payout,
        thru_status: player.thru_status,
      });
    });

    adjustedPosition += count;
  });

  return payouts;
};
