import { Button, IconButton, TextField } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
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
const DescriptionMain = styled.div``
const DescriptionMore = styled.div<{show: boolean}>`
  margin-top: 16px;
  height: 0;
  overflow: hidden;
  transition: all 500ms ease;
  ${props => (props.show ? css`
    height: 196px;
  ` : '')}
`
const DescriptionViewMore = styled.span`
  text-decoration: underline;
  cursor: pointer;
`

type Props = {
  onSave: (options: LandHereOptions) => void
  onRequestClose: () => void
  landHereOptions: LandHereOptions
}

const LandHereOptionsForm = ({ onRequestClose, onSave, landHereOptions }: Props) => {
  const [cruisingAlt, setCruisingAlt] = useState(26000)
  const [runwayExt, setRunwayExt] = useState(5)
  const [message, setMessage] = useState('')
  const [showDescriptionMore, setShowDescriptionMore] = useState(false)

  useEffect(() => {
    setCruisingAlt(landHereOptions.cruisingAlt)
    setRunwayExt(landHereOptions.runwayExt)
  }, [landHereOptions])

  let savedTimeout = 0

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({ cruisingAlt, runwayExt })
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
          <DescriptionMain>
            Click &quot;Land Here&quot; on a runway on the map to generate a flight plan containing a TOD and
            a runway extension with a 3° descend angle.&nbsp;
            <DescriptionViewMore
              onClick={() => { setShowDescriptionMore(!showDescriptionMore) }}
            >Details {showDescriptionMore ? 'Hide' : ''}
            </DescriptionViewMore>
          </DescriptionMain>
          <DescriptionMore show={showDescriptionMore}>
            There will be 4 waypoints generated in the flight plan: <br />
            1. Top of Descend (named &quot;Dxxxft&quot;, xxx is the runway extension altitude). <br />
            2. Runway extension (named &quot;xxxft&quot;, xxx is the runway extension altitude). <br />
            3. Runway start (named &quot;xxxft&quot;, xxx is the runway altitude). <br />
            4. Runway end (named &quot;xxxft&quot;, xxx is the runway altitude).
            <br /><br />
            If the cruising altitude can&apos;t be reach for a TOD with a 3° descend angle, an 10000ft fallback altitude is used if possible,
            otherwise the altitude of the first waypoint is the cruising altitude and no TOD is calculated.
          </DescriptionMore>
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
                label="Runway extension (NM from runway)"
                fullWidth
                type="number"
                value={runwayExt}
                onChange={e => { setRunwayExt(Number(e.currentTarget.value)) }}
              />
            </FieldInputWrapper>
          </FieldRow>
          <FieldRow>
            <FieldInputWrapper>
              <Button
                color="primary"
                variant="contained"
                type="submit"
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
