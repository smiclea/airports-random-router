import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import cookieParser from 'cookie-parser'

import router from './router'
import env from './env'
import db from './api/db'

export default async () => {
  const app = express()

  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(express.static(path.join(__dirname, '../dist')))

  router(app)

  console.log('Starting ...')
  await db.connect()

  app.listen(env.PORT, () => {
    console.log('Node API listening', `http://localhost:${env.PORT}`)
  })
}
