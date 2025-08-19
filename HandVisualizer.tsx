import React from 'react';

interface HandVisualizerProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const HandVisualizer: React.FC<HandVisualizerProps> = ({ videoRef, canvasRef }) => {
    return (
        <>
            <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
                autoPlay
                playsInline
            ></video>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
            ></canvas>
        </>
    );
};

export default HandVisualizer;