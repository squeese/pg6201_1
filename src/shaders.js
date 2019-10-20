export const SkyBoxCubeVertexShader = `#version 300 es
precision mediump float;
layout(std140, column_major) uniform;
uniform Camera {
  mat4 projection;
  mat4 view;
  vec4 position;
} uCamera;
layout(location=0) in vec3 aPosition;
out vec3 vUv;
void main() {
  gl_Position = uCamera.projection * vec4((uCamera.view * vec4(aPosition, 0.0)).xyz, 1.0);
  vUv = normalize(aPosition);
}
`;

export const SkyBoxCubeFragmentShader = `#version 300 es
precision mediump float;
uniform samplerCube uSkybox;
in vec3 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(texture(uSkybox, vUv).rgb, 1.0);
}
`;

export const SkyBoxPlaneVertexShader = `#version 300 es
precision mediump float;
layout(std140, column_major) uniform;
uniform Camera {
  mat4 projection;
  mat4 view;
  vec4 position;
} uCamera;
layout(location=0) in vec3 aPosition;
out vec3 vUv;
void main() {
  gl_Position = vec4(aPosition, 1.0);
  vec4 P0 = inverse(uCamera.projection * uCamera.view) * vec4(aPosition, 1.0);
  vec3 P1 = P0.xyz / P0.w;
  vUv = normalize(P1 - uCamera.position.xyz);
}
`;

export const SkyBoxPlaneFragmentShader = `#version 300 es
precision mediump float;
uniform samplerCube uSkybox;
in vec3 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(texture(uSkybox, vUv).rgb, 1.0);
}
`;

export const MonkeyVertexShader = ({}) => `#version 300 es
precision mediump float;
layout(std140, column_major) uniform;
uniform Camera {
  mat4 projection;
  mat4 view;
  vec4 position;
} uCamera;
uniform mat4 uModel;
layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;
out vec3 vNormal;
out vec3 vCamera;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vec4 P = uModel * aPosition;
  vCamera = normalize(P.xyz - uCamera.position.xyz);
  gl_Position = uCamera.projection * uCamera.view * P;
}
`;

export const MonkeyFragmentShader = ({ refractColors }, lights) => `#version 300 es
precision mediump float;
layout(std140, column_major) uniform;
uniform Material {
  vec3 ambientColor;
  vec3 diffuseColor;
  vec3 specularColor;
  float specularHighlight;
  vec3 refractionIndex;
  float refractionScalar;
  float reflectionScalar;
} uMaterial;
uniform Light {
  vec3 ambientColor[${lights.length}];
  vec3 diffuseColor[${lights.length}];
  vec3 specularColor[${lights.length}];
  vec3 directionPosition[${lights.length}];
} uLight;
uniform samplerCube uSkybox;
in vec3 vNormal;
in vec3 vCamera;
out vec4 fragColor;
void main() {
  vec3 finalAmbient = uMaterial.ambientColor;
  vec3 finalDiffuse = vec3(0.0);
  vec3 finalSpecular = vec3(0.0);
  float diffuse = 0.0;
  float specular = 0.0;
  ${lights.map((_, i) => `
    // Ambient color
    finalAmbient += uLight.ambientColor[${i}];
    // Diffuse color
    diffuse = max(dot(vNormal, uLight.directionPosition[${i}]), 0.0);
    finalDiffuse += uMaterial.diffuseColor * uLight.diffuseColor[${i}] * diffuse;
    // Specular color
    specular = pow(max(dot(vNormal, normalize(uLight.directionPosition[${i}] - vCamera)), 0.0), uMaterial.specularHighlight);
    finalSpecular += uMaterial.specularColor * uLight.specularColor[${i}] * specular;
  `).join("")}
  // Reflection color
  vec3 finalReflection = texture(uSkybox, normalize(reflect(vCamera, vNormal))).rgb * uMaterial.reflectionScalar;
  ${refractColors ? `
  vec3 finalRefraction = vec3(
    texture(uSkybox, refract(vCamera, vNormal, uMaterial.refractionIndex.r)).r,
    texture(uSkybox, refract(vCamera, vNormal, uMaterial.refractionIndex.g)).g,
    texture(uSkybox, refract(vCamera, vNormal, uMaterial.refractionIndex.b)).b) * uMaterial.refractionScalar;
  ` : `
  vec3 finalRefraction = texture(uSkybox, refract(vCamera, vNormal, uMaterial.refractionIndex.r)).rgb * uMaterial.refractionScalar;
  `}
  // Summize color
  fragColor = vec4(finalAmbient + finalDiffuse + finalSpecular + finalReflection + finalRefraction, 1.0);
}
`;