// Simple example effect:
// Draws a noise pattern modulated by an expanding sine wave.

#include <math.h>
#include "lib/color.h"
#include "lib/effect.h"
#include "lib/effect_runner.h"
#include "lib/noise.h"
#include <iostream>
#include <cstring>
#include "FCLeap.h"

class MyEffect : public Effect
{
public:
    MyEffect()
        : cycle (0) {}

    float cycle;
    float speed = 10.0;

    virtual void beginFrame(const FrameInfo &f)
    {
        //const float speed = 10.0;
        cycle = fmodf(cycle + f.timeDelta * speed, 2 * M_PI);
    }

    virtual void shader(Vec3& rgb, const PixelInfo &p) const
    {
        float distance = len(p.point);
        float wave = sinf(3.0 * distance - cycle) + noise3(p.point);
        hsv2rgb(rgb, 0.2, 0.3, wave);
    }

    virtual void setSpeed(float s)
    {
        speed = s;
    }
};



int main(int argc, char **argv)
{
    EffectRunner r;

     // Create a sample listener and controller
  SampleListener listener;
  Leap::Controller controller;

  // Have the sample listener receive events from the controller
  controller.addListener(listener);

  if (argc > 1 && strcmp(argv[1], "--bg") == 0)
    controller.setPolicy(Leap::Controller::POLICY_BACKGROUND_FRAMES);

  // Keep this process running until Enter is pressed
  //std::cout << "Press Enter to quit..." << std::endl;
  //std::cin.get();

  // Remove the sample listener when done
  //controller.removeListener(listener);

  //return 0;

    MyEffect e;
    r.setEffect(&e);

    // Defaults, overridable with command line options
    r.setMaxFrameRate(100);
    r.setLayout("../layouts/grid32x16z.json");

    return r.main(argc, argv);
}