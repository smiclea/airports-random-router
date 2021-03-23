import { Button, IconButton, TextField } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { LandHereOptions } from '../../../models/UiConfig'

const Wrapper = styled.div`
  margin-bottom: 48px;
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const CloseButton = styled.div``
const Title = styled.div`
  font-weight: bold;
  font-size: 15px;
`
const Body = styled.div``
const Form = styled.form`
  margin-top: 16px;
`
const Description = styled.div`
  opacity: 0.7;
  font-size: 10px;
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
    width: 300px;
  }
`
const Message = styled.div`
  margin-top: 8px;
`

type Props = {
  onSave: (options: LandHereOptions) => void
  onRequestClose: () => void
  landHereOptions: LandHereOptions
}

const LandHereOptionsForm = ({ onRequestClose, onSave, landHereOptions }: Props) => {
  const [cruisingAlt, setCruisingAlt] = useState(26000)
  const [waypoints, setWaypoints] = useState('8, 5')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setCruisingAlt(landHereOptions.cruisingAlt)
    setWaypoints(landHereOptions.waypoints.join(', '))
  }, [landHereOptions])

  const areWaypointsValid = () => {
    const waypointsArr = waypoints.split(',')
    for (let i = 0; i < waypointsArr.length; i += 1) {
      if (waypointsArr[i].trim() === '' || Number.isNaN(Number(waypointsArr[i])) || Number(waypointsArr[i]) < 0) {
        return false
      }
    }
    return true
  }

  let savedTimeout = 0

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!areWaypointsValid()) {
      return
    }
    onSave({ cruisingAlt, waypoints: waypoints.split(',').map(w => Number(w)) })
    setMessage('Saved!')
    clearTimeout(savedTimeout)
    savedTimeout = setTimeout(() => {
      setMessage('')
    }, 2000)
  }

  return (
    <Wrapper>
      <Header>
        <Title>&quot;Land Here&quot; Options</Title>
        <CloseButton>
          <IconButton onClick={onRequestClose}>
            <Close />
          </IconButton>
        </CloseButton>
      </Header>
      <Body>
        <Description>
          Click &quot;Land Here&quot; on a runway on the map to generate a flight plan containing a TOD and waypoints with a 3° descend angle
          between all of them.
          <br /><br />
          Waypoints are defined as the distance from the chosen runway.
          <br /><br />
          The name of the waypoints are automatically labeled as the altitude needed for a 3° descend path to the runway.
          The first waypoint is always the TOD.
          <br /><br />
          If the cruising altitude can&apos;t be reach for a TOD with a 3° descend angle, an 8000ft fallback altitude is used if possible,
          otherwise the altitude of the first waypoint is the cruising altitude.
        </Description>
        <Form onSubmit={handleSubmit}>
          <FieldRow>
            <FieldInputWrapper>
              <TextField
                label="Crusing Altitude (feet)"
                fullWidth
                type="number"
                value={cruisingAlt}
                onChange={e => { setCruisingAlt(Number(e.currentTarget.value)) }}
              />
            </FieldInputWrapper>
          </FieldRow>
          <FieldRow>
            <FieldInputWrapper>
              <TextField
                label="Waypoints (NM from runway)"
                fullWidth
                value={waypoints}
                onChange={e => { setWaypoints(e.currentTarget.value) }}
                helperText="Comma separated, numerical values"
              />
            </FieldInputWrapper>
          </FieldRow>
          <FieldRow>
            <FieldInputWrapper>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                disabled={!areWaypointsValid()}
              >Save
              </Button>
              {message ? <Message>{message}</Message> : null}
            </FieldInputWrapper>
          </FieldRow>
        </Form>
      </Body>
    </Wrapper>
  )
}

export default LandHereOptionsForm
