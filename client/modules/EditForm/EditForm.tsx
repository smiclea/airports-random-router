import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  Button,
  TextField,
} from '@material-ui/core'

const Wrapper = styled.div`
  margin-bottom: 48px;
`

type Props = {
  codes: string
  onSubmit: (value: string) => void
}

const EditForm = ({ codes, onSubmit }: Props) => {
  const [currentCodes, setCurrentCodes] = useState('')

  useEffect(() => {
    setCurrentCodes(codes)
  }, [codes])

  return (
    <Wrapper>
      <TextField
        margin="dense"
        label="Route ICAO Codes"
        multiline
        rows={10}
        fullWidth
        value={currentCodes}
        onChange={e => { setCurrentCodes(e.currentTarget.value) }}
        helperText="Here you can  input your own route (new line separated) or edit the generated one."
      />
      <Button
        onClick={() => {
          onSubmit(currentCodes)
        }}
        variant="contained"
        color="primary"
        style={{ marginTop: '48px' }}
      >
        Update
      </Button>
    </Wrapper>
  )
}

export default EditForm
