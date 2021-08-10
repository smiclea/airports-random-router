import { MongoClient, Db } from 'mongodb'
import pointInPolygon from '@turf/boolean-point-in-polygon'
import RegExpUtil from '../../../common/utils/RegExpUtil'
import {
  AirportDb, ApproachDb, ApproachType, RunwayDb,
} from '../../../models/Airport'
import { Country } from '../../../models/Country'
import env from '../../env'

const DB_NAME = RegExpUtil.matches(/.*\/(.*?)(?:\?|$)/g, env.MONGO_URI || '')[0]

class DbManager {
  private client!: MongoClient

  private mongoDb!: Db

  private get airportsCollection() {
    return this.mongoDb.collection<AirportDb>('airports_geojson')
  }

  private get approachesCollection() {
    return this.mongoDb.collection<ApproachDb>('approaches')
  }

  private get runwaysCollection() {
    return this.mongoDb.collection<RunwayDb>('runways')
  }

  async connect() {
    this.client = await MongoClient.connect(env.MONGO_URI, {
      keepAlive: true,
      connectTimeoutMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    this.mongoDb = this.client.db(DB_NAME)
  }

  async disconnect() {
    await this.client.close()
  }

  async getAirportByIdent(ident: string): Promise<AirportDb | null> {
    return this.airportsCollection.findOne({ ident })
  }

  async getAirportsByText(text: string) {
    return this.airportsCollection.find({ $text: { $search: `"${text}"` } }).sort({ longest_runway_length: -1 }).toArray()
  }

  async getAirportById(id: number): Promise<AirportDb | null> {
    return this.airportsCollection.findOne({ airport_id: id })
  }

  async getRunways(airportId: number): Promise<RunwayDb[]> {
    return this.runwaysCollection.find({ airport_id: airportId }).toArray()
  }

  async getRunway(id: number): Promise<RunwayDb | null> {
    return this.runwaysCollection.findOne({ runway_id: id })
  }

  async transformAiportsToGeoJson() {
    console.log('Loading airports, countries and approaches collection...')
    const [airportsSimple, countriesGeojson, approaches] = await Promise.all([
      this.mongoDb.collection('airports').find({}).toArray(),
      this.mongoDb.collection<any>('countries_geojson').find({}).toArray(),
      this.mongoDb.collection<ApproachDb>('approaches').find({}).toArray(),
    ])

    const approachesAssoc: {[aiportId: number]: string[]} = {}
    approaches.forEach(app => {
      if (approachesAssoc[app.airport_id]) {
        approachesAssoc[app.airport_id].push(app.type)
      } else {
        approachesAssoc[app.airport_id] = [app.type]
      }
    })

    const CHECK_PROGESS_EVERY = 5 * 1000
    let lastCheck = new Date().getTime()
    const airportsGeoJson: AirportDb[] = airportsSimple.map((airportSimple, index) => {
      const { lonx, laty, ...otherAirportProps } = airportSimple
      let country: Country | null = null
      for (let i = 0; i < countriesGeojson.length; i += 1) {
        if (pointInPolygon([lonx, laty], countriesGeojson[i].geometry)) {
          country = countriesGeojson[i].properties
          break
        }
      }
      if (new Date().getTime() - lastCheck >= CHECK_PROGESS_EVERY) {
        process.stdout.write(`\rProgress: ${((index / airportsSimple.length) * 100).toFixed(2)}% (${index} / ${airportsSimple.length})`)
        lastCheck = new Date().getTime()
      }

      return {
        ...otherAirportProps,
        geometry: {
          type: 'Point',
          coordinates: [lonx, laty],
        },
        countryCode: country?.ISO_A2 || country?.ADMIN || null,
        countryName: country?.ADMIN || 'Unknown',
        approaches: approachesAssoc[airportSimple.airport_id],
      }
    })

    console.log('\nDroping airports GeoJSON collection...')
    await this.airportsCollection.drop()
    console.log('Inserting the airports GeoJSON...')
    await this.airportsCollection.insertMany(airportsGeoJson)
    console.log('Creating airports GeoJSON indexes...')
    await Promise.all([
      this.airportsCollection.createIndex({ ident: 1 }),
      this.airportsCollection.createIndex({ airport_id: 1 }),
      this.airportsCollection.createIndex({ longest_runway_length: 1 }),
      this.airportsCollection.createIndex({ geometry: '2dsphere' }),
      this.airportsCollection.createIndex({ name: 'text', city: 'text' }),
    ])
  }

  async searchAround(
    airport: AirportDb,
    minDistance: number, maxDistance: number,
    minRunwayLength: number,
    approachType: ApproachType,
  ) {
    const airports = await this.airportsCollection.find({
      $and: [
        {
          geometry: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: airport.geometry.coordinates,
              },
              $maxDistance: maxDistance,
              $minDistance: minDistance,
            },
          },
        },
        {
          airport_id: { $ne: airport.airport_id },
        },
        {
          longest_runway_length: { $gte: minRunwayLength },
        },
      ],
    }).toArray()

    return airports.filter(air => {
      if (approachType === 'ils') {
        return air.approaches?.find(app => app === 'ILS')
      }
      if (approachType === 'approach') {
        return air.approaches?.length
      }
      return true
    })
  }
}

export default new DbManager()
