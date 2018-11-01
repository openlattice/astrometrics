/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { List, Map, Set } from 'immutable';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import VehicleCard from '../../components/vehicles/VehicleCard';
import {
  EDM,
  STATE,
  EXPLORE
} from '../../utils/constants/StateConstants';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';
import { getEntityKeyId } from '../../utils/DataUtils';
import * as EdmActionFactory from '../edm/EdmActionFactory';
import * as EntitySetActionFactory from '../entitysets/EntitySetActionFactory';
import * as ExploreActionFactory from './ExploreActionFactory';

type Props = {
  recordEntitySetId :string,
  coordinatePropertyTypeId :string,
  displayFullSearchOptions :boolean,
  isLoadingResults :boolean,
  results :List<*>,
  selectedEntityKeyIds :Set<*>,
  neighborsById :List<*>,
  searchParameters :Map<*, *>,
  geocodedAddresses :List<*>,
  actions :{
    editSearchParameters :(editing :boolean) => void,
    executeSearch :(searchParameters :Object) => void,
    geocodeAddress :(address :string) => void,
    selectAddress :(address :Object) => void,
    selectEntity :(entityKeyId :string) => void,
    selectEntitySet :(entitySet? :Map<*, *>) => void,
    updateSearchParameters :({ field :string, value :string }) => void
  }
};

type State = {

};

const SidebarWrapper = styled.div`
  position: absolute;
  z-index: 1;
  right: 0;
  width: 500px;
  padding: 100px 30px 30px 30px;
  background-color: rgba(26, 16, 59, 0.9);
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #ffffff;

  h1 {
    font-size: 20px;
    font-weight: 400;
  }
`;

const FilterBar = styled.div`
  margin: 10px 0 20px 0;
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const FilterGroup = styled.div`
  width: 50%;
  display: flex;
  flex-direction: row;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;

  span {
    font-weight: 300;
    margin-right: 10px;
  }
`;

const VehicleListWrapper = styled.div`
  height: 100%;
  overflow-y: scroll;
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

class Sidebar extends React.Component<Props, State> {

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
      timestampPropertyTypeId,
      coordinatePropertyTypeId,
      searchParameters,
      actions
    } = this.props;
    actions.executeSearch({
      entitySetId: recordEntitySetId,
      timestampPropertyTypeId,
      coordinatePropertyTypeId,
      searchParameters
    });
  }

  renderFilters = () => {
    return (
      <FilterBar>
        <FilterGroup>
          <span>Sort by: </span>
          <div>Relevance</div>
        </FilterGroup>
        <FilterGroup>
          <span>Filter: </span>
          <div>Stolen vehicles</div>
        </FilterGroup>
      </FilterBar>
    )
  }

  getVehicleList = () => {
    const { results, neighborsById } = this.props;

    let counts = Map();
    let seen = Set();
    const vehicleList = results.flatMap((record) => {
      return neighborsById.get(getEntityKeyId(record), List())
    }).filter(neighbor => neighbor.getIn(['neighborEntitySet', 'name']) === ENTITY_SETS.CARS);

    vehicleList.forEach((neighbor) => {
      const entityKeyId = getEntityKeyId(neighbor.get('neighborDetails'));
      seen = seen.add(entityKeyId);
      counts = counts.set(entityKeyId, counts.get(entityKeyId, 0) + 1);
    });

    const vehicles = vehicleList.filter((entity) => {
      const entityKeyId = getEntityKeyId(entity.get('neighborDetails'));
      const shouldInclude = seen.has(entityKeyId);
      seen = seen.delete(entityKeyId);
      return shouldInclude;
    });

    return { vehicles, counts };
  }

  onVehicleClick = (entityKeyId) => {
    const { actions, selectedEntityKeyIds } = this.props;
    const value = selectedEntityKeyIds.has(entityKeyId) ? undefined : entityKeyId;
    actions.selectEntity(value);
  }

  render() {
    const {
      actions,
      displayFullSearchOptions,
      geocodedAddresses,
      results,
      selectedEntityKeyIds,
      searchParameters
    } = this.props;

    const { vehicles, counts } = this.getVehicleList();

    return (
      <SidebarWrapper>
        <h1>{vehicles.size} vehicles found</h1>
        {this.renderFilters()}
        <VehicleListWrapper>
          {vehicles.map((vehicleNeighbor) => {
            const vehicle = vehicleNeighbor.get('neighborDetails', Map());
            const entityKeyId = getEntityKeyId(vehicle);
            return (
              <VehicleCard
                  key={entityKeyId}
                  isUnselected={selectedEntityKeyIds.size && !selectedEntityKeyIds.has(entityKeyId)}
                  onClick={() => this.onVehicleClick(entityKeyId)}
                  vehicle={vehicle}
                  count={counts.get(entityKeyId)} />
            );
          })}
        </VehicleListWrapper>
      </SidebarWrapper>
    );
  }
}


function mapStateToProps(state :Map<*, *>) :Object {
  const explore = state.get(STATE.EXPLORE);
  const edm = state.get(STATE.EDM);
  return {
    recordEntitySetId: edm.getIn([EDM.ENTITY_SETS, ENTITY_SETS.RECORDS, 'id']),
    timestampPropertyTypeId: edm.getIn([EDM.PROPERTY_TYPES, PROPERTY_TYPES.TIMESTAMP, 'id']),
    coordinatePropertyTypeId: edm.getIn([EDM.PROPERTY_TYPES, PROPERTY_TYPES.COORDINATE, 'id']),
    displayFullSearchOptions: explore.get(EXPLORE.DISPLAY_FULL_SEARCH_OPTIONS),
    results: explore.get(EXPLORE.SEARCH_RESULTS),
    selectedEntityKeyIds: explore.get(EXPLORE.SELECTED_ENTITY_KEY_IDS),
    neighborsById: explore.get(EXPLORE.ENTITY_NEIGHBORS_BY_ID),
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Sidebar));
