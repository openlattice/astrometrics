/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { List, Map } from 'immutable';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { AuthUtils } from 'lattice-auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/pro-regular-svg-icons';

import SubtleButton from '../../components/buttons/SubtleButton';
import {
  STATE,
  ALERTS,
  EDM,
  SEARCH_PARAMETERS,
  SUBMIT
} from '../../utils/constants/StateConstants';
import { APP_TYPES, PROPERTY_TYPES, ALERT_TYPES } from '../../utils/constants/DataModelConstants';
import { getEntitySetId } from '../../utils/AppUtils';
import * as AlertActionFactory from './AlertActionFactory';

type Props = {
  alert :Map,
  expired :boolean,
  actions :{
    expireAlert :Function
  }
}

type State = {
  expanded :boolean
};

const Alert = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  font-size: 14px;
}

  padding: 16px;
  border-bottom: 1px solid #36353B;

  &:first-child {
    border-top: 1px solid #36353B;
  }
`;

const AlertHeaderRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 14px;
  color: ${props => (props.expired ? '#b6bbc7' : '#135')};

  div {
    display: flex;
    flex-direction: row;
    align-items: center;

    &:first-child {

      div {
        color: ${props => (props.expired ? '#807F85' : '#ffffff')};
        font-size: 14px;
        font-weight: 600;
        margin-right: 10px;
      }

      span {
        color: #807F85;
        font-size: 14px;
      }
    }

    &:last-child {

      button {
        margin-left: 10px;
      }

    }
  }
`;

const Icon = styled(FontAwesomeIcon)`
  color: #CAC9CE;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  padding-top: 20px;
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: ${props => props.width || 100}%;
  max-width: ${props => props.width || 100}%;

  span {
    font-size: 11px;
    color: #807F85;
  }

  div {
    font-size: 14px;
    color: #B1B0B6;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;


class AlertRow extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    };
  }

  renderExpandedContent = () => {
    const { alert, expired } = this.props;
    const { expanded } = this.state;

    if (!expanded) {
      return null;
    }

    const { email } = AuthUtils.getUserInfo();

    const alertMetadata = alert.get('alertMetadata', Map());
    const alertType = alert.get('type');

    const emailArray = alert.get('emails', List()).toJS();
    emailArray.unshift(email);

    let expiration = moment(alert.get('expiration', ''));
    let createDate = moment(alertMetadata.get('createDate', ''));

    expiration = expiration.isValid() ? expiration.format('MM/DD/YYYY') : 'Invalid expiration date';
    createDate = createDate.isValid() ? createDate.format('MM/DD/YYYY') : 'Unknown';


    return (
      <>
        <InfoRow>
          <InfoGroup width={25}>
            <span>Created on</span>
            <div>{createDate}</div>
          </InfoGroup>
          <InfoGroup width={25}>
            <span>{`Expire${expired ? 'd' : 's'} on`}</span>
            <div>{expiration}</div>
          </InfoGroup>
          { alertType === ALERT_TYPES.CUSTOM_VEHICLE_ALERT && (
            <InfoGroup width={50}>
              <span>Search reason</span>
              <div>{alertMetadata.get('searchReason')}</div>
            </InfoGroup>
          )}
        </InfoRow>

        <InfoRow>
          <InfoGroup>
            <span>Email alert</span>
            <div>{emailArray.join(', ')}</div>
          </InfoGroup>
        </InfoRow>
      </>
    );

  }

  renderAlertTitle = () => {
    const { alert } = this.props;

    const alertMetadata = alert.get('alertMetadata', Map());
    const alertType = alert.get('type');

    if (alertType === ALERT_TYPES.CUSTOM_VEHICLE_ALERT) {
      return (
        <div>
          <div>{alertMetadata.get('licensePlate')}</div>
          <span>{alertMetadata.get('caseNum')}</span>
        </div>
      );
    }

    if (alertType === ALERT_TYPES.HOTLIST_ALERT) {
      return (
        <div>
          <div>{alertMetadata.get('county')}</div>
          <span>Hotlist Vehicle Alert</span>
        </div>
      );
    }

    return null;
  }

  render() {
    const { actions, alert, expired } = this.props;
    const { expanded } = this.state;

    const icon = expanded ? faChevronUp : faChevronDown;

    return (
      <Alert expired={expired}>
        <AlertHeaderRow>
          {this.renderAlertTitle()}

          <div>
            {expired ? null : <SubtleButton onClick={() => actions.expireAlert(alert.get('id'))}>Expire</SubtleButton>}
            <SubtleButton noHover onClick={() => this.setState({ expanded: !expanded })}>
              <Icon icon={icon} />
            </SubtleButton>
          </div>
        </AlertHeaderRow>

        {this.renderExpandedContent()}

      </Alert>
    );
  }


}

function mapStateToProps(state :Map<*, *>) :Object {
  const app = state.get(STATE.APP);
  const alerts = state.get(STATE.ALERTS);
  const parameters = state.get(STATE.PARAMETERS);
  const edm = state.get(STATE.EDM);
  const submit = state.get(STATE.SUBMIT);

  return {
    readsEntitySetId: getEntitySetId(app, APP_TYPES.RECORDS),
    alerts: alerts.get(ALERTS.ALERT_LIST),
    isLoadingAlerts: alerts.get(ALERTS.IS_LOADING_ALERTS),
    caseNum: alerts.get(ALERTS.CASE_NUMBER),
    searchReason: alerts.get(ALERTS.SEARCH_REASON),
    plate: alerts.get(ALERTS.PLATE),
    expirationDate: alerts.get(ALERTS.EXPIRATION),
    parameters: parameters.get(SEARCH_PARAMETERS.SEARCH_PARAMETERS),
    platePropertyTypeId: edm.getIn([EDM.PROPERTY_TYPES, PROPERTY_TYPES.PLATE, 'id']),
    isSubmitting: submit.get(SUBMIT.SUBMITTING),
    edm
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(AlertActionFactory).forEach((action :string) => {
    actions[action] = AlertActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

// $FlowFixMe
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AlertRow));
