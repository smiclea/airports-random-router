import { MongoClient, Db } from 'mongodb'
import pointInPolygon from '@turf/boolean-point-in-polygon'
import RegExpUtil from '../../../common/utils/RegExpUtil'
import {
  AirportDb, ApproachType,
} from '../../../models/Airport'
import { Country } from '../../../models/Country'
import env from '../../env'
import { GeographicalBounds } from '../../../models/Geography'

const DB_NAME = RegExpUtil.matches(/.*\/(.*?)(?:\?|$)/g, env.MONGO_URI || '')[0]

class DbManager {
  private client!: MongoClient

  private mongoDb!: Db

  private get airportsCollection() {
    return this.mongoDb.collection<AirportDb>('airports_geojson')
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
    return this.airportsCollection.findOne({ 'properties.ident': ident })
  }

  async getAirportsByBounds(bounds: GeographicalBounds): Promise<AirportDb[]> {
    return this.airportsCollection.find({
      geometry: {
        $geoWithin: {
          $box: [bounds.sw, bounds.ne],
        },
      },
    }).toArray()
  }

  async getAirportsByText(text: string) {
    return this.airportsCollection.find({ $text: { $search: `"${text}"` } }).sort({ 'properties.longest_runway_length': -1 }).toArray()
  }

  async getAirportById(id: number): Promise<AirportDb | null> {
    return this.airportsCollection.findOne({ 'properties.airport_id': id })
  }

  async transformAiportsToGeoJson() {
    console.log('Loading airports, countries and approaches collection...')
    const [airportsRaw, countriesGeojson, approachesRaw] = await Promise.all([
      this.mongoDb.collection('airports').find({}).toArray(),
      this.mongoDb.collection('countries_geojson').find({}).toArray(),
      this.mongoDb.collection('approaches').find({}).toArray(),
    ])

    console.log('Building approaches associative array...')
    const approachesAssoc: {[aiportId: number]: string[]} = {}
    approachesRaw.forEach(app => {
      if (approachesAssoc[app.airport_id]) {
        approachesAssoc[app.airport_id].push(app.type)
      } else {
        approachesAssoc[app.airport_id] = [app.type]
      }
    })

    console.log('Starting transformation...')
    const CHECK_PROGESS_EVERY = 5 * 1000
    let lastCheck = new Date().getTime()
    const airportsGeoJson: AirportDb[] = airportsRaw.map((airportSimple, index) => {
      const { lonx, laty, ...otherAirportProps } = airportSimple
      let country: Country | null = null
      for (let i = 0; i < countriesGeojson.length; i += 1) {
        if (pointInPolygon([lonx, laty], countriesGeojson[i].geometry)) {
          country = countriesGeojson[i].properties
          break
        }
      }
      if (new Date().getTime() - lastCheck >= CHECK_PROGESS_EVERY) {
        process.stdout.write(`\rProgress: ${((index / airportsRaw.length) * 100).toFixed(2)}% (${index} / ${airportsRaw.length})`)
        lastCheck = new Date().getTime()
      }

      return {
        type: 'Feature',
        properties: {
          ...otherAirportProps,
          countryCode: country?.ISO_A2 || country?.ADMIN || null,
          countryName: country?.ADMIN || 'Unknown',
          approaches: approachesAssoc[airportSimple.airport_id],
        },
        geometry: { type: 'Point', coordinates: [lonx, laty] },
      }
    })

    console.log('\nDroping the airports GeoJSON collection...')
    try {
      await this.airportsCollection.drop()
    } catch (err) { console.log(err) }
    console.log('Inserting into the airports GeoJSON collection...')
    await this.airportsCollection.insertMany(airportsGeoJson)
    console.log('Creating the airports GeoJSON indexes...')
    await Promise.all([
      this.airportsCollection.createIndex({ 'properties.ident': 1 }),
      this.airportsCollection.createIndex({ 'properties.airport_id': 1 }),
      this.airportsCollection.createIndex({ 'properties.longest_runway_length': 1 }),
      this.airportsCollection.createIndex({ geometry: '2dsphere' }),
      this.airportsCollection.createIndex({ 'properties.name': 'text', 'properties.city': 'text' }),
    ])

    console.log('Dropping raw airports and approaches collections...')
    try {
      await Promise.all([
        this.mongoDb.collection('approaches').drop(),
        this.mongoDb.collection('airports').drop(),
      ])
    } catch (err) { console.log(err) }
  }

  async searchAround(
    airport: AirportDb,
    minDistance: number, maxDistance: number,
    minRunwayLength: number,
    approachType: ApproachType,
    includeMilitary: boolean,
  ) {
    const includeMilitaryQuery = includeMilitary ? {} : { 'properties.is_military': 0 }
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
          'properties.airport_id': { $ne: airport.properties.airport_id },
        },
        {
          'properties.longest_runway_length': { $gte: minRunwayLength },
        },
        includeMilitaryQuery,
      ],
    }).toArray()

    return airports.filter(air => {
      if (approachType === 'ils') {
        return air.properties.approaches?.find(app => app === 'ILS')
      }
      if (approachType === 'approach') {
        return air.properties.approaches?.length
      }
      return true
    })
  }
}

export default new DbManager()
