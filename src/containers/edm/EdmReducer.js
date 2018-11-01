/*
 * @flow
 */

import { Map, fromJS } from 'immutable';

import { EDM } from '../../utils/constants/StateConstants';
import { loadDataModel } from './EdmActionFactory';

const {
  ENTITY_SETS,
  IS_LOADING_DATA_MODEL,
  PROPERTY_TYPES
} = EDM;

const INITIAL_STATE :Map<> = fromJS({
  [ENTITY_SETS]: Map(),
  [IS_LOADING_DATA_MODEL]: false,
  [PROPERTY_TYPES]: Map()
});

function reducer(state :Map<> = INITIAL_STATE, action :Object) {
  switch (action.type) {

    case loadDataModel.case(action.type): {
      return loadDataModel.reducer(state, action, {
        REQUEST: () => state.set(IS_LOADING_DATA_MODEL, true),
        SUCCESS: () => state.set(ENTITY_SETS, action.value.entitySets).set(PROPERTY_TYPES, action.value.propertyTypes),
        FINALLY: () => state.set(IS_LOADING_DATA_MODEL, false)
      });
    }

    default:
      return state;
  }
}

export default reducer;
