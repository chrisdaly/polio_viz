function time_series(divId, geo, year, data, coords) {
  let margin = {
    top: 40,
    right: 80,
    bottom: 44,
    left: 15,
  };
  let tooltipWidth = 320 - margin.left - margin.right;
  let tooltipHeight = 175 - margin.top - margin.bottom;
  let yearLineOffset = 15;
  let textOffset = 14;
  let manualOffset = 6;
  let circleRadius = 4;

  let { incidents, coverage, population, incidents_total } = data.filter((d) => d.year == parseInt(year))[0];
  data.sort((a, b) => a.year - b.year);
  let country = data[0].country_new;
  // console.log("COUNTRY: ", country);
  // console.log("data", data);
  // console.log("geo", geo);

  function makeChart() {
    // Interupt any mouseout transition.
    d3.select("body").select(divId).transition();

    d3.select("body").select(divId).select("svg").remove();

    var centroid = path.centroid(geo);
    let left = centroid[0] + coords["left"] - 330 / 2;
    let top = centroid[1] + coords["top"] - (210 + 40);
    // console.log("left", left);
    // console.log("top", top);

    tooltip = d3
      .select(divId)
      .style("opacity", 1)
      .style("left", `${left}px`)
      .style("top", `${top}px`)
      .append("svg")
      .attr("width", tooltipWidth + margin.left + margin.right)
      .attr("height", tooltipHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("id", "tooltipChart");

    // Scale the range of the data
    let scaleTime = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, tooltipWidth]);

    scaleIncidents = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => (!isNaN(d.incidents_total) ? d.incidents_total : 0))])
      .range([tooltipHeight, 0]);

    // let scaleCoverage = d3
    //     .scaleLinear()
    //     .domain([0, 100]) //d3.max(data, d => d.coverage)])
    //     .range([tooltipHeight, 0]);

    let scalePopulation = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.population)])
      .range([tooltipHeight, 0]);

    // Axes.
    let xAxis = d3.axisBottom().scale(scaleTime).ticks(5);

    let yAxisLeft = d3.axisLeft().scale(scaleIncidents).ticks(5);

    let yAxisLeftPop = d3.axisLeft().scale(scalePopulation).ticks(5);

    // let yAxisRight = d3
    //     .axisRight()
    //     .scale(scaleCoverage)
    //     .ticks(5);

    // Path generators.
    let areaPopulation = d3
      .area()
      .x((d) => scaleTime(d.year))
      .y0((d) => tooltipHeight)
      .y1((d) => scalePopulation(d.population));

    lineIncidents = d3
      .line()
      .defined((d) => !isNaN(d.incidents_total))
      .x((d) => scaleTime(d.year))
      .y((d) => {
        if (scaleIncidents.domain()[1] == 0) return tooltipHeight;
        return scaleIncidents(d.incidents_total);
      });

    // lineCoverage = d3
    //     .line()
    //     .defined(d => !isNaN(d.coverage))
    //     .x(d => scaleTime(d.year))
    //     .y(d => scaleCoverage(d.coverage));

    var filteredDataIncidents = data.filter(lineIncidents.defined());
    // var filteredDataCoverage = data.filter(lineCoverage.defined());

    // console.log("filteredDataIncidents", filteredDataIncidents);

    // Aesthetics
    let colorPop = "#F1F2F3";
    // let colorCoverage = "#3e90d0";
    let colorIncidents = "#525CA3";
    let colorYear = "#A5ACB1";

    // Drawing
    let populationArea = tooltip.append("path").attr("d", areaPopulation(data)).attr("fill", colorPop);

    // let coverageLineMissing = tooltip
    //     .append("path")
    //     .attr("d", lineCoverage(data))
    //     .attr("class", "line dashed")
    //     .style("stroke", "red");

    // let coverageLine = tooltip
    //     .append("path")
    //     .attr("d", lineCoverage(filteredDataCoverage))
    //     .attr("class", "line")
    //     .style("stroke", colorCoverage);

    let incidentsLineMissing = tooltip
      .append("path")
      .attr("d", lineIncidents(data.filter(lineIncidents.defined())))
      .attr("class", "line dashed")
      .style("stroke", colorIncidents);

    let incidentsLine = tooltip.append("path").attr("d", lineIncidents(data)).attr("class", "line incidents").style("stroke", colorIncidents);

    let yearLine = tooltip
      .append("line")
      .style("stroke", colorYear)
      .attr("x1", scaleTime(year))
      .attr("y1", tooltipHeight + yearLineOffset)
      .attr("x2", scaleTime(year))
      .attr("y2", scaleIncidents(incidents_total));
    // .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents_total)]));

    // // Circles.
    // if (coverage != "null") {
    //     let coverageCircle = tooltip
    //         .append("circle")
    //         .attr("cx", scaleTime(year))
    //         .attr("cy", scaleCoverage(coverage))
    //         .attr("r", circleRadius)
    //         .style("fill", colorCoverage);
    // }

    if (incidents_total != "null") {
      let incidentsCircle = tooltip
        .append("circle")
        .attr("cx", scaleTime(year))
        .attr("cy", () => {
          if (scaleIncidents.domain()[1] == 0) return tooltipHeight;
          return scaleIncidents(incidents_total);
        })
        .attr("r", circleRadius)
        .style("fill", colorIncidents);
    }

    let yearCircle = tooltip
      .append("circle")
      .attr("cx", scaleTime(year))
      .attr("cy", tooltipHeight + yearLineOffset)
      .attr("r", circleRadius)
      .style("fill", colorYear);

    // Bottom year axis.
    let yearAxis = tooltip
      .append("line")
      .style("stroke", colorYear)
      .attr("x1", 0)
      .attr("y1", tooltipHeight + yearLineOffset)
      .attr("x2", tooltipWidth)
      .attr("y2", tooltipHeight + yearLineOffset);

    // Annotations
    let countryLabel = tooltip
      .append("text")
      .text(country.toUpperCase())
      .attr("x", 310 / 2)
      .attr("y", -20)
      .attr("class", "countryText");

    let yearLabel = tooltip
      .append("text")
      .text(year)
      .attr("x", scaleTime(year))
      .attr("y", tooltipHeight + yearLineOffset + textOffset + 12)
      .attr("class", "yearText");

    // Coverage Text
    // if (!isNaN(coverage)) {
    //     tooltip
    //         .append("text")
    //         .text(`${Math.round(coverage * 100) / 100}%`)
    //         .attr("x", tooltipWidth + 15)
    //         .attr("y", 0)
    //         .style("fill", colorCoverage)
    //         .attr("class", "numberText");

    //     tooltip
    //         .append("text")
    //         .text("vaccine")
    //         .attr("x", tooltipWidth + 15)
    //         .attr("y", textOffset)
    //         .style("fill", colorCoverage)
    //         .attr("class", "textText");

    //     tooltip
    //         .append("text")
    //         .text("coverage")
    //         .attr("x", tooltipWidth + 15)
    //         .attr("y", textOffset * 2)
    //         .style("fill", colorCoverage)
    //         .attr("class", "textText");
    // } else {
    //     tooltip
    //         .append("text")
    //         .text("No")
    //         .attr("x", tooltipWidth + 15)
    //         .attr("y", 0)
    //         .style("fill", colorCoverage)
    //         .attr("class", "numberText");

    //     tooltip
    //         .append("text")
    //         .text("data")
    //         .attr("x", tooltipWidth + 15)
    //         .attr("y", textOffset)
    //         .style("fill", colorCoverage)
    //         .attr("class", "textText");
    // }

    // Incidents Text
    if (!isNaN(incidents_total)) {
      tooltip
        .append("text")
        .text(incidents_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
        .attr("x", tooltipWidth + 12)
        .attr("y", () => {
          let mid = scaleIncidents.range()[0] / 2;
          return mid - textOffset + manualOffset;
        })
        .style("fill", colorIncidents)
        .attr("class", "TTnumberText");

      tooltip
        .append("text")
        .text("polio cases")
        .attr("x", tooltipWidth + 12)
        .attr("y", () => {
          let mid = scaleIncidents.range()[0] / 2;
          return mid + manualOffset;
        })
        .style("fill", colorIncidents)
        .attr("class", "textText");

      // tooltip
      //     .append("text")
      //     .text(incidents_total == 1 ? "case" : "cases")
      //     .attr("x", tooltipWidth + 15)
      //     .attr("y", () => {
      //         let mid = scaleIncidents.range()[0] / 2;
      //         return mid + textOffset + manualOffset;
      //     })
      //     .style("fill", colorIncidents)
      //     .attr("class", "textText");
    } else {
      tooltip
        .append("text")
        .text("No")
        .attr("x", tooltipWidth + 12)
        .attr("y", () => {
          let mid = scaleIncidents.range()[0] / 2;
          return mid - textOffset + manualOffset;
        })
        .style("fill", colorIncidents)
        .attr("class", "TTnumberText");

      tooltip
        .append("text")
        .text("data")
        .attr("x", tooltipWidth + 12)
        .attr("y", () => {
          let mid = scaleIncidents.range()[0] / 2;
          return mid + manualOffset;
        })
        .style("fill", colorIncidents)
        .attr("class", "textText");
    }

    // Population Text
    if (!isNaN(population)) {
      tooltip
        .append("text")
        .text(nFormatter(population))
        .attr("x", tooltipWidth + 12)
        .attr("y", tooltipHeight - textOffset)
        .style("fill", "#A5ACB1")
        .attr("class", "TTnumberText");

      tooltip
        .append("text")
        .text("population")
        .attr("x", tooltipWidth + 12)
        .attr("y", tooltipHeight)
        .style("fill", "#A5ACB1")
        .attr("class", "textText");
    } else {
      tooltip
        .append("text")
        .text("No")
        .attr("x", tooltipWidth + 12)
        .attr("y", tooltipHeight - textOffset)
        .style("fill", "#A5ACB1")
        .attr("class", "TTnumberText");

      tooltip
        .append("text")
        .text("data")
        .attr("x", tooltipWidth + 12)
        .attr("y", tooltipHeight)
        .style("fill", "#A5ACB1")
        .attr("class", "textText");
    }
  }

  return makeChart();
}
