import React from 'react';
import styled from 'styled-components';
import reactMapboxGl, {
  Feature,
  GeoJSONLayer,
  Layer,
  Marker
} from 'react-mapbox-gl';
import { List, Map, Set } from 'immutable';

import LatLongPin from './LatLongPin';
import SearchRadius from './SearchRadius';
import DrawComponent from '../../containers/map/DrawComponent';
import { SEARCH_TYPES } from '../../utils/constants/ExploreConstants';
import { MAP_STYLE, LAYERS } from '../../utils/constants/MapConstants';
import { PARAMETERS } from '../../utils/constants/StateConstants';
import { SIDEBAR_WIDTH, INNER_NAV_BAR_HEIGHT } from '../../core/style/Sizes';
import {
  SEARCH_ZONE_COLORS_DARK,
  SEARCH_ZONE_COLORS_LIGHT,
  SEARCH_DOT_COLOR
} from '../../utils/constants/Colors';
import { getCoordinates, getEntityKeyId } from '../../utils/DataUtils';
import { getPlate } from '../../utils/VehicleUtils';
import { getSearchFields } from '../../containers/parameters/ParametersReducer';

declare var __MAPBOX_TOKEN__;

const COORDS = {
  CONTINENTAL_US: [[-124.7844079, 24.7433195], [-66.9513812, 49.3457868]],
  BAY_AREA: [[-123.025192, 38.117602], [-121.170329, 37.086658]]
};

const DEFAULT_COORDS = COORDS.BAY_AREA;

type Props = {
  drawMode :boolean,
  entities :List<Map<*, *>>,
  heatmap? :boolean,
  isMapStyleLoading :boolean,
  mapMode :string,
  searchParameters :Map<*, *>,
  selectedEntityKeyIds :Set<*>,
  selectedReadId :string,
  setMapStyleLoaded :RequestSequence,
  setSearchZones :(searchZones :number[][]) => void,
  selectEntity :(entityKeyId :string) => void
};

type State = {
  fitToBounds :boolean
};

const Wrapper = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  width: calc(100% - ${SIDEBAR_WIDTH}px);
  height: calc(100% - ${INNER_NAV_BAR_HEIGHT - 1}px);
  bottom: 0;
  right: 0;
