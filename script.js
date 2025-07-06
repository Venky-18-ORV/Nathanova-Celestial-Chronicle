// ---- CONFIG ----
const APP_ID = "778d9cc1-dc39-4074-beea-cce53466a663"; // AstronomyAPI Application ID
const APP_SECRET = "e41b370b0ee21585f8785279111daaa98a8c601981d96bf196b9a065284b012d59417ae6194a4ec4e70b049bef26ed0ef77c6e8525f5e7ff703c071e857374291daab7d32a67df449145822e5194da247313867ca4ea3a0c6d5aab12e5d03d9c9a52634001866a293c4a354523831b4e"; // AstronomyAPI Secret
const IPGEO_API_KEY = "5ab025ea5d6442158d5d9f80df175deb"; // IPGeolocation API Key
const NINJAS_API_KEY = "6B/cWV43/fp8ST5RIxNpmg==aSJmTPSCGLA5ER31"; // API Ninjas Historical Events Key

const latitude = 12.6934;
const longitude = 79.9770;
const elevation = 0;

// ---- HELPERS ----
function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}
function formatToday(dateObj) {
  const months = [
    'January','February','March','April','May','June','July',
    'August','September','October','November','December'
  ];
  return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

// ---- DOM ELEMENTS ----
const dateInput = document.getElementById("date-picker");
const today = new Date();
dateInput.valueAsDate = today;
document.getElementById("today-date").textContent = formatToday(today);

// ---- GLOBAL for search ----
let lastHistoricalEvents = [];

// ---- FETCH DAILY DATA (IPGeolocation) ----
function fetchDailyAstronomy(dateObj) {
  const dateStr = formatDateISO(dateObj);
  const url = `https://api.ipgeolocation.io/astronomy?apiKey=${IPGEO_API_KEY}&lat=${latitude}&long=${longitude}&date=${dateStr}`;

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data && !data.error) {
        return `
          <h3>Daily Sun & Moon Data</h3>
          <ul>
            <li><b>Sunrise:</b> ${data.sunrise}</li>
            <li><b>Sunset:</b> ${data.sunset}</li>
            <li><b>Solar Noon:</b> ${data.solar_noon}</li>
            <li><b>Day Length:</b> ${data.day_length}</li>
            <li><b>Moonrise:</b> ${data.moonrise}</li>
            <li><b>Moonset:</b> ${data.moonset}</li>
            <li><b>Moon Phase:</b> ${data.moon_phase}</li>
            <li><b>Moon Illumination:</b> ${data.moon_illumination}%</li>
          </ul>
        `;
      } else {
        return `<p style="color:#ffb300;">Could not load daily astronomy data.</p>`;
      }
    })
    .catch(() => `<p style="color:#ffb300;">Could not load daily astronomy data.</p>`);
}

