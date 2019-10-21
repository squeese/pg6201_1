Running the application:
  To run this project (exam), serve the files in the build folder with any http-server.
  With nodejs that could be either of
    serve -s build        (in the project folder)
    http-server build     (in the project folder)

  Build the project
    yarn install          (or npm)
    yarn build            (or 'start' to run the development build/server)

Using the application
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

Notes regarding the exam problems
  I was having trouble solving how to actually 'add' the colors together after
  computed individually, by that I mean; ambient, diffuse, specular, reflection
  and refraction. According to phong, you sum; color = (Ambient + Diffuse + Specular),
  but what about the reflection and refraction?
  From what I gathered, there is a relationship between the two as to how much is
  reflected and refracted, so there needed to be computed some scalar for each.
  I chose to solve it by letting the 'user' choose the value with Refraction Scalar
  and Reflection Scalar to manually tweak the amount, and then sum it along with the
  phong colors.

Final compatability notes
  This exam was built with webgl2, so it wont work properly (in my case, not at all)
  on the safari browser. But I tested myself chrome and firefox (mac) and it worked
  the way I intended on those.