import turfLength from '@turf/length'
import turfDistance from '@turf/distance'
import turfAlong from '@turf/along'
import turfBearing from '@turf/bearing'
import mapboxgl, { Map } from 'mapbox-gl'
import { AirportDb } from '../../../models/Airport'
import { getAirportSize } from '../../stores/AirportStore'

const buildGeoJsonLine = (coordinates: any): any => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates,
  },
})

class MapUtils {
  static addRouteLinePath(airports: AirportDb[], map: Map, distanceLabelMarkers: mapboxgl.Popup[]) {
    if (airports.length < 2) {
      (map.getSource('path') as any).setData(buildGeoJsonLine([]))
      return
    }
    const setOfArcs: [number, number][] = []
    for (let i = 1; i < airports.length; i += 1) {
      const startArc = airports[i - 1].geometry.coordinates
      const endArc = airports[i].geometry.coordinates
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
        .addTo(map)

      distanceLabelMarkers.push(marker)

      for (let j = 0; j < lineDistance + steps; j += lineDistance / steps) {
        const segment = turfAlong(geojsonLine, j)
        setOfArcs.push(segment.geometry.coordinates as any)
      }
    }

    (map.getSource('path') as any).setData(buildGeoJsonLine(setOfArcs))
  }

  static addRouteMarkersPath(map: Map, airports: AirportDb[], markers: mapboxgl.Popup[]) {
    const coordinates = airports.map(p => p.geometry.coordinates)
    if (!coordinates.length) {
      return
    }
    const bounds = coordinates.reduce((currentBounds, coord) => currentBounds
      .extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))
    map.fitBounds(bounds, { padding: 96 })

    airports.forEach((airport, i) => {
      const bulletString = getAirportSize(airport.longest_runway_length)
      const markerClassName = i === 0 ? ' map-marker-start' : i === airports.length - 1 ? ' map-marker-end' : ''
      const countryTemplate = airport.countryCode ? `
        <div class="map-marker-country">
          <img width="16px" height="16px" src="/flags/${airport.countryCode}.svg" title="${airport.countryName}" />${airport.countryCode}
        </div>
      ` : ''
      const infoTemplate = `
        <div class="map-marker-info">
          <div class="map-marker-info-name">${airport.name}</div>
          <div class="map-marker-info-small">${[airport.city, airport.countryName].filter(Boolean).join(', ')}</div>
          <div class="map-marker-info-small">${airport.approaches?.join(', ') || ''}</div>
        </div>
      `
      const marker = new mapboxgl.Popup({
        className: `map-marker${markerClassName}`,
        closeOnClick: false,
        closeButton: false,
        anchor: 'center',
        maxWidth: 'none',
      })
        .setLngLat(airport.geometry.coordinates)
        .setHTML(
          `<div class="map-marker-content">
            ${infoTemplate}
            <div class="map-marker-altitude">${airport.altitude}ft</div>
            <div class="map-marker-ident">${airport.ident}</div>
            <div class="map-marker-size">${bulletString || '<span style="opacity: 0;">E</span>'}</div>
          <div>
          ${countryTemplate}
          `,
        )
        .addTo(map)

      marker.getElement().addEventListener('click', () => {
        const currentMarker = airports[i].geometry.coordinates
        const nextMarker = airports[i === airports.length - 1 ? i - 1 : i + 1].geometry.coordinates
        const markersBounds = new mapboxgl.LngLatBounds([currentMarker[0], currentMarker[1]], [nextMarker[0], nextMarker[1]])
        map.fitBounds(markersBounds, { padding: 96 })
      })

      markers.push(marker)
    })
  }

  static addAirportsMarkers(map: Map, airports: AirportDb[], markers: mapboxgl.Popup[]) {
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
              <div class="map-marker-info-small">${[airport.city, airport.countryName].filter(Boolean).join(', ')}</div>
              <div class="map-marker-info-small">Runway: ${airport.longest_runway_length}ft, Altitude: ${airport.altitude}ft</div>
              <div class="map-marker-info-small">${airport.approaches?.join(', ') || ''}</div>
            </div>
          <div>
          `,
        )
        .addTo(map)

      markers.push(marker)
    })
  }

  // static addAirportsMarkers(map: Map, airports: AirportDb[]) {
  //   const geoJson: any = {
  //     type: 'FeatureCollection',
  //     features: airports.map(airport => {
  //       const { geometry, ...properties } = airport
  //       return {
  //         type: 'Feature',
  //         properties,
  //         geometry,
  //       }
  //     }),
  //   }
  //   const airportsSource: any = map.getSource('airports')
  //   airportsSource.setData(geoJson)
  // }

  static addLayers(map: Map) {
    // Route source
    map.addSource('path', { type: 'geojson', data: buildGeoJsonLine([]) })

    map.addLayer({
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

    // Airports source
    map.addSource('airports', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      },
    })
    map.addLayer({
      id: 'airports-layer',
      type: 'circle',
      source: 'airports',
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    })
  }
}

export default MapUtils
