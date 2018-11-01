/*
 * @flow
 */

import {
  List,
  Map,
  Set,
  fromJS
} from 'immutable';

import { EXPLORE, PARAMETERS } from '../../utils/constants/StateConstants';
import { getEntityKeyId } from '../../utils/DataUtils';
import {
  CLEAR_EXPLORE_SEARCH_RESULTS,
  EDIT_SEARCH_PARAMETERS,
  SELECT_ADDRESS,
  SELECT_ENTITY,
  SET_DRAW_MODE,
  UNMOUNT_EXPLORE,
  UPDATE_SEARCH_PARAMETERS,
  executeSearch,
  geocodeAddress,
  loadEntityNeighbors
} from './ExploreActionFactory';

const {
  DISPLAY_FULL_SEARCH_OPTIONS,
  DRAW_MODE,
  ENTITY_NEIGHBORS_BY_ID,
  ENTITIES_BY_ID,
  IS_LOADING_ENTITY_NEIGHBORS,
  IS_SEARCHING_DATA,
  SEARCH_PARAMETERS,
  SELECTED_ENTITY_KEY_IDS,
  ADDRESS_SEARCH_RESULTS,
  SEARCH_RESULTS,
  TOTAL_RESULTS
} = EXPLORE;

const {
  CASE_NUMBER,
  REASON,
  PLATE,
  ADDRESS,
  LATITUDE,
  LONGITUDE,
  RADIUS,
  SEARCH_ZONES,
  START,
  END,
  DEPARTMENT,
  DEVICE
} = PARAMETERS;

const INITIAL_SEARCH_PARAMETERS :Map<> = fromJS({
  [CASE_NUMBER]: '',
  [REASON]: '',
  [PLATE]: '',
  [ADDRESS]: '',
  [LATITUDE]: '',
  [LONGITUDE]: '',
  [RADIUS]: '',
  [SEARCH_ZONES]: [],
  [START]: '',
  [END]: '',
  [DEPARTMENT]: '',
  [DEVICE]: ''
});

const INITIAL_STATE :Map<> = fromJS({
  [DISPLAY_FULL_SEARCH_OPTIONS]: true,
  [DRAW_MODE]: false,
  [ENTITY_NEIGHBORS_BY_ID]: Map(),
  [ENTITIES_BY_ID]: Map(),
  [IS_LOADING_ENTITY_NEIGHBORS]: false,
  [IS_SEARCHING_DATA]: false,
  [SEARCH_PARAMETERS]: INITIAL_SEARCH_PARAMETERS,
  [ADDRESS_SEARCH_RESULTS]: List(),
  [SEARCH_RESULTS]: List(),
  [SELECTED_ENTITY_KEY_IDS]: Set(),
  [TOTAL_RESULTS]: 0
});

const updateEntitiesIdForNeighbors = (initEntitiesById, neighborLists) => {
  let entitiesById = initEntitiesById;
  neighborLists.forEach((neighborList) => {
    neighborList.forEach((neighborObj) => {
      const association = neighborObj.get('associationDetails', Map());
      const neighbor = neighborObj.get('neighborDetails', Map());
      if (association) {
        const associationEntityKeyId = getEntityKeyId(association);
        entitiesById = entitiesById.set(
          associationEntityKeyId,
          entitiesById.get(associationEntityKeyId, Map()).merge(association)
        );
      }
      if (neighbor) {
        const neighborEntityKeyId = getEntityKeyId(neighbor);
        entitiesById = entitiesById.set(
          neighborEntityKeyId,
          entitiesById.get(neighborEntityKeyId, Map()).merge(neighbor)
        );
      }
    });
  });

  return entitiesById;
};

