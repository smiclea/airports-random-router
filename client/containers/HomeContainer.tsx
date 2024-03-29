import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import styled, { css } from 'styled-components'
import { IconButton, Tab, Tabs } from '@material-ui/core'
import { Close, Menu } from '@material-ui/icons'
import useStores from '../stores/useStores'
import Map from '../modules/Map/Map'
import RouteConfigForm from '../modules/RouteConfigForm/RouteConfigForm'
import { ApproachType, GenerateRouteRequestBody } from '../../models/Airport'
import EditForm from '../modules/EditForm/EditForm'
import { GeographicalBounds } from '../../models/Geography'

import logoImage from './resources/logo.png'
import useComponentWillMount from '../utils/useComponentWillMount'

const Wrapper = styled.div`
  padding: 0 16px 16px 16px;
  height: 100%;
`
const MenuButtonWrapper = styled.div<{ collapsed: boolean}>`
  position: absolute;
  top: 11px;
  transition: all 250ms ease-in-out;
  left: ${props => (props.collapsed ? 0 : 276)}px;
`
const Header = styled.div`
  font-size: 20px;
  padding: 16px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`
const HeaderAuthor = styled.span`
  font-size: 10px;
  margin-bottom: -7px;
  opacity: 0.4;
`
const MapColumn = styled.div`
  position: relative;
  height: 100%;
  margin-left: 16px;
  flex-grow: 1;
`

const TabsColumn = styled.div<{collapsed: boolean}>`
  display: flex;
  flex-direction: column;
  width: 260px;
  margin-top: -55px;
  height: calc(100% + 55px);
  transition: all 250ms ease-in-out;
  ${props => (props.collapsed ? css`margin-left: -276px;` : '')}
`
const Logo = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
`
const Content = styled.div`
  height: calc(100% - 64px);
  display: flex;
  position: relative;
`
const Message = styled.div<{ isError?: boolean }>`
  overflow: auto;
  max-width: 300px;
  ${props => (props.isError ? css`color: #f50057;` : '')}
  position: absolute;
  top: 10px;
  left: 290px;
  background: #303030;
  border-radius: 4px;
  padding: 8px 16px;
`
const HomeContainer = () => {
  const { airportStore } = useStores()

  useComponentWillMount(() => {
    airportStore.loadUiConfig()
  })

  useEffect(() => {
    airportStore.loadRouteConfig()
  }, [])

  const handleGenerateRoute = async (config: GenerateRouteRequestBody) => {
    airportStore.saveRouteConfig(config)
    await airportStore.generateRoute()
  }

  const handleApproachTypeChange = (approachType: ApproachType) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, approachType })
  }

  const handleRunwayMinLengthChange = (runwayMinLength: number) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, runwayMinLength })
  }

  const handleShowAirportsChange = (showAirports: boolean) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, showAirports })
  }
  const handleIncludeMilitaryChange = (includeMilitary: boolean) => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, includeMilitary })
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

  const toggleFormCollapse = () => {
    airportStore.saveUiConfig({ ...airportStore.uiConfig, isFormCollapsed: !airportStore.uiConfig.isFormCollapsed })
  }

  return (
    <Wrapper>
      <Header>
        <Logo src={logoImage} />
        Airports Random Router&nbsp;<HeaderAuthor>by Sergiu Miclea</HeaderAuthor>
      </Header>
      <MenuButtonWrapper collapsed={airportStore.uiConfig.isFormCollapsed}>
        <IconButton onClick={toggleFormCollapse}>
          {airportStore.uiConfig.isFormCollapsed ? <Menu /> : <Close />}
        </IconButton>
      </MenuButtonWrapper>
      <Content>
        <TabsColumn collapsed={airportStore.uiConfig.isFormCollapsed}>
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
              onShowAirportsChange={handleShowAirportsChange}
              onIncludeMilitaryChange={handleIncludeMilitaryChange}
            />
          ) : (
            <EditForm
              codes={airportStore.routeItems.map(airport => airport.properties.ident).join('\n')}
              onSubmit={newCodes => { handleEditSubmit(newCodes) }}
            />
          )}
        </TabsColumn>
        <MapColumn>
          <Map
            routeItems={airportStore.routeItems}
            airports={airportStore.filteredAirports}
            onLoad={handleMapLoad}
            onMapMoveEnd={handleMapMoveEnd}
            shouldResize={airportStore.uiConfig.isFormCollapsed}
          />
        </MapColumn>
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
      </Content>
    </Wrapper>
  )
}

export default observer(HomeContainer)