`;

const MapComponent = reactMapboxGl({
  accessToken: __MAPBOX_TOKEN__,
  logoPosition: 'top-right',
  dragRotate: false
});

class SimpleMap extends React.Component<Props, State> {
  //
  // shouldComponentUpdate(nextProps) {
  //   if (nextProps.isMapStyleLoading) {
  //     return false;
  //   }
  //   return true;
  // }

  static defaultProps = {
    heatmap: false
  }

  constructor(props) {
    super(props);
    this.state = {
      fitToBounds: true
    };
  }

  componentWillReceiveProps(nextProps) {
    const { entities } = this.props;
    if (!nextProps.entities.size || entities !== nextProps.entities) {
      this.setState({ fitToBounds: true });
    }
    else {
      this.setState({ fitToBounds: false });
    }
  }

  getBounds = () => {
    const { entities } = this.props;

    /* Show bay area if no entities present to display */
    if (!entities.size) {
      return DEFAULT_COORDS;
    }

    let minX;
    let maxX;
    let minY;
    let maxY;

    entities.forEach((entity) => {
      const [x, y] = getCoordinates(entity);

      if (!minX || x < minX) {
        minX = x;
      }
      if (!maxX || x > maxX) {
        maxX = x;
      }
      if (!minY || y < minY) {
        minY = y;
      }
      if (!maxY || y > maxY) {
        maxY = y;
      }
    });

    return [[minX, minY], [maxX, maxY]];
  }

  getFeatures = () => {
    const { entities } = this.props;

    return entities.filter(entity => getCoordinates(entity)).map(entity => (
      <Feature
          key={getEntityKeyId(entity)}
          coordinates={getCoordinates(entity)} />
    )).toArray();
  }

  renderLatLong = () => {
    const { mapMode, searchParameters, isMapStyleLoading } = this.props;

    return (
      <LatLongPin
          mapMode={mapMode}
          searchParameters={searchParameters}
          isMapStyleLoading={isMapStyleLoading} />
    );
  }

  renderSearchAreaLayer = () => {
    const {
      entities,
      isMapStyleLoading,
      mapMode,
      searchParameters
    } = this.props;

    return (
      <SearchRadius
          entityCount={entities.size}
          mapMode={mapMode}
          searchParameters={searchParameters}
          isMapStyleLoading={isMapStyleLoading} />
    );
  }

  renderSearchZones = () => {
    const { entities, mapMode, searchParameters } = this.props;

    const colors = mapMode === MAP_STYLE.LIGHT ? SEARCH_ZONE_COLORS_LIGHT : SEARCH_ZONE_COLORS_DARK;

    return searchParameters.get(PARAMETERS.SEARCH_ZONES, []).map((zone, index) => {
      const color = colors[index % colors.length];

      return (
        <GeoJSONLayer
            key={`polygon-${index}`}
            fillPaint={{
              'fill-opacity': entities.size ? 0.1 : 0.3,
              'fill-color': color
            }}
            data={{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [zone]
              }
            }} />
      );
    });
  }

  mapEntityToFeature = (entity) => {
    const entityKeyId = getEntityKeyId(entity);
    return {
      type: 'Feature',
      properties: { entityKeyId },
      geometry: {
        type: 'Point',
        coordinates: getCoordinates(entity)
      }
    };
  }

  getSourceLayer = (id, entityFilter) => {
    const { entities } = this.props;

    return (
      <GeoJSONLayer
          id={id}
          data={{
            type: 'FeatureCollection',
            features: entities.filter(entityFilter).map(this.mapEntityToFeature).toArray()
          }}
          fillOnClick={console.log}
          circleOnClick={console.log} />
    );
  }

  isHotlist = (entity) => {
    const { hotlistPlates } = this.props;
    return hotlistPlates.has(getPlate(entity).toLowerCase());
  }

  addSource = () => this.getSourceLayer(
    LAYERS.ALL_SOURCE_FEATURES,
    entity => getCoordinates(entity)
  )

  addSelectedSource = () => {
    const { selectedEntityKeyIds } = this.props;

    return this.getSourceLayer(
      LAYERS.SELECTED_SOURCE_FEATURES,
      entity => selectedEntityKeyIds.has(getEntityKeyId(entity)) && getCoordinates(entity)
    );
  }

  addHotlistSource = () => {
    const { hotlistPlates } = this.props;
    return this.getSourceLayer(
      LAYERS.HOTLIST_SOURCE_FEATURES,
      entity => this.isHotlist(entity) && getCoordinates(entity)
    )
  }

  addSelectedReadSource = () => {
    const { selectedReadId } = this.props;

    return this.getSourceLayer(
      LAYERS.SELECTED_READ,
      entity => getEntityKeyId(entity) === selectedReadId && getCoordinates(entity)
    );
  }

  renderSelectedFeatures = () => (
    <Layer
        type="circle"
        sourceId={LAYERS.SELECTED_SOURCE_FEATURES}
        paint={{
          'circle-opacity': 1,
          'circle-color': SEARCH_DOT_COLOR.UNSELECTED,
          'circle-radius': 5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 1
        }} />
  )

  renderSelectedReadFeature = () => (
    <Layer
        type="circle"
        sourceId={LAYERS.SELECTED_READ}
        paint={{
          'circle-opacity': 1,
          'circle-color': SEARCH_DOT_COLOR.SELECTED,
          'circle-radius': 5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 1
        }} />
  )

  renderSelectedFeaturesInnerCircles = () => (
    <Layer
        type="circle"
        sourceId={LAYERS.SELECTED_SOURCE_FEATURES}
        paint={{
          'circle-opacity': 1,
          'circle-color': '#ffffff',
          'circle-radius': 4
        }} />
  )

  renderHotlistInnerCircles = () => (
    <Layer
        type="circle"
        sourceId={LAYERS.HOTLIST_SOURCE_FEATURES}
        paint={{
          'circle-opacity': 1,
          'circle-color': SEARCH_DOT_COLOR.HOTLIST,
          'circle-radius': 4
        }} />
  )

  renderUnclusteredPoints = () => {
    const { selectedEntityKeyIds } = this.props;

    return (
      <Layer
          id={LAYERS.DATA_POINTS}
          type="circle"
          sourceId={LAYERS.ALL_SOURCE_FEATURES}
          paint={{
            'circle-opacity': 1,
            'circle-color': selectedEntityKeyIds.size ? SEARCH_DOT_COLOR.UNSELECTED : SEARCH_DOT_COLOR.SELECTED,
            'circle-radius': selectedEntityKeyIds.size ? 3 : 5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': selectedEntityKeyIds.size ? 0 : 2,
            'circle-stroke-opacity': selectedEntityKeyIds.size ? 0.4 : 1
          }} />
    );
  }

  onPointClick = (e) => {
    const { selectEntity } = this.props;

    const { features } = e;
    if (features && features.length > 0) {
      const { properties } = features[0];
      if (properties) {
        const { entityKeyId } = properties;
        selectEntity(entityKeyId);
      }
    }
  }

  renderAddressAndRadiusSearchParams = (searchFields) => {
    const { drawMode } = this.props;

    const shouldRender = searchFields.includes(SEARCH_TYPES.GEO_RADIUS) && !drawMode;

    const radiusArea = this.renderSearchAreaLayer();
    const addressPin = this.renderLatLong();

    return shouldRender ? (
      <>
        {radiusArea}
        {addressPin}
      </>
    ) : null;
  }

  renderReads = () => {

    return (
      <>
        {this.addSource()}
        {this.renderUnclusteredPoints()}
      </>
    );
  }

  renderSelectedReads = () => {

    return (
      <>
        {this.addSelectedSource()}
        {this.addSelectedReadSource()}
        {this.renderSelectedFeatures()}
        {this.renderSelectedReadFeature()}
      </>
    );
  }

  renderHotlistReads = () => {

    return (
      <>
        {this.addHotlistSource()}
        {this.renderHotlistInnerCircles()}
      </>
    );
  }

  render() {
    const { mapMode, searchParameters, setMapStyleLoaded } = this.props;
    const { fitToBounds } = this.state;

    const searchFields = getSearchFields(searchParameters);

    const optionalProps = fitToBounds ? {
      fitBounds: this.getBounds(),
      fitBoundsOptions: {
        padding: {
          top: 130,
          bottom: 50,
          left: 50,
          right: 550
        }
      }
    } : {};

    return (
      <Wrapper>
        <MapComponent
            style={mapMode}
            onStyleLoad={(map) => {
              map.on('click', LAYERS.DATA_POINTS, this.onPointClick);
              map.on('mouseenter', LAYERS.DATA_POINTS, () => {
                map.getCanvas().style.cursor = 'pointer';
              });
              map.on('mouseleave', LAYERS.DATA_POINTS, () => {
                map.getCanvas().style.cursor = '';
              });
              setMapStyleLoaded();
            }}
            containerStyle={{
              height: '100%',
              width: '100%'
            }}
            {...optionalProps}>

          <DrawComponent />

          {this.renderReads()}

          {this.renderSelectedReads()}

          {this.renderHotlistReads()}

          {this.renderSearchZones()}
          {this.renderAddressAndRadiusSearchParams(searchFields)}
        </MapComponent>
      </Wrapper>
    );
  }
}

export default SimpleMap;
