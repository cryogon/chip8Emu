import Renderer from "./renderer";
import Keyboard from "./keyboard";
import Speaker from "./speaker"
class CPU {
    renderer: Renderer;
    keyboard: Keyboard;
    speaker: Speaker;
    memory: Uint8Array;
    v: Uint8Array
    i: number;
    delayTimer: number;
    soundTimer: number;
    pc: number;
    stack: Array<any>;
    paused: boolean;
    speed: number;

    constructor(renderer: Renderer, keyboard: Keyboard, speaker: Speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        //4Kb (4096 bytes) of Memory

        this.memory = new Uint8Array(4096);

        //16 8-bits registers
        this.v = new Uint8Array(16)

        // Stores memory addresses. Set this to 0 since we aren't storing anything at initialization.
        this.i = 0;

        //Timers
        this.soundTimer = 0;
        this.delayTimer = 0;

        //Program Counter. Stores current executing processes
        //starts from 0x200 because everthinig before this address is reserved by chip8-interpreter
        //See Memory map: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#memmap

        this.pc = 0x200;

        // Don't initialize this with a size in order to avoid empty results.
        this.stack = new Array();

        // Some instructions require pausing, such as Fx0A.
        this.paused = false;

        this.speed = 10;

    }

    loadSpritesIntoMemory() {
        // Array of hex values for each sprite. Each sprite is 5 bytes.
        // The technical reference provides us with each one of these values.
        // Read Here: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#dispcoords
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 1
            0x20, 0x60, 0x20, 0x20, 0x70, // 2
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 3
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 4
            0x90, 0x90, 0xF0, 0x10, 0x10, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ]

        // According to the technical reference, sprites are stored in the interpreter section of memory starting at hex 0x000
        // Can read in about link about display

        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    loadProgramIntoMemory(program: Uint8Array) {

        //As Mentioned in techincal reference most program starts at location 0x200 and location before that is reserved.
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i];
        }
    }

    loadRom(romName: string) {
        let request = new XMLHttpRequest();

        // Handles the response received from sending (request.send()) our request
        request.onload = () => {
            if (request.response) {
                let program = new Uint8Array(request.response);

                //load the rom/program into memory
                this.loadProgramIntoMemory(program)
            }
        }
        // Initialize a GET request to retrieve the ROM from our roms folder
        request.open("GET", "roms/" + romName);
        request.responseType = "arraybuffer";

        //Send the GET request
        request.send();
    }

    //This is function is begin called in out ./chip8.ts file which is calling this function 60 times per second    
    cycle() {
        /*The first piece of code within our cycle function is a for loop that handles the execution of instructions.
         This is where our speed variable comes into play.
         The higher this value, the more instructions that will be executed every cycle*/
        for (let i = 0; i < this.speed; i++) {
            //instructions should only be executed when the emulator is running.
            //In out techincal reference each diffrent intruction and their opcode is mentioned
            // Read Here: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1
            if(!this.paused){
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc+1])
            }
        }
    }
}

export default CPU;