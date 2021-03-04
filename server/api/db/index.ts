import { MongoClient, Db } from 'mongodb'
import RegExpUtil from '../../../common/utils/RegExpUtil'
import { AirportDb, RunwayDb } from '../../../models/Airport'
import { Country } from '../../../models/Country'
import env from '../../env'

const DB_NAME = RegExpUtil.matches(/.*\/(.*?)(?:\?|$)/g, env.MONGO_URI || '')[0]

class DbManager {
  private client!: MongoClient

  private mongoDb!: Db

  private get airportsCollection() {
    return this.mongoDb.collection<AirportDb>('airports')
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

  async getAirportByIdent(ident: string): Promise<AirportDb | null> {
    return this.airportsCollection.findOne({ ident })
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

  async getCountryByCoords(coordinates: [number, number]): Promise<Country | null> {
    return (await this.mongoDb.collection<any>('countries_geojson').findOne({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates,
          },
        },
      },
    }))?.properties
  }

  async transformAiportsToGeoJson() {
    const airports = await this.airportsCollection.find({ latx: { $exists: true } }).toArray()
    if (airports.length === 0) {
      console.log('No non-geojson airport found')
      return
    }
    // @TODO Load country info and bypass country_geojson collections throughout the app
    const airportsGeoJson: AirportDb[] = airports.map((airport: any) => {
      const { lonx, laty, ...otherAiportProps } = airport
      return {
        ...otherAiportProps,
        geometry: {
          type: 'Point',
          coordinates: [lonx, laty],
        },
      }
    })
    await this.airportsCollection.drop()
    await this.airportsCollection.insertMany(airportsGeoJson)
  }

  async searchAround(airport: AirportDb, minDistance: number, maxDistance: number, minRunwayLength: number) {
    return this.airportsCollection.find({
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
  }
}

export default new DbManager()
