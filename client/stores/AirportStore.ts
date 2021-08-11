import axios, { CancelTokenSource } from 'axios'
import {
  action, computed, observable, runInAction,
} from 'mobx'
import {
  AirportDb, GenerateFlightPlanRequestBody, GenerateRouteRequestBody, RunwayDb,
} from '../../models/Airport'
import { GeographicalBounds } from '../../models/Geography'
import { LandHereOptions, UiConfig } from '../../models/UiConfig'
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
    runwayMinLength: 1001,
    angle: 45,
  }

  @observable
  uiConfig: UiConfig = {
    selectedTab: 0,
    approachType: 'all',
  }

  @observable
  landHereOptions: LandHereOptions = {
    cruisingAlt: 26000,
    runwayExt: 5,
  }

  @computed
  get filteredAirports() {
    return this.allAirports.filter(a => {
      if (this.uiConfig.approachType === 'ils') {
        return a.approaches ? a.approaches.indexOf('ILS') > -1 : false
      }
      if (this.uiConfig.approachType === 'approach') {
        return a.approaches?.length
      }
      return true
    })
  }

  @observable
  allAirports: AirportDb[] = []

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

  @action
  loadUiConfig() {
    const storage = JSON.parse(localStorage.getItem('ui-config') || '{}')
    this.uiConfig = {
      selectedTab: storage.selectedTab || this.uiConfig.selectedTab,
      approachType: storage.approachType || this.uiConfig.approachType,
    }
  }

  @action
  saveUiConfig(config: UiConfig) {
    localStorage.setItem('ui-config', JSON.stringify(config))
    this.uiConfig = config
  }

  @action
  loadLandHereOptions() {
    const storage = JSON.parse(localStorage.getItem('land-here-options') || JSON.stringify(this.landHereOptions))
    this.landHereOptions = storage
  }

  @action
  saveLandHereOptions(options: LandHereOptions) {
    localStorage.setItem('land-here-options', JSON.stringify(options))
    this.landHereOptions = options
  }

  saveRouteItems() {
    localStorage.setItem('route-items', JSON.stringify(this.routeItems))
  }

  @action
  loadRouteItems() {
    this.routeItems = JSON.parse(localStorage.getItem('route-items') || '[]')
  }

  airportsCancelable: CancelTokenSource | null = null

  @action
  async loadAirports(bounds: GeographicalBounds) {
    if (this.airportsCancelable) {
      this.airportsCancelable.cancel()
      this.airportsCancelable = null
    }
    const cancelTokenSource = axios.CancelToken.source()
    this.airportsCancelable = cancelTokenSource
    try {
      const airports: AirportDb[] = await apiCaller.send({
        url: '/api/airports/bounds',
        method: 'POST',
        cancelToken: cancelTokenSource.token,
        data: bounds,
      })
      runInAction(() => {
        this.allAirports = airports
      })
    } catch (err) {
      this.loadingError = `${err.type}: ${err.error.response.data.error}`
    }
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
          from: this.routeConfig.fromAirport.trim(),
          to: this.routeConfig.toAirport.trim(),
          minDistance: this.routeConfig.minDistance,
          maxDistance: this.routeConfig.maxDistance,
          runwayMinLength: this.routeConfig.runwayMinLength,
          angle: this.routeConfig.angle,
          approachType: this.uiConfig.approachType,
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
      const requestBody: GenerateFlightPlanRequestBody = {
        departureAirportIdent,
        destinationRunwayId,
        destinationRunwayType,
        cruisingAlt: this.landHereOptions.cruisingAlt,
        runwayExt: this.landHereOptions.runwayExt,
      }
      const flightPlan: string = await apiCaller.send({
        method: 'POST',
        url: '/api/flight-plan',
        data: requestBody,
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
