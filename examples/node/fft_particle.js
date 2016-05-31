#!/usr/bin/env node

var OPC = new require('./opc');
var NodeCoreAudio  = require('node-core-audio');
var fft = require('fft');
var tinycolor = require('tinycolor2');


var client = new OPC('localhost', 7890);
var x_pix = 32;
var y_pix = 64;

var npix = 512;
var data_size = 1024

var normfact = 1.4142135623730951 / data_size;

var threshold = -80;

var engine = new NodeCoreAudio();


var model = OPC.loadModel(process.argv[2] || '../layouts/grid32x16z.json');


engine.setOptions({
    inputDevice: 4,
    framesPerBuffer: data_size, //double for fft bins
    inputChannels: 2,
});

console.log(engine.getOptions())

console.log("Input Device: "+NodeCoreAudio.getDeviceName(4));

engine.addAudioCallback( draw );

var fft = new fft.complex(data_size, false);
var fft_output = new Array(data_size);
var peak = Array.apply(null, new Array(data_size/2)).map(Number.prototype.valueOf,-192);


console.log("init complete")

Math.log10 = function(n) {
    return (Math.log(n)) / (Math.log(10));
}

function round_to_6dp(val) {
    return Math.round(val*1000000)/1000000;
}


function HanningWindow(signal_in, pos, size)
{

    return signal_in;
}

function mapParticles(particles, model)
{
    // Set all pixels, by mapping a particle system to each element of "model".
    // The particles include parameters 'point', 'intensity', 'falloff', and 'color'.

    function shader(p) {
        var r = 0;
        var g = 0;
        var b = 0;

        for (var i = 0; i < particles.length; i++) {
            var particle = particles[i];

            // Particle to sample distance
            var dx = (p.point[0] - particle.point[0]) || 0;
            var dy = (p.point[1] - particle.point[1]) || 0;
            var dz = (p.point[2] - particle.point[2]) || 0;
            var dist2 = dx * dx + dy * dy + dz * dz;

            // Particle edge falloff
            var intensity = particle.intensity / (1 + particle.falloff * dist2);
            //console.log(intensity);

            // Intensity scaling
            r += particle.color[0] * intensity;
            g += particle.color[1] * intensity;
            b += particle.color[2] * intensity;
        }
        return [r, g, b];
    }
    client.mapPixels(shader, model);
}


function draw(inputBuffer) {
    console.log('%d channels', inputBuffer.length);
    console.log('Channel 0 has %d samples', inputBuffer[0].length);

    fft.simple(fft_output, inputBuffer[0], 'real');
    /* Process the fft output */
    for (var i = 0; i < data_size/2; i++) { /* We only get back half the number of bins as we do samples */
        var real = fft_output[(i*2)+0]; /* Even indexes are the real values */
        var imag = fft_output[(i*2)+1]; /* Odd indexes are the imaginary values */
        fft_output[i] = 10 * Math.log10(real*real + imag*imag);

        if (fft_output[i] < threshold){
            fft_output[i] = threshold;
        }
        fft_output[i] -= threshold; //0 centre the values
    }

    fft_output = fft_output.slice(0, (data_size/2)+1);

    //fft_output now only has 1st half its bins with processed data

    for ( var i = 0; i < data_size/2 ; i++ ) {
      if ( peak[i] < fft_output[i] ) {
        peak[i] = fft_output[i];
        } else {
            peak[i] = peak[i] * 0.999; // peak slowly falls until a new peak is found
        }
    }


    var particles = [];
    for (var particle = 0; particle < (data_size/2); particle++)
    {
        var x = particle * (4 / (data_size/2)) - 2; //set particle/npix range to +/-2
        var y = peak[particle]/60-1;

        particles[particle] = {
            point: [x, 0, y],
            intensity: 0.7,
            falloff: 100000,
            color: OPC.hsv((y+1/2),(y+1),1)
        };
    }

    var p1 = particles.length

    for (var particle = 0; particle < (data_size/2); particle++)
    {
        var x = particle * (4 / (data_size/2)) - 2; //set particle/npix range to +/-2
        var y = fft_output[particle]/60-1;

        var r=1.5;
        var theta =  (particle / (data_size/2))*360;
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);

        particles[particle+p1] = {
            point: [z, x, -y],
            intensity: 1,
            falloff: 500,
            color: OPC.hsv((y/1.5)+0.3,1,Math.abs(x))
        };
    }
    client.mapParticles(particles, model);
}