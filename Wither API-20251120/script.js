// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('location-search');
const currentTemp = document.getElementById('currentTemp');
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const weatherEmoji = document.getElementById('weatherEmoji');
const weatherDescription = document.getElementById('weatherDescription');
const tempMax = document.getElementById('tempMax');
const tempMin = document.getElementById('tempMin');
const humidity = document.getElementById('humidity');
const cloudiness = document.getElementById('cloudiness');
const windSpeed = document.getElementById('windSpeed');
const forecastContainer = document.getElementById('forecastContainer');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error');

// Complete Weather dictionary with emojis
const WEATHER = {
  0: { text: "CLEAR SKY", emoji: "☀️" },
  1: { text: "MAINLY CLEAR", emoji: "🌤️" },
  2: { text: "PARTLY CLOUDY", emoji: "⛅" },
  3: { text: "OVERCAST", emoji: "☁️" },
  45: { text: "FOG", emoji: "🌫️" },
  48: { text: "DEPOSITING RIME FOG", emoji: "🌫️" },
  51: { text: "LIGHT DRIZZLE", emoji: "🌦️" },
  53: { text: "MODERATE DRIZZLE", emoji: "🌦️" },
  55: { text: "DENSE DRIZZLE", emoji: "🌧️" },
  56: { text: "LIGHT FREEZING DRIZZLE", emoji: "🌧️" },
  57: { text: "DENSE FREEZING DRIZZLE", emoji: "🌧️" },
  61: { text: "SLIGHT RAIN", emoji: "🌦️" },
  63: { text: "MODERATE RAIN", emoji: "🌧️" },
  65: { text: "HEAVY RAIN", emoji: "🌧️" },
  66: { text: "LIGHT FREEZING RAIN", emoji: "🌧️" },
  67: { text: "HEAVY FREEZING RAIN", emoji: "🌧️" },
  71: { text: "SLIGHT SNOW", emoji: "🌨️" },
  73: { text: "MODERATE SNOW", emoji: "🌨️" },
  75: { text: "HEAVY SNOW", emoji: "❄️" },
  77: { text: "SNOW GRAINS", emoji: "🌨️" },
  80: { text: "SLIGHT RAIN SHOWERS", emoji: "🌧️" },
  81: { text: "MODERATE RAIN SHOWERS", emoji: "🌧️" },
  82: { text: "VIOLENT RAIN SHOWERS", emoji: "🌧️" },
  85: { text: "SLIGHT SNOW SHOWERS", emoji: "🌨️" },
  86: { text: "HEAVY SNOW SHOWERS", emoji: "❄️" },
  95: { text: "THUNDERSTORM", emoji: "⛈️" },
  96: { text: "THUNDERSTORM WITH HAIL", emoji: "⛈️" },
  99: { text: "HEAVY THUNDERSTORM WITH HAIL", emoji: "⛈️" }
};

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

function handleSearch(e) {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  loadWeatherData(city);
}

// Main function
async function loadWeatherData(city) {
  try {
    console.log("Loading weather for:", city);
    toggleLoading(true);
    hideError();

    // Geocoding API call
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    
    console.log("Fetching geolocation...");
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Geocoding error");

    const geoData = await geoRes.json();
    console.log("Geolocation data:", geoData);

    const place = geoData?.results?.[0];
    if (!place) throw new Error("City not found");

    const { latitude, longitude, name, country } = place;

    // Weather API call for current weather and daily forecast
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    console.log("Fetching weather data...");
    const wRes = await fetch(wUrl);
    if (!wRes.ok) throw new Error("Weather data error");

    const wData = await wRes.json();
    console.log("Weather data received:", wData);

    // Update UI with weather data
    updateCurrentWeather({ name, country }, wData.current, wData.daily);
    updateTodayForecast(wData.daily);
    
  } catch (err) {
    console.error("Error:", err);
    showError(err.message || "Something went wrong");
  } finally {
    toggleLoading(false);
  }
}

