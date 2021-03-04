import express, { Express } from 'express'
import path from 'path'

import airportApi from './api/airportApi'
import flightPlanApi from './api/flightPlanApi'

export default (app: Express) => {
  const router = express.Router()

  router.get('/version', (_, res) => {
    res.send({ version: '2021.01.11' })
  })

  airportApi(router)
  flightPlanApi(router)

  app.use('/api', router)

  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'))
  })
}
