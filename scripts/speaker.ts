class Speaker {
    audioCtx:AudioContext;
    gain:GainNode;
    finish:AudioDestinationNode;
    oscillator:OscillatorNode | null;
    constructor() {

        this.audioCtx = new window.AudioContext();
        //create a gain which will allow us to control the volume
        this.gain = this.audioCtx.createGain();
        this.finish = this.audioCtx.destination;
        this.oscillator = null;
        //connext the gain to audio context
        this.gain.connect(this.finish);
    }
    /**
     * 
     * @param {0 | 1} vol
     * `0` - To mute audio
     * `1` - To unmute audio
     */
 
    play(frequency:number) {
        // We are creating an oscillator which is what will be playing our sound. We set its frequency, the type, connect it to the gain,
        // then finally play the sound. Nothing too crazy here.


        if (this.audioCtx && !this.oscillator) {
            this.oscillator = this.audioCtx.createOscillator();

            //Set the frequency
            this.oscillator.frequency.setValueAtTime(frequency || 440, this.audioCtx.currentTime);

            //Square Wave
            this.oscillator.type = "square";

            //Connect the gain and start the sound 

            this.oscillator.connect(this.gain);
            this.oscillator.start();
        }
    }

    stop(){
        if(this.oscillator){
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
}
export default Speaker;