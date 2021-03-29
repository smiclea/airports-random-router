import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { Tab, Tabs } from '@material-ui/core'
import useStores from '../stores/useStores'
import Map from '../modules/Map/Map'
import RouteConfigForm from '../modules/RouteConfigForm/RouteConfigForm'
import { GenerateRouteRequestBody } from '../../models/Airport'
import EditForm from '../modules/EditForm/EditForm'
import LandHereOptionsForm from '../modules/LandHereOptionsForm/LandHereOptionsForm'
import { LandHereOptions } from '../../models/UiConfig'

const Wrapper = styled.div`
  padding: 32px;
  height: 100%;
  display: flex;
  position: relative;
`
const Column = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
`
const Message = styled.div<{ isError?: boolean }>`
  overflow: auto;
  max-width: 300px;
  ${props => (props.isError ? css`color: #f50057;` : '')}
  position: absolute;
  left: 338px;
  background: #303030;
  top: 46px;
  border-radius: 4px;
  padding: 8px 16px;
`
const HomeContainer = () => {
  const { airportStore } = useStores()
  const [showLandHereOptions, setShowLandHereOptions] = useState(false)

  useEffect(() => {
    airportStore.loadRouteConfig()
    airportStore.loadUiConfig()
    airportStore.loadLandHereOptions()
  }, [])

  const handleGenerateRoute = async (config: GenerateRouteRequestBody) => {
    airportStore.saveConfig(config)
    await airportStore.generateRoute()
  }

  const handleMapLoad = () => {
    airportStore.loadRouteItems()
  }

  const handleRequestRunways = (airportIdent: string) => {
    airportStore.loadRunways(airportIdent)
    setShowLandHereOptions(true)
  }

  const handleRequestFlightPlan = async (departureIdent: string, destinationIdent: string, runwayId: number, runwayType: 'primary' | 'secondary') => {
    await airportStore.generateFlightPlan(departureIdent, destinationIdent, runwayId, runwayType)
    setShowLandHereOptions(false)
  }

  const handleEditSubmit = (newCodes: string) => {
    const cleanCodes = newCodes.split('\n').map(str => str.trim()).filter(str => str)
    const uniqueCodes = cleanCodes.reduce((prevValue, currentValue) => {
      if (prevValue.indexOf(currentValue) === -1) {
        prevValue.push(currentValue)
      }
      return prevValue
    },
    [] as string[])
    airportStore.editRoute(uniqueCodes)
  }

  const handleTabChange = (e: React.ChangeEvent<{}>, newValue: number) => {
    airportStore.saveUiConfig({ selectedTab: newValue })
  }

  const handleLandHereOptionsSave = (options: LandHereOptions) => {
    airportStore.saveLandHereOptions(options)
  }

  return (
    <Wrapper>
      <Column style={{ width: '260px' }}>
        {showLandHereOptions ? (
          <LandHereOptionsForm
            onRequestClose={() => { setShowLandHereOptions(false) }}
            onSave={handleLandHereOptionsSave}
            landHereOptions={airportStore.landHereOptions}
          />
        ) : (
          <>
            <Tabs
              value={airportStore.uiConfig.selectedTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab label="Generate" style={{ minWidth: 72 }} />
              <Tab label="Edit" style={{ minWidth: 72 }} />
            </Tabs>
            <div style={{ marginBottom: '32px' }} />
            {airportStore.uiConfig.selectedTab === 0 ? (
              <RouteConfigForm
                config={airportStore.routeConfig}
                onGenerateClick={handleGenerateRoute}
              />
            ) : (
              <EditForm
                codes={airportStore.routeItems.map(airport => airport.ident).join('\n')}
                onSubmit={newCodes => { handleEditSubmit(newCodes) }}
              />
            )}
          </>
        )}
      </Column>
      <Column style={{ marginLeft: '32px', flexGrow: 1 }}>
        <Map
          routeItems={airportStore.routeItems}
          runways={airportStore.runways}
          onLoad={handleMapLoad}
          onRequestRunways={handleRequestRunways}
          onRequestFlightPlan={handleRequestFlightPlan}
        />
      </Column>
      {airportStore.loadingError ? (
        <Message isError>
          {airportStore.loadingError}
        </Message>
      ) : null}
      {airportStore.loading ? (
        <Message>
          Loading ...
        </Message>
      ) : null}
    </Wrapper>
  )
}

export default observer(HomeContainer)
