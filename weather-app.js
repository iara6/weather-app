import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.module.mjs';
/* https://confetti.js.org/ */

// https://open-meteo.com/en/docs - Weather Forecast API

// https://my-server.tld/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&current=temperature_2m,wind_speed_10m,weather_code,wind_direction_10m&timezone=Europe%2FMoscow&timeformat=unixtime

import { ICON_MAP } from "./iconMap.js"

const currentTime = document.querySelector('.current-time');
const hours = new Date().getHours();
const minutes = new Date().getMinutes();

currentTime.textContent = new Date().toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
});

navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
/* positionSuccess(); */ /* del + return blurred */

function positionSuccess({ coords }) {
  getWeather(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
/*   getWeather(
    59.97,
    30.3,
    "Europe/Moscow"
  ) */
  .then(renderWeather)
  .catch(e => {
    console.error(e);
    alert('Error getting weather.')
  })
}

function positionError() {
  alert("Location access is required to show the weather. Please allow access and refresh the page.");

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
    // return data
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
    /* const maxTemp = daily.temperature_2m_max[0] */
    temperature_2m_min: [minTemp], 
    apparent_temperature_max: [maxFeelsLike], 
    apparent_temperature_min: [minFeelsLike], 
    precipitation_sum: [precip], 
  } = daily

  return {
    currentTemp: Math.round(currentTemp), /*  */
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp), 
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed), /*  */
    precip: Math.round(precip * 100) / 100,
    iconCode,  /*  */
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

function renderWeather({ current, daily, hourly}) {
  renderCurrentWeather(current);
  renderDailyWeather(daily);
  renderHourlyWeather(hourly);
  document.body.classList.remove('blurred');
}

function setValue(selector, value, { parent = document} = {}) {
  parent.querySelector(`[data-${selector}]`).textContent = value;
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

/* SNOW */

function startSnow() {
  const duration = 60 * 1000,
  animationEnd = Date.now() + duration;
  
  let skew = 1;
  
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  (function frame() {
    const timeLeft = animationEnd - Date.now(),
      ticks = Math.max(200, 500 * (timeLeft / duration));
  
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



/* .then(data => {
  console.log(data)
}) */

/* getWeather(10, 10, Intl.DateTimeFormat().resolvedOptions().timeZone).then(res => res.json())
  .then(data => {
    console.log(data)
}) */

/* Phosphor */
/* https://iconstack.io/ */