import { ApproachType } from './Airport'

export type UiConfig = {
  selectedTab: number
  approachType: ApproachType
  runwayMinLength: number
  showAirports: boolean
  isFormCollapsed: boolean
  includeMilitary: boolean
}
