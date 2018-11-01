/*
 * @flow
 */

import React from 'react';
import Immutable from 'immutable';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { faDatabase } from '@fortawesome/pro-solid-svg-icons';

import StyledInput from '../../components/controls/StyledInput';
import StyledLink from '../../components/controls/StyledLink';
import EntitySetCard from '../../components/cards/EntitySetCard';
import LoadingSpinner from '../../components/spinner/Spinner';
import { ENTITY_SETS, STATE } from '../../utils/constants/StateConstants';
import * as Routes from '../../core/router/Routes';
import * as EntitySetActionFactory from './EntitySetActionFactory';

type Props = {
  actionText :string,
  history :string[],
  isLoadingEntitySets :boolean,
  entitySetSearchResults :Immutable.List<*>,
  actions :{
    searchEntitySets :({
      searchTerm :string,
      start :number,
      maxHits :number
    }) => void,
    selectEntitySet :(entitySet? :Immutable.Map<*, *>) => void
  }
};

type State = {
  temp :boolean
};

const HeaderContainer = styled.div`
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

const HeaderContent = styled.div`
  width: 560px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px 0;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  display: flex;
  flex-direction: row;

  span {
    margin-left: 20px;
    color: #b6bbc7;

    &:last-child {
      margin-left: 10px;
    }
  }
`;

const Subtitle = styled.div`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  text-align: center;
  color: #8e929b;
  margin: 15px 0 50px 0;
`;

const ResultsContainer = styled.div`
  padding: 30px 155px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const MAX_ENTITY_SET_HITS = 24;

class EntitySetSearch extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      searchTerm: ''
    };

    this.searchTimeout = null;
  }

  handleInputChange = (e :SyntheticEvent) => {
    this.setState({ searchTerm: e.target.value });

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.props.actions.searchEntitySets({
        searchTerm: this.state.searchTerm,
        start: 0,
        maxHits: MAX_ENTITY_SET_HITS
      })
    }, 500);
  }

  handleSelect = (entitySetObj) => {
    const { actions } = this.props;
    const entitySet = entitySetObj.get('entitySet', Immutable.Map());
    actions.selectEntitySet(entitySet);
  }

  renderResults = () => {
    const { isLoadingEntitySets, entitySetSearchResults, actions } = this.props;
    if (isLoadingEntitySets) {
      return <LoadingSpinner />;
    }

    return entitySetSearchResults.map(entitySetObj => (
      <EntitySetCard
          key={entitySetObj.getIn(['entitySet', 'id'])}
          entitySet={entitySetObj.get('entitySet', Immutable.Map())}
          onClick={() => this.handleSelect(entitySetObj)} />
    ));
  }

  routeToManage = () => {
    this.props.history.push(Routes.MANAGE);
  }

  render() {
    const { actionText } = this.props;

    return (
      <div>
        <HeaderContainer>
          <HeaderContent>
            <Title>Select a dataset to search</Title>
            <Subtitle>
              {`Choose a dataset you want to ${actionText}. If you
              don't see the dataset you're looking for,
              check`} <StyledLink onClick={this.routeToManage}>Data Management</StyledLink>
            </Subtitle>
            <StyledInput
                value={this.state.searchTerm}
                placeholder="Search"
                icon={faDatabase}
                onChange={this.handleInputChange} />
          </HeaderContent>
        </HeaderContainer>
        <ResultsContainer>
          {this.renderResults()}
        </ResultsContainer>
      </div>
    );
  }
}

function mapStateToProps(state :Immutable.Map<*, *>) :Object {
  const entitySets = state.get(STATE.ENTITY_SETS);
  return {
    entitySetSearchResults: entitySets.get(ENTITY_SETS.ENTITY_SET_SEARCH_RESULTS),
    isLoadingEntitySets: entitySets.get(ENTITY_SETS.IS_LOADING_ENTITY_SETS)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(EntitySetActionFactory).forEach((action :string) => {
    actions[action] = EntitySetActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EntitySetSearch));
