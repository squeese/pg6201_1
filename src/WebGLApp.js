import React, { createRef, Component } from 'react';
import { mat4, quat, vec3 } from 'gl-matrix';
import { OptionsGUI, skyboxImages } from './deps/OptionsGUI';
import { Canvas } from './deps/Canvas';
import monkeyHighpoly from './deps/models/suzanneHighpoly.json';
import monkeyLowpoly from './deps/models/suzanneLowpoly.json';
import * as utils from './deps/utils';
import * as shaders from './shaders';

export default class extends Component {
  constructor(props) {
    super(props);
    this.gl = createRef();
    this.options = createRef();
  }
  initGL = ({ state:{ camera, material, lights, mesh }}) => {
    const gl = this.gl.current;

    // Create the Camera Uniform Block Buffer
    // All three buffers (Camera, Light and Material) are created this way in a javascript ArrayBuffer object,
    // instead of individual Float32Array's, since it's better to be able to 'upload' one large arraybuffer,
    // rather than many individual arrays one at a time
    this.bufferCamera = utils.createUniformBuffer(gl, 0,
      "projection", 16,  mat4.perspective(mat4.create(), camera.fov*(Math.PI/180), window.innerWidth/window.innerHeight, camera.near, camera.far),
      "view",       16,  null,
      "position",    4,  null);

    // Create the Material Uniform Block Buffer
    this.bufferMaterial = utils.createUniformBuffer(gl, 1,
      "ambientColor",      3, material.ambient,
      "diffuseColor",      3, material.diffuse,
      "specularColor",     3, material.specular,
      "specularHighlight", 1, [material.highlight],
      "refractionIndex",   3, material.refractionIndex,
      "refractionScalar",  1, [material.refractionScalar],
      "reflectionScalar",  1, [material.reflectionScalar]);

    // Create the Light Uniform block buffer, but since the buffer depends on the config, well
    // create a function so we can recreate the buffer at a later time
    this.createLightBuffer = lights => {
      if (this.bufferLight)
        this.bufferLight.cleanup();
      this.bufferLight = utils.createUniformBuffer(gl, 2, ...utils.zip(3, Array.from(Array(lights.length)).map((_, i) => [
        `ambientColor_${i}`,      3, lights[i].ambient,
        `diffuseColor_${i}`,      3, lights[i].diffuse,
        `specularColor_${i}`,     3, lights[i].specular,
        `directionPosition_${i}`, 3, lights[i].vector,
      ])));
    };
    this.createLightBuffer(lights);

    // Create Shader Program for rendering of Skybox with method #1 (Cube rotating around the camera)
    this.programCubeSkybox = utils.createProgram(gl, shaders.SkyBoxCubeVertexShader, shaders.SkyBoxCubeFragmentShader);
    gl.useProgram(this.programCubeSkybox);
    gl.uniformBlockBinding(this.programCubeSkybox, gl.getUniformBlockIndex(this.programCubeSkybox, 'Camera'), 0);
    gl.uniform1i(gl.getUniformLocation(this.programCubeSkybox, "uSkybox"), 0);

    // Create Shader Program for rendering of Skybox with method #2 (plane on camera's back frustum)
    this.programPlaneSkybox = utils.createProgram(gl, shaders.SkyBoxPlaneVertexShader, shaders.SkyBoxPlaneFragmentShader);
    gl.useProgram(this.programPlaneSkybox);
    gl.uniformBlockBinding(this.programPlaneSkybox, gl.getUniformBlockIndex(this.programPlaneSkybox, 'Camera'), 0);
    gl.uniform1i(gl.getUniformLocation(this.programPlaneSkybox, "uSkybox"), 0);

    // Create Shader Program for rendering of the suzanne the monkey, and also create a method
    // that can be reused if we need to recompile the shader (when changing settings etc)
    this.createMonkeyProgram = (material, lights) => {
      const { MonkeyVertexShader, MonkeyFragmentShader } = shaders;
      if (this.monkeyProgram)
        gl.deleteProgram(this.monkeyProgram);
      // We need to pass in settings in use when creating the source for the shader, since the buffers changes
      // depending on the amount of lights, and if we want refraction for all colors
      this.programMonkey = utils.createProgram(gl, MonkeyVertexShader(material, lights), MonkeyFragmentShader(material, lights));
      gl.useProgram(this.programMonkey);
      gl.uniformBlockBinding(this.programMonkey, gl.getUniformBlockIndex(this.programMonkey, 'Camera'), 0);
      gl.uniformBlockBinding(this.programMonkey, gl.getUniformBlockIndex(this.programMonkey, 'Material'), 1);
      gl.uniformBlockBinding(this.programMonkey, gl.getUniformBlockIndex(this.programMonkey, 'Light'), 2);
      gl.uniform1i(gl.getUniformLocation(this.programMonkey, "uSkybox"), 0);
      this.programMonkey.uModel = gl.getUniformLocation(this.programMonkey, "uModel");
    };
    this.createMonkeyProgram(material, lights);
    gl.useProgram(null);
    
    // Create Mesh Buffers for the skybox, one cube and one plane
    this.meshCube = utils.createGenericMesh(gl, utils.createSimpleCubeMesh(1.0));
    this.meshPlane = utils.createGenericMesh(gl, {...utils.createPlaneMesh(1.0, 0.999), normals: false });

    // Create Mesh Buffers for the suzanne model, same as the monkeyShader program, we create a
    // function that we can call and create it again, when the settings changes
    this.createMonkeyMesh = ({ lowpoly, flatten }) => {
      if (this.monkeyMesh)
        this.monkeyMesh.cleanup();
      const source = lowpoly ? monkeyLowpoly : monkeyHighpoly;
      this.meshMonkey = utils.createGenericMesh(gl, flatten ? utils.flattenMesh(source) : source);
    };
    this.createMonkeyMesh(mesh);

    // Create Skybox cubemap texture
    this.skyboxTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyboxTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    utils.loadSkyboxTexture(gl, this.skyboxTexture, skyboxImages[mesh.skyboxTexture]);

    // For animating the monkey
    this.monkeyTransform = mat4.create();

    // Creating the update function for our render-loop
    // Wrapping it in a closure here to keep the variables needed for calculations private,
    // mostly just for the sanity I guessesess.. sneaky hobbbbbitses...
    const updateGL = ((() => {
      // The offset and rotation variables are for smoothing out the camera motions,
      // when moving and zooming. The rotation is always slerping towards the desired rotation.
      let camOffset = this.options.current.state.camera.offset;
      const camRotation = [0, 0, 0, 1];
      const lightRotation = quat.create();
      const upwards = [];
      return (gl, ts, dt) => {
        // lerping and slerping the zoom/rotation to smooth out the camera motions
        camOffset = utils.lerp(camOffset, this.options.current.state.camera.offset, 0.05);
        quat.slerp(camRotation, camRotation, this.options.current.state.camera.rotation, 0.05);
        // with the rotation/offset, need to update the camera position, to compute the view matrix
        vec3.transformQuat(this.bufferCamera.position, [0, 0, camOffset], camRotation);
        vec3.transformQuat(upwards, [0, 1, 0], camRotation);
        mat4.lookAt(this.bufferCamera.view, this.bufferCamera.position, [0, 0, 0], upwards);
        // some monkey bounce/rotate shenanigans
        mat4.identity(this.monkeyTransform);
        if (this.options.current.state.mesh.bounce)
          mat4.translate(this.monkeyTransform, this.monkeyTransform, [0, Math.sin(ts * 0.001), 0]);
        if (this.options.current.state.mesh.rotate)
          mat4.rotateY(this.monkeyTransform, this.monkeyTransform, ts * 0.001);
        // Moving the lights. Currently this is kinda poorly implemented, since it alters the position
        // of the light inside the light's uniform buffer, meaning it will then differ from the values
        // in the settings panel, so when the user alters the position, the light will jump unexpectedly
        if (this.options.current.state.mesh.lights) {
          quat.fromEuler(lightRotation, Math.sin(ts * 0.001), Math.cos(ts * 0.002), Math.cos(ts * 0.0005));
          for (let i = 0; i < this.options.current.state.lights.length; i++) {
            const pos = this.bufferLight[`directionPosition_${i}`];
            vec3.transformQuat(pos, pos, lightRotation);
          }
        };
      };
    })());

    // Starting the render-loop, with 60 fps
    gl.clearColor(0.05, 0.1, 0.2, 1.0);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    Canvas.run(gl, 1000/60, true, updateGL, (gl, ts, dt) => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // sending the three ArrayBuffers to the gpu
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.bufferCamera.glBuffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.bufferCamera);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.bufferMaterial.glBuffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.bufferMaterial);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.bufferLight.glBuffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.bufferLight);
      if (this.options.current.state.mesh.skyboxMethod === 'cube') {
        // since the camera is inside the box, we need to flip the frontFace, so we can see it
        gl.frontFace(gl.CW);
        gl.useProgram(this.programCubeSkybox);
        gl.bindVertexArray(this.meshCube.vertexArray);
        gl.drawElements(gl.TRIANGLES, this.meshCube.length, gl.UNSIGNED_SHORT, 0);
        gl.frontFace(gl.CCW);
        // the box is only of 2 unit size, way to small to contain the entire world, so to solve
        // this, we just clear the depth buffer, so it's impossible for the rest of the render
        // to actually render anything behind it
        gl.clear(gl.DEPTH_BUFFER_BIT);
      } else {
        // or we just use a plane on the back of the camera frustum
        gl.useProgram(this.programPlaneSkybox);
        gl.bindVertexArray(this.meshPlane.vertexArray);
        gl.drawElements(gl.TRIANGLES, this.meshPlane.length, gl.UNSIGNED_SHORT, 0);
      }
      gl.useProgram(this.programMonkey);
      gl.uniformMatrix4fv(this.programMonkey.uModel, false, this.monkeyTransform);
      gl.bindVertexArray(this.meshMonkey.vertexArray);
      gl.drawElements(gl.TRIANGLES, this.meshMonkey.length, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
      gl.useProgram(null);
    });
  };
  render = () => (
    <Canvas ref={this.gl}>
      <OptionsGUI ref={this.options} controller={this} />
    </Canvas>
  );
};