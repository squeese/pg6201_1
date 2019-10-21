Running the application:
  To run this project (exam), serve the files in the build folder with any http-server.
  With nodejs that could be either of
    serve -s build        (in the project folder)
    http-server build     (in the project folder)

  Build the project
    yarn install          (install dependencies)
    yarn build

  Or if everything went horribly wrong, and want to run the dev stuff
    yarn install
    yarn start

Using the application:
  As for instructions as to 'control' or use the exam application, you can
  control the camera as an orbital-camera with the mouse, mousedown and drag.
  Dragging the mouse up/down (Y-axis) will rotate the camera around the x axis,
  and some around the z axis (roll), but the furter the mouse is to the edge
  of the browser, the more the camera will roll. And left/right to yaw.

  Scrolling the mousewheel will zoom the camera in and out.

  For the control panel to the left, you can manually change the values per usual
  with typing, or hover the input and scroll the mousewheel to change values up
  and down.

  The buttons to the right of the screen are some presets that will change all the
  settings to match the requirements of the exam.

Final compatability notes
  This exam was built with webgl2, so it wont work properly (in my case, not at all)
  on the safari browser. But I tested myself chrome and firefox (mac) and it worked
  the way I intended on those.