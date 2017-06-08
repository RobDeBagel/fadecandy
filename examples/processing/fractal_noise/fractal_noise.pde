OPC opc;
import de.voidplus.leapmotion.*;
LeapMotion leap;

float dx, dy;
  float speed = 0.002;
  
  int     hand_id =0;
  PVector hand_position = new PVector(0,0,0);


  
  
void setup()
{
  size(640, 480,P3D);
  
  leap = new LeapMotion(this).allowGestures(); // All gestures

  // Connect to the local instance of fcserver. You can change this line to connect to another computer's fcserver
  opc = new OPC(this, "127.0.0.1", 7890);

  // Map an 8x8 grid of LEDs to the center of the window, scaled to take up most of the space
  float spacing = height / 20.0;
  opc.ledGrid(0, 16, 16, width/2, height/2, spacing, spacing, 0, true);
  opc.ledGrid(256, 16, 16, width/2 + spacing * 16, height/2, spacing, spacing, 0, true);

  // Put two more 8x8 grids to the left and to the right of that one.
  //opc.ledGrid8x8(64, width/2 - spacing * 8, height/2, spacing, 0, true);
  //opc.ledGrid8x8(128, width/2 + spacing * 8, height/2, spacing, 0, true);
  
  // Make the status LED quiet
  opc.setStatusLed(false);
  
  colorMode(HSB, 100);
}

float noiseScale=0.02;

float fractalNoise(float x, float y, float z) {
  float r = 0;
  float amp = 1.0;
  for (int octave = 0; octave < 4; octave++) {
    r += noise(x, y, z) * amp;
    amp /= 2;
    x *= 2;
    y *= 2;
    z *= 2;
  }
  return r;
}

void leapOnCircleGesture(CircleGesture g, int state){
    int     id                  = g.getId();
    Finger  finger              = g.getFinger();
    PVector position_center     = g.getCenter();
    float   radius              = g.getRadius();
    float   progress            = g.getProgress();
    long    duration            = g.getDuration();
    float   duration_seconds    = g.getDurationInSeconds();
    int     direction          = g.getDirection();

    switch(state){
        case 1: // Start
            break;
        case 2: // Update
            break;
        case 3: // Stop
            println("CircleGesture: "+id);
            break;
    }
    println(direction);
    switch(direction){
        case 0: // Anticlockwise/Left gesture
            speed-=0.0003;
            println("down");
            break;
        case 1: // Clockwise/Right gesture
            speed+=0.0003;
            println("up");
    }
    println(speed);
}


void draw() {
  
  for (Hand hand : leap.getHands ()) {
    
    if (hand.isLeft()){


    // ----- BASICS -----

             hand_id = hand.getId();
    hand_position    = hand.getPosition();
    println("hand"+hand_id+": "+hand_position);
  }
  }
  
  
  long now = millis();
  //float speed = 0.002;
  float angle = sin(now * 0.001);
  float z = now * 0.00008;
  float hue = now * 0.01 + hand_position.y;
  float scale = 0.005;

  dx += cos(angle) * speed;
  dy += sin(angle) * speed;

  loadPixels();
  for (int x=0; x < width; x++) {
    for (int y=0; y < height; y++) {
     
      float n = fractalNoise(dx + x*scale, dy + y*scale, z) - 0.75;
      float m = fractalNoise(dx + x*scale, dy + y*scale, z + 10.0) - 0.75;

      color c = color(
         (hue + 80.0 * m) % 100.0,
         100 - 100 * constrain(pow(3.0 * n, 3.5), 0, 0.9),
         100 * constrain(pow(3.0 * n, 1.5), 0, 0.9)
         );
      
      pixels[x + width*y] = c;
    }
  }
  updatePixels();
}