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
  static get AIPORTS_UNCLUSTERED_LAYER_NAME() { return 'unclustered-airports-layer' }

  static get AIPORTS_CLUSTER_LAYER_NAME() { return 'cluster-airports-layer' }

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
      const bulletString = getAirportSize(airport.properties.longest_runway_length)
      const markerClassName = i === 0 ? ' map-marker-start' : i === airports.length - 1 ? ' map-marker-end' : ''
      const countryTemplate = airport.properties.countryCode ? `
        <div class="map-marker-country">
          <img width="16px" height="16px" src="/flags/${airport.properties.countryCode}.svg"
           title="${airport.properties.countryName}" />${airport.properties.countryCode}
        </div>
      ` : ''
      const infoTemplate = `
        <div class="map-marker-info">
          <div class="map-marker-info-name">${airport.properties.name}</div>
          <div class="map-marker-info-small">${[airport.properties.city, airport.properties.countryName].filter(Boolean).join(', ')}</div>
          <div class="map-marker-info-small">${airport.properties.approaches?.join(', ') || ''}</div>
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
            <div class="map-marker-altitude">${airport.properties.altitude}ft</div>
            <div class="map-marker-ident">${airport.properties.ident}</div>
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

  static setAirportsSource(map: Map, airports: AirportDb[]) {
    const geoJson: any = {
      type: 'FeatureCollection',
      features: airports,
    }
    const airportsSource: any = map.getSource('airports')
    airportsSource.setData(geoJson)
  }

  static showAirportHoverPopup(map: Map, coordinates: mapboxgl.LngLatLike, properties: AirportDb['properties']) {
    const popup = new mapboxgl.Popup({
      className: 'map-marker-airport',
      closeOnClick: false,
      closeButton: false,
      anchor: 'center',
      maxWidth: 'none',
    })
      .setLngLat(coordinates)
      .setHTML(
        `<div class="map-marker-info">
          <div class="map-marker-info-name">${properties.ident} - ${properties.name}</div>
          <div class="map-marker-info-small">${[properties.city, properties.countryName].filter(Boolean).join(', ')}</div>
          <div class="map-marker-info-small">Runway: ${properties.longest_runway_length}ft, 
          Altitude: ${properties.altitude}ft</div>
          <div class="map-marker-info-small">${JSON.parse(properties.approaches as any)?.join(', ') || ''}</div>
        </div>`,
      )
      .addTo(map)
    return popup
  }

  static addLayers(map: Map) {
    // Airports source
    map.addSource('airports', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [],
          },
        }],
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    map.addLayer({
      id: this.AIPORTS_CLUSTER_LAYER_NAME,
      type: 'circle',
      source: 'airports',
      filter: ['has', 'point_count'],
      paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 5
        //   * Yellow, 30px circles when point count is between 5 and 10
        //   * Pink, 40px circles when point count is greater than or equal to 10
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#6571b4',
          5,
          '#6571b4',
          10,
          '#6571b4',
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          10,
          5,
          15,
          10,
          20,
        ],
      },
    })

    map.addLayer({
      id: 'cluster-count-layer',
      type: 'symbol',
      source: 'airports',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': 'white',
      },
    })

    map.addLayer({
      id: this.AIPORTS_UNCLUSTERED_LAYER_NAME,
      type: 'circle',
      source: 'airports',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#f50057',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'black',
      },
    })

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
  }
}

export default MapUtils
