import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.module.mjs';
/* https://confetti.js.org/ */

// https://open-meteo.com/en/docs - Weather Forecast API

// https://my-server.tld/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&current=temperature_2m,wind_speed_10m,weather_code,wind_direction_10m&timezone=Europe%2FMoscow&timeformat=unixtime

import { ICON_MAP } from "./iconMap.js"


/* HEADER LOCATION */

async function reverseGeocode(lat, lon) {
  const lang = "en"; // navigator.language || "en";

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang}`,
    {
      headers: {
        "User-Agent": "your-app-name"
      }
    }
  );

  const data = await res.json();

  if (!data.address) {
    return "Unknown location";
  }

  const city =
    data.address.city ||
    data.address.town ||
    data.address.village ||
    data.address.hamlet ||
    data.address.county ||
    "Unknown city";

  const country = data.address.country || "Unknown country";

  return `${city}, ${country}`;
}

const location = document.querySelector('.location');

async function updateLocation(lat, lon) { 
  try {
    const result = await reverseGeocode(lat, lon);
    if (document.querySelector('.location')) {
      location.textContent = result; 
    }
  } catch (err) {
    console.error(err); 
  }
}

const useGeolocation = document.querySelector("[data-use-geolocation]");

if (useGeolocation) {
  navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
}

function positionSuccess({ coords }) {
  updateLocation(coords.latitude, coords.longitude);

  getWeather(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  .then(renderWeather)
  .catch(e => {
    console.error(e);
    alert('Error getting weather.')
  })
}

function positionError() {
  alert("Location access is required to show the weather. Please allow access and refresh the page.");

  updateLocation(59.97, 30.3);

  getWeather(
    59.97,
    30.3,
    "Europe/Moscow"
  )
  .then(renderWeather)
  .catch(e => {
    console.error(e);
    alert('Error getting weather.')
  })
}

export function getWeather(lat, lon, timezone) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum",
    hourly: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    timezone: timezone,
    timeformat: "unixtime",
    current: "temperature_2m,wind_speed_10m,weather_code,wind_direction_10m",
  })

  return fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  .then (res => res.json())
  .then(data => {
    return {
      current: parseCurrentWeather(data),
      daily: parseDailyWeather(data),
      hourly: parseHourlyWeather(data),
    }
  })
}

function parseCurrentWeather({ current, daily }) {
  const {
    temperature_2m: currentTemp,
    wind_speed_10m: windSpeed,
    weather_code: iconCode
  } = current

  const {
    temperature_2m_max: [maxTemp], 
    temperature_2m_min: [minTemp], 
    apparent_temperature_max: [maxFeelsLike], 
    apparent_temperature_min: [minFeelsLike], 
    precipitation_sum: [precip], 
  } = daily

  return {
    currentTemp: Math.round(currentTemp), 
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp), 
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed), 
    precip: Math.round(precip * 100) / 100,
    iconCode,
  }
}

function parseDailyWeather({ daily }) {
  return daily.time.map((time, index) => {
    return {
      timestamp: time * 1000,
      iconCode: daily.weather_code[index],
      maxTemp: Math.round(daily.temperature_2m_max[index]),
    }
  })
}

function parseHourlyWeather({ hourly, current }) {
  return hourly.time.map((time, index) => {
    return {
      timestamp: time * 1000,
      iconCode: hourly.weather_code[index],
      temp: Math.round(hourly.temperature_2m[index]),
      feelsLike: Math.round(hourly.apparent_temperature[index]),
      windSpeed: Math.round(hourly.wind_speed_10m[index]),
      precip: Math.round(hourly.precipitation[index] * 100) / 100,
    }
  }).filter(({ timestamp }) => timestamp >= current.time * 1000)
}

function renderWeather({ current, daily, hourly }) {
  if (document.querySelector("[data-current-icon]")) {
    renderCurrentWeather(current);
  }

  if (dailySection) {
    renderDailyWeather(daily);
  }

  if (hourlySection) {
    renderHourlyWeather(hourly);
  }

  document.body.classList.remove('blurred');
}

function setValue(selector, value, {parent = document} = {}) {
  if (parent.querySelector(`[data-${selector}]`)) {
    parent.querySelector(`[data-${selector}]`).textContent = value;
  }
}

function getIconUrl(iconCode) {
  return `icons/${ICON_MAP.get(iconCode)}.svg`
}

const currentIcon = document.querySelector("[data-current-icon]");

function renderCurrentWeather(current) {
  currentIcon.src = getIconUrl(current.iconCode);
  setValue("current-temp", current.currentTemp);
  setValue("current-high", current.highTemp);
  setValue("current-low", current.lowTemp);
  setValue("current-fl-high", current.highFeelsLike);
  setValue("current-fl-low", current.lowFeelsLike);
  setValue("current-wind", current.windSpeed);
  setValue("current-precip", current.precip);
}

const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "long" }); 
//undefined/"en"/"en-GB" - language, locale
//"long", "short" - weekday names format
const dailySection = document.querySelector("[data-day-section]");
const dayCardTemplate = document.getElementById("day-card-template");

function renderDailyWeather(daily) {
  dailySection.innerHTML = "";
  daily.forEach(day => {
    const element = dayCardTemplate.content.cloneNode(true);
    setValue("temp", day.maxTemp, { parent: element});
    setValue("date", DAY_FORMATTER.format(day.timestamp), { parent: element});
    element.querySelector("[data-icon]").src = getIconUrl(day.iconCode);
    dailySection.append(element);
  });
}

const HOUR_FORMATTER = new Intl.DateTimeFormat("en", { hour: "numeric", minute: 'numeric' }); // hourCycle: 'h23'
const hourlySection = document.querySelector("[data-hour-section]");
const hourRowTemplate = document.getElementById("hour-row-template");

function renderHourlyWeather(hourly) {
  hourlySection.innerHTML = "";
  hourly.forEach(hour => {
    const element = hourRowTemplate.content.cloneNode(true);
    setValue("temp", hour.temp, { parent: element});
    setValue("fl-temp", hour.feelsLike, { parent: element});
    setValue("wind", hour.windSpeed, { parent: element});
    setValue("precip", hour.precip, { parent: element});
    setValue("day", DAY_FORMATTER.format(hour.timestamp), { parent: element});
    setValue("time", HOUR_FORMATTER.format(hour.timestamp), { parent: element});
    element.querySelector("[data-icon]").src = getIconUrl(hour.iconCode);
    hourlySection.append(element);
  });
}


/* HEADER TIME */

const currentTime = document.querySelector('.current-time');

if (document.querySelector('.current-time')) {
  currentTime.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}


/* WORLD CAPITALS WEATHER */

const cities = [{
    id: "new-york",
    lat: 40.73,
    lon: -74.01,
    tz: "America/New_York"
  },
  {
    id: "buenos-aires",
    lat: -34.60,
    lon: -58.38,
    tz: "America/Argentina/Buenos_Aires"
  },
  {
    id: "london",
    lat: 51.30,
    lon: -0.08,
    tz: "Europe/London"
  },
  {
    id: "rome",
    lat: 41.54,
    lon: 12.29,
    tz: "Europe/Rome"
  },
  {
    id: "warsaw",
    lat: 52.14,
    lon: 21.00,
    tz: "Europe/Warsaw"
  },  
  {
    id: "berlin",
    lat: 52.31,
    lon: 13.23,
    tz: "Europe/Berlin"
  },
  {
    id: "moscow",
    lat: 55.45,
    lon: 37.37,
    tz: "Europe/Moscow"
  },
  {
    id: "tokyo",
    lat: 35.41,
    lon: 139.42,
    tz: "Asia/Tokyo"
  },
  {
    id: "beijing",
    lat: 39.55,
    lon: 116.23,
    tz: "Asia/Shanghai"
  },
   {
    id: "sydney",
    lat: -33.52,
    lon: 151.12,
    tz: "Australia/Sydney"
  }
];

function getCityWeather(lat, lon, timezone, city) {
   getWeather(
    lat,
    lon,
    timezone
  )
  .then(({current}) => renderCityWeather(current, city))
  .catch(console.error);
/*   .catch(e => {
    console.error(e);
    alert('Error getting weather.')
  }) */
}

function renderCityWeather(current, city) {
  const cityIcon = city.querySelector("[data-current-city-icon]");
  const cityTemp = city.querySelector("[data-current-city-temp]");

  if (!cityIcon || !cityTemp) return;

  cityIcon.src = getIconUrl(current.iconCode);
  cityTemp.textContent = current.currentTemp;

  document.body.classList.remove('blurred');
}

if (document.querySelector(".world-header")) {
  cities.forEach(city => {
    getCityWeather(
      city.lat,
      city.lon,
      city.tz,
      document.getElementById(city.id)
    );
  });
}


/* SNOW */

function startSnow() {
  const duration = 45 * 1000,
  animationEnd = Date.now() + duration;
  
  let skew = 1;
  
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  (function frame() {
    const timeLeft = animationEnd - Date.now(),
      ticks = Math.max(100, 400 * (timeLeft / duration));
  
    skew = Math.max(0.8, skew - 0.001);
  
    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: ticks,
      origin: {
        x: Math.random(),
        // since particles fall down, skew start toward the top
        y: Math.random() * skew - 0.2,
      },
      colors: ["#ffffff"],
      shapes: ["circle"],
      gravity: randomInRange(0.4, 0.6),
      scalar: randomInRange(0.4, 0.7),
      drift: randomInRange(-0.4, 0.4),
    });
  
    if (timeLeft > 0) {
      requestAnimationFrame(frame);
    }
  })();
}

/* DYNAMIC BACKGROUND IMAGE */

const seasonMonths = {
  0: "winter",
  1: "winter",
  2: "spring",
  3: "spring",
  4: "spring",
  5: "summer",
  6: "summer",
  7: "summer",
  8: "autumn",
  9: "autumn",
  10: "autumn",
  11: "winter"
}

const month = new Date().getMonth();
const season = seasonMonths[month];

if (season === "winter") startSnow();

document.body.style.backgroundImage = `url('bg/${season}.jpg')`;


/* LIGHT/DARK MODE */

const lightDarkModeBtn = document.querySelector('.light-dark-mode-btn'); 
const savedMode = localStorage.getItem('savedMode');

function getVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateChartTheme() {
  chart.data.datasets.borderColor = getVar('--clr-main-lighter');

  chart.options.scales.x.grid.color = getVar('--clr-border');
/*   chart.options.scales.y.grid.color = getVar('--clr-border');

  chart.options.scales.x.ticks.color = getVar('--clr-main');
  chart.options.scales.y.ticks.color = getVar('--clr-main'); */

  chart.update();
}


if (savedMode === 'dark') {
  document.documentElement.classList.add('dark-mode');
  lightDarkModeBtn.classList.add('lightDark');
}

lightDarkModeBtn.addEventListener('click', () => {
  const darkModeOn = lightDarkModeBtn.classList.toggle('lightDark');
  document.documentElement.classList.toggle('dark-mode', darkModeOn);
  localStorage.setItem('savedMode', darkModeOn ? 'dark' : 'light');

   updateChartTheme();
});

if (!savedMode) {
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (preferDark) {
    document.documentElement.classList.add('dark-mode');
    lightDarkModeBtn.classList.add('lightDark');
  }
}




/* CHART */

/* const chart = document.getElementById("chart"); */

const xValues = [1,2,3,4,5,6,7];
const yValues = [7,8,8,9,9,9,10,11,14,14,15];

new Chart("chart", {
  type: "line",
  data: {
    labels: xValues,
    datasets: [{
      fill: false,
      lineTension: 0,
  /*     backgroundColor: "rgba(0,0,255,1.0)", */
      data: yValues,

         borderColor: getVar('--clr-main-lighter'), // Line color
            borderWidth: 2,                   // Line width
            /* borderDash: [5, 5],   */             // Dashed line
            tension: 0.4  
    }]
  },
  options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { 
          grid: {
                    color: 'rgb(142, 141, 141, 0.5)' 
                }
         },
        y: { min: 6, max: 16
          , grid: {
                    color: 'rgb(142, 141, 141, 0.5)' 
                }
         }
      }
    }
  });

  
  /*  title: {
       display: true,
       text: 'Custom Chart Title',
       color: '#ff6384', 
       font: {
         family: 'Geologica, sans-serif',
         size: 16
       }
   } */