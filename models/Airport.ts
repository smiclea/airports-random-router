export type AirportDb = {
  type: 'Feature',
  properties: {
    airport_id: number
    ident: string
    name: string
    city: string | null
    altitude: number
    longest_runway_length: number
    countryCode: string | null
    countryName: string
    approaches: string[] | null
    is_military: 0 | 1
  },
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export type ApproachType = 'ils' | 'approach' | 'all'

export type GenerateRouteRequestBody = {
  fromAirport: string
  toAirport: string
  minDistance: number,
  maxDistance: number,
  angle: number
}
