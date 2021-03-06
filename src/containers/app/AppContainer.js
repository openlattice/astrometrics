/*
 * @flow
 */

import React, { Component } from 'react';

import styled from 'styled-components';
import { Map } from 'immutable';
import {
  LatticeLuxonUtils,
  MuiPickersUtilsProvider,
  ThemeProvider,
  darkTheme,
} from 'lattice-ui-kit';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { bindActionCreators } from 'redux';
import type { RequestSequence } from 'redux-reqseq';

import AppHeaderContainer from './AppHeaderContainer';
import { loadApp } from './AppActions';

import AuditContainer from '../audit/AuditContainer';
import EulaContainer from '../eula/EulaContainer';
import ExploreContainer from '../explore/ExploreContainer';
import QualityContainer from '../quality/QualityContainer';
import Spinner from '../../components/spinner/Spinner';
import * as Routes from '../../core/router/Routes';
import { APP_CONTAINER_WIDTH, HEADER_HEIGHT } from '../../core/style/Sizes';
import { termsAreAccepted } from '../../utils/CookieUtils';
import { APP_NAME } from '../../utils/constants/Constants';
import { APP, STATE } from '../../utils/constants/StateConstants';

const AppContainerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  min-width: ${APP_CONTAINER_WIDTH}px;
  padding: ${HEADER_HEIGHT}px 0 0 0;
`;

const AppContentOuterWrapper = styled.main`
  background-color: #1f1e24;
  display: flex;
  flex: 1 0 auto;
  justify-content: center;
  position: relative;
`;

const AppContentInnerWrapper = styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
`;

type Props = {
  actions :{
    loadApp :RequestSequence;
    loadDepartmentsAndDevices :RequestSequence;
  };
  isLoadingApp :boolean;
  isAdmin :boolean;
};

class AppContainer extends Component<Props> {

  componentDidMount() {

    const { actions } = this.props;
    actions.loadApp(APP_NAME);
  }

  renderAppContent = () => {

    const { isLoadingApp, isAdmin } = this.props;
    if (isLoadingApp) {
      return (
        <Spinner />
      );
    }

    if (!termsAreAccepted()) {
      return <EulaContainer />;
    }

    return (
      <Switch>
        <Route path={Routes.EXPLORE} component={ExploreContainer} />
        {
          isAdmin ? (
            <>
              <Route path={Routes.AUDIT} component={AuditContainer} />
              <Route path={Routes.QUALITY} component={QualityContainer} />
            </>
          ) : null
        }
        <Redirect to={Routes.EXPLORE} />
      </Switch>
    );
  }

  render() {

    return (
      <ThemeProvider theme={darkTheme}>
        <MuiPickersUtilsProvider utils={LatticeLuxonUtils}>
          <AppContainerWrapper>
            <AppHeaderContainer />
            <AppContentOuterWrapper>
              <AppContentInnerWrapper>
                { this.renderAppContent() }
              </AppContentInnerWrapper>
            </AppContentOuterWrapper>
          </AppContainerWrapper>
      </MuiPickersUtilsProvider>
      </ThemeProvider>
    );
  }
}

function mapStateToProps(state :Map<*, *>) :Object {

  return {
    isLoadingApp: state.getIn(['app', 'isLoadingApp'], false),
    isAdmin: state.getIn([STATE.APP, APP.IS_ADMIN], false)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {

  return {
    actions: bindActionCreators({ loadApp }, dispatch)
  };
}

export default connect<*, *, *, *, *, *>(mapStateToProps, mapDispatchToProps)(AppContainer);
