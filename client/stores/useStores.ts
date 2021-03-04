import React from 'react'

import airportStore from './AirportStore'

const context = React.createContext({
  airportStore,
})

export default () => React.useContext(context)
