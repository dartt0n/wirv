export class Timeline {
    constructor() {
        this.container = d3.select('#timeline');
        this.margin = { top: 20, right: 20, bottom: 20, left: 40 };
        this.width = this.container.node().getBoundingClientRect().width - this.margin.left - this.margin.right;
        this.height = 100 - this.margin.top - this.margin.bottom;
        this.listeners = new Map();
        this.currentTime = null;
        
        this.setupSVG();
        window.addEventListener('resize', () => this.onResize());
    }

    setupSVG() {
        this.svg = this.container
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create clip path
        this.svg.append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.width)
            .attr('height', this.height);

        // Create group for histogram bars
        this.barsGroup = this.svg.append('g')
            .attr('clip-path', 'url(#clip)');

        // Create group for current time indicator
        this.timeIndicator = this.svg.append('g')
            .attr('class', 'time-indicator')
            .style('display', 'none');

        this.timeIndicator.append('line')
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('y1', 0)
            .attr('y2', this.height);
    }

    setTimeRange(from, to, buckets) {
        this.timeScale = d3.scaleTime()
            .domain([from, to])
            .range([0, this.width]);

        // Create y scale for histogram
        const maxCount = d3.max(buckets, d => d.count);
        this.yScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([this.height, 0]);

        // Draw histogram bars
        this.barsGroup.selectAll('rect')
            .data(buckets)
            .join('rect')
            .attr('x', d => this.timeScale(new Date(d.timestamp)))
            .attr('y', d => this.yScale(d.count))
            .attr('width', this.width / buckets.length)
            .attr('height', d => this.height - this.yScale(d.count))
            .attr('fill', '#4169e1')
            .attr('opacity', 0.5);

        // Draw axes
        const xAxis = d3.axisBottom(this.timeScale);
        const yAxis = d3.axisLeft(this.yScale);

        this.svg.selectAll('.x-axis').remove();
        this.svg.selectAll('.y-axis').remove();

        this.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(xAxis);

        this.svg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        // Create brush
        const brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on('end', (event) => {
                if (!event.selection) return;
                const [x0, x1] = event.selection;
                const [t0, t1] = [this.timeScale.invert(x0), this.timeScale.invert(x1)];
                this.emit('rangeSelected', { from: t0, to: t1 });
            });

        this.svg.selectAll('.brush').remove();
        this.svg.append('g')
            .attr('class', 'brush')
            .call(brush);
    }

    updateCurrentTime(timestamp) {
        this.currentTime = timestamp;
        if (!this.timeScale || !timestamp) {
            this.timeIndicator.style('display', 'none');
            return;
        }

        const x = this.timeScale(new Date(timestamp));
        this.timeIndicator
            .style('display', null)
            .attr('transform', `translate(${x},0)`);
    }

    onResize() {
        this.width = this.container.node().getBoundingClientRect().width - this.margin.left - this.margin.right;
        
        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right);
        
        if (this.timeScale) {
            this.timeScale.range([0, this.width]);
            this.svg.select('.x-axis')
                .call(d3.axisBottom(this.timeScale));
                
            this.svg.select('.brush')
                .call(d3.brushX()
                    .extent([[0, 0], [this.width, this.height]]));

            // Update histogram bars
            const bars = this.barsGroup.selectAll('rect');
            if (!bars.empty()) {
                const data = bars.data();
                bars
                    .attr('x', d => this.timeScale(new Date(d.timestamp)))
                    .attr('width', this.width / data.length);
            }

            // Update time indicator
            if (this.currentTime) {
                this.updateCurrentTime(this.currentTime);
            }
        }
    }

    on(event, callback) {
        this.listeners.set(event, callback);
    }

    emit(event, data) {
        const callback = this.listeners.get(event);
        if (callback) callback(data);
    }
}
