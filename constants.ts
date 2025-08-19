
import { SynthType } from "./types";

export interface Instrument {
    name: string;
    synth: SynthType;
}

export const instruments: Instrument[] = [
    { name: "Sintetizador", synth: "Synth" },
    { name: "Piano (FM)", synth: "FMSynth" },
    { name: "Sintetizador AM", synth: "AMSynth" },
    { name: "Sintetizador Duo", synth: "DuoSynth" },
    { name: "Membrana", synth: "MembraneSynth" },
];
