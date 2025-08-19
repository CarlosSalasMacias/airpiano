
import React from 'react';
import { Instrument } from '../constants';

interface InstrumentSelectorProps {
    instruments: Instrument[];
    selectedInstrument: Instrument;
    onSelect: (instrument: Instrument) => void;
}

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ instruments, selectedInstrument, onSelect }) => {
    return (
        <div className="flex flex-col">
            <label htmlFor="instrument-select" className="mb-2 text-sm font-medium text-gray-400">
                Selecciona un Instrumento
            </label>
            <div className="relative">
                <select
                    id="instrument-select"
                    value={selectedInstrument.name}
                    onChange={(e) => {
                        const newInstrument = instruments.find(i => i.name === e.target.value);
                        if (newInstrument) {
                            onSelect(newInstrument);
                        }
                    }}
                    className="w-full appearance-none bg-gray-700 border border-gray-600 text-white py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-gray-600 focus:border-purple-500"
                >
                    {instruments.map((instrument) => (
                        <option key={instrument.name} value={instrument.name}>
                            {instrument.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default InstrumentSelector;
