import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button, MenuItem, TextField } from '@material-ui/core'
import { GenerateRouteRequestBody } from '../../../models/Airport'
import { getAirportSize } from '../../stores/AirportStore'

const Wrapper = styled.form``
const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 48px;
  margin-left: -16px;
  > div {
    margin-left: 16px;
  }
`
const FieldInputWrapper = styled.div`
  width: 100%;
  label {
    width: 160px;
  }
`

const AIRPORT_SIZES = [
  {
    label: `> 10000ft ${getAirportSize(10001)}`,
    value: 10001,
  },
  {
    label: `> 9000ft ${getAirportSize(9001)}`,
    value: 9001,
  },
  {
    label: `> 8000ft ${getAirportSize(8001)}`,
    value: 8001,
  },
  {
    label: `> 7000ft ${getAirportSize(7001)}`,
    value: 7001,
  },
  {
    label: `> 6000ft ${getAirportSize(6001)}`,
    value: 6001,
  },
  {
    label: `> 5000ft ${getAirportSize(5001)}`,
    value: 5001,
  },
  {
    label: `> 4000ft ${getAirportSize(4001)}`,
    value: 4001,
  },
  {
    label: `> 3000ft ${getAirportSize(3001)}`,
    value: 3001,
  },
  {
    label: `> 2000ft ${getAirportSize(2001)}`,
    value: 2001,
  },
  {
    label: `> 1000ft ${getAirportSize(1001)}`,
    value: 1001,
  },
  {
    label: '> 0ft',
    value: 1,
  },
]

type Props = {
  config: GenerateRouteRequestBody
  onGenerateClick: (config: GenerateRouteRequestBody) => void
}

const RouteConfigForm = ({
  config,
  onGenerateClick,
}: Props) => {
  const [startAirport, setStartAirport] = useState('')
  const [endAirport, setEndAirport] = useState('')
  const [legDistanceMin, setLegDistanceMin] = useState(5)
  const [legDistanceMax, setLegDistanceMax] = useState(50)
  const [airportSize, setAirportSize] = useState(1001)
  const [bearing, setBearing] = useState(45)

  useEffect(() => {
    setStartAirport(config.fromAirport)
    setEndAirport(config.toAirport)
    setLegDistanceMin(config.minDistance)
    setLegDistanceMax(config.maxDistance)
    setAirportSize(config.runwayMinLength)
    setBearing(config.angle)
  }, [config])

  const handleGenerateClick = () => {
    onGenerateClick({
      fromAirport: startAirport,
      toAirport: endAirport,
      maxDistance: legDistanceMax,
      minDistance: legDistanceMin,
      runwayMinLength: airportSize,
      angle: bearing,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleGenerateClick()
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <FieldRow>
        <FieldInputWrapper>
          <TextField
            fullWidth
            label="Departure"
            value={startAirport}
            onChange={e => { setStartAirport(e.currentTarget.value) }}
            helperText="ICAO, name or city"
          />
        </FieldInputWrapper>
        <FieldInputWrapper>
          <TextField
            label="Arrival"
            fullWidth
            value={endAirport}
            onChange={e => { setEndAirport(e.currentTarget.value) }}
            helperText="ICAO, name or city"
          />
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <TextField
            fullWidth
            label="Leg Distance Min"
            type="number"
            value={legDistanceMin}
            onChange={e => { setLegDistanceMin(Number(e.currentTarget.value)) }}
          />
        </FieldInputWrapper>
        <FieldInputWrapper>
          <TextField
            label="Leg Distance Max"
            fullWidth
            type="number"
            value={legDistanceMax}
            onChange={e => { setLegDistanceMax(Number(e.currentTarget.value)) }}
          />
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <TextField
            select
            label="Runway Length"
            value={airportSize}
            onChange={e => { setAirportSize(Number(e.target.value)) }}
            fullWidth
          >
            {AIRPORT_SIZES.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <Button
            color="primary"
            variant="contained"
            disabled={!startAirport.trim() || !endAirport.trim()}
            type="submit"
          >Generate
          </Button>
        </FieldInputWrapper>
      </FieldRow>
    </Wrapper>
  )
}

export default RouteConfigForm
