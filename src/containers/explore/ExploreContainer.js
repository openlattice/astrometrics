/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { List, Map, Set } from 'immutable';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Sidebar from './Sidebar';
import EntitySetSearch from '../entitysets/EntitySetSearch';
import SearchParameters from './SearchParameters';
import SimpleMap from '../../components/maps/SimpleMap';
import HeatMap from '../../components/maps/HeatMap';
import Spinner from '../../components/spinner/Spinner';
import {
  EDM,
  STATE,
  EXPLORE,
  PARAMETERS
} from '../../utils/constants/StateConstants';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';
import * as EdmActionFactory from '../edm/EdmActionFactory';
import * as EntitySetActionFactory from '../entitysets/EntitySetActionFactory';
import * as ExploreActionFactory from './ExploreActionFactory';

type Props = {
  recordEntitySetId :string,
  coordinatePropertyTypeId :string,
  displayFullSearchOptions :boolean,
  drawMode :boolean,
  isLoadingResults :boolean,
  results :List<*>,
  selectedEntityKeyIds :Set<*>,
  searchParameters :Map<*, *>,
  geocodedAddresses :List<*>,
  actions :{
    editSearchParameters :(editing :boolean) => void,
    executeSearch :(searchParameters :Object) => void,
    geocodeAddress :(address :string) => void,
    selectAddress :(address :Object) => void,
    selectEntitySet :(entitySet? :Map<*, *>) => void,
    setDrawMode :(drawMode :boolean) => void,
    updateSearchParameters :({ field :string, value :string }) => void
  }
};

type State = {

};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

class ExploreContainer extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {

    };
  }

  componentDidMount() {
    const { actions } = this.props;
    actions.loadDataModel();
  }

  onSearchSubmit = () => {
    const {
      recordEntitySetId,
      coordinatePropertyTypeId,
      searchParameters,
      actions
    } = this.props;
    actions.executeSearch({
      entitySetId: recordEntitySetId,
      propertyTypeId: coordinatePropertyTypeId,
      searchParameters
    });
  }

  setSearchZones = (searchZones) => {
    const { actions } = this.props;
    actions.updateSearchParameters({
      field: PARAMETERS.SEARCH_ZONES,
      value: searchZones
    });
    actions.setDrawMode(false);
  }

  render() {
    const {
      actions,
      displayFullSearchOptions,
      drawMode,
      geocodedAddresses,
      results,
      searchParameters,
      selectedEntityKeyIds
    } = this.props;

    return (
      <Wrapper>
        <SearchParameters
            onInputChange={actions.updateSearchParameters}
            geocodedAddresses={geocodedAddresses}
            geocodeAddress={actions.geocodeAddress}
            selectAddress={actions.selectAddress}
            onSubmit={this.onSearchSubmit}
            values={searchParameters}
            editSearchParameters={actions.editSearchParameters}
            setDrawMode={actions.setDrawMode}
            isTopNav={!displayFullSearchOptions || drawMode} />
        {displayFullSearchOptions ? null : <Sidebar />}
        <SimpleMap
            drawMode={drawMode}
            setDrawMode={actions.setDrawMode}
            setSearchZones={this.setSearchZones}
            searchParameters={searchParameters}
            entities={results}
            selectEntity={actions.selectEntity}
            selectedEntityKeyIds={selectedEntityKeyIds}
            heatmap />
      </Wrapper>
    );
  }
}


function mapStateToProps(state :Map<*, *>) :Object {
  const explore = state.get(STATE.EXPLORE);
  const edm = state.get(STATE.EDM);
  return {
    recordEntitySetId: edm.getIn([EDM.ENTITY_SETS, ENTITY_SETS.RECORDS, 'id']),
    coordinatePropertyTypeId: edm.getIn([EDM.PROPERTY_TYPES, PROPERTY_TYPES.COORDINATE, 'id']),
    displayFullSearchOptions: explore.get(EXPLORE.DISPLAY_FULL_SEARCH_OPTIONS),
    drawMode: explore.get(EXPLORE.DRAW_MODE),
    results: explore.get(EXPLORE.SEARCH_RESULTS),
    selectedEntityKeyIds: explore.get(EXPLORE.SELECTED_ENTITY_KEY_IDS),
    isLoadingResults: explore.get(EXPLORE.IS_SEARCHING_DATA),
    searchParameters: explore.get(EXPLORE.SEARCH_PARAMETERS),
    geocodedAddresses: explore.get(EXPLORE.ADDRESS_SEARCH_RESULTS)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(EdmActionFactory).forEach((action :string) => {
    actions[action] = EdmActionFactory[action];
  });

  Object.keys(EntitySetActionFactory).forEach((action :string) => {
    actions[action] = EntitySetActionFactory[action];
  });

  Object.keys(ExploreActionFactory).forEach((action :string) => {
    actions[action] = ExploreActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ExploreContainer));
