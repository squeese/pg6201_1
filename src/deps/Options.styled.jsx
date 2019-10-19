import React, { Fragment, useContext } from 'react';
import styled from 'styled-components';
import { Context, Float, Bool, Vector, Dropdown } from './Options.core';

export const InputFloat = ({ header = null, ...props }) => (
  <Fragment>
    {header && <Label>{header}</Label>}
    <Float {...props}>
      {props => <Input {...props} />}
    </Float>
  </Fragment>
);

export const InputBool = ({ header = null, ...props }) => (
  <Fragment>
    {header && <Label>{header}</Label>}
    <Row>
      <Bool {...props}>
        {props => (
          <div style={{ background: '#1244', flex: '1 0 auto' }}>
            <input type="checkbox" {...props} />
          </div>
        )}
      </Bool>
    </Row>
  </Fragment>
);

export const InputDropdown = ({ header = null, ...props }) => (
  <Fragment>
    {header && <Label>{header}</Label>}
    <Row>
      <Dropdown {...props}>
        {props => <Select {...props} />}
      </Dropdown>
    </Row>
  </Fragment>
);

export const InputVector = ({ header = null, name, value, ...props }) => (
  <Fragment>
    {header && <Label>{header}</Label>}
    <Row>
      <Vector name={name} value={value}>
        {(value, index) => <InputFloat key={index} {...props} name={index} value={value} />}
      </Vector>
    </Row>
  </Fragment>
);

export const Json = () => {
  const { state } = useContext(Context);
  return <Pre>{JSON.stringify(state, null, 3)}</Pre>;
};

export const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 256px;
  background: #124A;
  overflow-y: scroll;
`;

export const Wrapper = styled.div`
  color: white;
  display: grid;
  grid-template-columns: 4fr 3fr; 
  padding: 0 1px 1px 0;
`;

export const Header = styled.h1`
  font-size: 0.7rem;
  font-weight: bold;
  color: #0004;
  grid-column: 1 / 3;
  margin: 0;
  padding: 0.25rem 0 0 0.45rem;
  display: flex;
  flex-direction: row;
  & > span { flex: 1 0 auto; }
  & > button {
    flex: 0 1 auto;
    border: 0;
    background: #2358;
  }
`;

export const Label = styled.h2`
  font-size: 0.65rem;
  font-weight: normal;
  padding: 0;
  margin: 0;
  padding-left: 0.5rem;
  background: #0004;
`;

export const Input = styled.input`
  border: 0;
  color: white;
  background: ${props => props.invalid ? 'red' : '#0003'};
  padding: 0.1rem 0.25rem;
  font-size: 0.6rem;
  border-left: 1px solid #1244;
  border-top: 1px solid #1244;
  box-shadow: 1px 1px 0px 0px #1244;
  opacity: ${props => props.disabled ? '0.1' : '1.0'};
`;

export const Select = styled.select`
  border: 0;
  font-size: 0.6rem;
  border-left: 1px solid #1244;
  border-top: 1px solid #1244;
  box-shadow: 1px 1px 0px 0px #1244;
  flex: 1 0 auto;
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  & > input {
    min-width: 0;
    width: 0;
    flex: 1 0 auto;
  }
`;

export const Grid = styled.div`
  display: grid;
`;

export const Pre = styled.pre`
  color: white;
  padding: 0.5rem;
  grid-column: 1 / 3;
`;