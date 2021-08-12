import { createGlobalStyle } from 'styled-components'

export default createGlobalStyle`
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
        .map-marker-info-small {
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
  .map-marker-airport {
    z-index: 99999;
    .mapboxgl-popup-tip {
      display: none;
    }
    .mapboxgl-popup-content {
      padding: 0;
      .map-marker-info {
        display: block;
        background: #3f51b5;
        position: absolute;
        bottom: calc(100% + 8px);
        padding: 4px 5px;
        border-radius: 5px;
        min-width: 130px;
        white-space: nowrap;
        left: -62px;
        line-height: 10px;
        font-size: 10px;
        .map-marker-info-small {
          font-size: 8px;
          line-height: 8px;
          padding-top: 4px;
          opacity: 0.7;
        }
      }
    }
  } 
`
