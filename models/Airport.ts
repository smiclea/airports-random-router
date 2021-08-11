export type AirportDb = {
  airport_id: number
  ident: string
  name: string
  city: string | null
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  altitude: number
  longest_runway_length: number
  countryCode: string | null
  countryName: string
  approaches: string[] | null
}

export type ApproachDb = {
  airport_id: number
  type: string
}

export type ApproachType = 'ils' | 'approach' | 'all'

export type GenerateRouteRequestBody = {
  fromAirport: string
  toAirport: string
  minDistance: number,
  maxDistance: number,
  angle: number
}
