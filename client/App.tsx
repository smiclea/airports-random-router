import { hot } from 'react-hot-loader/root'
import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CssBaseline, NoSsr } from '@material-ui/core'
import { createGlobalStyle } from 'styled-components'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import HomeContainer from './containers/HomeContainer'

const HeightFull = createGlobalStyle`
  html, body, #root {
    height: 100%;
  }
`

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
})

const App = () => (
  <Router>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HeightFull />
      <NoSsr>
        <Switch>
          <HomeContainer />
          <Route>Not Found</Route>
        </Switch>
      </NoSsr>
    </ThemeProvider>
  </Router>
)

export default hot(App)
