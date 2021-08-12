import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import mapboxgl from 'mapbox-gl'

import { AirportDb } from '../../../models/Airport'
import { GeographicalBounds } from '../../../models/Geography'
import MapStyle from './MapStyle'
import MapUtils from './MapUtils'

const MapContainer = styled.div`
  height: 100%;
`
const MAP_AIRPORTS_ZOOM_LIMIT = 0
type Props = {
  routeItems: AirportDb[]
  airports: AirportDb[]
  onLoad: () => void
  onMapMoveEnd: (bounds: GeographicalBounds) => void,
}

const Map = ({
  routeItems,
  airports,
  onLoad,
  onMapMoveEnd,
}: Props) => {
  const map = useRef<mapboxgl.Map>()
  const routeItemsMarkersRef = useRef<mapboxgl.Popup[]>([])
  const airportHoverPopupRef = useRef<mapboxgl.Popup | null>()

  // Load small airports markers on map
  useEffect(() => {
    if (!map.current || map.current.getZoom() < MAP_AIRPORTS_ZOOM_LIMIT) {
      return
    }
    MapUtils.setAirportsSource(map.current, airports)
  }, [airports])

  // Show route items markers on map
  useEffect(() => {
    if (!map.current) {
      return
    }
    routeItemsMarkersRef.current.forEach(m => m.remove())
    routeItemsMarkersRef.current = []
    MapUtils.addRouteMarkersPath(map.current, routeItems, routeItemsMarkersRef.current)
    MapUtils.addRouteLinePath(routeItems, map.current!, routeItemsMarkersRef.current)
  }, [routeItems])

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2l1b3hpZ2VuIiwiYSI6ImNranN5bHc3bjJtd2cydG1qdTFmNWU4cnAifQ.AN8uW43ZdoGTNWpPkKhPNQ'
    const mapInstance = new mapboxgl.Map({
      container: 'mapContainer',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [0, 0],
      zoom: 3,
    })
    mapInstance.dragRotate.disable()
    mapInstance.touchZoomRotate.disableRotation()
    mapInstance.touchPitch.disable()

    const handleMoveEnd = () => {
      if (mapInstance.getZoom() < MAP_AIRPORTS_ZOOM_LIMIT) {
        MapUtils.setAirportsSource(mapInstance, [])
        return
      }

      const bounds = mapInstance.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      onMapMoveEnd({ sw: [sw.lng, sw.lat], ne: [ne.lng, ne.lat] })
    }
    mapInstance.on('load', () => {
      MapUtils.addLayers(mapInstance)

      map.current = mapInstance

      onLoad()
      handleMoveEnd()
    })

    mapInstance.on('moveend', () => {
      handleMoveEnd()
    })

    mapInstance.on('mouseenter', MapUtils.AIPORTS_CLUSTER_LAYER_NAME, () => {
      mapInstance!.getCanvas().style.cursor = 'pointer'
    })
    mapInstance.on('mouseleave', MapUtils.AIPORTS_CLUSTER_LAYER_NAME, () => {
      mapInstance!.getCanvas().style.cursor = ''
    })
    mapInstance.on('mouseenter', MapUtils.AIPORTS_UNCLUSTERED_LAYER_NAME, () => {
      mapInstance!.getCanvas().style.cursor = 'default'
    })
    mapInstance.on('mouseleave', MapUtils.AIPORTS_UNCLUSTERED_LAYER_NAME, () => {
      mapInstance!.getCanvas().style.cursor = ''
      if (airportHoverPopupRef.current) {
        airportHoverPopupRef.current.remove()
        airportHoverPopupRef.current = null
      }
    })
    mapInstance.on('click', MapUtils.AIPORTS_CLUSTER_LAYER_NAME, e => {
      const feature: any = e.features?.[0]
      if (!feature) {
        return
      }
      const clusterId = feature.properties.cluster_id
      const source = mapInstance.getSource('airports') as any
      source.getClusterExpansionZoom(
        clusterId,
        (error: any, zoom: any) => {
          if (error) {
            return
          }
          mapInstance.easeTo({
            center: feature.geometry.coordinates,
            zoom,
          })
        },
      )
    })
    mapInstance.on('mouseover', MapUtils.AIPORTS_UNCLUSTERED_LAYER_NAME, e => {
      if (!e.features) {
        return
      }
      if (airportHoverPopupRef.current) {
        airportHoverPopupRef.current.remove()
        airportHoverPopupRef.current = null
      }
      airportHoverPopupRef.current = MapUtils.showAirportHoverPopup(
        mapInstance,
        (e.features[0].geometry as any).coordinates, e.features[0].properties as any,
      )
    })
  }, [])
  return (
    <>
      <MapStyle />
      <MapContainer id="mapContainer" />
    </>
  )
}

export default Map
