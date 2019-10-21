import React from 'react';
import styled from 'styled-components';
import presets from './presets.json';

const loadConfig = name => () => {
  window.sessionStorage.setItem("PG6201Config", JSON.stringify(presets[name]));
  setTimeout(() => window.location.reload(), 0);
};

const reset = () => {
  window.sessionStorage.removeItem("PG6201Config");
  setTimeout(() => window.location.reload(), 0);
};

export class OptionsPresets extends React.Component {
  componentDidCatch() {}
  render = () => (
    <Container>
      <Header>Presets</Header>
      <Button onClick={loadConfig("ReflectionOnly")}>Reflection only</Button>
      <Button onClick={loadConfig("ReflectionWithDiffuseSpecular")}>Reflection with Diffuse/Specular</Button>
      <Button onClick={loadConfig("RefractionOnly")}>Refraction Only</Button>
      <Button onClick={loadConfig("RefractionOnlyColors")}>Refraction Only (color dispersion)</Button>
      <Button onClick={loadConfig("RefractionDispersionAndEverything")}>Refraction (color dispersion) with Diffuse/Specular</Button>
      <Button onClick={loadConfig("OneWithEverything")}>One with everything</Button>
      <Button onClick={reset}>Reset</Button>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
`;

const Header = styled.h1`
  color: white;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
  text-align: right;
  margin-right: 0.5rem;
`;

const Button = styled.button`
  margin: 0.25rem;
  border: 0;
  background: #446A;
  color: white;
  padding: 0.25rem 0.75rem;
`;