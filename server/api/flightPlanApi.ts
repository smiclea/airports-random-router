import { Router } from 'express'
import turfBearing from '@turf/bearing'
import turfDestination from '@turf/destination'
import fs from 'fs'
import path from 'path'
import Mustache from 'mustache'

import db from './db'
import handleError from './helpers/handleError'

const flightPlanApi = (router: Router) => {
  router.route('/flight-plan')
    .post(async (req, res) => {
      try {
        const {
          departureAirportIdent,
          destinationRunwayId,
          destinationRunwayType,
        } = req.body
        if (destinationRunwayType !== 'primary' && destinationRunwayType !== 'secondary') {
          res.status(500).json({ error: `Runway end must be either 'primary' or 'secondary', not '${destinationRunwayType}'.` })
          return
        }
        const [runway, departureAirport] = await Promise.all([
          db.getRunway(Number(destinationRunwayId)),
          db.getAirportByIdent(String(departureAirportIdent)),
        ])
        if (!runway) {
          res.status(404).json({ error: `Runway with id '${destinationRunwayId}' not found` })
          return
        }
        if (!departureAirport) {
          res.status(404).json({ error: `Airport with ident '${departureAirportIdent}' not found` })
          return
        }
        const destinationAirport = await db.getAirportById(runway.airport_id)
        if (!destinationAirport) {
          res.status(404).json({ error: 'Airport not found for destination runway' })
          return
        }

        const bearingPoints = [[runway.primary_lonx, runway.primary_laty]]
        if (destinationRunwayType === 'primary') {
          bearingPoints.unshift([runway.secondary_lonx, runway.secondary_laty])
        } else {
          bearingPoints.push([runway.secondary_lonx, runway.secondary_laty])
        }
        const bearing = turfBearing(bearingPoints[0], bearingPoints[1])
        let origin = [runway.primary_lonx, runway.primary_laty]
        if (destinationRunwayType === 'secondary') {
          origin = [runway.secondary_lonx, runway.secondary_laty]
        }
        const approachDistancesNM = [10, 5, 0]
        const approachPoints: number[][] = []
        approachDistancesNM.forEach(distanceToRunway => {
          const targetAltitude = distanceToRunway * 300 + runway.altitude
          approachPoints.push([
            ...turfDestination(origin, distanceToRunway * 1.852, bearing).geometry.coordinates,
            targetAltitude,
          ])
        })
        const finalApproachPoint = destinationRunwayType === 'primary' ? [runway.secondary_lonx, runway.secondary_laty]
          : [runway.primary_lonx, runway.primary_laty]
        approachPoints.push([
          ...finalApproachPoint,
          runway.altitude,
        ])

        const convertDecimalToDegrees = (x: number, y: number) => {
          const toDegreesMinutesAndSeconds = (coordinate: number) => {
            const absolute = Math.abs(coordinate)
            const degrees = Math.floor(absolute)
            const minutesNotTruncated = (absolute - degrees) * 60
            const minutes = Math.floor(minutesNotTruncated)
            const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2)

            return `${degrees}° ${minutes}' ${seconds}"`
          }

          const latitude = toDegreesMinutesAndSeconds(y)
          const latitudeCardinal = y >= 0 ? 'N' : 'S'

          const longitude = toDegreesMinutesAndSeconds(x)
          const longitudeCardinal = x >= 0 ? 'E' : 'W'

          return `${latitudeCardinal}${latitude},${longitudeCardinal}${longitude}`
        }

        const convertToAltitude = (altitude: number) => `+${altitude.toFixed(2).padStart(8, '0')}`

        const template = fs.readFileSync(path.join(__dirname, 'helpers', 'flightPlanTemplate.pln'), 'utf-8')
        const flightPlan = Mustache.render(template, {
          departureIdent: departureAirport.ident,
          destinationIdent: destinationAirport.ident,
          waypoints: approachPoints.map(point => ({
            name: `${Math.round(point[2] / 100) * 100}ft`,
            coordinates: convertDecimalToDegrees(point[0], point[1]),
            altitude: convertToAltitude(point[2]),
          })),
        })
        res.send(flightPlan)
      } catch (err) {
        handleError('Flight Plan API error', err, res)
      }
    })
}

export default flightPlanApi
