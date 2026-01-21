// https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Europe%2FMoscow&timeformat=unixtime

// https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&current=temperature_2m,wind_speed_10m,weather_code&timezone=Europe%2FMoscow&timeformat=unixtime

// https://my-server.tld/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&current=temperature_2m,wind_speed_10m,weather_code,wind_direction_10m&timezone=Europe%2FMoscow&timeformat=unixtime

/* export function getWeather(lat, lon, timezone) {
  axios.get("https://api.open-meteo.com/v1/forecast")
} */

/* export function getWeather(lat, lon, timezone) {
  fetch(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum` +
    `&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
    `&timezone=${encodeURIComponent(timezone)}` +
    `&timeformat=unixtime`
  )
} */

/* export function getWeather(lat, lon, timezone) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum",
    hourly: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    timezone: timezone,
    timeformat: "unixtime",
  })

  fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
}
 */
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

getWeather(59.97, 30.3, "Europe/Moscow"/* Intl.DateTimeFormat().resolvedOptions().timeZone */)
.then(renderWeather)
.catch(e => {
  console.error(e);
  alert('Error getting weather.')
})

function renderWeather({ current, daily, hourly}) {
  renderCurrentWeather(current);
 /*  renderDailyWeather(daily); */
  /* renderHourlyWeather(hourly); */
  document.body.classList.remove('blurred');
}

function setValue(selector, value, { parent = document} = {}) {
  parent.querySelector(`[data-${selector}]`).textContent = value;
}

function getIconUrl(iconCode) {
  return `icons/${iconCode}.svg`
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

/* .then(data => {
  console.log(data)
}) */

/* getWeather(10, 10, Intl.DateTimeFormat().resolvedOptions().timeZone).then(res => res.json())
  .then(data => {
    console.log(data)
}) */