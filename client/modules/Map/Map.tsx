import React, { useEffect, useRef } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import mapboxgl from 'mapbox-gl'
import turfLength from '@turf/length'
import turfDistance from '@turf/distance'
import turfAlong from '@turf/along'
import turfBearing from '@turf/bearing'

import { AirportDb, RunwayDb } from '../../../models/Airport'
import { getAirportSize } from '../../stores/AirportStore'

const GlobalStyle = createGlobalStyle`
  .map-marker {
    z-index: 99999;

    .mapboxgl-popup-tip {
      display: none;
    }
    .mapboxgl-popup-content {
      border-radius: 50%;
      width: 48px;
      height: 48px;
      font-weight: bold;
      display: flex;
      justify-content: center;
      align-items: center;
      padding-top: 16px;
      background: #3f51b5;
      cursor: pointer;
    }
    &.map-marker-start .mapboxgl-popup-content {
      background: #f50057;
      cursor: default;
    }
    &.map-marker-end .mapboxgl-popup-content {
      background: rgb(255, 152, 0);
    }
    .map-marker-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 3px;
      .map-marker-altitude {
        font-size: 9px;
        margin-bottom: -9px;
      }
      .map-marker-ident {
        margin-bottom: -10px;
      }
      .map-marker-size {
        letter-spacing: 2px;
        margin-left: 1px;
      }
    }
    .map-marker-country {
      display: flex;
      align-items: center;
      background: #3f51b5;
      position: absolute;
      bottom: -20px;
      left: 1px;
      padding: 0px 4px;
      border-radius: 3px;

      img {
        margin-right: 4px;
      }
    }
  }
  .distance-marker {
    .mapboxgl-popup-tip {
      display: none;
    }
    .mapboxgl-popup-content {
      padding: 0;
      background: transparent;
      box-shadow: none;
    }
    .distance-marker-content { 
      background: #3f51b5;
      border-radius: 4px;
      padding: 0 4px;
    }
  }
  .runway-marker {
    .mapboxgl-popup-tip {
      display: none;
    }
    .mapboxgl-popup-content {
      padding: 4px 0;
      background: #565656;
      width: 71px;
      text-align: center;
      cursor: pointer;
    }
  }
`
const MapContainer = styled.div`
  height: 100%;
`
type Props = {
  routeItems: AirportDb[]
  runways: RunwayDb[]
  onLoad: () => void
  onRequestRunways: (airportIdent: string) => void
  onRequestFlightPlan: (departureIdent: string, destinationIdent: string, runwayId: number, runwayType: 'primary' | 'secondary') => void
}

