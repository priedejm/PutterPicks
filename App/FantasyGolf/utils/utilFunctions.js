export const calculatePayouts = (tournament, players, amateurPlayers, payoutPercentages, specialPayouts) => {
  if (!tournament || !tournament.purse) return [];
  if (!Array.isArray(players) || players.length === 0) return [];
  if (!Array.isArray(amateurPlayers)) return [];
  if (!Array.isArray(payoutPercentages) || payoutPercentages.length === 0) return [];
  if (!specialPayouts || typeof specialPayouts !== 'object') return [];

  const playersPaid = players.filter(
    (player) =>
      !amateurPlayers.includes(player.name) &&
      player.position !== 'CUT' &&
      player.position !== 'N/A' &&
      player.score !== '-'
  );

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

  const sortedPositions = Object.keys(positionCounts)
    .map(Number)
    .sort((a, b) => a - b);

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

      if (
        specialPayouts?.[player.name]?.enabled &&
        specialPayouts?.[player.name]?.payout
      ) {
        payout = specialPayouts[player.name].payout;
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
