document.addEventListener('DOMContentLoaded', () => {
  const seasonSelect = document.getElementById('seasonSelect');
  const submitBtn = document.getElementById('submitBtn');
  const chartCanvas = document.getElementById('f1Chart').getContext('3d');
  let f1Chart = null;

  // Populate season dropdown (from 2007 to 2024) Hamilton started racing in 2007 and Ergast API only supports up to 2024 as it's deprecated
  const startYear = 2007;
  const endYear = 2024;
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    seasonSelect.appendChild(option);
  }
  seasonSelect.value = endYear; // default to latest season available

  submitBtn.addEventListener('click', async () => {
    const season = seasonSelect.value;
    const driverId = "hamilton"; // hard-coded for trial, will have option to choose driver in future

    try {
      // Fetch season data to get all race names for each rounds
      const seasonResponse = await fetch(`https://ergast.com/api/f1/${season}.json`);
      const seasonData = await seasonResponse.json();
      const races = seasonData.MRData.RaceTable.Races;
      // Use race names for x-axis labels
      const raceLabels = races.map(race => race.raceName);
      
      // For each race, fetch the driver standings to get Hamilton's points
      const pointsData = [];
      for (let i = 0; i < races.length; i++) {
        const round = races[i].round;
        // using await and in in future will implement fetch bar.
        const roundResponse = await fetch(`https://ergast.com/api/f1/${season}/${round}/driverStandings.json`);
        const roundData = await roundResponse.json();
        const standingsList = roundData.MRData.StandingsTable.StandingsLists;
        let points = 0;
        if (standingsList.length > 0) {
          // Find Hamilton's standings for this round 
          const driverStanding = standingsList[0].DriverStandings.find(ds => ds.Driver.driverId === driverId);
          if (driverStanding) {
            points = parseFloat(driverStanding.points);
          }
        }
        pointsData.push(points);
      }
      // will implement constructors section in future
      // Render the chart using Chart.js
      if (f1Chart) f1Chart.destroy();
      f1Chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: raceLabels,
          datasets: [{
            label: `Points for ${driverId} in ${season}`,
            data: pointsData,
            borderColor: 'blue',
            fill: false,
            tension: 0.1
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  });
});
