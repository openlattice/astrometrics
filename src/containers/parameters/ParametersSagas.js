/*
 * @flow
 */

import axios from 'axios';
import qs from 'query-string';
import {
  all,
  call,
  put,
  select,
  takeEvery
} from '@redux-saga/core/effects';
import {
  List,
  Map,
  OrderedMap,
  fromJS
} from 'immutable';
import {
  DataApiActions,
  DataApiSagas,
  SearchApiActions,
  SearchApiSagas,
} from 'lattice-sagas';
import type { SequenceAction } from 'redux-reqseq';

import {
  GEOCODE_ADDRESS,
  LOAD_DEPARTMENTS_AND_DEVICES,
  REVERSE_GEOCODE_COORDINATES,
  geocodeAddress,
  loadDepartmentsAndDevices,
  reverseGeocodeCoordinates
} from './ParametersActionFactory';

import { getAppFromState, getEntitySetId } from '../../utils/AppUtils';
import { formatDescriptionIdForDisplay, formatNameIdForDisplay, getEntityKeyId } from '../../utils/DataUtils';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';

declare var __MAPBOX_TOKEN__;

const { getEntitySetData } = DataApiActions;
const { getEntitySetDataWorker } = DataApiSagas;
const { searchEntityNeighborsWithFilter } = SearchApiActions;
const { searchEntityNeighborsWithFilterWorker } = SearchApiSagas;

const SACRAMENTO_LAT_LONG = '-121.4944,38.5816';
const GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function* getGeocodedResults(addressOrCoords) :Generator<*, *, *> {
  if (!addressOrCoords) {
    return [];
  }

  const params = {
    access_token: __MAPBOX_TOKEN__,
    autocomplete: true,
    proximity: SACRAMENTO_LAT_LONG
  };

  const queryString = qs.stringify(params);

  const { data: suggestions } = yield call(axios, {
    method: 'get',
    url: `${GEOCODING_API}/${window.encodeURI(addressOrCoords)}.json?${queryString}`,
  });

  const formattedSuggestions = suggestions.features.map((sugg) => {
    const { place_name: value, geometry } = sugg;
    const { coordinates } = geometry;
    const [lon, lat] = coordinates;
    return {
      ...sugg,
      label: value,
      value,
      lon,
      lat
    };
  });

  return formattedSuggestions;
}

function* geocodeAddressWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(geocodeAddress.request(action.id));
    const results = yield call(getGeocodedResults, action.value);
    yield put(geocodeAddress.success(action.id, results));
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

function* reverseGeocodeCoordinatesWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(reverseGeocodeCoordinates.request(action.id));

    const requestedCoords = action.value;
    const indexedResults = yield all(requestedCoords.toJS().map((coords) => call(getGeocodedResults, coords)));

    let addressesByCoords = Map();
    requestedCoords.forEach((coords, idx) => {
      if (!coords) {
        return;
      }

      const [long, lat] = coords;
      const latLongAsString = `${lat}, ${long}`;
      const resultForCoords = indexedResults[idx];

      let resultStr = '';

      if (resultForCoords && resultForCoords.length) {
        resultStr = resultForCoords[0].label;
      }

      addressesByCoords = addressesByCoords.set(latLongAsString, resultStr);
    });

    yield put(reverseGeocodeCoordinates.success(action.id, fromJS(addressesByCoords)));
  }
  catch (error) {
    yield put(reverseGeocodeCoordinates.failure(action.id, error));
  }
  finally {
    yield put(reverseGeocodeCoordinates.finally(action.id));
  }
}

export function* reverseGeocodeCoordinatesWatcher() :Generator<*, *, *> {
  yield takeEvery(REVERSE_GEOCODE_COORDINATES, reverseGeocodeCoordinatesWorker);
}

const getDataAsMap = (entities, useDescription) => {
  const formatter = useDescription ? formatDescriptionIdForDisplay : formatNameIdForDisplay;
  let map = OrderedMap();

  fromJS(entities).forEach((entity) => {
    const id = entity.getIn([PROPERTY_TYPES.ID, 0]);
    map = map.set(id, formatter(entity));
  });

  return map.sort();
};

function* loadDepartmentsAndDevicesWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(loadDepartmentsAndDevices.request(action.id));

    const app = yield select(getAppFromState);

    const agenciesESID :UUID = getEntitySetId(app, APP_TYPES.AGENCIES);
    const devicesESID :UUID = getEntitySetId(app, APP_TYPES.CAMERAS);

    const departmentsResponse = yield call(
      getEntitySetDataWorker,
      getEntitySetData({ entitySetId: agenciesESID })
    );
    if (departmentsResponse.error) throw departmentsResponse.error;
    const departments :List = fromJS(departmentsResponse.data);

    const agencyEKIDs = [];
    departments.forEach((department :Map) => {
      agencyEKIDs.push(getEntityKeyId(department));
    });

    let deviceEKIDsByAgencyEKID :Map = Map();
    if (agencyEKIDs.length) {
      const response = yield call(searchEntityNeighborsWithFilterWorker, searchEntityNeighborsWithFilter({
        entitySetId: agenciesESID,
        filter: {
          entityKeyIds: agencyEKIDs,
          sourceEntitySetIds: [devicesESID],
          destinationEntitySetIds: [devicesESID]
        },
        idsOnly: true
      }));
      if (response.error) throw response.error;

      deviceEKIDsByAgencyEKID = fromJS(response.data)
        .map((associationESIDToNeighborIdMap :Map) => {
          const deviceEKIDs = List().withMutations((mutator) => {
            associationESIDToNeighborIdMap.forEach((idsByDeviceESID :Map) => {
              const deviceNeighborIdMaps = idsByDeviceESID.get(devicesESID, List());
              deviceNeighborIdMaps.forEach((neighborIdMap :Map) => {
                mutator.push(neighborIdMap.get('neighborId'));
              });
            });
          });
          return deviceEKIDs;
        });
    }

    const deviceEKIDs = [];
    deviceEKIDsByAgencyEKID.forEach((agencyDeviceEKIDs) => {
      agencyDeviceEKIDs.forEach((agencyDeviceEKID :UUID) => {
        deviceEKIDs.push(agencyDeviceEKID);
      });
    });

    const devicesResponse = yield call(
      getEntitySetDataWorker,
      getEntitySetData({ entitySetId: devicesESID, entityKeyIds: deviceEKIDs })
    );
    if (devicesResponse.error) throw devicesResponse.error;
    const devices :List = fromJS(devicesResponse.data);
    const deviceByDeviceEKID :Map = Map().withMutations((mutator) => {
      devices.forEach((device :Map) => {
        mutator.set(getEntityKeyId(device), device);
      });
    });

    const devicesByAgency = Map().withMutations((mutator) => {
      departments.forEach((agency :Map) => {

        const agencyId = agency.getIn([PROPERTY_TYPES.ID, 0]);
        const agencyEKID = getEntityKeyId(agency);

        const deviceIds :List = List().withMutations((listMutator) => {
          deviceEKIDsByAgencyEKID.get(agencyEKID, List()).forEach((deviceEKID :UUID) => {
            const device :Map = deviceByDeviceEKID.get(deviceEKID, Map());
            const deviceId = device.getIn([PROPERTY_TYPES.ID, 0]);
            listMutator.push(deviceId);
          });
        });

        mutator.set(agencyId, deviceIds);
      });
    });

    yield put(loadDepartmentsAndDevices.success(action.id, {
      departmentOptions: getDataAsMap(departments),
      deviceOptions: getDataAsMap(devices, true),
      devicesByAgency
    }));
  }

  catch (error) {
    console.error(error);
    yield put(loadDepartmentsAndDevices.failure(action.id, error));
  }
  finally {
    yield put(loadDepartmentsAndDevices.finally(action.id));
  }
}

export function* loadDepartmentsAndDevicesWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_DEPARTMENTS_AND_DEVICES, loadDepartmentsAndDevicesWorker);
}
