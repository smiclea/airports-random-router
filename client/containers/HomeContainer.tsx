import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import useStores from '../stores/useStores'
import Map from '../modules/Map/Map'
import RouteConfigForm from '../modules/RouteConfigForm/RouteConfigForm'
import { GenerateRouteRequestBody } from '../../models/Airport'
import EditModal from '../modules/EditModal/EditModal'

const Wrapper = styled.div`
  padding: 32px;
  height: 100%;
  display: flex;
`
const Column = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
`
const Message = styled.div<{ isError?: boolean }>`
  overflow: auto;
  max-width: 176px;
  ${props => (props.isError ? css`color: #f50057;` : '')}
`
const HomeContainer = () => {
  const { airportStore } = useStores()
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    airportStore.loadRouteConfig()
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
  }

  const handleRequestFlightPlan = (departureIdent: string, destinationIdent: string, runwayId: number, runwayType: 'primary' | 'secondary') => {
    airportStore.generateFlightPlan(departureIdent, destinationIdent, runwayId, runwayType)
  }

  const handleEditClick = () => {
    setShowEditModal(true)
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
    setShowEditModal(false)
  }

  return (
    <Wrapper>
      <Column style={{ width: '260px' }}>
        <RouteConfigForm
          config={airportStore.routeConfig}
          onGenerateClick={handleGenerateRoute}
          onEditClick={handleEditClick}
        />
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
      {showEditModal ? (
        <EditModal
          codes={airportStore.routeItems.map(airport => airport.ident).join('\n')}
          onRequestClose={() => { setShowEditModal(false) }}
          onSubmit={newCodes => { handleEditSubmit(newCodes) }}
        />
      ) : null}
    </Wrapper>
  )
}

export default observer(HomeContainer)
