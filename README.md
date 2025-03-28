# F1 Historical Data Viewer

**Author:** `Victor Kinyanjui Ngigi`

---

## Description

This project is a single-page web application designed to explore historical Formula 1 data. Users can select specific F1 seasons by browsing through decades and years, view the drivers and constructors active in that season,
and visualize the championship points progression for a selected driver or constructor using an interactive chart. The application also displays the official World Drivers' Champion (WDC) and World Constructors' Champion (WCC) for the selected year.
All data is fetched asynchronously from the public Ergast F1 API.

---

## Features

*   Browse F1 seasons from 1950 to the present using interactive decade and year selectors.
*   Toggle between viewing data for the Drivers' Championship and the Constructors' Championship.
*   Dynamically loads drivers or constructors available for the selected season into dropdown menus.
*   Displays the official WDC and WCC winner below the respective selectors for the chosen season.
*   Generates an interactive line chart (using Chart.js) showing the cumulative points progression throughout the selected season for the chosen driver or constructor.
*   Loading states provide visual feedback during API calls.
*   Error handling for API requests.
*   Styled with a dark theme inspired by F1 aesthetics.

---

## Technologies Used

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   [Ergast Developer API](http://ergast.com/mrd/)
*   [Chart.js](https://www.chartjs.org/)
*   [Google Fonts (Montserrat)](https://fonts.google.com/specimen/Montserrat)

---

## Project Setup Instructions

This project is built with vanilla HTML, CSS, and JavaScript and does not require any build steps or package managers like Node.js/npm.

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:victorngigi/final-project.git
    ```
    Alternatively, download the ZIP file from GitHub.
2.  **Navigate to the project directory:**
    ```bash
    cd final-project
    ```
3.  **Open the HTML file:**
    Simply open the `index.html` file in your preferred web browser (e.g., Chrome, Firefox, Safari, Edge).


---

## Screenshot

screenshot 1
![screenshot1](./images/phase-1-proj-1.png?raw=true)
screenshot 2
![screenshot2](./images/phase-1-proj-2.png?raw=true)

---

## Copyright and License

Copyright (c) 2024 `Victor Kinyanjui Ngigi`

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
