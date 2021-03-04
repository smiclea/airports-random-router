import turfDistance from '@turf/distance'
import turfBearing from '@turf/bearing'
import { AirportDb } from '../../../models/Airport'
import db from '../db'

const ROUTE_LIMIT = 49

export default async (config: {
  fromAirport: AirportDb
  toAirport: AirportDb
  minDistance: number,
  maxDistance: number,
  runwayMinLength: number,
  angle: number,
}) => {
  const currentRoute: AirportDb[] = []

  const findRoute = async (foundRoute: AirportDb) => {
    currentRoute.push(foundRoute)
    const distanceToEnd = turfDistance(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates) * 0.539957
    if (distanceToEnd <= config.maxDistance || currentRoute.length === ROUTE_LIMIT) {
      currentRoute.push(config.toAirport)
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
      currentRoute.push(config.toAirport)
      return
    }
    const randomAirport = searchAroundAirports[Math.floor(Math.random() * searchAroundAirports.length)]
    await findRoute(randomAirport)
  }
  await findRoute(config.fromAirport)
  return currentRoute
}
