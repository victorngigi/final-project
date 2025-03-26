document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("seasonSelect");
  const driverSelect = document.getElementById("driverSelect");
  const submitBtn = document.getElementById("submitBtn");
  const chartCanvas = document.getElementById("f1Chart").getContext("2d");
  let f1Chart = null;

  // Populate season dropdown (from 2007 to 2024) Hamilton started racing in 2007 and Ergast API only supports up to 2024 as it's deprecated
  const startYear = 2007;
  const endYear = 2024;
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    seasonSelect.appendChild(option);
  }
  seasonSelect.value = endYear; // default to latest season available
  //asunc function to fetch drivers
  async function fetchDrivers(season) {
    driverSelect.innerHTML = ""; // clear existing options
    // try-catch block to handle errors
    try {
      const response = await fetch(`https://ergast.com/api/f1/${season}/drivers.json`);
      const data = await response.json();
      const drivers = data.MRData.DriverTable.Drivers;

      //create driver dropdown and populate it with fetched data
      drivers.forEach((driver) => {
        const option = document.createElement("option");
        option.value = driver.driverId;
        option.textContent = `${driver.givenName} ${driver.familyName}`;
        driverSelect.appendChild(option);
      });

      //default to Hamilton if available in the season
      if (drivers.some(driver => driver.driverId === "hamilton")) {
        driverSelect.value = "hamilton";
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }
  // Fetch drivers for the selected season
  fetchDrivers(endYear);

  // Event listener for season change
  seasonSelect.addEventListener("change", () => {
    fetchDrivers(seasonSelect.value);
  });
  // Event listener for submit button
  submitBtn.addEventListener("click", async () => {
    const season = seasonSelect.value;
    const driverId = driverSelect.value; // hard-coded for trial, will have option to choose driver in future
    //try-catch block to handle errors
    try {
      // Fetch season data to get all race names for each rounds
      const seasonResponse = await fetch(
        `https://ergast.com/api/f1/${season}.json`
      );
      const seasonData = await seasonResponse.json();
      const races = seasonData.MRData.RaceTable.Races;
      // Use race names for x-axis labels
      const raceLabels = races.map((race) => race.raceName);

      // For each race, fetch the driver standings to get driver's points
      const pointsData = await Promise.all(
        races.map(async (race) => {
          const round = race.round;
          const response = await fetch(
            `https://ergast.com/api/f1/${season}/${round}/driverStandings.json`
          );
          const data = await response.json();
          const standings = data.MRData.StandingsTable.StandingsLists;

          if (standings.length > 0) {
            const driverStandings = standings[0].DriverStandings.find(
              (ds) => ds.Driver.driverId === driverId
            );
            return driverStandings ? parseFloat(driverStandings.points) : 0;
          }
          return 0;
        })
      );
      // Render the chart using Chart.js
      if (f1Chart) f1Chart.destroy();
      f1Chart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: raceLabels,
          datasets: [
            {
              label: `Points for ${driverId} in ${season}`,
              data: pointsData,
              borderColor: "blue",
              fill: false,
              tension: 0.1,
            },
          ],
        },
        options: {
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  });
});
