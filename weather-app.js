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

  fetch(`https://api.open-meteo.com/v1/forecast?${params}`).then(({ data }) => {
    return {
      current: parseCurrentWeather(data),
    /*   daily: parseDailyWeather(data),
      hourly: parseHourlyWeather(data), */
    }
  })
}

function parseCurrentWeather({ current, daily }) {
  const {
    temperature: currentTemp,
    windspeed: windSpeed,
    weathercode: iconCode
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

getWeather(10, 10, Intl.DateTimeFormat().resolvedOptions().timeZone).then(res => res.json())
  .then(data => {
    console.log(data)
})