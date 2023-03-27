import Renderer from "./renderer";
import Keyboard from "./keyboard";
import Speaker from "./speaker"
class CPU {
    renderer: Renderer;
    keyboard: Keyboard;
    speaker: Speaker;
    /**
     *  4Kb (4096 bytes) of Memory
     */
    memory: Uint8Array;
    /**
     * 16 8-bits registers
     */
    v: Uint8Array

    /**
     * Stores memory addresses. 
     */
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

        this.memory = new Uint8Array(4096);

        this.v = new Uint8Array(16)
        //Set this to 0 since we aren't storing anything at initialization.
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
            //hey look something like 00E0 or 9xy0 to give a few examples. So our job is to grab that opcode from memory
            // and pass that along to another function that'll handle the execution of that instruction 
            // Read Here: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1
            if (!this.paused) {

                //Since opcode is 16bits long and our memory is made up of 8 bit pieces So here what I am doing is
                //shifting memory by 8 by means adding 8 zeros at the end of bit or rather adding 8 0x00
                //this make our 8 bit piece a 16 bit memory piece and then using BITWISE OR operator to add both value and get full value of opcode
                //e.g.  this.memory[this.pc] = 10101000, this.memory[this.pc+1] = 10111010
                // after left shift by 8 = 1010100000000000
                //so now after OR operator we get
                // 1010100000000000 = 43008
                //         10111010 = 186
                //------------------
                // 1010100010111010 = 43194

                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1])

                this.executeInstruction(opcode);


                if (!this.paused) {
                    this.updateTimers();
                }
                this.playSound();
                this.renderer.render();
            }
        }
    }
    /* The delay timer is used for keeping track of when certain events occur. This timer is only used in two instructions:
        once for setting its value, and another for reading its value and branching to another instruction if a certain value is present.

    The sound timer is what controls the length of the sound. As long as the value of this.soundTimer is greater than zero, the sound will continue to play.
     When the sound timer hits zero, the sound will stop*/
    updateTimers() {
        //Each timer, delay and sound, decrement by 1 at a rate of 60Hz. In other words, every 60 frames our timers will decrement by 1.
        //Mention is section 2.5 of technical review
        //http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.5
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }
        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }
    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }
    executeInstruction(opcode: number) {
        //This entire function will be referencing section 3.0 and section 3.1 of the technical reference
        //The first piece of information to be aware of is that all instructions are 2 bytes long.
        // So every time we execute an instruction, or run this function, we have to increment the program counter (this.pc) by 2 
        //so the CPU knows where the next instruction is.
        this.pc += 2;


        //This is mention is section 3.0
        // We only need the 2nd nibble, so grab the value of the 2nd nibble
        // and shift it right 8 bits to get rid of everything but that 2nd nibble.
        let x = (opcode & 0xF00) >> 8;

        // We only need the 3rd nibble, so grab the value of the 3rd nibble
        // and shift it right 4 bits to get rid of everything but that 3rd nibble.
        let y = (opcode & 0x00F0) >> 4;

        /*
        To explain whats being done in code above, let's once again assume we have an instruction 0x5460.
         If we & (bitwise AND) that instruction with hex value 0x0F00 we'll end up with 0x0400. 
         Shift that 8 bits right and we end up with 0x04 or 0x4. Same thing with y. We & the instruction with hex value 0x00F0 and get 0x0060.
          Shift that 4 bits right and we end up with 0x006 or 0x6.
         */


        //Now comes the anoyining part writing logic for each 36 instruction
        //In switch (opcode & 0xF000), we're grabbing the upper 4 bits of the most significant byte of the opcode

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0: // CLS - For clearing the display
                        this.renderer.clear();
                        break;
                    case 0x00EE: // RET - Pop the last element in the stack array and store it in this.pc. This will return us from a subroutine.
                        this.pc = this.stack.pop();
                        break;
                }

                break;
            case 0x1000: // JP adr - Set the program counter to the value stored in nnn.
                this.pc = (opcode & 0xFFF);
                break;
            case 0x2000: // CALL adr - the interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF)
                break;
            case 0x3000: // SE Vx, byte - Skip next instruction if Vx = kk.
                /* This instruction compares the value stored in the x register (Vx) to the value of kk. 
                   Note that V signifies a register, and the value following it, in this case x, is the register number.
                   If they are equal, we increment the program counter by 2, effectively skipping the next instruction.*/
                if (this.v[x] === (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x4000: // SNE Vx, byte -Skip next instruction if Vx != kk.
                //The opcode & 0xFF part of the if statement is simply grabbing the last byte of the opcode. This is the kk portion of the opcode.
                if (this.v[x] !== (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x5000: // SE Vx, Vy - SKip next instruction if Vx == Vy
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6000: //LD Vx, byte - The interpreter puts the value kk into register Vx.
                this.v[x] = (opcode & 0xFF);
                break;
            case 0x7000: // ADD Vx, byte - Set Vx = Vx + kk.
                this.v[x] += (opcode & 0xFF)
                break;
            case 0x8000:

                /*
                The reasoning behind this is we have a handful of different instructions that fall under case 0x8000:.
                 If you take a look at those instructions in the technical reference,
                 you'll notice the last nibble of each one of these instructions ends with a value 0-7 or E. */
                switch (opcode & 0xF) {
                    case 0x0: // LD Vx, Vy - Stores the value of register Vy in register Vx.
                        this.v[x] = this.v[y];
                        break;
                    case 0x1: //OR Vx, Vy - Set Vx to the value of Vx OR Vy.
                        this.v[x] |= this.v[y];
                        break;
                    case 0x2: //AND Vx, Vy - Set Vx to the value of Vx AND Vy.
                        this.v[x] &= this.v[y];
                        break;
                    case 0x3:// XOR Vx, Vy - Set Vx equal to the value of Vx XOR Vy.
                        this.v[x] ^= this.v[y];
                        break;
                    case 0x4: //ADD Vx, Vy - This instruction add Vy from Vx
                        //According to techincal reference 
                        //If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. 
                        //Only the lowest 8 bits of the result are kept, and stored in Vx.
                        //See Here: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1

                        //Since here we are only keeping last 8 bit of result we have to do nothing since
                        //the type of our register "v" is Uint8Array which automatically takes the lower 8 bit value so we have do nothing here
                        //This is handles by Uint8Array 
                        let sum = (this.v[x] += this.v[y]);
                        this.v[0xF] = 0;
                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] = sum;
                        break;
                    case 0x5: // SUB Vx, Vy - This instruction subtracts Vy from Vx
                        //Just like overflow is handled in the previous instruction, we have to handle underflow for this one.

                        /* 
                        Once again, since we're using a Uint8Array, we don't have to do anything to handle underflow as it's taken care of for us.
                         So -1 will become 255, -2 becomes 254, and so forth.*/
                        this.v[0xF] = 0;
                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] -= this.v[y];
                        break;
                    case 0x6: // SHR Vx {, Vy} - If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.

                        // determine the least-significant bit and set VF accordingly.
                        this.v[0xF] = (this.v[x] & 0x1)
                        this.v[x] = this.v[x] >> 1;
                        break;
                    case 0x7: // SUBN Vx, Vy - If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
                        this.v[0xF] = 0;
                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    case 0xE: // SHL Vx {, Vy}- If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.

                        /*
                        The first line of code, this.v[0xF] = (this.v[x] & 0x80);, is grabbing the most significant bit of Vx and storing that in VF.
                         To explain this, we have an 8-bit register, Vx, and we want to get the most significant, or leftmost, bit.
                          To do this we need to AND Vx with binary 10000000, or 0x80 in hex. This will accomplish setting VF to the proper value.
    
                        After that, we simply multiply Vx by 2 by shifting it left 1. 
                        */
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] = this.v[x] << 1;
                        break;
                }

                break;
            case 0x9000: // SNE Vx, Vy - This instruction simply increments the program counter by 2 if Vx and Vy are not equal.
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0xA000: //LD I, addr - Set the value of register i to nnn. If the opcode is 0xA740 then (opcode & 0xFFF) will return 0x740.
                this.i = (opcode & 0xFFF);
                break;
            case 0xB000://JP V0, addr - The program counter is set to nnn plus the value of V0
                this.pc = (opcode & 0xFFF) + this.v[0];
                break;
            case 0xC000: // RND Vx, byte - The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx.
                //Generate a random number in the range 0-255 and then AND that with the lowest byte of the opcode.
                // For example, if the opcode is 0xB849, then (opcode & 0xFF) would return 0x49.    

                let rand = Math.floor(Math.random() * 0xFF);
                this.v[x] = rand & (opcode & 0xFF);
                break;
            case 0xD000://DRW Vx, Vy, nibble - This instruction handles the drawing and erasing of pixels on the screen
                //width is 8 because is sprites are size of 8 so it is safe to hardcode value;    
                let width = 8;
                //Height value is set to last nibble(n) of the opcode
                //e.g. If our opcode is 0xD235, height will be set to 5. From there we set VF to 0,
                // which if necessary, will be set to 1 later on if pixels are erased.
                let height = (opcode & 0xF);

                //Our sprites look like this,  as we have set this is loadSpritesIntoMemory Function
                //11110000
                //10010000
                //10010000
                //10010000
                //11110000
                for (let row = 0; row < height; row++) {
                    let sprite = this.memory[this.i + row];

                    for (let col = 0; col < width; col++) {
                        // If the bit (sprite) is not 0, render/erase the pixel
                        if ((sprite & 0x80) > 0) {
                            // If setPixel returns 1, which means a pixel was erased, set VF to 1
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1;
                            }
                        }
                        // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
                        // e.g. 10010000 << 1 will become 0010000
                        sprite = sprite << 1;
                    }
                }
                break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    case 0x9E: // SKP Vx - skips the next instruction if the key stored in Vx is pressed, by incrementing the program counter by 2.
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1: // SKNP Vx - opposite of previous
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }

                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    case 0x07: // LD Vx, DT
                        this.v[x] = this.delayTimer;
                        break;
                    case 0x0A: //  LD Vx, K
                        //Taking a look at the technical reference, this instruction pauses the emulator until a key is pressed. Here's the code for it:
                        this.paused = true;

                        this.keyboard.onNextKeyPress = (key: number) => {
                            this.v[x] = key;
                            this.paused = false;
                        }
                        break;
                    case 0x15: //  LD DT, Vx - DT is set equal to the value of Vx.
                        this.delayTimer = this.v[x];
                        break;
                    case 0x18: // LD ST, Vx - ST is set equal to the value of Vx.
                        this.soundTimer = this.v[x];
                        break;
                    case 0x1E: // ADD I, Vx - Add Vx to I.
                        this.i += this.v[x];
                        break;
                    case 0x29: //LD F, Vx - ADD I, Vx
                        //For this one, we are setting I to the location of the sprite at Vx. It's multiplied by 5 because each sprite is 5 bytes long.
                        this.i = this.v[x] * 5;
                        break;
                    case 0x33: // LD B, Vx
                        //This instruction is going to grab the hundreds, tens, and ones digit from register Vx and store them in registers I, I+1, and I+2 respectively.

                        // Get the hundreds digit and place it in I.
                        this.memory[this.i] = (this.v[x] / 100);

                        // Get tens digit and place it in I+1. Gets a value between 0 and 99,
                        // then divides by 10 to give us a value between 0 and 9.
                        this.memory[this.i + 1] = ((this.v[x] % 100) / 10);

                        // Get the value of the ones (last) digit and place it in I+2.
                        this.memory[this.i + 2] = (this.v[x] % 10);
                        break;
                    case 0x55://LD [I], Vx -  we are looping through registers V0 through Vx and storing its value in memory starting at I.
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    case 0x65://LD Vx, [I] -  This one does the opposite of Fx55. It reads values from memory starting at I and stores them in registers V0 through Vx.
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                        break;
                }

                break;

            default:
                throw new Error('Unknown opcode ' + opcode);
        }

    }
}

export default CPU;