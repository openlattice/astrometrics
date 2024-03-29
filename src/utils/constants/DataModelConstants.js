/*
 * @flow
 */

export const APP_NAME = 'astrometrics';

export const APP_TYPES = {
  RECORDS: 'app.vehiclerecord',
  CAMERAS: 'app.camera',
  LOCATIONS: 'app.location',
  AGENCIES: 'app.agencies',
  STANDARDIZED_AGENCIES: 'app.standardizedagencies',
  CONFIDENCE_METRICS: 'app.confidencemetrics',
  HITS: 'app.infractions',
  HOTLIST_VEHICLES: 'app.hotlistvehicles',
  HOTLIST_READS: 'app.hotlistreads',
  RECORDED_BY: 'app.recordedby',
  CARS: 'app.vehicle',
  USERS: 'app.staff',
  REGISTERED_FOR: 'app.registeredfor',
  REPORTS: 'app.report',
  SAVED_MAPS: 'app.savedmaps',
  SEARCHES: 'app.searchalert',
  SEARCHED_BY: 'app.searchedby',
  TEMP_DATA_SOURCE_ENUM: 'app.temporarydatasourcesenum',
  SETTINGS: 'app.settings',
};

export const PERSON_ENTITY_TYPE_FQN = 'general.person';

export const SEARCH_PREFIX = 'entity';

export const PROPERTY_TYPES = {
  LATITUDE: 'location.latitude',
  LONGITUDE: 'location.longitude',
  COORDINATE: 'ol.locationcoordinates',

  STATE: 'vehicle.licensestate',
  YEAR: 'vehicle.year',
  COLOR: 'vehicle.color',
  VIN: 'vehicle.vin',
  MAKE: 'vehicle.make',
  MODEL: 'vehicle.model',
  PLATE: 'vehicle.licensenumber',
  VEHICLE_IMAGE: 'ol.vehicleimage',
  LICENSE_PLATE_IMAGE: 'ol.licenseplateimage',
  ACCESSORIES: 'ol.accessories',
  STYLE: 'vehicle.style',
  LABEL: 'ol.label',

  // agency
  NAME: 'ol.name',
  TYPE: 'ol.type',
  ID: 'ol.id',
  AGENCY_NAME: 'ol.agencyname',
  CAMERA_ID: 'ol.resourceid',
  HIT_TYPE: 'ol.description',
  DESCRIPTION: 'ol.description',
  TEXT: 'ol.text',

  TIMESTAMP: 'ol.datelogged',
  CONFIDENCE: 'ol.confidence',

  PERSON_ID: 'nc.SubjectIdentification',
  COMPLETED_DATE_TIME: 'date.completeddatetime',
  LAST_REPORTED_DATE_TIME: 'ol.datetimelastreported',
  END_DATE_TIME: 'ol.datetimeend',
  SEARCH_REASON: 'ol.searchreason',
  CASE_NUMBER: 'criminaljustice.casenumber',
  SEARCH_QUERY: 'ol.searchquery',

  // reports
  REPORT_CREATED_DATE_TIME: 'ol.datetimeadministered',
  REPORT_CREATOR_ID: 'general.id',

  EKID: 'openlattice.@id',
  OL_APP_DETAILS: 'ol.appdetails',
  OL_DATA_SOURCE: 'ol.datasource',
  PUBLIC_SAFETY_AGENCY_NAME: 'publicsafety.agencyname',
};

export const ALERT_TYPES = {
  CUSTOM_VEHICLE_ALERT: 'ALPR_ALERT',
  HOTLIST_ALERT: 'ALPR_HOTLIST_ALERT'
};
