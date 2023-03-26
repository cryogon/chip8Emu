/** 
 * Handles everything related to rendering
 */
class Renderer {
    display: Array<number>;
    cols: number;
    rows: number;
    scale: number;
    /**
   * This is for rendering all this in canvas
   */
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;


    constructor(scale: number) {
        /*Since Chip8 had 64*32 pixels of display this cols and rows are set to this */
        this.cols = 64;
        this.rows = 32;
        /**
         * 64*32 pixels of display is too small for todays devices so scaling helps it display on bigger devices 
         * */
        this.scale = scale;
        /**
         * It is Actual Screen of Chip8 With array of size 64*32 = 2048 each storing 1 and 0
         * 1 if pixel is on and 0 if pixel is off
         */
        this.display = new Array(this.cols * this.rows);
        this.canvas = document.getElementById("screen") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.cols * this.scale;
        this.canvas.height = this.rows * this.scale;
    }

    setPixel(x: number, y: number) {
        if (x > this.cols) {
            x -= this.cols;
        } else if (x < 0) {
            x += this.cols;
        }
        if (y > this.rows) {
            y -= this.rows;
        } else if (y < 0) {
            y += this.rows;
        }

        let pixelLoc = x + (y * this.cols);
        /**
         * According to the technical reference, sprites are XORed onto the display:
         * All that this line is doing is toggling the value at pixelLoc (0 to 1 or 1 to 0).
         * A value of 1 means a pixel should be drawn, a value of 0 means a pixel should be erased. From here,
         * we just return a value to signify whether a pixel was erased or not.
         */
        this.display[pixelLoc] ^= 1;
        console.log(this.display)
        return !this.display[pixelLoc];
    }
    /**
     * Clear The display for reinitializing it
     */
    clear() {
        this.display = new Array(this.cols * this.rows);
    }

    render() {
        if (this.ctx) {
            //Clears the display every render cycle, Typically for render loop
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            //loop through our display array
            for (let i = 0; i < this.rows * this.cols; i++) {
                //Grabs the x position of the pixel based off 'i'
                let x = (i % this.cols) * this.scale;

                //Grabs the y position of the pixel
                let y = Math.floor(i / this.cols) * this.scale;
                // If the value at this.display[i] == 1, then draw a pixel.
                if (this.display[i]) {
                    // Set the pixel color to black
                    this.ctx.fillStyle = '#000';

                    // Place a pixel at position (x, y) with a width and height of scale
                    this.ctx.fillRect(x, y, this.scale, this.scale);
                }
            }
        }
    }

    //For testing purpose
    testRender() {
        this.setPixel(0, 0);
        this.setPixel(4, 3);
    }
}
export default Renderer;