document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("seasonSelect");
  const driverSelect = document.getElementById("driverSelect");
  const constructorSelect = document.getElementById("constructorSelect");
  const driversSection = document.getElementById("driversSection");
  const constructorsSection = document.getElementById("constructorsSection");
  const driversBtn = document.getElementById("driversBtn");
  const constructorsBtn = document.getElementById("constructorsBtn");
  const submitBtn = document.getElementById("submitBtn");
  const chartCanvas = document.getElementById("f1Chart").getContext("2d");
  let f1Chart = null;
  
  // Default championship type is "drivers"
  let selectedChampType = "drivers";

  // Populate season dropdown (from 1990 to 2024)
  const startYear = 1990;
  const endYear = 2024;
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    seasonSelect.appendChild(option);
  }
  seasonSelect.value = endYear; // default to latest season available

  // Toggle championship type buttons styling and selection
  function setChampType(type) {
    selectedChampType = type;
    if (type === "drivers") {
      driversBtn.classList.add("active");
      constructorsBtn.classList.remove("active");
      driversSection.style.display = "block";
      constructorsSection.style.display = "none";
    } else {
      constructorsBtn.classList.add("active");
      driversBtn.classList.remove("active");
      driversSection.style.display = "none";
      constructorsSection.style.display = "block";
    }
  }

  driversBtn.addEventListener("click", () => setChampType("drivers"));
  constructorsBtn.addEventListener("click", () => setChampType("constructors"));

  // Async function to fetch drivers for a given season
  async function fetchDrivers(season) {
    driverSelect.innerHTML = ""; // clear existing options
    try {
      const response = await fetch(`https://ergast.com/api/f1/${season}/drivers.json`);
      const data = await response.json();
      const drivers = data.MRData.DriverTable.Drivers;
      drivers.forEach((driver) => {
        const option = document.createElement("option");
        option.value = driver.driverId;
        option.textContent = `${driver.givenName} ${driver.familyName}`;
        driverSelect.appendChild(option);
      });
      // Default to Hamilton if available in the season
      if (drivers.some(driver => driver.driverId === "hamilton")) {
        driverSelect.value = "hamilton";
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }

  // Async function to fetch constructors for a given season
  async function fetchConstructors(season) {
    constructorSelect.innerHTML = ""; // clear existing options
    try {
      const response = await fetch(`https://ergast.com/api/f1/${season}/constructors.json`);
      const data = await response.json();
      const constructors = data.MRData.ConstructorTable.Constructors;
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
  seasonSelect.addEventListener("change", updateDataForSeason);
  updateDataForSeason();

  // Event listener for submit button
  submitBtn.addEventListener("click", async () => {
    const season = seasonSelect.value;
    // Determine selected entity based on championship type
    const selectedEntity = selectedChampType === "drivers" 
                             ? driverSelect.value 
                             : constructorSelect.value;
    
    try {
      // Fetch season data to get all race names
      const seasonResponse = await fetch(`https://ergast.com/api/f1/${season}.json`);
      const seasonData = await seasonResponse.json();
      const races = seasonData.MRData.RaceTable.Races;
      const raceLabels = races.map((race) => race.raceName);

      // For each race, fetch standings to get points for the selected entity
      const pointsData = await Promise.all(
        races.map(async (race) => {
          const round = race.round;
          let url;
          if (selectedChampType === "drivers") {
            url = `https://ergast.com/api/f1/${season}/${round}/driverStandings.json`;
          } else {
            url = `https://ergast.com/api/f1/${season}/${round}/constructorStandings.json`;
          }
          const response = await fetch(url);
          const data = await response.json();
          const standings = data.MRData.StandingsTable.StandingsLists;
          if (standings.length > 0) {
            if (selectedChampType === "drivers") {
              const driverStandings = standings[0].DriverStandings.find(
                (ds) => ds.Driver.driverId === selectedEntity
              );
              return driverStandings ? parseFloat(driverStandings.points) : 0;
            } else {
              const constructorStandings = standings[0].ConstructorStandings.find(
                (cs) => cs.Constructor.constructorId === selectedEntity
              );
              return constructorStandings ? parseFloat(constructorStandings.points) : 0;
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
          datasets: [{
            label: `Points for ${selectedEntity} in ${season}`,
            data: pointsData,
            borderColor: selectedChampType === "drivers" ? "blue" : "red",
            fill: false,
            tension: 0.1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
