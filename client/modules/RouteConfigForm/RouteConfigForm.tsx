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

const LEG_DISTANCES = [
  {
    label: '5-50 NM',
    value: 50,
  },
  {
    label: '50-250 NM',
    value: 250,
  },
  {
    label: '250-500 NM',
    value: 500,
  },
  {
    label: '500-1000 NM',
    value: 1000,
  },
  {
    label: '1000-3000 NM',
    value: 3000,
  },
  {
    label: '3000-5000 NM',
    value: 5000,
  },
]

const AIRPORT_SIZES = [
  {
    label: `> 1000ft ${getAirportSize(10001)}`,
    value: 10001,
  },
  {
    label: `> 8500ft ${getAirportSize(8501)}`,
    value: 8501,
  },
  {
    label: `> 7000ft ${getAirportSize(7001)}`,
    value: 7001,
  },
  {
    label: `> 5000ft ${getAirportSize(5001)}`,
    value: 5001,
  },
  {
    label: `> 2300ft ${getAirportSize(2301)}`,
    value: 2301,
  },
  {
    label: '> 0ft',
    value: 1,
  },
]

const BEARINGS = [
  {
    label: '45deg',
    value: 45,
  },
  {
    label: '75deg',
    value: 75,
  },
  {
    label: '90deg',
    value: 90,
  },
]

type Props = {
  config: GenerateRouteRequestBody
  onGenerateClick: (config: GenerateRouteRequestBody) => void
  onClear: () => void
}

const RouteConfigForm = ({
  config,
  onGenerateClick,
  onClear,
}: Props) => {
  const [startAirport, setStartAirport] = useState('')
  const [endAirport, setEndAirport] = useState('')
  const [legDistance, setLegDistance] = useState(250)
  const [airportSize, setAirportSize] = useState(7001)
  const [bearing, setBearing] = useState(45)

  useEffect(() => {
    setStartAirport(config.fromAirport)
    setEndAirport(config.toAirport)
    setLegDistance(config.maxDistance)
    setAirportSize(config.runwayMinLength)
    setBearing(config.angle)
  }, [config])

  const handleGenerateClick = () => {
    let minDistance = 5
    const legIndex = LEG_DISTANCES.findIndex(l => l.value === legDistance)
    if (legIndex > 0) {
      minDistance = LEG_DISTANCES[legIndex - 1].value
    }

    onGenerateClick({
      fromAirport: startAirport,
      toAirport: endAirport,
      maxDistance: legDistance,
      minDistance,
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
            label="Departure Airport"
            value={startAirport}
            onChange={e => { setStartAirport(e.currentTarget.value) }}
          />
        </FieldInputWrapper>
        <FieldInputWrapper>
          <TextField
            label="Destination Airport"
            fullWidth
            value={endAirport}
            onChange={e => { setEndAirport(e.currentTarget.value) }}
          />
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <TextField
            select
            label="Leg Distance"
            value={legDistance}
            onChange={e => { setLegDistance(Number(e.target.value)) }}
            fullWidth
          >
            {LEG_DISTANCES.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FieldInputWrapper>
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
          <TextField
            select
            label="Max Bearing"
            value={bearing}
            onChange={e => { setBearing(Number(e.target.value)) }}
            fullWidth
          >
            {BEARINGS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FieldInputWrapper>
        <FieldInputWrapper>
          <div />
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <Button
            color="primary"
            variant="contained"
            disabled={!startAirport || !endAirport}
            type="submit"
          >Generate
          </Button>
        </FieldInputWrapper>
        <FieldInputWrapper style={{ textAlign: 'right' }}>
          <Button onClick={onClear}>Clear</Button>
        </FieldInputWrapper>
      </FieldRow>
    </Wrapper>
  )
}

export default RouteConfigForm
