import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { createGlobalStyle } from 'styled-components';
import WebGLApp from './WebGLApp';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
      "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden;
  }
  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
  }
`;

render((
  <Fragment>
    <GlobalStyle />
    <WebGLApp />
  </Fragment>),
  document.getElementById('root'));