export class Timeline {
    constructor() {
        this.margin = { top: 10, right: 30, bottom: 30, left: 40 };
        this.height = 100;
        this.padding = 20;

        // Create the container div for the timeline
        this.container = d3.select("#timeline")
            .style("position", "relative")
            .style("background", "#2a2a2a")
            .style("border-radius", "8px")
            .style("padding", `${this.padding}px`);

        // Calculate width based on container
        this.width = parseInt(this.container.style("width")) - this.margin.left - this.margin.right - (this.padding * 2);

        // Create SVG
        this.svg = this.container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Initialize scales
        this.timeScale = d3.scaleTime().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        // Create axes
        this.xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`);

        this.yAxis = this.svg.append("g")
            .attr("class", "y-axis");

        // Create the brush
        this.brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on("end", this.brushed.bind(this));

        // Add brush to SVG
        this.brushGroup = this.svg.append("g")
            .attr("class", "brush");

        // Create current time indicator
        this.currentTimeIndicator = this.svg.append("line")
            .attr("class", "current-time-indicator")
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .style("display", "none");

        // Style axes and text
        this.svg.selectAll(".domain")
            .attr("stroke", "#666");
        
        this.svg.selectAll(".tick line")
            .attr("stroke", "#666");
        
        this.svg.selectAll(".tick text")
            .attr("fill", "#fff");

        // Add event listeners
        this.listeners = new Map();
        window.addEventListener("resize", this.onResize.bind(this));
    }

    setTimeRange(from, to, buckets) {
        // Set time domain
        this.timeScale.domain([from, to]);

        // Calculate y scale based on bucket counts
        const maxCount = d3.max(buckets, d => d.count);
        this.yScale.domain([0, maxCount]);

        // Update axes
        this.xAxis.call(d3.axisBottom(this.timeScale));
        this.yAxis.call(d3.axisLeft(this.yScale));

        // Create histogram bars
        const bars = this.svg.selectAll(".bar")
            .data(buckets);

        // Remove old bars
        bars.exit().remove();

        // Update existing bars
        bars.attr("x", d => this.timeScale(new Date(d.timestamp)))
            .attr("y", d => this.yScale(d.count))
            .attr("width", this.width / buckets.length)
            .attr("height", d => this.height - this.yScale(d.count));

        // Add new bars
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => this.timeScale(new Date(d.timestamp)))
            .attr("y", d => this.yScale(d.count))
            .attr("width", this.width / buckets.length)
            .attr("height", d => this.height - this.yScale(d.count))
            .attr("fill", "#4a4a4a");

        // Update brush
        this.brushGroup.call(this.brush);
    }

    updateCurrentTime(time) {
        const x = this.timeScale(time);
        this.currentTimeIndicator
            .attr("x1", x)
            .attr("x2", x)
            .style("display", "block");
    }

    on(event, callback) {
        this.listeners.set(event, callback);
    }

    brushed(event) {
        if (!event.selection) return;
        
        const [x0, x1] = event.selection;
        const range = {
            from: this.timeScale.invert(x0),
            to: this.timeScale.invert(x1)
        };
        
        const callback = this.listeners.get("rangeSelected");
        if (callback) callback(range);
    }

    onResize() {
        // Update width based on new container size
        this.width = parseInt(this.container.style("width")) - this.margin.left - this.margin.right - (this.padding * 2);

        // Update SVG size
        this.container.select("svg")
            .attr("width", this.width + this.margin.left + this.margin.right);

        // Update scales
        this.timeScale.range([0, this.width]);

        // Update axes and brush
        this.xAxis.call(d3.axisBottom(this.timeScale));
        this.brushGroup.call(this.brush);
    }
}
