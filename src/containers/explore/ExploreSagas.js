/*
 * @flow
 */

import axios from 'axios';
import moment from 'moment';
import { Constants, SearchApi } from 'lattice';
import { call, put, takeEvery } from 'redux-saga/effects';

import { getEntityKeyId } from '../../utils/DataUtils';
import { PARAMETERS } from '../../utils/constants/StateConstants';
import {
  EXECUTE_SEARCH,
  GEOCODE_ADDRESS,
  LOAD_ENTITY_NEIGHBORS,
  executeSearch,
  geocodeAddress,
  loadEntityNeighbors
} from './ExploreActionFactory';

const { OPENLATTICE_ID_FQN } = Constants;

const GEOCODER_URL_PREFIX = 'http://ec2-160-1-30-195.us-gov-west-1.compute.amazonaws.com/nominatim/search/';
const GEOCODER_URL_SUFFIX = '?format=json';

function* geocodeAddressWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(geocodeAddress.request(action.id));

    const response = yield call(axios, {
      method: 'get',
      url: `${GEOCODER_URL_PREFIX}${window.encodeURI(action.value)}${GEOCODER_URL_SUFFIX}`
    });

    yield put(geocodeAddress.success(action.id, response.data));
  }
  catch (error) {
    yield put(geocodeAddress.failure(action.id, error));
  }
  finally {
    yield put(geocodeAddress.finally(action.id));
  }
}

export function* geocodeAddressWatcher() :Generator<*, *, *> {
  yield takeEvery(GEOCODE_ADDRESS, geocodeAddressWorker);
}

function* loadEntityNeighborsWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    const { entitySetId, entityKeyIds } = action.value;
    yield put(loadEntityNeighbors.request(action.id, action.value));

    const neighborsById = yield call(SearchApi.searchEntityNeighborsBulk, entitySetId, entityKeyIds);
    yield put(loadEntityNeighbors.success(action.id, neighborsById));
  }
  catch (error) {
    console.error(error);
    yield put(loadEntityNeighbors.failure(action.id, error));
  }
  finally {
    yield put(loadEntityNeighbors.finally(action.id));
  }
}

export function* loadEntityNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_ENTITY_NEIGHBORS, loadEntityNeighborsWorker);
}

const getSearchRequest = (
  entitySetId,
  timestampPropertyTypeId,
  coordinatePropertyTypeId,
  searchParameters
) => {
  const baseSearch = {
    entitySetIds: [entitySetId],
    start: 0,
    maxHits: 3000
  };

  const constraintGroups = [];

  /* handle time constraints */
  const start = moment(searchParameters.get(PARAMETERS.START));
  const end = moment(searchParameters.get(PARAMETERS.END));
  const startStr = start.isValid() ? start.toISOString(true) : '*';
  const endStr = end.isValid() ? end.toISOString(true) : '*';
  if (startStr.length > 1 || endStr.length > 1) {
    constraintGroups.push({
      constraints: [{
        type: 'simple',
        searchTerm: `${timestampPropertyTypeId}:[${startStr} TO ${endStr}]`
      }]
    });
  }

  const zones = searchParameters.get(PARAMETERS.SEARCH_ZONES, []);

  /* handle geo polygon constraints */
  if (zones.length) {
    constraintGroups.push({
      min: 2,
      constraints: [{
        type: 'geoPolygon',
        propertyTypeId: coordinatePropertyTypeId,
        zones
      }]
    });
  }

  /* handle geo radius + distance constraints */
  else {
    const latitude = searchParameters.get(PARAMETERS.LATITUDE);
    const longitude = searchParameters.get(PARAMETERS.LONGITUDE);
    const radius = searchParameters.get(PARAMETERS.RADIUS);
    const unit = 'miles';

    constraintGroups.push({
      constraints: [{
        type: 'geoDistance',
        propertyTypeId: coordinatePropertyTypeId,
        latitude,
        longitude,
        radius,
        unit
      }]
    });
  }

  return Object.assign({}, baseSearch, { constraints: constraintGroups });
};

function* executeSearchWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(executeSearch.request(action.id));
    const {
      entitySetId,
      timestampPropertyTypeId,
      coordinatePropertyTypeId,
      searchParameters
    } = action.value;

    const results = yield call(SearchApi.executeSearch, getSearchRequest(
      entitySetId,
      timestampPropertyTypeId,
      coordinatePropertyTypeId,
      searchParameters
    ));

    yield put(executeSearch.success(action.id, results));

    yield put(loadEntityNeighbors({
      entitySetId,
      entityKeyIds: results.hits.map(entity => entity[OPENLATTICE_ID_FQN][0])
    }));
  }
  catch (error) {
    console.error(error)
    yield put(executeSearch.failure(action.id, error));
  }
  finally {
    yield put(executeSearch.finally(action.id));
  }
}

export function* executeSearchWatcher() :Generator<*, *, *> {
  yield takeEvery(EXECUTE_SEARCH, executeSearchWorker);
}
