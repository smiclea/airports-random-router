import turfDistance from '@turf/distance'
import turfBearing from '@turf/bearing'
import { AirportDb, RouteItem } from '../../../models/Airport'
import db from '../db'

export default async (config: {
  fromAirport: AirportDb
  toAirport: AirportDb
  minDistance: number,
  maxDistance: number,
  runwayMinLength: number,
  angle: number,
}) => {
  const currentRoute: RouteItem[] = []

  const airportToRouteItem = async (airport: AirportDb) => {
    const country = await db.getCountryByCoords(airport.geometry.coordinates)
    const routeItem: RouteItem = {
      ...airport,
      countryCode: country?.ISO_A2 || country?.ADMIN || null,
      countryName: country?.ADMIN || 'Unknown',
    }

    return routeItem
  }

  const findRoute = async (foundRoute: AirportDb) => {
    currentRoute.push(await airportToRouteItem(foundRoute))
    const distanceToEnd = turfDistance(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates) * 0.539957
    if (distanceToEnd <= config.maxDistance || currentRoute.length === 9) {
      currentRoute.push(await airportToRouteItem(config.toAirport))
      return
    }

    let searchAroundAirports = await db.searchAround(
      foundRoute,
      config.minDistance * 1852,
      config.maxDistance * 1852,
      config.runwayMinLength,
    )
    const foundRouteBearing = turfBearing(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates)
    const minBearing = foundRouteBearing - config.angle
    const maxBearing = foundRouteBearing + config.angle
    searchAroundAirports = searchAroundAirports.filter(saa => {
      const saaBearing = turfBearing(foundRoute.geometry.coordinates, saa.geometry.coordinates)
      return saaBearing >= minBearing && saaBearing <= maxBearing
    })

    if (!searchAroundAirports.length) {
      currentRoute.push(await airportToRouteItem(config.toAirport))
      return
    }
    const randomAirport = searchAroundAirports[Math.floor(Math.random() * searchAroundAirports.length)]
    await findRoute(randomAirport)
  }
  await findRoute(config.fromAirport)
  return currentRoute
}
