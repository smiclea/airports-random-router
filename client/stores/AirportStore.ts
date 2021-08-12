import axios, { CancelTokenSource } from 'axios'
import {
  action, computed, observable, runInAction,
} from 'mobx'
import {
  AirportDb, GenerateRouteRequestBody,
} from '../../models/Airport'
import { GeographicalBounds } from '../../models/Geography'
import { UiConfig } from '../../models/UiConfig'
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
  loading = false

  @observable
  loadingError: string | null = null

  @observable
  routeConfig: GenerateRouteRequestBody = {
    fromAirport: '',
    toAirport: '',
    minDistance: 50,
    maxDistance: 250,
    angle: 45,
  }

  @observable
  uiConfig: UiConfig = {
    selectedTab: 0,
    approachType: 'all',
    runwayMinLength: 1001,
    showAirports: true,
  }

  @computed
  get filteredAirports() {
    if (!this.uiConfig.showAirports) {
      return []
    }

    const filterByApproach = (airport: AirportDb) => {
      if (this.uiConfig.approachType === 'ils') {
        return airport.properties.approaches ? airport.properties.approaches.indexOf('ILS') > -1 : false
      }
      if (this.uiConfig.approachType === 'approach') {
        return airport.properties.approaches?.length
      }
      return true
    }

    return this.allAirports.filter(a => {
      if (!filterByApproach(a)) {
        return false
      }
      return a.properties.longest_runway_length >= this.uiConfig.runwayMinLength
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
      runwayMinLength: storage.runwayMinLength || this.uiConfig.runwayMinLength,
      showAirports: storage.showAirports === undefined ? this.uiConfig.showAirports : storage.showAirports,
    }
  }

  @action
  saveUiConfig(config: UiConfig) {
    localStorage.setItem('ui-config', JSON.stringify(config))
    this.uiConfig = config
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

    try {
      const routeItems: AirportDb[] = await apiCaller.send({
        url: '/api/airports/generate-random-route',
        method: 'POST',
        data: {
          from: this.routeConfig.fromAirport.trim(),
          to: this.routeConfig.toAirport.trim(),
          minDistance: this.routeConfig.minDistance,
          maxDistance: this.routeConfig.maxDistance,
          runwayMinLength: this.uiConfig.runwayMinLength,
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
