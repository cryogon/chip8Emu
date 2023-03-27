class Keyboard {
    KEYMAP:Object;
    keysPressed:boolean[] = [];
    onNextKeyPress: Function | null;
    constructor() {
        //This is used to map chip8 inputs with keyboards keycode where 1 is 49 ,2 is 50 and so on
        this.KEYMAP = {
            49: 0x1,
            50: 0x2,
            51: 0x3,
            52: 0xC,
            53: 0x4,
            54: 0x5,
            56: 0x6,
            57: 0xD,
            58: 0x7,
            59: 0x8,
            60: 0x9,
            61: 0xE,
            62: 0xA,
            63: 0x0,
            64: 0xB,
            65: 0xF
        }

        this.keysPressed = [];

        //Some Chip-8 Instaruction require waiting for next keypress, we initialize this function when needed;
        this.onNextKeyPress = null;

        window.addEventListener("keydown", this.onKeyDown.bind(this), false);
        window.addEventListener("keyup", this.onKeyUp.bind(this), false);

    }
    // This will simply check the keysPressed array for the specified Chip-8 keyCode.
    isKeyPressed(keyCode:number) {
        return this.keysPressed[keyCode];
    }
    onKeyDown(event:InputEvent) {
        //I know its depecated will replace it with keyName later
        let key = this.KEYMAP[event.which];

        this.keysPressed[key] = true;
        // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key
        if (this.onNextKeyPress !== null && key) {
            this.onNextKeyPress(parseInt(key));
            this.onNextKeyPress = null;
        }
    }
    onKeyUp(event:InputEvent) {
        let key = this.KEYMAP[event.which];
        this.keysPressed[key] = false;
    }
}

export default Keyboard;