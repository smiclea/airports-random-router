import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
} from '@material-ui/core'

const Wrapper = styled.div``

type Props = {
  codes: string
  onRequestClose: () => void
  onSubmit: (value: string) => void
}

const EditModal = ({ codes, onRequestClose, onSubmit }: Props) => {
  const [currentCodes, setCurrentCodes] = useState('')

  useEffect(() => {
    setCurrentCodes(codes)
  }, [codes])

  return (
    <Wrapper>
      <Dialog open onClose={onRequestClose} style={{ zIndex: 99999 }}>
        <DialogTitle>Edit Route</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can add or remove any MSFS ICAO codes here. They will be saved in your browser for the next time you load the page.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Route ICAO Codes"
            multiline
            rows={10}
            fullWidth
            value={currentCodes}
            onChange={e => { setCurrentCodes(e.currentTarget.value) }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onRequestClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(currentCodes)
            }}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  )
}

export default EditModal
