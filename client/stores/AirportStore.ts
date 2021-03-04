import { action, observable, runInAction } from 'mobx'
import { AirportDb, GenerateRouteRequestBody, RunwayDb } from '../../models/Airport'
import apiCaller from '../utils/ApiCaller'

export const getAirportSize = (length: number): string => {
  const size = (
    length > 10000 ? 5 : length > 8500 ? 4 : length > 7000 ? 3 : length > 5000 ? 2 : length > 2300 ? 1 : 0
  )
  let bulletString = ''
  for (let j = 0; j < size; j += 1) { bulletString += '•' }

  return bulletString
}
class AirportStore {
  @observable
  routeItems: AirportDb[] = []

  @observable
  runways: RunwayDb[] = []

  @observable
  loading = false

  @observable
  loadingError: string | null = null

  @observable
  routeConfig: GenerateRouteRequestBody = {
    fromAirport: '',
    toAirport: '',
    minDistance: 50,
    maxDistance: 250,
    runwayMinLength: 5001,
    angle: 45,
  }

  @action
  loadRouteConfig() {
    const storage = JSON.parse(localStorage.getItem('route-config') || '{}')
    this.routeConfig = {
      fromAirport: storage.fromAirport || this.routeConfig.fromAirport,
      toAirport: storage.toAirport || this.routeConfig.toAirport,
      minDistance: storage.minDistance || this.routeConfig.minDistance,
      maxDistance: storage.maxDistance || this.routeConfig.maxDistance,
      runwayMinLength: storage.runwayMinLength || this.routeConfig.runwayMinLength,
      angle: storage.angle || this.routeConfig.angle,
    }
  }

  @action
  saveConfig(config: GenerateRouteRequestBody) {
    localStorage.setItem('route-config', JSON.stringify(config))
    this.routeConfig = config
  }

  saveRouteItems() {
    localStorage.setItem('route-items', JSON.stringify(this.routeItems))
  }

  @action
  loadRouteItems() {
    this.routeItems = JSON.parse(localStorage.getItem('route-items') || '[]')
  }

  @action
  async generateRoute() {
    this.loading = true
    this.loadingError = null
    this.runways = []

    try {
      const routeItems: AirportDb[] = await apiCaller.send({
        url: '/api/airports/generate-random-route',
        method: 'POST',
        data: {
          from: this.routeConfig.fromAirport,
          to: this.routeConfig.toAirport,
          minDistance: this.routeConfig.minDistance,
          maxDistance: this.routeConfig.maxDistance,
          runwayMinLength: this.routeConfig.runwayMinLength,
          angle: this.routeConfig.angle,
        },
      })
      runInAction(() => {
        this.routeItems = routeItems
        this.saveRouteItems()
      })
    } catch (err) {
      this.loadingError = `${err.type}: ${err.error.response.data.error}`
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  @action
  async loadRunways(airportIdent: string) {
    this.loading = true
    this.loadingError = null

    try {
      const runways: RunwayDb[] = await apiCaller.send({
        url: `/api/airports/${airportIdent}`,
      })
      runInAction(() => {
        this.runways = runways
      })
    } catch (err) {
      this.loadingError = `${err.type}: ${err.error.response.data.error}`
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  @action
  async generateFlightPlan(
    departureAirportIdent: string,
    destinationAirportIdent: string,
    destinationRunwayId: number,
    destinationRunwayType: 'primary' | 'secondary',
  ) {
    this.loading = true
    this.loadingError = null

    try {
      const flightPlan: string = await apiCaller.send({
        method: 'POST',
        url: '/api/flight-plan',
        data: {
          departureAirportIdent,
          destinationRunwayId,
          destinationRunwayType,
        },
      })
      const element = document.createElement('a')
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(flightPlan)}`)
      element.setAttribute('download', `${departureAirportIdent} - ${destinationAirportIdent}.pln`)

      element.style.display = 'none'
      document.body.appendChild(element)

      element.click()

      document.body.removeChild(element)
    } catch (err) {
      this.loadingError = `${err.type}: ${err.error.response.data.error}`
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  @action
  clearRoute() {
    this.routeItems = []
    this.saveRouteItems()
  }

  @action
  async editRoute(codes: string[]) {
    this.loading = true
    this.loadingError = null

    try {
      const response: {
        foundAirports: AirportDb[],
        notFoundAirports: string[],
      } = await apiCaller.send({
        url: `/api/airports?codes=${codes.join(',')}`,
      })
      runInAction(() => {
        this.runways = []
        this.routeItems = response.foundAirports
        this.saveRouteItems()
        if (response.notFoundAirports.length) {
          this.loadingError = `The following airports couldn't be found: ${response.notFoundAirports.join(', ')}`
        }
      })
    } catch (err) {
      this.loadingError = `${err.type}: ${err.error.response.data.error}`
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }
}

export default new AirportStore()
