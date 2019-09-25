function chart(id, geo, data) {
    console.log('chart()')
    console.log("id", id)
    console.log("geo", geo)
    console.log("data", data)

    let margin = { top: 55, right: 130, bottom: 55, left: 20 };
    let width = 310 - margin.left - margin.right;
    let height = 210 - margin.top - margin.bottom;
    let yearLineOffset = 20;

    let { incidents_total, coverage, population } = data.filter(d => d.year == year)[0];
    let incidents = incidents_total;
    data.sort((a, b) => a.year - b.year);
    let country = data[0].country


    function hideTooltip() {
        d3.select("body")
            .select("#tooltip-Container")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .transition()
            .duration(1)
            .style("display", "None");
    }

    function makeChart() {
        d3
            .select("body")
            .select("#tooltip-Container")
            .select("svg")
            .remove()

        console.log('makeChart()')
        var coords = path.centroid(geo);
        console.log('coords', coords)

        d3
            .select("body")
            .select("#tooltip-Container")
            .style("left", coords[0] - 550 / 2 + "px")
            .style("top", coords[1] - 210 / 2 + "px")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        d3
            .select("body")
            .select("#tooltip-Container")
            .on("mouseout", hideTooltip)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        tooltip = d3.select("#tooltip-Container")
            .append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        let scaleTime = d3
            .scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);

        let scaleIncidents = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.incidents)])
            .range([height, 0]);

        let scaleCoverage = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.coverage)])
            .range([height, 0]);

        let scalePopulation = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.population)])
            .range([height, 0]);

        // Axes.
        let xAxis = d3
            .axisBottom()
            .scale(scaleTime)
            .ticks(5);

        let yAxisLeft = d3
            .axisLeft()
            .scale(scaleIncidents)
            .ticks(5);

        let yAxisLeftPop = d3
            .axisLeft()
            .scale(scalePopulation)
            .ticks(5);

        let yAxisRight = d3
            .axisRight()
            .scale(scaleCoverage)
            .ticks(5);

        // Path generators.
        let areaPopulation = d3
            .area()
            .x(d => scaleTime(d.year))
            .y0(d => height)
            .y1(d => scalePopulation(d.population));

        let lineIncidents = d3
            .line()
            .x(d => scaleTime(d.year))
            .y(d => scaleIncidents(d.incidents));

        let lineCoverage = d3
            .line()
            .x(d => scaleTime(d.year))
            .y(d => scaleCoverage(d.coverage));

        // Aesthetics
        let colorPop = "#e2e2e2";
        let colorCoverage = "#3e90d0";
        let colorIncidents = "#be006b";
        let colorYear = "#c3c7cb";

        // Drawing
        let populationArea = tooltip
            .append("path")
            .attr("d", areaPopulation(data))
            .attr("fill", colorPop);

        let coverageLine = tooltip
            .append("path")
            .attr("d", lineCoverage(data))
            .attr("class", "line")
            .style("stroke", colorCoverage);

        let incidentsLine = tooltip
            .append("path")
            .attr("d", lineIncidents(data))
            .attr("class", "line")
            .style("stroke", colorIncidents);

        let yearLine = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", scaleTime(year))
            .attr("y1", height + yearLineOffset)
            .attr("x2", scaleTime(year))
            .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents)]));

        let coverageCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleCoverage(coverage))
            .attr("r", "5")
            .style("fill", colorCoverage);

        let incidentsCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleIncidents(incidents))
            .attr("r", "5")
            .style("fill", colorIncidents);

        let yearCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", height + yearLineOffset)
            .attr("r", "5")
            .style("fill", colorYear);

        let yearAxis = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", 0)
            .attr("y1", height + 20)
            .attr("x2", width)
            .attr("y2", height + 20);

        // Annotations
        let countryLabel = tooltip
            .append("text")
            .text(country.replace('(the)', '').toUpperCase())
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("class", "countryText");

        let yearLabel = tooltip
            .append("text")
            .text(year)
            .attr("x", scaleTime(year))
            .attr("y", height + 45)
            .attr("class", "yearText");

        // Coverage Text
        tooltip.append("text")
            .text(`${Math.round(coverage * 100) / 100}%`)
            .attr("x", width + 15)
            .attr("y", 0)
            .style("fill", colorCoverage)
            .attr("class", "numberText");

        tooltip.append("text")
            .text("vaccine coverage")
            .attr("x", width + 15)
            .attr("y", 14)
            .style("fill", colorCoverage)
            .attr("class", "textText");

        // Incidents Text
        tooltip.append("text")
            .text(Math.round(incidents * 100) / 100)
            .attr("x", width + 15)
            .attr("y", scaleCoverage.range()[0] / 2 - 6)
            .style("fill", colorIncidents)
            .attr("class", "numberText");

        tooltip.append("text")
            .text("polio cases")
            .attr("x", width + 15)
            .attr("y", scaleCoverage.range()[0] / 2 + 6)
            .style("fill", colorIncidents)
            .attr("class", "textText");

        // Population Text
        tooltip.append("text")
            .text(nFormatter(population))
            .attr("x", width + 15)
            .attr("y", height - 14)
            .style("fill", "#6b747b")
            .attr("class", "numberText");

        tooltip.append("text")
            .text("population")
            .attr("x", width + 15)
            .attr("y", height)
            .style("fill", "#6b747b")
            .attr("class", "textText");
    }

    return makeChart();
}