/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { DatePicker } from '@atlaskit/datetime-picker';

import { DATE_FORMAT } from '../../utils/constants/DateTimeConstants';
import InfoButton from '../buttons/InfoButton';

type Props = {
  onConfirm :({ startDate :string, endDate :string }) => void,
  defaultStart :string,
  defaultEnd :string
};

type State = {
  startDate :string,
  endDate :string
}

const InputRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  width: ${props => (props.fullSize ? '100%' : '33%')};
`;

const InputLabel = styled.span`
  color: #8e929b;
  margin-bottom: 10px;
  font-size: 14px;
`;

const DatePickerWrapper = styled.div`
  width: 100%;
`;

const FullWidthInfoButton = styled(InfoButton)`
  width: 100%;
`;

export default class DateRangePicker extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      startDate: props.defaultStart,
      endDate: props.defaultEnd
    };
  }

  render() {
    const { onConfirm } = this.props;
    const { startDate, endDate } = this.state;

    return (
      <InputRow>
        <InputGroup>
          <InputLabel>Date Range Start</InputLabel>
          <DatePickerWrapper>
            <DatePicker
                value={startDate}
                dateFormat={DATE_FORMAT}
                onChange={date => this.setState({ startDate: date })}
                selectProps={{
                  placeholder: DATE_FORMAT,
                }} />
          </DatePickerWrapper>
        </InputGroup>
        <InputGroup>
          <InputLabel>Date Range End</InputLabel>
          <DatePickerWrapper>
            <DatePicker
                value={endDate}
                dateFormat={DATE_FORMAT}
                onChange={date => this.setState({ endDate: date })}
                selectProps={{
                  placeholder: DATE_FORMAT,
                }} />
          </DatePickerWrapper>
        </InputGroup>
        <InputGroup>
          <InputLabel />
          <FullWidthInfoButton onClick={() => onConfirm({ startDate, endDate })}>
            Set Date Range
          </FullWidthInfoButton>
        </InputGroup>
      </InputRow>
    );
  }
}