function reducer(state :Map<> = INITIAL_STATE, action :Object) {
  switch (action.type) {

    case geocodeAddress.case(action.type): {
      return geocodeAddress.reducer(state, action, {
        SUCCESS: () => state.set(ADDRESS_SEARCH_RESULTS, fromJS(action.value))
      });
    }

    case loadEntityNeighbors.case(action.type): {
      return loadEntityNeighbors.reducer(state, action, {
        REQUEST: () => state.set(IS_LOADING_ENTITY_NEIGHBORS, true),
        SUCCESS: () => {
          const neighborsById = fromJS(action.value);

          const entitiesById = updateEntitiesIdForNeighbors(state.get(ENTITIES_BY_ID), neighborsById.valueSeq());

          return state
            .set(ENTITY_NEIGHBORS_BY_ID, state.get(ENTITY_NEIGHBORS_BY_ID).merge(neighborsById))
            .set(ENTITIES_BY_ID, entitiesById);
        },
        FINALLY: () => state.set(IS_LOADING_ENTITY_NEIGHBORS, false)
      });
    }

    case executeSearch.case(action.type): {
      return executeSearch.reducer(state, action, {
        REQUEST: () => state
          .set(IS_SEARCHING_DATA, true)
          .set(SEARCH_RESULTS, List())
          .set(TOTAL_RESULTS, 0)
          .set(DISPLAY_FULL_SEARCH_OPTIONS, false),
        SUCCESS: () => {
          const { hits, numHits } = action.value;
          const results = fromJS(hits);
          let entitiesById = state.get(ENTITIES_BY_ID);
          results.forEach((result) => {
            entitiesById = entitiesById.set(getEntityKeyId(result), result);
          });
          return state
            .set(SEARCH_RESULTS, results)
            .set(ENTITIES_BY_ID, entitiesById)
            .set(TOTAL_RESULTS, numHits);
        },
        FAILURE: () => state.set(SEARCH_RESULTS, List()).set(TOTAL_RESULTS, 0),
        FINALLY: () => state.set(IS_SEARCHING_DATA, false)
      });
    }

    case EDIT_SEARCH_PARAMETERS:
      return state.set(DISPLAY_FULL_SEARCH_OPTIONS, action.value);

    case SELECT_ADDRESS:
      return state
        .setIn([SEARCH_PARAMETERS, LATITUDE], action.value.get('lat'))
        .setIn([SEARCH_PARAMETERS, LONGITUDE], action.value.get('lon'))
        .setIn([SEARCH_PARAMETERS, ADDRESS], action.value.get('display_name'));

    case SELECT_ENTITY: {
      let selectedEntityKeyIds = Set();

      if (action.value) {
        selectedEntityKeyIds = selectedEntityKeyIds.add(action.value);
        let idsToMatch = Set().add(action.value);
        if (state.get(ENTITY_NEIGHBORS_BY_ID).has(action.value)) {
          state.getIn([ENTITY_NEIGHBORS_BY_ID, action.value], List()).forEach((neighborObj) => {
            const entityKeyId = getEntityKeyId(neighborObj.get('neighborDetails', Map()));
            if (entityKeyId) {
              selectedEntityKeyIds = selectedEntityKeyIds.add(entityKeyId);
              idsToMatch = idsToMatch.add(entityKeyId);
            }
          });
        }

        state.get(ENTITY_NEIGHBORS_BY_ID).entrySeq().forEach(([entityKeyId, neighborList]) => {
          neighborList.forEach((neighbor) => {
            if (idsToMatch.has(getEntityKeyId(neighbor.get('neighborDetails', Map())))) {
              selectedEntityKeyIds = selectedEntityKeyIds.add(entityKeyId);
            }
          });
        });
      }

      return state.set(SELECTED_ENTITY_KEY_IDS, selectedEntityKeyIds);
    }

    case SET_DRAW_MODE:
      return state.set(DRAW_MODE, action.value);

    case UPDATE_SEARCH_PARAMETERS:
      return state.setIn([SEARCH_PARAMETERS, action.value.field], action.value.value);

    case CLEAR_EXPLORE_SEARCH_RESULTS:
    case UNMOUNT_EXPLORE:
      return state
        .set(DISPLAY_FULL_SEARCH_OPTIONS, true)
        .set(IS_LOADING_ENTITY_NEIGHBORS, false)
        .set(IS_SEARCHING_DATA, false)
        .set(SEARCH_RESULTS, List())
        .set(TOTAL_RESULTS, 0);

    default:
      return state;
  }
}

export default reducer;