// ---- FETCH MAJOR EVENTS (AstronomyAPI) ----
function fetchAstronomyEvents(dateObj, body = "sun") {
  const dateStr = formatDateISO(dateObj);
  const url = `https://api.astronomyapi.com/api/v2/bodies/events/${body}?latitude=${latitude}&longitude=${longitude}&elevation=${elevation}&from_date=${dateStr}&to_date=${dateStr}&output=table`;
  const basicAuth = btoa(`${APP_ID}:${APP_SECRET}`);

  return fetch(url, {
    headers: {
      "Authorization": `Basic ${basicAuth}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (
        data &&
        data.data &&
        data.data.table &&
        data.data.table.rows &&
        data.data.table.rows.length > 0
      ) {
        let html = `<h3>Major Astronomical Events</h3>`;
        data.data.table.rows.forEach(row => {
          html += `<div class="event"><b>${row.body.name}</b><ul>`;
          row.events.forEach(event => {
            html += `<li><b>${event.type.replace(/_/g, " ")}:</b> `;
            if (event.eventHighlights) {
              for (const [key, value] of Object.entries(event.eventHighlights)) {
                html += `<br>${key}: ${typeof value === "object" && value !== null && value.date ? value.date : value}`;
              }
            }
            html += `</li>`;
          });
          html += `</ul></div>`;
        });
        return html;
      } else {
        return `<p style="color:#ffb300;">No major astronomical events (eclipse, solstice, etc.) found for this date.<br>Try another date, such as a known eclipse or solstice.</p>`;
      }
    })
    .catch(() =>
      `<p style='color:#ffb300;'>Could not load AstronomyAPI data. Please check your credentials or try again later.</p>`
    );
}

// ---- FETCH HISTORICAL EVENTS (API Ninjas) ----
function fetchHistoricalEvents(dateObj) {
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const url = `https://api.api-ninjas.com/v1/historicalevents?month=${month}&day=${day}`;

  return fetch(url, {
    headers: { 'X-Api-Key': NINJAS_API_KEY }
  })
    .then(response => response.json())
    .then(data => {
      lastHistoricalEvents = data; // Store for filtering
      if (Array.isArray(data) && data.length > 0) {
        let html = `<h3>Historical Events on This Day</h3><ul>`;
        data.forEach(event => {
          html += `<li><b>${event.year}:</b> ${event.event}</li>`;
        });
        html += `</ul>`;
        return html;
      } else {
        return `<p>No recorded historical events for this date.</p>`;
      }
    })
    .catch(() =>
      `<p style="color:#ffb300;">Could not load historical events. Please try again later.</p>`
    );
}

// ---- DISPLAY ALL THREE ----
function displayCombinedAstronomy(dateObj) {
  document.getElementById("today-date").textContent = formatToday(dateObj);
  document.getElementById("event-list").innerHTML = `<p style="color:#7ecfff;">Loading astronomical data...</p>`;
  Promise.all([
    fetchDailyAstronomy(dateObj),
    fetchAstronomyEvents(dateObj, "sun"),
    fetchHistoricalEvents(dateObj)
  ]).then(([dailyHtml, eventsHtml, historyHtml]) => {
    document.getElementById("event-list").innerHTML = dailyHtml + eventsHtml + historyHtml;
  });
}

// ---- INITIAL LOAD ----
displayCombinedAstronomy(today);

// ---- DATE PICKER LISTENER ----
dateInput.addEventListener("change", function () {
  const selectedDate = new Date(this.value);
  displayCombinedAstronomy(selectedDate);
});

// ---- HISTORICAL EVENTS SEARCH/FILTER ----
// Only add this if you have a search box with id="history-search" in your HTML!
const historySearchInput = document.getElementById("history-search");
if (historySearchInput) {
  historySearchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase();
    let html = `<h3>Historical Events on This Day</h3><ul>`;
    lastHistoricalEvents.forEach(event => {
      if (event.event.toLowerCase().includes(query) || String(event.year).includes(query)) {
        html += `<li><b>${event.year}:</b> ${event.event}</li>`;
      }
    });
    html += `</ul>`;
    // Replace only the historical events section in event-list (assumes it's the last <ul>)
    const eventListDiv = document.getElementById("event-list");
    const allUls = eventListDiv.querySelectorAll("ul");
    if (allUls.length > 0) {
      allUls[allUls.length - 1].parentElement.innerHTML = html;
    }
  });
}

// NASA APOD API integration
const nasaApiKey = "FpENkSLQPklS3OeBrumaZfu4fhTFZPC8sRIebRCo"; // Replace with your NASA API key

function fetchNasaApod(date) {
  let url = `https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}`;
  if (date) url += `&date=${date}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      document.getElementById("nasa-apod-title").textContent = data.title || "NASA Astronomy Picture of the Day";
      document.getElementById("nasa-apod-explanation").textContent = data.explanation || "";
      const img = document.getElementById("nasa-apod-image");
      const vid = document.getElementById("nasa-apod-video");
      if (data.media_type === "image") {
        img.src = data.url;
        img.style.display = "block";
        vid.style.display = "none";
      } else if (data.media_type === "video") {
        vid.src = data.url;
        vid.style.display = "block";
        img.style.display = "none";
      } else {
        img.style.display = "none";
        vid.style.display = "none";
      }
    })
    .catch(error => {
      document.getElementById("nasa-apod-title").textContent = "NASA APOD Unavailable";
      document.getElementById("nasa-apod-explanation").textContent = "Could not load NASA Astronomy Picture of the Day.";
      document.getElementById("nasa-apod-image").style.display = "none";
      document.getElementById("nasa-apod-video").style.display = "none";
      console.error("Error fetching NASA APOD:", error);
    });
}

// Fetch today's APOD on load
fetchNasaApod();

// (Optional) If you want to show APOD for the selected date in your date picker:
dateInput.addEventListener("change", function () {
  const selectedDate = new Date(this.value);
  const dateStr = selectedDate.toISOString().split('T')[0];
  fetchNasaApod(dateStr);
});







  
  

  
 
  

  