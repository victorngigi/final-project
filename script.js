document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("seasonSelect");
  const driverSelect = document.getElementById("driverSelect");
  const constructorSelect = document.getElementById("constructorSelect");
  const champTypeRadios = document.getElementsByName("champType");
  const submitBtn = document.getElementById("submitBtn");
  const chartCanvas = document.getElementById("f1Chart").getContext("2d");
  let f1Chart = null;

  // Populate season dropdown
  const startYear = 1990;
  const endYear = 2024;
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    seasonSelect.appendChild(option);
  }
  seasonSelect.value = endYear; // default to latest season available

  // Async function to fetch drivers for a given season
  async function fetchDrivers(season) {
    driverSelect.innerHTML = ""; // clear existing options
    // try-catch block to handle errors
    try {
      const response = await fetch(
        `https://ergast.com/api/f1/${season}/drivers.json`
      );
      const data = await response.json();
      const drivers = data.MRData.DriverTable.Drivers;

      // Create driver dropdown and populate it with fetched data
      drivers.forEach((driver) => {
        const option = document.createElement("option");
        option.value = driver.driverId;
        option.textContent = `${driver.givenName} ${driver.familyName}`;
        driverSelect.appendChild(option);
      });

      // Default to Hamilton if available in the season
      if (drivers.some((driver) => driver.driverId === "hamilton")) {
        driverSelect.value = "hamilton";
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }

  // Async function to fetch constructors for a given season
  async function fetchConstructors(season) {
    constructorSelect.innerHTML = ""; // clear existing options
    // try-catch block to handle errors
    try {
      const response = await fetch(
        `https://ergast.com/api/f1/${season}/constructors.json`
      );
      const data = await response.json();
      const constructors = data.MRData.ConstructorTable.Constructors;

      // Create constructor dropdown and populate it with fetched data
      constructors.forEach((constructor) => {
        const option = document.createElement("option");
        option.value = constructor.constructorId;
        option.textContent = constructor.name;
        constructorSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching constructors:", error);
    }
  }

  // Fetch drivers & constructors for the selected season
  function updateDataForSeason() {
    fetchDrivers(seasonSelect.value);
    fetchConstructors(seasonSelect.value);
  }

  // Fetch initial data for latest season
  updateDataForSeason();

  // Event listener for season change
  seasonSelect.addEventListener("change", updateDataForSeason);

  // Toggle between drivers and constructors section
  champTypeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "drivers") {
        driverSelect.parentElement.style.display = "block";
        constructorSelect.parentElement.style.display = "none";
      } else {
        driverSelect.parentElement.style.display = "none";
        constructorSelect.parentElement.style.display = "block";
      }
    });
  });

  // Event listener for submit button
  submitBtn.addEventListener("click", async () => {
    const season = seasonSelect.value;
    const selectedChampType = document.querySelector("input[name='champType']:checked").value;
    const selectedEntity =
      selectedChampType === "drivers"
        ? driverSelect.value
        : constructorSelect.value;

    // try-catch block to handle errors
    try {
      // Fetch season data to get all race names for each round
      const seasonResponse = await fetch(`https://ergast.com/api/f1/${season}.json`);
      const seasonData = await seasonResponse.json();
      const races = seasonData.MRData.RaceTable.Races;

      // Use race names for x-axis labels
      const raceLabels = races.map((race) => race.raceName);

      // For each race, fetch standings (drivers or constructors)
      const pointsData = await Promise.all(
        races.map(async (race) => {
          const round = race.round;
          let url;
          // manipulate DOM to show either drivers or constructors dropdown
          if (selectedChampType === "drivers") {
            url = `https://ergast.com/api/f1/${season}/${round}/driverStandings.json`;
          } else {
            url = `https://ergast.com/api/f1/${season}/${round}/constructorStandings.json`;
          }

          const response = await fetch(url);
          const data = await response.json();
          const standingsList = data.MRData.StandingsTable.StandingsLists;

          if (standingsList.length > 0) {
            if (selectedChampType === "drivers") {
              const driverStandings = standingsList[0].DriverStandings.find(
                (ds) => ds.Driver.driverId === selectedEntity
              );
              return driverStandings ? parseFloat(driverStandings.points) : 0;
            } else {
              const constructorStandings =
                standingsList[0].ConstructorStandings.find(
                  (cs) => cs.Constructor.constructorId === selectedEntity
                );
              return constructorStandings
                ? parseFloat(constructorStandings.points)
                : 0;
            }
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
              label: `Points for ${selectedEntity} in ${season}`,
              data: pointsData,
              borderColor: selectedChampType === "drivers" ? "blue" : "red",
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
