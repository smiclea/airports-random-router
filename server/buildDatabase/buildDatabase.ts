import path from 'path'
import { spawn } from 'child_process'
import fs from 'fs'
import env from '../env'

const AIRPORTS_SQLITE_COMMAND_FILE = 'airports.sqlite_command'
const APPROACHES_SQLITE_COMMAND_FILE = 'approaches.sqlite_command'

const sqliteSpawn = async (commandFileName: string) => new Promise<void>((resolve, reject) => {
  const commandSpawn = spawn(path.join(__dirname, 'sqlite3.exe'),
    [env.SQLITE_DB_PATH, `.read '${path.join(__dirname, commandFileName)}'`])
  commandSpawn.stderr.on('data', data => {
    reject(new Error(`stderr: ${data}`))
  })
  commandSpawn.on('error', error => {
    reject(error)
  })
  commandSpawn.on('close', () => {
    resolve()
  })
})

const mongoSpawn = (collection: string) => new Promise<void>((resolve, reject) => {
  const commandSpawn = spawn(path.join(__dirname, 'mongoimport.exe'), [
    '--uri', env.MONGO_URI, '--collection', collection, '--type', 'csv', '--headerline', '--file', path.join(__dirname, `${collection}.csv`)])
  commandSpawn.stderr.on('data', data => {
    process.stdout.write(data)
  })
  commandSpawn.on('error', error => {
    reject(error)
  })
  commandSpawn.on('close', () => {
    resolve()
  })
})

export default async () => {
  console.log('Building airports.csv...')
  await sqliteSpawn(AIRPORTS_SQLITE_COMMAND_FILE)

  console.log('Building approaches.csv...')
  await sqliteSpawn(APPROACHES_SQLITE_COMMAND_FILE)

  console.log('Importing airports into MongoDB...')
  await mongoSpawn('airports')

  console.log('Importing approaches into MongoDB...')
  await mongoSpawn('approaches')

  fs.unlinkSync(path.join(__dirname, 'airports.csv'))
  fs.unlinkSync(path.join(__dirname, 'approaches.csv'))
}
