import React, { Fragment, forwardRef } from 'react';

export const Canvas = forwardRef(({ children, context = 'webgl2' }, ref) => {
  const getContext = canvas => {
    if (!canvas) return (ref.current = null);
    canvas.setAttribute("width", window.innerWidth);
    canvas.setAttribute("height", window.innerHeight);
    const gl = canvas.getContext(context);
    if (context === 'webgl2') {
      gl.viewportWidth = window.innerWidth;
      gl.viewportHeight = window.innerHeight;
    }
    ref.current = gl;
  };
  return (
    <Fragment>
      <canvas ref={getContext} />
      {children}
    </Fragment>
  );
});

Canvas.run = (gl, fps = 1000 / 60, isWebGL = true, update, render) => {
  let past = performance.now();
  let tick = fps;
  window.requestAnimationFrame(function frame() {
    const next = performance.now();
    const tock = next - past;
    past = next;
    tick = (tock > 1000) ? fps : tick + tock;
    if (tick >= fps) {
      while (tick >= fps) {
        tick -= fps;
        update(gl, next, fps);
      }
      if (render(gl, next, fps) === null) return;
    }
    if (!isWebGL || !checkGLError(gl)) window.requestAnimationFrame(frame);
  });
};

const checkGLError = gl => {
  const e = gl.getError();
  if (e !== 0) {
    switch(e) {
      case gl.INVALID_ENUM:
        console.log('INVALID_ENUM');
        break;
      case gl.INVALID_VALUE:
        console.log('INVALID_VALUE');
        break;
      case gl.INVALID_OPERATION:
        console.log('INVALID_OPERATION');
        break;
      case gl.INVALID_FRAMEBUFFER_OPERATION:
        console.log('INVALID_FRAMEBUFFER_OPERATION');
        break;
      case gl.OUT_OF_MEMORY:
        console.log('OUT_OF_MEMORY');
        break;
      default:
        console.log(e);
        break;
    }
    return e;
  }
  return false;
};
