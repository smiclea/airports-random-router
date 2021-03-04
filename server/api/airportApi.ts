import { Router } from 'express'
import db from './db'
import handleError from './helpers/handleError'
import findRoute from './helpers/findRoute'

const airportApi = (router: Router) => {
  router.route('/airports/generate-random-route')
    .post(async (req, res) => {
      const {
        from, to, minDistance, maxDistance, runwayMinLength, angle,
      } = req.body
      if (!from || !to || !Number(minDistance) || !Number(maxDistance) || !Number(runwayMinLength) || angle === undefined) {
        res.status(500).json({ error: 'Invalid request body!' })
        return
      }
      if (Number(minDistance) < 5) {
        res.status(500).json({ error: '`minDistance` must be larger than 5' })
        return
      }
      if (Number(maxDistance) <= Number(minDistance)) {
        res.status(500).json({ error: '`maxDistance` must be larger than `minDistance`' })
        return
      }

      if (Number(angle) < 0 || Number(angle) > 360) {
        res.status(500).json({ error: '`angle` must be between 0 and 360' })
        return
      }

      const fromAirport = await db.getAirportByIdent(String(from).toUpperCase())
      if (!fromAirport) {
        res.status(500).json({ error: `'${from}' airport not found` })
        return
      }

      const toAirport = await db.getAirportByIdent(String(to).toUpperCase())
      if (!toAirport) {
        res.status(500).json({ error: `'${to}' airport not found` })
        return
      }

      try {
        res.json(await findRoute({
          fromAirport,
          toAirport,
          minDistance: Number(minDistance),
          maxDistance: Number(maxDistance),
          runwayMinLength: Number(runwayMinLength),
          angle: Number(angle),
        }))
      } catch (err) {
        handleError('Route Generator error', err, res)
      }
    })

  router.route('/airports/:ident')
    .get(async (req, res) => {
      const { ident } = req.params
      const airport = await db.getAirportByIdent(ident)
      if (!airport) {
        res.status(404).json({ error: `Airport with ident '${ident}' not found` })
        return
      }
      const runways = await db.getRunways(airport.airport_id)
      res.json(runways)
    })
}

export default airportApi
