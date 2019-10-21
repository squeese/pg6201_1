import React, { Fragment, forwardRef } from 'react';
import { vec3, quat, mat4 } from 'gl-matrix';
import * as Options from './Options';
import * as utils from './utils';

export const OptionsGUI = forwardRef(({ controller }, ref) => (
  <Options.Provider load="PG6201Config">
    <Options.Container>
      <Options.Wrapper>
        <Options.Dictionary name="camera">
          <Options.Header>CameraBuffer</Options.Header>
          <Options.InputFloat header="Field of View" name="fov" value={45} min={10} max={160} />
          <Options.InputFloat header="Near" name="near" value={0.1} min={0.01} max={0.99} />
          <Options.InputFloat header="Far" name="far" value={100} min={1} />
          <Options.InputFloat header="Offset" name="offset" value={10} min={1} />
          <Options.InputVector header="Rotation" name="rotation" value={[0, 0, 0, 1]} />
          <Options.Label>Reset</Options.Label>
            <Options.Context.Consumer>
              {({ state, update }) => (
                <Options.Row>
                  <Options.Button children="pitch" onClick={() => update(proxy => proxy.rotation.set(utils.resetPitch(mat4.create(), state.rotation)))} />
                  <Options.Button children="yaw" onClick={() => update(proxy => proxy.rotation.set(utils.resetYaw(mat4.create(), state.rotation)))} />
                  <Options.Button children="roll" onClick={() => update(proxy => proxy.rotation.set(utils.resetRoll(mat4.create(), state.rotation)))} />
                  <Options.Button children="all" onClick={e => {
                    update(proxy => proxy.rotation.set([0, 0, 0, 1]));
                  }} />
                </Options.Row>
              )}
            </Options.Context.Consumer>
          <Options.Event onReady={({ state: { offset, rotation }, update }) => {
            utils.createMouseMoveHandler(delta => update(({ rotation }) => quat.multiply(rotation, rotation.read(), delta)));
            utils.createMouseWheelHandler(delta => update(({ offset }) => offset.set(offset.read() + delta * 0.1)));
          }} />
          <Options.Event onChange={({ state: { fov, near, far }}, prev) => {
            if (prev.fov === fov && prev.near === near && prev.far === far) return;
            mat4.perspective(controller.bufferCamera.projection, fov * Math.PI / 180, window.innerWidth / window.innerHeight, near, far);
          }} />
        </Options.Dictionary>
        <Options.Dictionary name="material">
          <Options.Header>MaterialBuffer</Options.Header>
          <Options.InputVector header="Ambient Color" name="ambient" value={[0.05, 0.05, 0.05]} min={0} max={1} step={0.01} />
          <Options.InputVector header="Diffuse Color" name="diffuse" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
          <Options.InputVector header="Specular Color" name="specular" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
          <Options.InputFloat header="Specular Hightlight" name="highlight" value={32} min={0} max={1024} step={0.1} />
          <Options.InputFloat header="Reflection Scalar" name="reflectionScalar" value={0.5} min={0} max={1} step={0.01} />
          <Options.InputFloat header="Refraction Scalar" name="refractionScalar" value={0.5} min={0} max={1} step={0.01} />
          <Options.Label>Refraction Index</Options.Label>
          <Options.Context.Consumer children={({ state }) => (
            <Options.Row>
              <Options.Vector name="refractionIndex" value={[0.8, 0.85, 0.8]}>
                {(value, index) => (
                  <Options.InputFloat
                    key={index}
                    name={index}
                    value={value}
                    disabled={index > 0 && !state.refractColors}
                    min={0}
                    max={1}
                    step={0.01} 
                  />
                )}
              </Options.Vector>
            </Options.Row>
          )} />
          <Options.InputBool header="Refract Colors" name="refractColors" value={true} />
          <Options.Event onChange={({ state:material }) => {
            utils.copy(controller.bufferMaterial.ambientColor, material.ambient);
            utils.copy(controller.bufferMaterial.diffuseColor, material.diffuse);
            utils.copy(controller.bufferMaterial.specularColor, material.specular);
            utils.copy(controller.bufferMaterial.specularHighlight, [material.highlight]);
            utils.copy(controller.bufferMaterial.refractionIndex, material.refractionIndex);
            utils.copy(controller.bufferMaterial.refractionScalar, [material.refractionScalar]);
            utils.copy(controller.bufferMaterial.reflectionScalar, [material.reflectionScalar]);
          }} />
        </Options.Dictionary>
        <Options.List name="lights" min={1} max={3}>
          {({ increment, decrement, list }) => (
            <Fragment>
              <Options.Header>
                <span>LightBuffer</span>
                <button onClick={increment}>+</button>
                <button onClick={decrement}>-</button>
              </Options.Header>
              {list.map(index => (
                <Options.Dictionary key={index} name={index}>
                  <Options.ListDivider />
                  <Options.InputVector header="Ambient Color" name="ambient" value={[0.05, 0.05, 0.05]} min={0} max={1} step={0.01} />
                  <Options.InputVector header="Diffuse Color" name="diffuse" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
                  <Options.InputVector header="Specular Color" name="specular" value={[0.7, 0.7, 0.7]} min={0} max={1} step={0.01} />
                  <Options.Context.Consumer children={({ state }) => (
                    <Options.InputVector
                      header={state.type === 'Directional' ? 'Direction' : 'Position'}
                      name="vector"
                      value={[0, 1, 0]}
                      min={-1} 
                      max={1}
                      step={0.01}
                      validate={vector => vector.set(vec3.normalize([], vector.read()))}
                    />
                  )} />
                  <Options.Event onChange={({ state:light }) => {
                    utils.copy(controller.bufferLight[`ambientColor_${index}`], light.ambient);
                    utils.copy(controller.bufferLight[`diffuseColor_${index}`], light.diffuse);
                    utils.copy(controller.bufferLight[`specularColor_${index}`], light.specular);
                    utils.copy(controller.bufferLight[`directionPosition_${index}`], light.vector);
                  }} />
                </Options.Dictionary>
              ))}
            </Fragment>
          )}
        </Options.List>
        <Options.Dictionary name="mesh">
          <Options.Header>Mesh / Skybox / Misc</Options.Header>
          <Options.InputDropdown header="Skybox Method" name="skyboxMethod" value={['frustum plane', 'cube']} />
          <Options.InputDropdown header="Skybox Texture" name="skyboxTexture" value={Object.keys(skyboxImages)} />
          <Options.InputBool header="Low Polygon" name="lowpoly" value={false} />
          <Options.InputBool header="Flatten Normals" name="flatten" value={false} />
          <Options.InputBool header="Bounce Monkey" name="bounce" value={true} />
          <Options.InputBool header="Rotate Monkey" name="rotate" value={true} />
          <Options.InputBool header="Animage Lights" name="lights" value={true} />
          <Options.Event onChange={({ state:mesh }, prev) => {
            if (mesh.lowpoly !== prev.lowpoly || mesh.flatten !== prev.flatten)
              controller.createMonkeyMesh(mesh);
            if (mesh.skyboxTexture !== prev.skyboxTexture)
              utils.loadSkyboxTexture(controller.gl.current, controller.skyboxTexture, skyboxImages[mesh.skyboxTexture]);
          }} />
        </Options.Dictionary>
        {/*
        <Options.Row>
          <Options.Context.Consumer>
            {context => (
              <Fragment>
                <input id="clipboard" value={JSON.stringify(context.state, null, 3)} onChange={() => {}} />
                <button onClick={() => {
                  const input = document.getElementById("clipboard");
                  input.select();
                  document.execCommand("copy");
                }}>Save</button>
              </Fragment>
            )}
          </Options.Context.Consumer>
        </Options.Row>
        */}
      </Options.Wrapper>
    </Options.Container>
    <Options.Event onReady={context => {
      ref.current = context;
      controller.initGL(context);
    }} />
    <Options.Event onChange={(context, prev) => {
      ref.current = context;
      const lightsChanged = context.state.lights.length !== prev.lights.length;
      const refractChanged = context.state.material.refractColors !== prev.material.refractColors;
      if (lightsChanged || refractChanged)
        controller.createMonkeyProgram(context.state.material, context.state.lights);
      if (lightsChanged)
        controller.createLightBuffer(context.state.lights);
    }} />
  </Options.Provider>
));

