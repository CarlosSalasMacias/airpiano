
import React from 'react';

interface StatusDisplayProps {
    status: string;
    webcamRunning: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, webcamRunning }) => {
    if (webcamRunning) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="text-center">
                <div className="text-2xl font-semibold mb-2">{status}</div>
                {status.includes('Listo') && (
                     <p className="text-gray-300">Presiona "Iniciar Webcam" para comenzar a crear música.</p>
                )}
                 {status.includes('Cargando') && (
                    <div className="mt-4 flex justify-center">
                        <div className="w-10 h-10 border-4 border-t-purple-400 border-gray-600 rounded-full animate-spin"></div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default StatusDisplay;
