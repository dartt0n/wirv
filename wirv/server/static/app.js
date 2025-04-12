import { GlobeVisualization } from './globe.js';
import { Timeline } from './timeline.js';

class App {
    constructor() {
        this.globe = new GlobeVisualization();
        this.timeline = new Timeline();
        this.playbackSpeed = 1;
        this.isPlaying = false;
        this.currentTime = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.speed-control button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.playbackSpeed = parseInt(e.target.dataset.speed);
                document.querySelectorAll('.speed-control button').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        this.timeline.on('rangeSelected', async (range) => {
            const logs = await this.fetchLogRange(range.from, range.to);
            this.globe.clearArcs();
            this.startVisualization(logs);
        });
    }

    async fetchLogRange(from, to) {
        try {
            const response = await fetch(`/api/request_log/range?from=${from.toISOString()}&to=${to.toISOString()}`);
            const data = await response.json();
            return data.logs;
        } catch (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
    }

    async initialize() {
        try {
            const [timelineResponse, rangeResponse] = await Promise.all([
                fetch('/api/request_log/timeline'),
                fetch('/api/request_log/range')
            ]);

            const timelineData = await timelineResponse.json();
            const rangeData = await rangeResponse.json();

            if (timelineData.buckets && timelineData.buckets.length > 0) {
                const timestamps = timelineData.buckets.map(b => new Date(b.timestamp));
                const from = d3.min(timestamps);
                const to = d3.max(timestamps);
                this.timeline.setTimeRange(from, to, timelineData.buckets);

                if (rangeData.logs && rangeData.logs.length > 0) {
                    this.startVisualization(rangeData.logs);
                }
            }
        } catch (error) {
            console.error('Error fetching timeline range:', error);
        }
    }

    startVisualization(logs) {
        if (!logs.length) return;
        
        this.isPlaying = true;
        const startTime = new Date(logs[0].timestamp);
        let currentIndex = 0;
        let lastTimestamp = performance.now();

        const animate = (timestamp) => {
            if (!this.isPlaying || currentIndex >= logs.length) {
                this.isPlaying = false;
                return;
            }

            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            const simulatedTime = new Date(
                startTime.getTime() + (deltaTime * this.playbackSpeed)
            );
            this.timeline.updateCurrentTime(simulatedTime);

            while (currentIndex < logs.length) {
                const log = logs[currentIndex];
                const logTime = new Date(log.timestamp);

                if (logTime <= simulatedTime) {
                    this.globe.addArc({
                        id: log.id,
                        startLat: log.latitude,
                        startLng: log.longitude,
                        endLat: log.server_latitude || 37.7749,
                        endLng: log.server_longitude || -122.4194,
                        color: log.suspicious ? 0xff0000 : 0x808080,
                        ip: log.ip
                    });
                    currentIndex++;
                } else {
                    break;
                }
            }

            requestAnimationFrame(animate);
        };

        lastTimestamp = performance.now();
        animate(lastTimestamp);
    }
}

const app = new App();
app.initialize();
