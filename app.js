var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "income";

// function used for updating x-scale var upon click on axis label
function xScale(csvData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(csvData, d => d[chosenXAxis]) * 0.8,
      d3.max(csvData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

  if (chosenXAxis === "poverty") {
    var xlabel = "% Pop. Impoverished";
  }
  else {
    var xlabel = "% Pop. lacking Healthcare";
  }

  if (chosenYAxis === "income") {
    var ylabel = "Median Income";
  }
  else {
    var ylabel = "% Pop who Smokes";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function(d) {
      return (`${d.state}<br>${xlabel} ${d[chosenXAxis]}<br>${ylabel} ${d[chosenYAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("data.csv", function(err, csvData) {
  if (err) throw err;

  // parse data
  csvData.forEach(function(data) {
    data.state = data.state; //State Name
    //console.log(data)
    data.abbr = +data.abbr;  //State Abbreviation
    data.poverty = +data.poverty; //Percent of State pop. in poverty
    data.povertyMoe = +data.povertyMoe; //Margin of Error for %Impoverished
    data.age = +data.age; //Median Age
    data.ageMoe = +data.ageMoe; //Margin of Error for Median Age
    data.income = +data.income; //Median household income
    data.incomeMoe = +data.incomeMoe; //Margin of Error for Median Income
    data.healthcare = +data.healthcare; //% Reporting not having healthcare
    data.healthcareLow = +data.healthcareLow; //Lower bound of CI
    data.healthcareHigh = +data.healthcareHigh; //Upper bound of CI
    data.obesity = +data.obesity; //% of population with BMI>30
    data.obesityLow = +data.obesityLow; //Lower bound of CI
    data.obesityHigh = +data.obesityHigh; //Upper bound of CI
    data.smokes = +data.smokes; //% of population that smokes
    data.smokesLow = +data.smokesLow; //Lower bound of CI
    data.smokesHigh = +data.smokesHigh; //Higher bound of CI
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(csvData, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(csvData, d => d[chosenYAxis])])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(csvData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 5)
    .attr("fill", "#275988")
    .attr("opacity", ".75");

  // Create group for  2 x- axis labels
  var xlabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  // Create group for  2 y- axis labels
  var ylabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  // var incomeLabel = ylabelsGroup.append("text")
  //   .attr("x", 0)
  //   .attr("y", 20)
  //   .attr("value", "poverty") // value to grab for event listener
  //   .classed("active", true)
  //   .text("Median Income ($)");

  var povertyLabel = xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("% of Population in Poverty");

  var healthcareLabel = xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "healthcare") // value to grab for event listener
    .classed("inactive", true)
    .text("% of Population without Healthcare");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Median Income ($)");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

  // x axis labels event listener
  xlabelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(csvData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "poverty") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          healthcareLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });

  // y axis labels event listener
  ylabelsGroup.selectAll("text")
  .on("click", function() {
    // get value of selection
    var value = d3.select(this).attr("value");
    if (value !== chosenYAxis) {

      // replaces chosenXAxis with value
      chosenYAxis = value;

      // functions here found above csv import
      // updates x scale for new data
      yLinearScale = xScale(csvData, chosenYAxis);

      // updates y axis with transition
      yAxis = renderAxes(yLinearScale, chosenYAxis);

      // updates circles with new x values
      circlesGroup = renderCircles(circlesGroup, yLinearScale, chosenYAxis);

      // updates tooltips with new info
      circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

      // changes classes to change bold text
      if (chosenYAxis === "num_albums") {
        albumsLabel
          .classed("active", true)
          .classed("inactive", false);
        hairLengthLabel
          .classed("active", false)
          .classed("inactive", true);
      }
      else {
        albumsLabel
          .classed("active", false)
          .classed("inactive", true);
        hairLengthLabel
          .classed("active", true)
          .classed("inactive", false);
      }
    }
  });
});
