import './style.css'

type City = {
  latitude: string;
  longitude: string;
  city: string;
  country: string;
}

type WeatherData = {
  date: number,
  temp2m: {
    max: number,
    min: number
  }
  weather: string,
  wind10m_max: number
}

type Unit = 'fahrenheit' | 'celsius'

const weatherTypes: Map<string, string> = new Map([
  ['clear', 'Clear' ],
  ['cloudy', 'Cloudy' ],
  ['fog', 'Fog'],
  ['humid', 'Humid' ],
  ['ishower', 'Isolated shower' ],
  ['lightrain', 'Light rain'],
  ['lightsnow', 'Light snow' ],
  ['mcloudy', 'Mostly cloudy' ],
  ['oshower', 'Occasional showers	'],
  ['pcloudy', 'Partly cloudy' ],
  ['rain', 'Rain'],
  ['rainsnow', 'Mixed' ],
  ['snow', 'Snow'],
  ['tsrain', 'Thunderstorm'],
  ['tstorm', 'Thunderstorm possible'],
  ['windy', 'Windy'],
]);

let dataseries: WeatherData[];
let unit: Unit = 'celsius'

const cardsEl = document.querySelector<HTMLDivElement>('#cards')!
const spinner = document.querySelector<HTMLDivElement>('.lds-spinner')!
const toggleUnitEl = document.querySelector("#toggle-unit")!

// #region populate cities in options
const populateCities = () => {
  return fetch("/city_coordinates.csv")
    .then(response => response.text())
    .then(csvData => {
      let cities: Map<number, City> = new Map()
      const rows = csvData.split('\n').entries()
      rows.next(); // Skip first row
      while (true) {
        const next = rows.next()
        if (next.done) break
        const [key, value] = next.value
        const row = value.split(',')
        const city: City = {
          latitude: row[0],
          longitude: row[1],
          city: row[2],
          country: row[3]
        }
        cities.set(key, city)
      }
      return cities
    })
}
const cities = await populateCities();
const citySelect = document.querySelector<HTMLDivElement>('#city-select select')!
for (let [key, value] of cities) {
  const optionEl = document.createElement('option')
  optionEl.value = String(key)
  optionEl.text = value.city + ', ' + value.country
  citySelect.appendChild(optionEl)
}
// #endregion

const fetchWeather = async (longitude: string, latitude: string) => {
  const url = `https://www.7timer.info/bin/civillight.php?lon=${longitude}&lat=${latitude}&ac=0&unit=metric&output=json&tzshift=0"`
  const dataseries = await fetch(url).then(data => data.json()).then(json => {
    return json.dataseries as WeatherData[]
  })
  console.log(dataseries)
  return dataseries
}

citySelect.addEventListener('change', async (event) => {
  const key = parseInt((event.target as HTMLSelectElement).value)
  if (!key) return;
  let city = cities.get(key);
  if (!city) return;
  spinner.style.display = 'block'
  cardsEl.style.display = 'none'
  dataseries = await fetchWeather(city.longitude, city.latitude)
  repopulateCards()
  spinner.style.display = 'none'
  cardsEl.style.display = 'flex'
})

const repopulateCards = () => {
  cardsEl.innerHTML = '';
  if (!dataseries) { return }
  dataseries.forEach(data => {
    let max, min;
    const {  temp2m } = data
    let weather = data.weather;
    let weatherLabel = weatherTypes.get(weather);

    if (unit == 'fahrenheit') {
      max = (temp2m.max * 9 / 5) + 32
      min = (temp2m.min * 9 / 5) + 32
    } else {
      max = temp2m.max
      min = temp2m.min
    }
    const date = formatDate(String(data.date))
    const template = `
    <div class="card">
      <p>${date}</p>
      <div style="overflow:hidden; width:64px;">
        <img src="/images/${weather}.png"/>
      </div>
      <p>${weatherLabel ?? weather}</p>
      <p>High: ${max} ${units[unit].symbol}</p>
      <p>Low: ${min} ${units[unit].symbol}</p>
    </div>`
    const cardEl = document.createElement('div')
    cardEl.innerHTML = template
    cardsEl.appendChild(cardEl)
  })
}

const formatDate = (inputDateString: string) => {
  // Parse the input string into a Date object
  const date = new Date(
    parseInt(inputDateString.substring(0, 4)), // Year
    parseInt(inputDateString.substring(4, 6), 10) - 1, // Month (zero-based)
    parseInt(inputDateString.substring(6, 8)) // Day
  );
  // Array of month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // Array of day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Get day, month, and year components
  const dayName = dayNames[date.getDay()].substring(0, 3);
  const monthName = monthNames[date.getMonth()].substring(0, 3);
  const year = date.getFullYear();

  // Format the output
  const formattedDate = `${dayName} ${monthName} ${year}`;

  return formattedDate;
}

let units = {
  'fahrenheit': {
    label: 'Fahrenheit',
    symbol: 'ºF'
  },
  'celsius': {
    label: 'Celcius',
    symbol: 'ºC'
  },
}

const toggleUnit = () => {
  if (unit == 'celsius') {
    unit = 'fahrenheit'
  } else {
    unit = 'celsius'
  }
  renderUnit()
  repopulateCards()
}

const renderUnit = () => {
  let first = toggleUnitEl.children[0]
  let last = toggleUnitEl.children[1]
  if (unit == 'celsius') {
    first.textContent = `Using ${units.celsius.label}.`
    last.textContent = `Switch to ${units.fahrenheit.symbol}`
  } else {
    first.textContent = `Using ${units.fahrenheit.label}.`
    last.textContent = `Switch to ${units.celsius.symbol}`
  }
}

toggleUnitEl.innerHTML = `
<span></span>
<span class="toggler"></span>
`
toggleUnitEl.children[1].addEventListener('click', toggleUnit)
renderUnit()
