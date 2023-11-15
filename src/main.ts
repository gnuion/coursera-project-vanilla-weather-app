import './style.css'

type City = {
  latitude: string;
  longitude: string;
  city: string;
  country: string;
}

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
const citySelect = document.querySelector<HTMLDivElement>('#city-select')!
for (let [key, value] of cities) {
  const optionEl = document.createElement('option')
  optionEl.value = String(key)
  optionEl.text = value.city
  citySelect.appendChild(optionEl)
}

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = "hello"
