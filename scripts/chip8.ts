/*
Reference Used for this project is
1. http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.2
2. https://tobiasvl.github.io/blog/write-a-chip-8-emulator/ 
*/

import Renderer from './renderer';
import Keyboard from "./keyboard";
import Speaker from './speaker';
import CPU from "./cpu";

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer,keyboard,speaker); 

let loop;

/**
 * according to the technical reference, 60hz or 60 frames per second. Just like our render function, this is not Chip-8 specific and can be modified a bit to work with practically any other project.
 */
let fps = 60,
    fpsInterval: number,
    startTime: number,
    now: number,
    then: number,
    elapsed: number;

function init() {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    //When our emulator is initialized we will load the sprites into memory and load up the BLITZ rom. Now we just need to cycle the CPU:
    cpu.loadSpritesIntoMemory();
    cpu.loadRom("BLITZ.a");
    console.log("Called")

    loop = requestAnimationFrame(step);
}
function step() {

    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        // Cycle the CPU
        cpu.cycle();
    }

    loop = requestAnimationFrame(step);
}

init();
