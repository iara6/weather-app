// https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Europe%2FMoscow&timeformat=unixtime

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
  })

  return fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
}

getWeather(10, 10, Intl.DateTimeFormat().resolvedOptions().timeZone).then(res => res.json())
  .then(data => {
    console.log(data)
})