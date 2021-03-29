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
}

export type GenerateRouteRequestBody = {
  fromAirport: string
  toAirport: string
  minDistance: number,
  maxDistance: number,
  runwayMinLength: number,
  angle: number
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
