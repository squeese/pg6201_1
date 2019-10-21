import React, { Fragment } from 'react';
import { createBrowserHistory } from 'history';
import styled from 'styled-components';
import presets from './presets.json';


export class OptionsPresets extends React.Component {
  constructor(props) {
    super(props);
    this.history = createBrowserHistory();
    this.history.listen(location => this.setState(this.loadConfig(location)));
    this.state = {
      preset: this.loadConfig(this.history.location),
    };
  }
  componentDidCatch() {}
  loadConfig = location => {
    const name = location.search.slice(1);
    return presets.hasOwnProperty(name) ? presets[name] : null;
  };
  setConfig = name => () => {
    if (name) this.history.push(`?${name}`);
    else this.history.push("");
    this.setState({ preset: this.loadConfig(this.history.location) });
  };
  render = () => (
    <Fragment>
      <Container>
        <Header>Presets</Header>
        <Button onClick={this.setConfig("ReflectionOnly")}>Reflection only</Button>
        <Button onClick={this.setConfig("ReflectionWithDiffuseSpecular")}>Reflection with Diffuse/Specular</Button>
        <Button onClick={this.setConfig("RefractionOnly")}>Refraction Only</Button>
        <Button onClick={this.setConfig("RefractionOnlyColors")}>Refraction Only (color dispersion)</Button>
        <Button onClick={this.setConfig("RefractionDispersionAndEverything")}>Refraction (color dispersion) with Diffuse/Specular</Button>
        <Button onClick={this.setConfig("OneWithEverything")}>One with everything</Button>
        <Button onClick={this.setConfig(null)}>Reset</Button>
      </Container>
      {React.cloneElement(this.props.children, { preset: this.state.preset })}
    </Fragment>
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