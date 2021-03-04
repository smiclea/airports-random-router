import turfDistance from '@turf/distance'
import turfBearing from '@turf/bearing'
import { AirportDb } from '../../../models/Airport'
import db from '../db'

const ROUTE_LIMIT = 49
const MAX_SEARCH_AROUND_RETRIES = 60

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
      if (foundRoute.airport_id !== config.toAirport.airport_id) {
        currentRoute.push(config.toAirport)
      }
      return
    }

    const searchAround = async (retryCount?: number): Promise<AirportDb[]> => {
      const actualRetryCount = retryCount || 0
      let actualMaxDistance = (config.maxDistance * 1852)
      let actualAngle = config.angle
      if (actualRetryCount) {
        actualMaxDistance += 50 * 1852 * actualRetryCount
        actualAngle = Math.max(75, config.angle)
        console.log(`Increasing search around distance to: ${(actualMaxDistance / 1852).toFixed(0)}NM`)
      }
      let searchAroundAirports = await db.searchAround(
        foundRoute,
        config.minDistance * 1852,
        actualMaxDistance,
        config.runwayMinLength,
      )
      const foundRouteBearing = turfBearing(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates)
      const minBearing = foundRouteBearing - actualAngle
      const maxBearing = foundRouteBearing + actualAngle
      searchAroundAirports = searchAroundAirports.filter(saa => {
        const saaBearing = turfBearing(foundRoute.geometry.coordinates, saa.geometry.coordinates)
        return saaBearing >= minBearing && saaBearing <= maxBearing
      })
      if (!searchAroundAirports.length && actualRetryCount < MAX_SEARCH_AROUND_RETRIES) {
        return searchAround(actualRetryCount + 1)
      }
      return searchAroundAirports
    }

    const searchAroundAirports = await searchAround()
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
