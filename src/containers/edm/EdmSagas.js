/*
 * @flow
 */

import { EntityDataModelApi } from 'lattice';
import { Map, fromJS } from 'immutable';
import {
  all,
  call,
  put,
  takeEvery
} from 'redux-saga/effects';

import { getFqnString } from '../../utils/DataUtils';
import {
  LOAD_DATA_MODEL,
  loadDataModel
} from './EdmActionFactory';

import { ENTITY_SETS } from '../../utils/constants/DataModelConstants';


const getProjectionRequest = id => ({
  id,
  type: 'EntitySet',
  include: ['EntitySet', 'PropertyTypeInEntitySet']
});

function* loadDataModelWorker(action :SequenceAction) {
  try {
    yield put(loadDataModel.request(action.id));
    const [recordEntitySetId, carsEntitySetId] = yield all([
      call(EntityDataModelApi.getEntitySetId, ENTITY_SETS.RECORDS),
      call(EntityDataModelApi.getEntitySetId, ENTITY_SETS.CARS)
    ]);
    const projection = yield call(EntityDataModelApi.getEntityDataModelProjection, [
      getProjectionRequest(recordEntitySetId),
      getProjectionRequest(carsEntitySetId)
    ]);

    let entitySets = Map();
    let propertyTypes = Map();

    fromJS(projection.entitySets).forEach((entitySet) => {
      entitySets = entitySets.set(entitySet.get('name'), entitySet);
    });

    fromJS(projection.propertyTypes).forEach((propertyType) => {
      propertyTypes = propertyTypes.set(getFqnString(propertyType.get('type')), propertyType);
    });

    yield put(loadDataModel.success(action.id, { entitySets, propertyTypes }));
  }
  catch (error) {
    yield put(loadDataModel.failure(action.id, error));
  }
  finally {
    yield put(loadDataModel.finally(action.id));
  }
}

export function* loadDataModelWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_DATA_MODEL, loadDataModelWorker);
}
