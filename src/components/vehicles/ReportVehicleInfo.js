/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';

import { getCoordinates, getValue, getDisplayNameForId } from '../../utils/DataUtils';
import { getMapImgUrlAtSize } from '../../utils/MapUtils';
import { PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';

type Props = {
  read :Map<*, *>,
  departmentOptions :Map,
  deviceOptions :Map
};

const Card = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  height: 130px;

  article {
    width: 49%;
    max-width: 280px;
    height: 100%;
  }
`;

const Photos = styled.article`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  article:first-child {
    width: 65%;
    height: 100%;

    img {
      max-height: 100%;
      max-width: 100%;
    }
  }

  article:last-child {
    width: 33%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    img {
      max-height: 49%;
      max-width: 100%;
    }
  }
`;

const Details = styled.article`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  article {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    line-height: 150%;
    font-weight: 500;
    color: #ffffff;

    span {
      color: #807F85;
    }
  }
`;

const ReportVehicleInfo = ({
  read,
  departmentOptions,
  deviceOptions
} :Props) => {

  const vehicleSrc = read.getIn([PROPERTY_TYPES.VEHICLE_IMAGE, 0]);
  const plateSrc = read.getIn([PROPERTY_TYPES.LICENSE_PLATE_IMAGE, 0]);

  let makeModel = getValue(read, PROPERTY_TYPES.MAKE);
  const model = getValue(read, PROPERTY_TYPES.MODEL);
  if (model) {
    if (makeModel) {
      makeModel = `${makeModel} ${model}`;
    }
    else {
      makeModel = model;
    }
  }
  const color = getValue(read, PROPERTY_TYPES.COLOR);

  const department = getDisplayNameForId(departmentOptions, getValue(read, PROPERTY_TYPES.AGENCY_NAME));
  const device = getDisplayNameForId(deviceOptions, getValue(read, PROPERTY_TYPES.CAMERA_ID));

  const [long, lat] = getCoordinates(read);

  return (
    <Card>

      <Photos>
        <article>
          <img src={getMapImgUrlAtSize(lat, long, 200, 150)} />
        </article>
        <article>
          <img src={plateSrc} />
          <img src={vehicleSrc} />
        </article>
      </Photos>

      <Details>
        <article>
          <span>Make/model</span>
          <div>{makeModel}</div>
        </article>
        <article>
          <span>Color</span>
          <div>{color}</div>
        </article>
        <article>
          <span>Department</span>
          <div>{department}</div>
        </article>
        <article>
          <span>Device</span>
          <div>{device}</div>
        </article>
      </Details>

    </Card>
  );
};

export default ReportVehicleInfo;