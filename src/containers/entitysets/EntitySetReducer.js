/*
 * @flow
 */

import Immutable from 'immutable';

import { ENTITY_SETS } from '../../utils/constants/StateConstants';
import {
  SELECT_ENTITY_SET,
  searchEntitySets
} from './EntitySetActionFactory';

import { UNMOUNT_EXPLORE } from '../explore/ExploreActionFactory';

const {
  ENTITY_SET_SEARCH_RESULTS,
  IS_LOADING_ENTITY_SETS,
  SELECTED_ENTITY_SET
} = ENTITY_SETS;

const INITIAL_STATE :Immutable.Map<> = Immutable.fromJS({
  [IS_LOADING_ENTITY_SETS]: false,
  [ENTITY_SET_SEARCH_RESULTS]: Immutable.List(),
  [SELECTED_ENTITY_SET]: undefined
});

function reducer(state :Immutable.Map<> = INITIAL_STATE, action :Object) {
  switch (action.type) {

    case searchEntitySets.case(action.type): {
      return searchEntitySets.reducer(state, action, {
        REQUEST: () => state.set(IS_LOADING_ENTITY_SETS, true).set(ENTITY_SET_SEARCH_RESULTS, Immutable.List()),
        SUCCESS: () => state.set(ENTITY_SET_SEARCH_RESULTS, Immutable.fromJS(action.value.hits)),
        FAILURE: () => state.set(ENTITY_SET_SEARCH_RESULTS, Immutable.List()),
        FINALLY: () => state.set(IS_LOADING_ENTITY_SETS, false)
      });
    }

    case SELECT_ENTITY_SET:
      return state.set(SELECTED_ENTITY_SET, action.value);

    case UNMOUNT_EXPLORE:
      return INITIAL_STATE;

    default:
      return state;
  }
}

export default reducer;
