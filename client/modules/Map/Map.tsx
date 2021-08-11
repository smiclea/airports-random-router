import React, { useEffect, useRef } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import mapboxgl from 'mapbox-gl'
import turfLength from '@turf/length'
import turfDistance from '@turf/distance'
import turfAlong from '@turf/along'
import turfBearing from '@turf/bearing'

import { AirportDb, RunwayDb } from '../../../models/Airport'
import { getAirportSize } from '../../stores/AirportStore'
import { GeographicalBounds } from '../../../models/Geography'

const GlobalStyle = createGlobalStyle`
  .map-marker {
    z-index: 99999;
    :hover {
      z-index: 999999;
    }

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
      cursor: default;
    }
    &.map-marker-start .mapboxgl-popup-content {
      background: #f50057;
    }
    &.map-marker-end .mapboxgl-popup-content {
      background: rgb(255, 152, 0);
      cursor: default;
    }
    .map-marker-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 3px;
      position: relative;
      cursor: pointer;
      .map-marker-info {
        display: none;
        background: #3f51b5;
        position: absolute;
        bottom: calc(100% + 8px);
        padding: 4px 5px;
        border-radius: 5px;
        min-width: 130px;
        white-space: nowrap;
        .map-marker-info-city {
          font-size: 10px;
          opacity: 0.7;
        }
        .map-marker-info-approach {
          font-size: 10px;
          opacity: 0.7;
        }
      }
      :hover .map-marker-info {
        display: block;
      }
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
      left: -5px;
      padding: 0px 4px;
      border-radius: 3px;

      img {
        margin-right: 4px;
      }
    }
  }
  .distance-marker {
    z-index: 1;
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
  .map-marker-airport {
    :hover {
      z-index: 999999;
    }
    .mapboxgl-popup-tip {
      display: none;
    }
    .mapboxgl-popup-content {
      background: red;
      border-radius: 50%;
      padding: 0;
      .map-marker-airport-content {
        position: relative;
        width: 8px;
        height: 8px;
        .map-marker-info {
          display: none;
          background: #ff6d00;
          position: absolute;
          bottom: calc(100% + 8px);
          padding: 4px 5px;
          border-radius: 5px;
          min-width: 130px;
          white-space: nowrap;
          left: -62px;
          line-height: 10px;
          font-size: 10px;
          .map-marker-info-city {
            font-size: 8px;
            line-height: 8px;
            padding-top: 4px;
            opacity: 0.7;
          }
          .map-marker-info-approach {
            font-size: 8px;
            line-height: 8px;
            padding-top: 4px;
            opacity: 0.7;
          }
        }
        :hover .map-marker-info {
          display: block;
        }
      }
    }
  } 
`
const MapContainer = styled.div`
  height: 100%;
`
type Props = {
  routeItems: AirportDb[]
  airports: AirportDb[]
  runways: RunwayDb[]
  onLoad: () => void
  onMapMoveEnd: (bounds: GeographicalBounds) => void,
  onRequestFlightPlan: (departureIdent: string, destinationIdent: string, runwayId: number, runwayType: 'primary' | 'secondary') => void
}

const Map = ({
  routeItems,
  runways,
  airports,
  onLoad,
  onMapMoveEnd,
  // onRequestRunways,
  onRequestFlightPlan,
}: Props) => {
  const map = useRef<mapboxgl.Map>()
  const routeItemsMarkersRef = useRef<mapboxgl.Popup[]>([])
  const runwayMarkersRef = useRef<mapboxgl.Popup[]>([])
  const airportMarkersRef = useRef<mapboxgl.Popup[]>([])
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

  const showDetailMarkersOnMap = (
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
      const infoTemplate = `
        <div class="map-marker-info">
          <div class="map-marker-info-name">${routeItem.name}</div>
          <div class="map-marker-info-city">${[routeItem.city, routeItem.countryName].filter(Boolean).join(', ')}</div>
          <div class="map-marker-info-approach">${routeItem.approaches?.join(', ') || ''}</div>
        </div>
      `
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
            ${infoTemplate}
            <div class="map-marker-altitude">${routeItem.altitude}ft</div>
            <div class="map-marker-ident">${routeItem.ident}</div>
            <div class="map-marker-size">${bulletString || '<span style="opacity: 0;">E</span>'}</div>
          <div>
          ${countryTemplate}
          `,
        )
        .addTo(map.current!)

      marker.getElement().addEventListener('click', () => {
        const currentMarker = markersToShowOnMap[i].geometry.coordinates
        const nextMarker = markersToShowOnMap[i === markersToShowOnMap.length - 1 ? i - 1 : i + 1].geometry.coordinates
        const markersBounds = new mapboxgl.LngLatBounds([currentMarker[0], currentMarker[1]], [nextMarker[0], nextMarker[1]])
        map.current?.fitBounds(markersBounds, { padding: 96 })
      })

      markersRef.current.push(marker)
    })
  }

  // Load small airports markers on map
  useEffect(() => {
    if (!map.current) {
      return
    }
    airportMarkersRef.current.forEach(m => m.remove())
    airportMarkersRef.current = []

    airports.forEach(airport => {
      const marker = new mapboxgl.Popup({
        className: 'map-marker-airport',
        closeOnClick: false,
        closeButton: false,
        anchor: 'center',
        maxWidth: 'none',
      })
        .setLngLat(airport.geometry.coordinates)
        .setHTML(
          `<div class="map-marker-airport-content">
            <div class="map-marker-info">
              <div class="map-marker-info-name">${airport.ident} - ${airport.name}</div>
              <div class="map-marker-info-city">${[airport.city, airport.countryName].filter(Boolean).join(', ')}</div>
              <div class="map-marker-info-approach">${airport.approaches?.join(', ') || ''}</div>
            </div>
          <div>
          `,
        )
        .addTo(map.current!)

      airportMarkersRef.current.push(marker)
    })
  }, [airports])

  // Show route items markers on map
  useEffect(() => {
    showDetailMarkersOnMap(routeItems, routeItemsMarkersRef)
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

    mapInstance.on('moveend', () => {
      if (mapInstance.getZoom() < 6) {
        airportMarkersRef.current.forEach(m => m.remove())
        airportMarkersRef.current = []
        return
      }

      const bounds = mapInstance.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      onMapMoveEnd({ sw: [sw.lng, sw.lat], ne: [ne.lng, ne.lat] })
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
