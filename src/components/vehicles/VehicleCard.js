/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/pro-light-svg-icons';

import { PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';

type Props = {
  vehicle :Map<*, *>,
  count :number,
  isUnselected :boolean,
  onClick: () => void
};

const Card = styled.div`
  background-color: #ffffff;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  opacity: ${props => (props.isUnselected ? 0.75 : 1)};

  &:hover {
    cursor: pointer;
  }
`;

const Photos = styled.div`
  width: 100px;
  display: flex;
  flex-direction: column;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  font-size: 14px;
  color: #000000;
`;

const DetailsHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 15px;

  section {
    display: flex;
    flex-direction: column;

    span {
      font-size: 14px;
      font-weight: 300;
      margin-bottom: 5px;
    }

    span:last-child {
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 2px;
    }
  }

  button {
    border-radius: 3px;
    background-color: #f0f0f7;
    height: 30px;
    padding: 0 10px;
    border: none;
    color: #b7bbc6;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    span {
      color: #414345;
      margin-left: 5px;
      font-size: 12px;
      font-weight: 400;
    }

    &:hover {
      background-color: #dcdce7;
      cursor: pointer;
    }

    &:focus {
      outline: none;
    }
  }
`;

const DetailsBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  section {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;

    span {
      width: 100px;
      color: rgb(145, 145, 145);
      font-weight: 300;
    }

    div {
      font-weight: 600;
    }
  }

  section:not(:last-child) {
    border-bottom: 1px solid rgb(220, 220, 230);
    padding-bottom: 6px;
    margin-bottom: 6px;
  }
`;

const VehicleCard = ({
  vehicle,
  count,
  onClick,
  isUnselected
} :Props) => {

  const make = vehicle.getIn([PROPERTY_TYPES.MAKE, 0], '');
  const model = vehicle.getIn([PROPERTY_TYPES.MODEL, 0], '');
  const year = vehicle.getIn([PROPERTY_TYPES.YEAR, 0], '');
  const plate = vehicle.getIn([PROPERTY_TYPES.PLATE, 0], '');
  const state = vehicle.getIn([PROPERTY_TYPES.STATE, 0], 'California');

  const addToReport = (e) => {
    e.stopPropagation();
    console.log('add to report!')
  }

  return (
    <Card onClick={onClick} isUnselected={isUnselected}>
      <Photos>

      </Photos>
      <Details>
        <DetailsHeader>
          <section>
            <span>{state}</span>
            <span>{plate}</span>
          </section>
          <button onClick={addToReport}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Add to report</span>
          </button>
        </DetailsHeader>
        <DetailsBody>
          <section>
            <span>Make / Model</span>
            <div>{`${make} ${model}`}</div>
          </section>
          <section>
            <span>Timestamp</span>
            <div>12/13/18 01:23 AM</div>
          </section>
          <section>
            <span>Dept / Device</span>
            <div>OPD / Device name</div>
          </section>
        </DetailsBody>
      </Details>
    </Card>
  );
}

export default VehicleCard;
