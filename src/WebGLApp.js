import React, { Fragment } from 'react';
import * as Options from './deps/Options';

const log = title => ({ state }) => console.log(title, state);

export default () => (
  <Options.Provider>
    <Options.Event onReady={log('root.READY')} />
    <Options.Container>
      <Options.Wrapper>
        <Options.Dictionary name="camera">
          <Options.Header>Camera</Options.Header>
          <Options.InputFloat header="Field of View" name="fov" value={45} min={10} max={160} />
          <Options.InputFloat header="Near" name="near" value={0.1} min={0.01} max={0.99} />
          <Options.InputFloat header="Far" name="faar" value={100} min={1} />
          <Options.InputFloat header="Offset" name="offset" value={10} min={1} />
          <Options.InputVector header="Rotation" name="rotation" value={[0, 0, 0, 1]} />
          <Options.Event onChange={log('camera.CHANGE')} />
        </Options.Dictionary>
        <Options.Dictionary name="mesh">
          <Options.Header>Mesh</Options.Header>
          <Options.InputDropdown header="Model" name="model" value={['suzanne', 'cube']} />
          <Options.InputBool header="Low Polygon" name="lowpoly" value={false} />
          <Options.InputBool header="Flatten Normals" name="flatten" value={false} />
          <Options.Event onChange={log('mesh.CHANGE')} />
        </Options.Dictionary>
        <Options.Dictionary name="material">
          <Options.Header>Material</Options.Header>
          <Options.InputVector header="Ambient Color" name="ambient" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
          <Options.InputVector header="Diffuse Color" name="diffuse" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
          <Options.InputVector header="Specular Color" name="specular" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
          <Options.InputFloat header="Specular Hightlight" name="hightlight" value={32} min={0} max={1024} step={0.1} />
          <Options.InputFloat header="Reflection Scalar" name="reflection" value={0.5} min={0} max={1} step={0.01} />
          <Options.InputFloat header="Refraction Scalar" name="refraction" value={0.5} min={0} max={1} step={0.01} />
          <Options.Label>Refraction Index</Options.Label>
          <Options.Context.Consumer children={({ state }) => (
            <Options.Row>
              <Options.Vector name="" value={[0.8, 0.85, 0.8]}>
                {(value, index) => <Options.InputFloat key={index} name={index} value={value} disabled={index > 0 && !state.refractColors} />}
              </Options.Vector>
            </Options.Row>
          )} />
          <Options.InputBool header="Refract Colors" name="refractColors" value={true} />
          <Options.Event onChange={log('material.CHANGE')} />
        </Options.Dictionary>
        <Options.List name="lights" min={1} max={3}>
          {({ increment, decrement, list }) => (
            <Fragment>
              <Options.Header>
                <span>Lights</span>
                <button onClick={increment}>+</button>
                <button onClick={decrement}>-</button>
              </Options.Header>
              {list.map(index => (
                <Options.Dictionary key={index} name={index}>
                  <Options.InputDropdown header=" " name="type" value={['Directional', 'Spotlight']} />
                  <Options.InputVector header="Ambient Color" name="ambient" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
                  <Options.InputVector header="Diffuse Color" name="diffuse" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
                  <Options.InputVector header="Specular Color" name="specular" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
                  <Options.Context.Consumer children={({ state }) => (
                    <Options.InputVector
                      header={state.type === 'Directional' ? 'Direction' : 'Position'}
                      name="specular"
                      value={[0.7, 0.7, 0.7]}
                      min={0} 
                      max={1}
                      step={0.01}
                    />
                  )} />
                </Options.Dictionary>
              ))}
              <Options.Event onChange={log('lights.CHANGE')} />
            </Fragment>
          )}
        </Options.List>
      </Options.Wrapper>
    </Options.Container>
  </Options.Provider>
);