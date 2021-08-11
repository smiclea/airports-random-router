import { ApproachType } from './Airport'

export type UiConfig = {
  selectedTab: number
  approachType: ApproachType
}

export type LandHereOptions = {
  cruisingAlt: number
  runwayExt: number
}
