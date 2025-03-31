document.addEventListener("DOMContentLoaded", () => {
  const decadeCarousel = document.getElementById("decadeCarousel");
  const seasonCarousel = document.getElementById("seasonCarousel");
  const driverSelect = document.getElementById("driverSelect");
  const constructorSelect = document.getElementById("constructorSelect");
  const driversSection = document.getElementById("driversSection");
  const constructorsSection = document.getElementById("constructorsSection");
  const driversBtn = document.getElementById("driversBtn");
  const constructorsBtn = document.getElementById("constructorsBtn");
  const submitBtn = document.getElementById("submitBtn");
  const chartCanvas = document.getElementById("f1Chart").getContext("2d");
  const driverChampWinnerSpan = document.getElementById("driverChampWinner");
  const constructorChampWinnerSpan = document.getElementById(
    "constructorChampWinner"
  );
  let f1Chart = null;

  // Default championship type is "drivers"
  let selectedChampType = "drivers";

  // Create decade carousel and fetch seasons for the selected decade
  function createCarousel(container, items, onClick) {
    container.innerHTML = ""; // Clear container
    items.forEach((item) => {
      const button = document.createElement("button");
      button.textContent = item;
      button.classList.add("carousel-item");
      // Add click event to mark item as active and trigger callback
      button.addEventListener("click", () => {
        // Remove 'active' class from all carousel items in the container
        [...container.children].forEach((child) =>
          child.classList.remove("active")
        );
        button.classList.add("active"); // Mark this item as active
        onClick(item); // Execute callback with selected item
      });
      container.appendChild(button);
    });
  }
  // Populate decade carousel (from 1950 to 2020; latest decade for 2024)
  const decades = Array.from({ length: 8 }, (_, i) => 1950 + i * 10);
  createCarousel(decadeCarousel, decades, (decade) => {
    // When a decade is selected, populate season carousel with years of that decade (filtering to <=2024)
    const years = Array.from({ length: 10 }, (_, i) => decade + i).filter(
      (year) => year <= 2024
    );
    createCarousel(seasonCarousel, years, (year) => {
      updateDataForSeason();
    });
    const firstYearButton = seasonCarousel.querySelector(".carousel-item");
    if (firstYearButton) {
      firstYearButton.click();
    }
  });

  // Auto-select latest decade and season by default:
  createCarousel(
    seasonCarousel,
    Array.from({ length: 10 }, (_, i) => 2020 + i).filter(
      (year) => year <= 2024
    ),
    (year) => {
      updateDataForSeason();
    }
  );

  const seasonItems = seasonCarousel.getElementsByClassName("carousel-item");
  if (
    seasonItems.length > 0 &&
    !seasonCarousel.querySelector(".carousel-item.active")
  ) {
    seasonItems[seasonItems.length - 1].classList.add("active");
  }

  const defaultDecadeValue = 2020;
  const defaultDecadeBtn = [
    ...decadeCarousel.querySelectorAll(".carousel-item"),
  ].find((btn) => btn.textContent === String(defaultDecadeValue));
  if (
    defaultDecadeBtn &&
    !decadeCarousel.querySelector(".carousel-item.active")
  ) {
    [...decadeCarousel.children].forEach((child) =>
      child.classList.remove("active")
    );
    defaultDecadeBtn.classList.add("active");
  }

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



// Async function to fetch and display the World Drivers' Champion
async function fetchAndDisplayWDC(season) {
  driverChampWinnerSpan.textContent = 'Loading Champion...'; // Show loading state
  try {
    const response = await fetch(`https://ergast.com/api/f1/${season}/driverStandings/1.json`);
    if (!response.ok) {
      // Handle cases like 404 Not Found if season data isn't complete
      if (response.status === 404) {
         driverChampWinnerSpan.textContent = 'Champion data not available for this season.';
      } else {
         throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return;
    }
    const data = await response.json();
    const standingsLists = data?.MRData?.StandingsTable?.StandingsLists;

    if (standingsLists && standingsLists.length > 0) {
      const driverStandings = standingsLists[0]?.DriverStandings;
      if (driverStandings && driverStandings.length > 0) {
        const champion = driverStandings[0].Driver;
        driverChampWinnerSpan.innerHTML = `<span class="trophy">🏆</span> Champion: ${champion.givenName} ${champion.familyName}`;
        return; // Success
      }
    }
    // If data structure is unexpected or empty
    driverChampWinnerSpan.textContent = 'Champion data unavailable.';

  } catch (error) {
    console.error("Error fetching WDC:", error);
    driverChampWinnerSpan.textContent = 'Error loading champion.';
  }
}

// Async function to fetch and display the World Constructors' Champion
async function fetchAndDisplayWCC(season) {
  constructorChampWinnerSpan.textContent = 'Loading Champion...'; // Show loading state
  try {
    const response = await fetch(`https://ergast.com/api/f1/${season}/constructorStandings/1.json`);
     if (!response.ok) {
      if (response.status === 404) {
         // Constructors championship started later, so more likely to be unavailable
         constructorChampWinnerSpan.textContent = 'Constructors\' Champion data not available for this season.';
      } else {
         throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return;
    }
    const data = await response.json();
    const standingsLists = data?.MRData?.StandingsTable?.StandingsLists;

    if (standingsLists && standingsLists.length > 0) {
      const constructorStandings = standingsLists[0]?.ConstructorStandings;
      if (constructorStandings && constructorStandings.length > 0) {
        const champion = constructorStandings[0].Constructor;
        constructorChampWinnerSpan.innerHTML = `<span class="trophy">🏆</span> Champion: ${champion.name}`;
        return; // Success
      }
    }
    // If data structure is unexpected or empty
    constructorChampWinnerSpan.textContent = 'Constructors\' Champion data unavailable.';

  } catch (error) {
    console.error("Error fetching WCC:", error);
    constructorChampWinnerSpan.textContent = 'Error loading constructors\' champion.';
  }
}

  // Async function to fetch drivers for a given season
  async function fetchDrivers(season) {
    driverSelect.innerHTML = '<option value="">Loading drivers...</option>'; // Show loading state
    driverSelect.disabled = true; // Disable during load

    const response = await fetch(
      `https://ergast.com/api/f1/${season}/drivers.json?limit=100`
    );
    const data = await response.json();
    // Optional chaining remains useful for resilience against unexpected API responses
    const drivers = data?.MRData?.DriverTable?.Drivers;

    driverSelect.innerHTML = ""; // Clear loading message

    if (!drivers || drivers.length === 0) {
      driverSelect.innerHTML = '<option value="">No drivers found</option>';
      driverSelect.disabled = false;
      return;
    }

    drivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver.driverId;
      option.textContent = `${driver.givenName} ${driver.familyName}`;
      driverSelect.appendChild(option);
    });
    // Default to Hamilton if available in the season
    if (drivers.some((driver) => driver.driverId === "hamilton")) {
      driverSelect.value = "hamilton";
    } else if (driverSelect.options.length > 0) {
      driverSelect.selectedIndex = 0;
    }
    driverSelect.disabled = false;
  }

  // Async function to fetch constructors for a given season
  async function fetchConstructors(season) {
    constructorSelect.innerHTML =
      '<option value="">Loading constructors...</option>'; // Show loading state
    constructorSelect.disabled = true; // Disable during load

    const response = await fetch(
      `https://ergast.com/api/f1/${season}/constructors.json?limit=100`
    );
    const data = await response.json();
    const constructors = data?.MRData?.ConstructorTable?.Constructors;

    constructorSelect.innerHTML = ""; // Clear loading message

    if (!constructors || constructors.length === 0) {
      constructorSelect.innerHTML =
        '<option value="">No constructors found</option>';
      constructorSelect.disabled = false;
      return;
    }

    constructors.forEach((constructor) => {
      const option = document.createElement("option");
      option.value = constructor.constructorId;
      option.textContent = constructor.name;
      constructorSelect.appendChild(option);
    });

    if (constructorSelect.options.length > 0) {
      constructorSelect.selectedIndex = 0;
    }
    constructorSelect.disabled = false;
  }

  // Fetch drivers & constructors for the selected season using the active season carousel item
  function updateDataForSeason() {
    // Get the active season from the season carousel
    const activeSeasonBtn = seasonCarousel.querySelector(".carousel-item.active");
    if (!activeSeasonBtn) {
      console.warn("updateDataForSeason called, but no active season button found yet.");
      driverSelect.innerHTML = '<option value="">Select Season</option>';
      constructorSelect.innerHTML = '<option value="">Select Season</option>';
      driverSelect.disabled = true;
      constructorSelect.disabled = true;
      // Clear champion spans when no season is selected
      driverChampWinnerSpan.textContent = '';
      constructorChampWinnerSpan.textContent = '';
      return;
    }
    const season = activeSeasonBtn.textContent;
    console.log(`Fetching data for season: ${season}`);
  
    // Call all fetch operations for the selected season
    fetchDrivers(season);
    fetchConstructors(season);
    fetchAndDisplayWDC(season); // Call new function
    fetchAndDisplayWCC(season); // Call new function
  
    if (f1Chart) {
        f1Chart.destroy();
        f1Chart = null;
    }
  }

  // Event listener for submit button
  submitBtn.addEventListener("click", async () => {
    const activeSeasonBtn = seasonCarousel.querySelector(
      ".carousel-item.active"
    );
    if (!activeSeasonBtn) return alert("Please select a season.");
    const season = activeSeasonBtn.textContent;
    // Determine selected entity based on championship type
    const selectedEntityId =
      selectedChampType === "drivers"
        ? driverSelect.value
        : constructorSelect.value;

    const selectedOption =
      selectedChampType === "drivers"
        ? driverSelect.options[driverSelect.selectedIndex]
        : constructorSelect.options[constructorSelect.selectedIndex];
    const selectedEntityName = selectedOption
      ? selectedOption.textContent
      : selectedEntityId;

    if (!selectedEntityId) {
      alert(
        `Please select a ${
          selectedChampType === "drivers" ? "driver" : "constructor"
        }.`
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Loading Chart...";

    try {
      // Fetch season data to get all race names
      const seasonResponse = await fetch(
        `https://ergast.com/api/f1/${season}.json`
      );
      if (!seasonResponse.ok)
        throw new Error(
          `Failed to fetch race list for ${season}. Status: ${seasonResponse.status}`
        );
      const seasonData = await seasonResponse.json();
      const races = seasonData?.MRData?.RaceTable?.Races;

      if (!races || races.length === 0) {
        alert(`No race data found for season ${season}.`);
        return;
      }
      const raceLabels = races.map((race) => race.raceName);

      // For each race, fetch standings to get points for the selected entity
      let cumulativePoints = 0;
      const pointsData = [];

      for (const race of races) {
        const round = race.round;
        let url;
        if (selectedChampType === "drivers") {
          url = `https://ergast.com/api/f1/${season}/${round}/driverStandings.json`;
        } else {
          url = `https://ergast.com/api/f1/${season}/${round}/constructorStandings.json`;
        }
        let roundPoints = cumulativePoints;

        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const standingsLists = data?.MRData?.StandingsTable?.StandingsLists;
            if (standingsLists && standingsLists.length > 0) {
              const currentStandings = standingsLists[0];
              if (selectedChampType === "drivers") {
                const driverStanding = currentStandings.DriverStandings?.find(
                  (ds) => ds.Driver.driverId === selectedEntityId
                );
                if (driverStanding) {
                  roundPoints = parseFloat(driverStanding.points);
                }
              } else {
                const constructorStanding =
                  currentStandings.ConstructorStandings?.find(
                    (cs) => cs.Constructor.constructorId === selectedEntityId
                  );
                if (constructorStanding) {
                  roundPoints = parseFloat(constructorStanding.points);
                }
              }
            }
          } else {
            console.warn(
              `Failed to fetch standings for round ${round}. Status: ${response.status}`
            );
          }
        } catch (fetchError) {
          console.warn(
            `Error fetching standings for round ${round}:`,
            fetchError
          );
        }
        cumulativePoints = roundPoints;
        pointsData.push(cumulativePoints);
      }

      // Render the chart using Chart.js
      if (f1Chart) f1Chart.destroy();
      f1Chart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: raceLabels,
          datasets: [
            {
              label: `Cumulative Points for ${selectedEntityName} in ${season}`,
              data: pointsData,
              borderColor:
                selectedChampType === "drivers"
                  ? "rgb(0, 119, 190)"
                  : "rgb(220, 50, 50)",
              backgroundColor:
                selectedChampType === "drivers"
                  ? "rgba(0, 119, 190, 0.1)"
                  : "rgba(220, 50, 50, 0.1)",
              fill: true,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `F1 Championship Standings Progression ${season}`,
            },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Cumulative Points" },
            },
            x: { title: { display: true, text: "Race" } },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching data or rendering chart:", error);
      alert(`Error updating chart: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Chart";
    }
  });

  updateDataForSeason();
}); // End DOMContentLoaded