const Map = ({
  routeItems,
  runways,
  onLoad,
  onRequestRunways,
  onRequestFlightPlan,
}: Props) => {
  const map = useRef<mapboxgl.Map>()
  const routeItemsMarkersRef = useRef<mapboxgl.Popup[]>([])
  const runwayMarkersRef = useRef<mapboxgl.Popup[]>([])
  const departureAirportRef = useRef<string | null>(null)
  const destinationAirportRef = useRef<string | null>(null)

  const buildFeatureCollection = (features: any[]): any => ({
    type: 'FeatureCollection',
    features,
  })

  const buildGeoJsonLine = (coordinates: number[][] | number[]): any => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  })

  const showMarkersOnMap = (
    markersToShowOnMap: AirportDb[],
    markersRef: React.MutableRefObject<mapboxgl.Popup[]>,
  ) => {
    if (!map.current) {
      return
    }
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const coordinates = routeItems.map(p => p.geometry.coordinates)
    if (!coordinates.length) {
      return
    }
    const bounds = coordinates.reduce((currentBounds, coord) => currentBounds
      .extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))
    map.current.fitBounds(bounds, { padding: 96 })

    markersToShowOnMap.forEach((routeItem, i) => {
      const bulletString = getAirportSize(routeItem.longest_runway_length)
      const markerClassName = i === 0 ? ' map-marker-start' : i === markersToShowOnMap.length - 1 ? ' map-marker-end' : ''
      const countryTemplate = routeItem.countryCode ? `
        <div class="map-marker-country">
          <img width="16px" height="16px" src="/flags/${routeItem.countryCode}.svg" title="${routeItem.countryName}" />${routeItem.countryCode}
        </div>
      ` : ''
      const marker = new mapboxgl.Popup({
        className: `map-marker${markerClassName}`,
        closeOnClick: false,
        closeButton: false,
        anchor: 'center',
        maxWidth: 'none',
      })
        .setLngLat(routeItem.geometry.coordinates)
        .setHTML(
          `<div class="map-marker-content">
            <div class="map-marker-altitude">${routeItem.altitude}ft</div>
            <div class="map-marker-ident">${routeItem.ident}</div>
            <div class="map-marker-size">${bulletString || '<span style="opacity: 0;">E</span>'}</div>
          <div>
          ${countryTemplate}
          `,
        )
        .addTo(map.current!)

      if (i > 0) {
        marker.getElement().addEventListener('click', () => {
          onRequestRunways(routeItem.ident)
          departureAirportRef.current = markersToShowOnMap[i - 1].ident
          destinationAirportRef.current = routeItem.ident
        })
      }

      markersRef.current.push(marker)
    })
  }

  useEffect(() => {
    showMarkersOnMap(routeItems, routeItemsMarkersRef)
    if (!map.current) {
      return
    }

    if (routeItems.length < 2) {
      // @ts-ignore
      map.current.getSource('path').setData(buildGeoJsonLine([]))
      return
    }

    const setOfArcs: [number, number][] = []
    for (let i = 1; i < routeItems.length; i += 1) {
      const startArc = routeItems[i - 1].geometry.coordinates
      const endArc = routeItems[i].geometry.coordinates
      const geojsonLine = buildGeoJsonLine([startArc, endArc])
      const steps = 500
      const lineDistance = turfLength(geojsonLine)
      const halfwayCoords: any = turfAlong(geojsonLine, lineDistance / 2).geometry.coordinates
      let bearing = turfBearing(halfwayCoords, endArc)
      bearing = bearing > 0 ? bearing - 90 : bearing + 90
      const distance = turfDistance(startArc, endArc) * 0.539957

      const marker = new mapboxgl.Popup({
        className: 'distance-marker',
        closeOnClick: false,
        closeButton: false,
        anchor: 'center',
        maxWidth: 'none',
      })
        .setLngLat(halfwayCoords)
        .setHTML(`<div class="distance-marker-content" style="transform: rotate(${bearing}deg);">${distance.toFixed(0)} NM</div>`)
        .addTo(map.current!)
      routeItemsMarkersRef.current.push(marker)

      for (let j = 0; j < lineDistance + steps; j += lineDistance / steps) {
        const segment = turfAlong(geojsonLine, j)
        // @ts-ignore
        setOfArcs.push(segment.geometry.coordinates)
      }
    }

    // @ts-ignore
    map.current.getSource('path').setData(buildGeoJsonLine(setOfArcs))
  }, [routeItems])

  const showRunways = () => {
    const runwayGeojsonLines = runways.map(runway => buildGeoJsonLine([
      [runway.primary_lonx, runway.primary_laty],
      [runway.secondary_lonx, runway.secondary_laty],
    ]))
    const runwayBounds = runways.reduce((currentBounds, runway) => currentBounds.extend([runway.primary_lonx, runway.primary_laty])
      .extend([runway.secondary_lonx, runway.secondary_laty]),
    new mapboxgl.LngLatBounds([runways[0].primary_lonx, runways[0].primary_laty], [runways[0].secondary_lonx, runways[0].secondary_laty]))
    map.current?.fitBounds(runwayBounds, { padding: 96 })

    // @ts-ignore
    map.current?.getSource('runways').setData(buildFeatureCollection(runwayGeojsonLines))

    runwayMarkersRef.current.forEach(m => m.remove())
    runwayMarkersRef.current = []

    if (!map.current) {
      return
    }
    const generateRunwayMarker = (coords: [number, number], runway: RunwayDb, runwayType: 'primary' | 'secondary') => {
      const runwayMarker = new mapboxgl.Popup({
        className: 'runway-marker',
        closeOnClick: false,
        closeButton: false,
        anchor: 'center',
        maxWidth: 'none',
      })
        .setLngLat(coords)
        .setHTML(`
          <div class="runway-marker-content">
            Land here
          </div>
        `)
        .addTo(map.current!)
      runwayMarker.getElement().addEventListener('click', () => {
        onRequestFlightPlan(departureAirportRef.current!, destinationAirportRef.current!, runway.runway_id, runwayType)
      })
      runwayMarkersRef.current.push(runwayMarker)
    }

    runways.forEach(runway => {
      generateRunwayMarker([runway.primary_lonx, runway.primary_laty], runway, 'primary')
      generateRunwayMarker([runway.secondary_lonx, runway.secondary_laty], runway, 'secondary')
    })
  }

  useEffect(() => {
    if (!runways.length) {
      // @ts-ignore
      map.current?.getSource('runways').setData(buildFeatureCollection([]))

      runwayMarkersRef.current.forEach(m => m.remove())
      runwayMarkersRef.current = []
      return
    }
    showRunways()
  }, [runways])

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

    mapInstance.on('load', () => {
      mapInstance.addSource('path', {
        type: 'geojson',
        data: buildGeoJsonLine([]),
      })
      mapInstance.addLayer({
        id: 'path-layer',
        type: 'line',
        source: 'path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3f51b5',
          'line-width': 8,
        },
      })
      mapInstance.addSource('runways', {
        type: 'geojson',
        data: buildGeoJsonLine([]),
      })
      mapInstance.addLayer({
        id: 'runways-layer',
        type: 'line',
        source: 'runways',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#565656',
          'line-width': 5,
        },
      })

      map.current = mapInstance

      onLoad()
    })
  }, [])
  return (
    <>
      <GlobalStyle />
      <MapContainer id="mapContainer" />
    </>
  )
}

export default Map
