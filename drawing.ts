import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Define the connections between landmarks for drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle finger
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17]
];


export const drawHandLandmarks = (
    ctx: CanvasRenderingContext2D, 
    landmarks: NormalizedLandmark[][],
    videoWidth: number,
    videoHeight: number,
    activeFingers: Set<string>
) => {
    if (!landmarks) return;

    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';

    landmarks.forEach((hand, handIndex) => {
        // Draw connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        HAND_CONNECTIONS.forEach(connection => {
            const start = hand[connection[0]];
            const end = hand[connection[1]];
            if (start && end) {
                ctx.beginPath();
                ctx.moveTo((1 - start.x) * videoWidth, start.y * videoHeight);
                ctx.lineTo((1 - end.x) * videoWidth, end.y * videoHeight);
                ctx.stroke();
            }
        });

        // Draw landmarks
        hand.forEach((point, index) => {
            if (point) {
                const fingerId = `h${handIndex}-f${index}`;
                const isActive = activeFingers.has(fingerId);

                ctx.beginPath();
                let radius = 6;
                let color = 'rgba(190, 50, 245, 0.8)'; // Purple for most points

                // Highlight fingertips
                const FINGERTIP_INDEXES = [4, 8, 12, 16, 20];
                if (FINGERTIP_INDEXES.includes(index)) {
                     radius = isActive ? 15 : 10;
                     // Green for active, pink for inactive fingertip
                     color = isActive ? 'rgba(50, 255, 150, 1)' : 'rgba(255, 80, 150, 0.9)';
                }

                ctx.fillStyle = color;
                ctx.arc((1 - point.x) * videoWidth, point.y * videoHeight, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    });
};
