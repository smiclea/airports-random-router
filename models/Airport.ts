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
  runwayMinLength: number,
  angle: number
  approachType: ApproachType
}

export type RunwayDb = {
  airport_id: number
  runway_id: number
  length: number
  lonx: number
  laty: number
  altitude: number
  heading: number
  primary_lonx: number
  primary_laty: number
  secondary_lonx: number
  secondary_laty: number
}

export type GenerateFlightPlanRequestBody = {
  departureAirportIdent: string
  destinationRunwayId: number
  destinationRunwayType: 'primary' | 'secondary'
  cruisingAlt: number,
  runwayExt: number
}