export const skyboxImages = {
  totality: [
    'totality/totality_rt.png',
    'totality/totality_lf.png',
    'totality/totality_up.png',
    'totality/totality_dn.png',
    'totality/totality_ft.png',
    'totality/totality_bk.png',
  ],
  druidcove: [
    'druidcove/druidcove_rt.png',
    'druidcove/druidcove_lf.png',
    'druidcove/druidcove_up.png',
    'druidcove/druidcove_dn.png',
    'druidcove/druidcove_ft.png',
    'druidcove/druidcove_bk.png',
  ],
  violentdays: [
    'violentdays/violentdays_rt.png',
    'violentdays/violentdays_lf.png',
    'violentdays/violentdays_up.png',
    'violentdays/violentdays_dn.png',
    'violentdays/violentdays_ft.png',
    'violentdays/violentdays_bk.png',
  ],
  greenspace: [
    'greenspace/skybox_z_p.png',
    'greenspace/skybox_z_n.png',
    'greenspace/skybox_y_p.png',
    'greenspace/skybox_y_n.png',
    'greenspace/skybox_x_p.png',
    'greenspace/skybox_x_n.png',
  ],
  lmcity: [
    'lmcity/lmcity_rt.png',
    'lmcity/lmcity_lf.png',
    'lmcity/lmcity_up.png',
    'lmcity/lmcity_dn.png',
    'lmcity/lmcity_ft.png',
    'lmcity/lmcity_bk.png',
  ],
  hourglass: [
    'hourglass/hourglass_rt.png',
    'hourglass/hourglass_lf.png',
    'hourglass/hourglass_up.png',
    'hourglass/hourglass_dn.png',
    'hourglass/hourglass_ft.png',
    'hourglass/hourglass_bk.png',
  ],
};