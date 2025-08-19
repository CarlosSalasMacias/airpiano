
import * as Tone from 'tone';
import { SynthType } from '../types';

export class AudioService {
    private synth: Tone.PolySynth;
    private isInitialized: boolean = false;

    constructor(initialSynth: SynthType) {
        this.synth = this.createSynth(initialSynth);
        this.synth.toDestination();
    }

    private async initializeAudio() {
        if (!this.isInitialized && Tone.context.state !== 'running') {
            await Tone.start();
            console.log('AudioContext started');
            this.isInitialized = true;
        }
    }

    private createSynth(synthType: SynthType): Tone.PolySynth {
        let synth;
        switch (synthType) {
            case 'AMSynth':
                synth = new Tone.PolySynth(Tone.AMSynth);
                break;
            case 'FMSynth':
                synth = new Tone.PolySynth(Tone.FMSynth);
                break;
            case 'DuoSynth':
                 synth = new Tone.PolySynth(Tone.DuoSynth);
                 break;
            case 'MembraneSynth':
                synth = new Tone.PolySynth(Tone.MembraneSynth);
                break;
            case 'Synth':
            default:
                synth = new Tone.PolySynth(Tone.Synth);
                break;
        }
        return synth;
    }

    public setInstrument(synthType: SynthType) {
        if (this.synth) {
            this.synth.dispose();
        }
        this.synth = this.createSynth(synthType);
        const reverb = new Tone.Reverb(1.5).toDestination();
        this.synth.connect(reverb);
    }

    public async playNote(note: string, duration: Tone.Unit.Time) {
        await this.initializeAudio();
        this.synth.triggerAttackRelease(note, duration);
    }
}
