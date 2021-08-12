import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  Button, FormLabel, MenuItem, TextField,
  RadioGroup, FormControlLabel, Radio, Checkbox,
} from '@material-ui/core'
import { ApproachType, GenerateRouteRequestBody } from '../../../models/Airport'
import { getAirportSize } from '../../stores/AirportStore'
import { UiConfig } from '../../../models/UiConfig'

const Wrapper = styled.form`
  overflow: hidden auto;
  position: relative;
`
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
    width: 172px;
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
  routeConfig: GenerateRouteRequestBody
  uiConfig: UiConfig
  onApproachTypeChange: (type: ApproachType) => void
  onRunwayMinLengthChange: (length: number) => void
  onGenerateClick: (config: GenerateRouteRequestBody) => void
  onShowAirportsChange: (show: boolean) => void
}

const RouteConfigForm = ({
  routeConfig,
  uiConfig,
  onApproachTypeChange,
  onRunwayMinLengthChange,
  onShowAirportsChange,
  onGenerateClick,
}: Props) => {
  const [startAirport, setStartAirport] = useState('')
  const [endAirport, setEndAirport] = useState('')
  const [legDistanceMin, setLegDistanceMin] = useState(5)
  const [legDistanceMax, setLegDistanceMax] = useState(50)
  const [bearing, setBearing] = useState(45)

  useEffect(() => {
    setStartAirport(routeConfig.fromAirport)
    setEndAirport(routeConfig.toAirport)
    setLegDistanceMin(routeConfig.minDistance)
    setLegDistanceMax(routeConfig.maxDistance)
    setBearing(routeConfig.angle)
  }, [routeConfig])

  const handleGenerateClick = () => {
    onGenerateClick({
      fromAirport: startAirport,
      toAirport: endAirport,
      maxDistance: legDistanceMax,
      minDistance: legDistanceMin,
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
            select
            label="Runway Length"
            value={uiConfig.runwayMinLength}
            onChange={e => { onRunwayMinLengthChange(Number(e.target.value)) }}
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
          <FormLabel>Approach</FormLabel>
          <RadioGroup
            row
            name="approachType"
            value={uiConfig.approachType}
            onChange={e => {
              onApproachTypeChange(e.target.value as ApproachType)
            }}
          >
            <FormControlLabel
              value="ils"
              control={<Radio />}
              label="Has ILS"
            />
            <FormControlLabel
              value="approach"
              control={<Radio />}
              label="Has approach"
            />
            <FormControlLabel
              value="all"
              control={<Radio />}
              label="Doesn't matter"
            />
          </RadioGroup>
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <FormControlLabel
            control={<Checkbox checked={uiConfig.showAirports} onChange={(_, checked) => { onShowAirportsChange(checked) }} />}
            label="Show all airports"
          />
        </FieldInputWrapper>
      </FieldRow>
      <FieldRow>
        <FieldInputWrapper>
          <TextField
            fullWidth
            label="Start point"
            value={startAirport}
            onChange={e => { setStartAirport(e.currentTarget.value) }}
            helperText="ICAO or airport name"
          />
        </FieldInputWrapper>
        <FieldInputWrapper>
          <TextField
            label="End point"
            fullWidth
            value={endAirport}
            onChange={e => { setEndAirport(e.currentTarget.value) }}
            helperText="ICAO or airport name"
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