// Update current weather
function updateCurrentWeather(place, current, daily) {
  console.log("Updating UI with:", { place, current, daily });
  
  const label = `${place.name}${place.country ? ", " + place.country : ""}`;
  const code = current?.weather_code;
  const wm = WEATHER[code] || { text: "UNKNOWN", emoji: "❔" };

  console.log("Weather code:", code, "Weather info:", wm);

  // Update all elements
  cityName.textContent = label;
  currentTemp.textContent = current?.temperature_2m != null ? Math.round(current.temperature_2m) + "°" : "—";
  weatherEmoji.textContent = wm.emoji;
  weatherDescription.textContent = wm.text;
  
  // Update weather details
  humidity.textContent = current?.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) + "%" : "—";
  windSpeed.textContent = current?.wind_speed_10m != null ? Math.round(current.wind_speed_10m) + " km/h" : "—";
  
  // Use daily data for min/max temps
  tempMax.textContent = daily?.temperature_2m_max?.[0] != null ? Math.round(daily.temperature_2m_max[0]) + "°" : "—";
  tempMin.textContent = daily?.temperature_2m_min?.[0] != null ? Math.round(daily.temperature_2m_min[0]) + "°" : "—";
  
  // Set cloudiness based on weather code
  const cloudValue = (code >= 2 && code <= 3) ? "86%" : 
                    (code === 1) ? "25%" : "15%";
  cloudiness.textContent = cloudValue;
  
  // Update date
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  currentDate.setAttribute('datetime', now.toISOString());

  console.log("UI updated successfully");
}

// Update today's forecast using daily data
function updateTodayForecast(daily) {
  console.log("Updating today's forecast with daily data:", daily);
  
  // Clear existing forecast
  while (forecastContainer.firstChild) {
    forecastContainer.removeChild(forecastContainer.firstChild);
  }
  
  if (!daily?.time?.length || !daily?.weather_code?.length) {
    console.log("No forecast data available");
    createFallbackForecast();
    return;
  }

  // Create forecast for next 5 days
  for (let i = 0; i < Math.min(5, daily.time.length); i++) {
    const date = daily.time[i];
    const code = daily.weather_code[i];
    const tempMax = daily.temperature_2m_max[i];
    const wm = WEATHER[code] || { text: "UNKNOWN", emoji: "❔" };

    const forecastItem = document.createElement('div');
    forecastItem.className = `forecast-card${i === 0 ? '' : i === 1 ? '-2' : i === 2 ? '-3' : i === 3 ? '-4' : '-5'}`;
    
    forecastItem.innerHTML = `
      <div class="element-snow${i >= 2 ? '-2' : ''}">
        <span style="font-size: 24px;">${wm.emoji}</span>
      </div>
      <div class="group-3">
        <time class="text-wrapper-6">${formatForecastDate(date)}</time>
        <span class="text-wrapper-7">${wm.text}</span>
      </div>
      <span class="text-wrapper-8">${tempMax != null ? Math.round(tempMax) + "°" : "—"}</span>
    `;
    
    forecastContainer.appendChild(forecastItem);
  }

  console.log("Forecast updated with", Math.min(5, daily.time.length), "items");
}

// Format date for forecast
function formatForecastDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });
}

// Fallback forecast if no data available
function createFallbackForecast() {
  const times = ["Mon, Sep 11", "Tue, Sep 12", "Wed, Sep 13", "Thu, Sep 14", "Fri, Sep 15"];
  const temps = ["18°", "21°", "19°", "16°", "14°"];
  const weatherTypes = ["SUNNY", "PARTLY CLOUDY", "CLOUDY", "RAIN", "CLEAR"];
  const emojis = ["☀️", "⛅", "☁️", "🌧️", "🌤️"];

  for (let i = 0; i < 5; i++) {
    const forecastItem = document.createElement('div');
    forecastItem.className = `forecast-card${i === 0 ? '' : i === 1 ? '-2' : i === 2 ? '-3' : i === 3 ? '-4' : '-5'}`;
    
    forecastItem.innerHTML = `
      <div class="element-snow${i >= 2 ? '-2' : ''}">
        <span style="font-size: 24px;">${emojis[i]}</span>
      </div>
      <div class="group-3">
        <time class="text-wrapper-6">${times[i]}</time>
        <span class="text-wrapper-7">${weatherTypes[i]}</span>
      </div>
      <span class="text-wrapper-8">${temps[i]}</span>
    `;
    
    forecastContainer.appendChild(forecastItem);
  }
}

// Helper functions
function toggleLoading(show) {
  if (show) {
    loader.style.display = 'block';
    loader.textContent = 'Loading weather data...';
  } else {
    loader.style.display = 'none';
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  console.error("Error displayed:", msg);
}

function hideError() {
  errorBox.textContent = "";
  errorBox.style.display = 'none';
}

// Initialize with default city
console.log("Initializing weather app...");
loadWeatherData("Bishkek");