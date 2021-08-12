import { useRef } from 'react'

export default (callback: () => void) => {
  const willMount = useRef(true)
  if (willMount.current) {
    callback()
  }
  willMount.current = false
}
