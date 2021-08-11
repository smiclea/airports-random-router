import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import styled, { css } from 'styled-components'
import { Tab, Tabs } from '@material-ui/core'
import useStores from '../stores/useStores'
import Map from '../modules/Map/Map'
import RouteConfigForm from '../modules/RouteConfigForm/RouteConfigForm'
import { ApproachType, GenerateRouteRequestBody } from '../../models/Airport'
import EditForm from '../modules/EditForm/EditForm'
import { GeographicalBounds } from '../../models/Geography'

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

  useEffect(() => {
    airportStore.loadRouteConfig()
    airportStore.loadUiConfig()
  }, [])

  const handleGenerateRoute = async (config: GenerateRouteRequestBody) => {
    airportStore.saveConfig(config)
    await airportStore.generateRoute()
  }

  const handleApproachTypeChange = async (approachType: ApproachType) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, approachType })
  }

  const handleRunwayMinLengthChange = async (runwayMinLength: number) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, runwayMinLength })
  }

  const handleMapLoad = () => {
    airportStore.loadRouteItems()
  }

  const handleMapMoveEnd = (bounds: GeographicalBounds) => {
    airportStore.loadAirports(bounds)
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
    airportStore.saveUiConfig({ ...airportStore.uiConfig, selectedTab: newValue })
  }

  return (
    <Wrapper>
      <Column style={{ width: '260px' }}>
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
            routeConfig={airportStore.routeConfig}
            uiConfig={airportStore.uiConfig}
            onGenerateClick={handleGenerateRoute}
            onApproachTypeChange={handleApproachTypeChange}
            onRunwayMinLengthChange={handleRunwayMinLengthChange}
          />
        ) : (
          <EditForm
            codes={airportStore.routeItems.map(airport => airport.ident).join('\n')}
            onSubmit={newCodes => { handleEditSubmit(newCodes) }}
          />
        )}
      </Column>
      <Column style={{ marginLeft: '32px', flexGrow: 1 }}>
        <Map
          routeItems={airportStore.routeItems}
          airports={airportStore.filteredAirports}
          onLoad={handleMapLoad}
          onMapMoveEnd={handleMapMoveEnd}
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
