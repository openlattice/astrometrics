import React from 'react';
import styled from 'styled-components';

type Props = {

};

const SearchParameterWrapper = styled.div`
  width: 100%;
  position: fixed;
  top: 0;
  background-color: #000000;
  opacity: 0.5;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

class SearchParametersFilterBar extends React.Component<Props> {

  constructor(props :Props) {
    super(props);
    this.state - {

    }
  }

  render() {
    return (
      <SearchParameterWrapper>hi</SearchParameterWrapper>
    );
  }
}

export default SearchParametersFilterBar;
