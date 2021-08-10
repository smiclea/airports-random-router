import turfDistance from '@turf/distance'
import turfBearing from '@turf/bearing'
import { AirportDb, ApproachType } from '../../../models/Airport'
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
  approachType: ApproachType
}) => {
  const currentRoute: AirportDb[] = []

  const findRoute = async (foundRoute: AirportDb) => {
    currentRoute.push(foundRoute)
    const distanceToEnd = turfDistance(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates) * 0.539957 // NM
    if (distanceToEnd <= config.maxDistance || currentRoute.length === ROUTE_LIMIT) {
      if (foundRoute.airport_id !== config.toAirport.airport_id) {
        currentRoute.push(config.toAirport)
      }
      return
    }

    const searchAround = async (retryCount?: number): Promise<AirportDb[]> => {
      const actualRetryCount = retryCount || 0
      const actualMaxDistance = (config.maxDistance * 1852) + (50 * 1852 * actualRetryCount) // meters
      if (actualMaxDistance / 1852 >= distanceToEnd) {
        return []
      }

      let searchAroundAirports = await db.searchAround(
        foundRoute,
        config.minDistance * 1852,
        actualMaxDistance,
        config.runwayMinLength,
        config.approachType,
      )
      const foundRouteBearing = turfBearing(foundRoute.geometry.coordinates, config.toAirport.geometry.coordinates)
      const minBearing = foundRouteBearing - config.angle
      const maxBearing = foundRouteBearing + config.angle
      searchAroundAirports = searchAroundAirports.filter(saa => {
        const saaBearing = turfBearing(foundRoute.geometry.coordinates, saa.geometry.coordinates)
        return !currentRoute.find(r => r.airport_id === saa.airport_id) && saaBearing >= minBearing && saaBearing <= maxBearing
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
