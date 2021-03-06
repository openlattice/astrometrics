import React from 'react';
import styled from 'styled-components';
import DrawControl from 'react-mapbox-gl-draw';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { GeoJSONLayer } from 'react-mapbox-gl';
import { Map } from 'immutable';

import Modal from '../../components/modals/Modal';
import {
  STATE,
  DRAW,
  PARAMETERS,
  SEARCH_PARAMETERS,
  SAVED_MAP
} from '../../utils/constants/StateConstants';
import { PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';
import * as DrawActionFactory from './DrawActionFactory';
import * as ExploreActionFactory from '../explore/ExploreActionFactory';
import * as ParametersActionFactory from '../parameters/ParametersActionFactory';

type Props = {
  drawMode :boolean,
  searchParameters :Map<*, *>,
  draw :Object,
  selectedMap :Map<*, *>,
  actions :{
    updateSearchParameters :Function,
    setSearchZones :Function,
    setDrawZones :Function,
    setDrawMode :Function
  }
};

type State = {
  fitToBounds :boolean
};

class DrawComponent extends React.Component<Props, State> {

  componentDidUpdate(prevProps) {
    const { selectedMapId, selectedMap, draw } = this.props;
    if (draw && prevProps.selectedMapId !== selectedMapId) {

      const {
        [SAVED_MAP.FEATURES]: features
      } = JSON.parse(selectedMap.getIn([PROPERTY_TYPES.TEXT, 0], '{}'));

      draw.set({
        type: 'FeatureCollection',
        features
      });
    }
  }

  handleUpdate = () => {
    const { actions } = this.props;
    const { setDrawZones, updateSearchParameters } = actions;

    const searchZones = this.drawControl.draw.getAll();
    if (searchZones && searchZones.features) {

      const coordinates = [];

      searchZones.features.forEach(({ geometry }) => {
        coordinates.push(...geometry.coordinates);
      });

      setDrawZones(searchZones.features);
      updateSearchParameters({
        field: PARAMETERS.SEARCH_ZONES,
        value: coordinates
      });
    }
  }

  render() {
    const { actions, drawMode } = this.props;

    if (!drawMode) {
      return null;
    }

    return (
      <DrawControl
          ref={(drawControl) => {
            this.drawControl = drawControl;
            const draw = drawControl ? drawControl.draw : undefined;
            actions.setDrawControl({ draw });
          }}
          onDrawCreate={this.handleUpdate}
          onDrawDelete={this.handleUpdate}
          onDrawUpdate={this.handleUpdate}
          position="top-right"
          displayControlsDefault={false}
          controls={{
            polygon: true,
            trash: true
          }} />
    );
  }
}

function mapStateToProps(state :Map<*, *>) :Object {
  const params = state.get(STATE.PARAMETERS);
  const draw = state.get(STATE.DRAW);

  return {
    searchParameters: params.get(SEARCH_PARAMETERS.SEARCH_PARAMETERS),
    drawMode: params.get(SEARCH_PARAMETERS.DRAW_MODE),
    selectedMapId: draw.get(DRAW.SELECTED_MAP_ID),
    selectedMap: draw.getIn([DRAW.SAVED_MAPS, draw.get(DRAW.SELECTED_MAP_ID)], Map()),
    draw: draw.get(DRAW.DRAW_CONTROL)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(DrawActionFactory).forEach((action :string) => {
    actions[action] = DrawActionFactory[action];
  });

  Object.keys(ExploreActionFactory).forEach((action :string) => {
    actions[action] = ExploreActionFactory[action];
  });

  Object.keys(ParametersActionFactory).forEach((action :string) => {
    actions[action] = ParametersActionFactory[action];
  });


  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(DrawComponent);
