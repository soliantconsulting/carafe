"use strict";

import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'mustache';
import * as d3 from 'd3';
import {timeWeek, timeMonth} from "d3-time";
import {timeFormat} from "d3-time-format";
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleTime, scaleLinear} from "d3-scale";

export default class D3BurndownChart {
    constructor(selector, options) {
        this.selector = selector;
        this.maxY = 0;

        /**
         * default options - merged with user passed options
         */
        let defaults = {
            width: 800,
            height: 600,
            margin: {top: 30, right: 10, bottom: 80, left: 55},
            title: 'Title',
            xAxisDisplayInterval: 50, // chart display options
            yAxisTitle: 'Y Axis Title',
            xAxisTitle: 'X Axis Title',
            yAxisAdditionalRangeStoryPoints: 20,
            xAxisAdditionalRangeDays: 14,
            axisFontSize: 13,
            rectWidth: null,
            bigFontSize: null,
            medFontSize: null,
            buildProjections: true,
            showActuals: false
        };

        let merge_options = function extend(obj, src) {
            for (let key in src) {
                if (src.hasOwnProperty(key)) obj[key] = src[key];
            }
            return obj;
        };

        // merge options with defaults
        if (typeof options === 'object') {
            options = merge_options(defaults, options);
        } else {
            options = defaults;
        }

        this.options = options;

        this.sprintRowPrototype = function (obj) {
            this.estimateDate = obj.estimateDate;
            this.completedFinalSPWithCreep = obj.completedFinalSPWithCreep;
            this.verifyFinalSPWithCreep = obj.verifyFinalSPWithCreep;
            this.storyPoints = obj.storyPoints;
            this.verifyStoryPoints = obj.verifyStoryPoints;
            this.completedStoryPoints = obj.completedStoryPoints;
            this.verifyEstimatedTotalDevDays = obj.verifyEstimatedTotalDevDays;
            this.completedEstimatedTotalDevDays = obj.completedEstimatedTotalDevDays;
            this.verifyEstimatedTotalDevDaysWithCreep = obj.verifyEstimatedTotalDevDaysWithCreep;
            this.completedEstimatedTotalDevDaysWithCreep = obj.completedEstimatedTotalDevDaysWithCreep;
            this.storyPoints = obj.storyPoints;

            this.lowestY = function () {
                return -this.xCurrentTotalAddedScope;
            };
            this.doneY = function () {
                // green
                let yStart = this.verifyStoryPointsY();
                let yHeight = +this.xDone;
                return yStart + yHeight;
            };
            this.verifyStoryPointsY = function () {
                // orange
                let yStart = this.storyPointsY();
                let yHeight = +this.xAlmostDone;
                return yStart + yHeight;
            };
            this.storyPointsY = function () {
                // blue
                let yStart = this.addedScopeY();
                let yHeight = +this.xStoryPoints;
                return yStart + yHeight;
            };
            this.addedScopeY = function () {
                // orange
                let yStart = this.lowestY();
                let yHeight = +this.xAddedScope;
                return yStart + yHeight;
            };
            this.treatAsUTC = function (date) {
                let result = new Date(date);
                result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
                return result;
            };
            this.daysBetween = function (startDate, endDate) {
                let millisecondsPerDay = 24 * 60 * 60 * 1000;
                return (this.treatAsUTC(endDate) - this.treatAsUTC(startDate)) / millisecondsPerDay;
            };
            this.addDays = function (date, days) {
                let returnDate = new Date(date);
                returnDate.setTime(returnDate.getTime() + days * 86400000);
                return returnDate;
            };
            this.tooltip = function () {
                let html = "<B>Date:</B> " + this.estimateDate + "<BR>";
                html += "<B>Done:</B> " + parseInt(this.xDone) + "<BR>";
                html += "<B>Almost Done:</B> " + parseInt(this.xAlmostDone) + "<BR>";
                html += "<B>Story Points:</B> " + parseInt(this.xStoryPoints) + "<BR>";
                html += "<B>Added Scope:</B> " + parseInt(this.xAddedScope) + "<BR>";
                return html;
            };
            this.parseInt = function () {
                return parseInt(this);
            };
        };

        // graph dimensions
        this.graphWidth = options.width - options.margin.left - options.margin.right;
        this.graphHeight = options.height - options.margin.top - options.margin.bottom;
    }

    render(projectStartDate, data) {

        this.clearDebugLinesAndCircles();

        // convert json data to objects with functions
        data = this.convertToObjects(data, this.sprintRowPrototype);

        // helpers
        let fullDateFormatter = timeFormat("%m-%d");
        let estimateDateMap = data.map(function (prototypeObject) {
            return new Date(prototypeObject.estimateDate);
        });

        // ending scope value - this is the sum of the added scope
        // this can be a tricky one to understand, when the scope is negative, it should be higher
        // on the graph, which is a positive addition to the coordinates. So the value gets flipped here
        let endingScopeValue = 0 - (this.buildTotalAddedScope(projectStartDate, data));

        // build variables
        let firstRow = data[0];
        let lastRow = data.slice(-1).pop();

        // startDate - minimum estimateDate with half additional range
        let startDate = new Date(projectStartDate);
        startDate.setTime(startDate.getTime() - ((this.options.xAxisAdditionalRangeDays / 2) * 86400000));

        this.setDataBasedDefaults(data);

        let maxAddedScope = d3.max(data, (d) => {
            return d.xCurrentTotalAddedScope;
        });

        let projections = {};

        if (this.options.buildProjections) {
            projections = {
                endingScopeValue: endingScopeValue,
                firstBar: {
                    'date': new Date(firstRow.estimateDate),
                    'endingScopeValue': firstRow.storyPoints
                },
                verifyEstimated: {
                    'date': firstRow.addDays(firstRow.estimateDate, lastRow.verifyEstimatedTotalDevDays),
                    'endingScopeValue': endingScopeValue
                },
                verifyComplete: {
                    'date': firstRow.addDays(firstRow.estimateDate, lastRow.completedEstimatedTotalDevDays),
                    'endingScopeValue': endingScopeValue
                },
                lastBar: {
                    'date': new Date(lastRow.estimateDate),
                    'endingScopeValue': lastRow.storyPoints
                },
                verifyEstimatedWithCreep: {
                    'date': firstRow.addDays(firstRow.estimateDate, lastRow.verifyEstimatedTotalDevDaysWithCreep),
                    'endingScopeValue': firstRow.storyPoints - lastRow.verifyFinalSPWithCreep
                },
                verifyCompleteWithCreep: {
                    'date': firstRow.addDays(firstRow.estimateDate, lastRow.completedEstimatedTotalDevDaysWithCreep),
                    'endingScopeValue': firstRow.storyPoints - lastRow.completedFinalSPWithCreep
                }
            };
        }

        // endDate - minimum estimateDate with half additional range
        let endDate = new Date(Math.max.apply(null, estimateDateMap));
        endDate.setDate(endDate.getDate() + this.options.xAxisAdditionalRangeDays / 2);
        if (this.options.buildProjections && (projections.verifyCompleteWithCreep.date > endDate || projections.verifyComplete.date > endDate)) {

            if (projections.verifyCompleteWithCreep.date >= projections.verifyComplete.date) {
                endDate = new Date(projections.verifyCompleteWithCreep.date);
                endDate.setDate(endDate.getDate() + this.options.xAxisAdditionalRangeDays / 2);
            } else {
                endDate = new Date(projections.verifyComplete.date);
                endDate.setDate(endDate.getDate() + this.options.xAxisAdditionalRangeDays / 2);
            }
        }

        // the chart dimensions
        let svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .append('g')
            .attr('transform', 'translate(' + this.options.margin.left + ', ' + this.options.margin.top + ')');

        // ==========================================================================================================
        // ========== axis scales ==========
        // x-scale - date range
        let x = scaleTime()
            .domain([startDate, endDate])
            .range([0, this.graphWidth]);

        // calculate the bottom
        let yBottom = -maxAddedScope - this.options.yAxisAdditionalRangeStoryPoints;
        if (this.options.buildProjections) {
            if (projections.verifyCompleteWithCreep.endingScopeValue < 0) {
                yBottom = -(-projections.verifyCompleteWithCreep.endingScopeValue + +this.options.yAxisAdditionalRangeStoryPoints);
            } else {
                yBottom = -(projections.verifyCompleteWithCreep.endingScopeValue + +this.options.yAxisAdditionalRangeStoryPoints);
            }
        }

        // y-scale - story points
        let y = scaleLinear()
            .domain([yBottom, this.getMaxY() + +this.options.yAxisAdditionalRangeStoryPoints / 2])
            .range([this.graphHeight, 0]);

        if (this.options.buildProjections) {
            // add x,y for projected endpoints
            projections.firstBar.x = x(projections.firstBar.date);
            projections.firstBar.y = y(projections.firstBar.endingScopeValue);
            projections.verifyEstimated.dot = {
                'x': x(projections.verifyEstimated.date),
                'y': y(projections.verifyEstimated.endingScopeValue)
            };
            projections.verifyComplete.dot = {
                'x': x(projections.verifyComplete.date),
                'y': y(projections.verifyComplete.endingScopeValue)
            };
            projections.verifyEstimatedWithCreep.dot = {
                'x': x(projections.verifyEstimatedWithCreep.date),
                'y': y(projections.verifyEstimatedWithCreep.endingScopeValue)
            };
            projections.verifyCompleteWithCreep.dot = {
                'x': x(projections.verifyCompleteWithCreep.date),
                'y': y(projections.verifyCompleteWithCreep.endingScopeValue)
            };
            projections.lastBar.x = x(projections.lastBar.date);
            projections.lastBar.y = y(projections.lastBar.endingScopeValue);
        }

        /**
         * DOTS
         * @type {{}}
         */
        let dots = {};
        dots.firstDayZero = {
            'color': 'red',
            'x': x(new Date(firstRow.estimateDate)),
            'y': y(0)
        };
        dots.dayLastScopeValue = {
            'color': "yellow",
            'x': x(new Date(lastRow.estimateDate)),
            'y': y(endingScopeValue)
        };

        // ==========================================================================================================
        // PREPARE TOOLTIPS
        let div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.mouseoverRectTransition = (d) => {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.tooltip())
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        };

        this.mouseoutRectTransition = function () {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        };

        // axis override
        if ('weekly' === this.options.xAxisDisplayInterval) {
            this.options.xAxisDisplayInterval = timeWeek;
        } else if ('monthly' === this.options.xAxisDisplayInterval) {
            this.options.xAxisDisplayInterval = timeMonth;
        }

        // DISPLAY BEGINS
        // ========== axis ==========
        // x-axis - display the axis
        let xAxis = axisBottom()
            .scale(x)
            .ticks(this.options.xAxisDisplayInterval)
            .tickFormat(timeFormat("%m-%d"));

        // y-axis - display the axis
        let yAxis = axisLeft()
            .scale(y);

        this.buildGridLines.call(this, svg, y, x, this.options.xAxisDisplayInterval);

        // center line
        svg.append("line")
            .style("stroke", "grey")
            .attr("x1", 0)
            .attr("y1", y(0))
            .attr("x2", this.graphWidth)
            .attr("y2", y(0));

        // orange line
        let remainingWork = endingScopeValue + (+lastRow.xStoryPoints + lastRow.xAddedScope + lastRow.xAlmostDone);
        let showOrangeElements = (-firstRow.xCurrentTotalAddedScope + firstRow.xStoryPoints) >= (-lastRow.xCurrentTotalAddedScope + lastRow.xStoryPoints + lastRow.xAddedScope);
        let showGreenElements = firstRow.storyPoints > remainingWork;

        if (showOrangeElements) {
            this.buildOrangeLine(svg, x, firstRow, y, lastRow);
        }
        if (showGreenElements) {
            this.buildGreenSolidLine(svg, x, y, firstRow, lastRow, endingScopeValue, remainingWork);
        }

        // projections
        if (this.options.buildProjections) {
            // dotted red line - scope continues to add
            if (0 !== endingScopeValue) {
                svg.append("line")
                    .style("stroke", "red")
                    .style("stroke-dasharray", ("3, 3"))
                    .attr("x1", dots.dayLastScopeValue.x)
                    .attr("y1", dots.dayLastScopeValue.y)
                    .attr("x2", projections.verifyCompleteWithCreep.dot.x)
                    .attr("y2", projections.verifyCompleteWithCreep.dot.y);
            }

            if (showOrangeElements) {
                // dotted orange line from last row of data to verifiy estimated
                svg.append("line")
                    .style("stroke", "orange")
                    .style("stroke-dasharray", ("3, 3"))
                    .attr("x1", x(new Date(lastRow.estimateDate)))
                    .attr("y1", y(-lastRow.xCurrentTotalAddedScope + lastRow.xStoryPoints + lastRow.xAddedScope))
                    .attr("x2", projections.verifyEstimated.dot.x)
                    .attr("y2", projections.verifyEstimated.dot.y);

                // dotted orange line from verifiy estimated to verifiy estimated with creep
                svg.append("line")
                    .style("stroke", "orange")
                    .style("stroke-dasharray", ("3, 3"))
                    .attr("x1", projections.verifyEstimated.dot.x)
                    .attr("y1", projections.verifyEstimated.dot.y)
                    .attr("x2", projections.verifyEstimatedWithCreep.dot.x)
                    .attr("y2", projections.verifyEstimatedWithCreep.dot.y);

                // verify estimated dot
                svg.append("circle")
                    .style("fill", "orange")
                    .attr("cx", projections.verifyEstimated.dot.x)
                    .attr("cy", projections.verifyEstimated.dot.y)
                    .attr("r", 5)
                    .on("mouseover", function () {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html("Verify Estimated:<BR>Date: " + fullDateFormatter(projections.verifyEstimated.date) + "<BR>Scope: " + parseInt(projections.verifyEstimated.endingScopeValue))
                            .style("left", (d3.event.pageX + 15) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", this.mouseoutRectTransition);

                this.createDebugDot('Verifiy Estimated', fullDateFormatter(projections.verifyEstimated.date), parseInt(projections.verifyEstimated.endingScopeValue));

                // verify estimated with creep dot
                svg.append("circle")
                    .style("fill", "orange")
                    .attr("cx", projections.verifyEstimatedWithCreep.dot.x)
                    .attr("cy", projections.verifyEstimatedWithCreep.dot.y)
                    .attr("r", 5)
                    .on("mouseover", function () {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html("Verify Estimated With Creep:<BR>Date: " + fullDateFormatter(projections.verifyEstimatedWithCreep.date) + "<BR>Scope: " + parseInt(projections.verifyEstimatedWithCreep.endingScopeValue))
                            .style("left", (d3.event.pageX + 15) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", this.mouseoutRectTransition);
                this.createDebugDot('Verifiy Estimated With Creep', fullDateFormatter(projections.verifyEstimatedWithCreep.date), parseInt(projections.verifyEstimatedWithCreep.endingScopeValue));
            }

            if (showGreenElements) {
                this.buildGreenDashedLine(svg, x, y, lastRow, projections, endingScopeValue, remainingWork);

                // verify complete dot
                svg.append("circle")
                    .style("fill", "green")
                    .attr("cx", projections.verifyComplete.dot.x)
                    .attr("cy", projections.verifyComplete.dot.y)
                    .attr("r", 5)
                    .on("mouseover", function () {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html("Verify Complete:<BR>Date: " + fullDateFormatter(projections.verifyComplete.date) + "<BR>Scope: " + parseInt(projections.verifyComplete.endingScopeValue))
                            .style("left", (d3.event.pageX + 15) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", this.mouseoutRectTransition);
                this.createDebugDot('Verifiy Complete', fullDateFormatter(projections.verifyComplete.date), parseInt(projections.verifyComplete.endingScopeValue));

                // verify complete with creep dot
                svg.append("circle")
                    .style("fill", "green")
                    .attr("cx", projections.verifyCompleteWithCreep.dot.x)
                    .attr("cy", projections.verifyCompleteWithCreep.dot.y)
                    .attr("r", 5)
                    .on("mouseover", function () {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html("Verify Complete With Creep:<BR>Date: " + fullDateFormatter(projections.verifyCompleteWithCreep.date) + "<BR>Scope: " + parseInt(projections.verifyCompleteWithCreep.endingScopeValue))
                            .style("left", (d3.event.pageX + 15) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", this.mouseoutRectTransition);
                this.createDebugDot('Verifiy Complete With Creep', fullDateFormatter(projections.verifyCompleteWithCreep.date), parseInt(projections.verifyCompleteWithCreep.endingScopeValue));
            }

            if (0 !== endingScopeValue) {
                svg.append("line")
                    .style("stroke", "blue")
                    .attr("x1", x(new Date(lastRow.estimateDate)))
                    .attr("y1", y(endingScopeValue))
                    .attr("x2", x(endDate))
                    .attr("y2", y(endingScopeValue));
            }
        }

        // RECTANGLES
        let rects = svg.selectAll('.chart')
            .data(data)
            .enter();

        // scope completed rectangles - green
        this.buildGreenRectangles.call(this, rects, x, y);

        // almost done rectangles - orange
        this.buildOrangeRectangles.call(this, rects, x, y);

        // story point rectangles - blue
        this.buildBlueRectangles.call(this, rects, x, y, div);

        // added scope rectangles - orange
        this.buildRedRectangles.call(this, svg, data, x, y);

        // labels on rectangles
        let texts = svg.selectAll("text")
            .data(data)
            .enter();

        if (this.options.showActuals) {
            this.buildActuals(svg, x, y, data);
        } else {
            // completed scope labels
            this.buildCompletedScopeLabels(texts, x, y);

            // almost completed labels
            this.buildAlmostCompleteLabels(texts, x, y);

            // storyPoint scope labels
            this.buildStoryPointLabels(texts, x, y);

            // added scope labels
            this.buildAddedScopeLabels(texts, x, y);
        }

        // buildDatesAboveBars(svg, data, y, x, fullDateFormatter);

        // x-axis text - dates ticks
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + (this.graphHeight) + ')')
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", function () {
                return "rotate(-65)"
            });

        // y-axis - story point ticks
        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        // text label for the x axis
        svg.append("text")
            .attr("x", (this.options.width - this.options.margin.left - this.options.margin.right) / 2)
            .attr("y", this.options.height - 45)
            .style("text-anchor", "middle")
            .style("font-size", this.options.axisFontSize + "px")
            .text(this.options.xAxisTitle);


        // text label for the y axis
        svg.append("text")
            .attr("x", -(this.options.height / 2))
            .attr("y", -45)
            .style("text-anchor", "start")
            .text(this.options.yAxisTitle)
            .style("font-size", this.options.axisFontSize + "px")
            .attr("transform", function () {
                return "rotate(-90)"
            });

        // text label for the header
        if (this.options.showHeaderText) {
            this.buildChartHeader(svg);
        }

        // red burndown line
        this.buildRedLine(svg, dots, endingScopeValue);

    };

    buildDatesAboveBars(svg, data, y, x, fullDateFormatter) {
        // dates above rectangles - group wrappers
        let gText = svg.selectAll("gText")
            .data(data)
            .enter().append("svg:g")
            .attr("transform", (d) => {
                let yHeight = +d.xAddedScope + +d.xStoryPoints + +d.xAlmostDone + +d.xDone;
                let rectHeight = y(0) - y(yHeight);
                let xPos = x(new Date(d.estimateDate)) - this.options.rectWidth / 2 + this.options.medFontSize / 2;
                let yPos = y(d.lowestY()) - rectHeight;
                return "translate(" + xPos + "," + yPos + ")";
            });

        // DATES above rectangles inside wrappers
        gText.append("text")
            .text((d) => {
                return fullDateFormatter(new Date(d.estimateDate));
            })
            .attr("text-anchor", "start")
            .style("font-size", this.options.medFontSize + "px")
            .attr("transform", function () {
                return "translate(" + this.options.rectWidth / 2 + ",-10) rotate(-90,0,0)";
            });
    }

    buildAddedScopeLabels(texts, x, y) {
        texts.append("text")
            .text((d) => {
                if (+d.xAddedScope > 0 && +d.xAddedScope < 25) {
                    return '';
                } else if (+d.xAddedScope > 0) {
                    return '+' + parseInt(d.xAddedScope);
                } else if (d.xAddedScope < 0 && d.xAddedScope > -25) {
                    return '';
                } else if (+d.xAddedScope < 0) {
                    return -parseInt(d.xAddedScope);
                }

            })
            .attr("text-anchor", "middle")
            .attr("x", (d) => {
                return x(new Date(d.estimateDate));
            })
            .attr("y", (d) => {
                return y(d.lowestY() + d.xAddedScope) + this.options.medFontSize;
            })
            .attr("class", "soliantD3Label")
            .attr("font-size", this.options.medFontSize + "px")
            .attr("fill", "black");
    }

    buildStoryPointLabels(texts, x, y) {
        texts.append("text")
            .text((d) => {
                if (+d.xStoryPoints > 0 && +d.xStoryPoints < 25) {
                    return '';
                } else if (+d.xStoryPoints > 0) {
                    return parseInt(d.xStoryPoints);
                }
            })
            .attr("text-anchor", "middle")
            .attr("x", (d) => {
                return x(new Date(d.estimateDate));
            })
            .attr("y", (d) => {
                return y(d.storyPointsY()) + this.options.medFontSize;
            })
            .attr("class", "soliantD3Label")
            .attr("font-size", this.options.medFontSize + "px")
            .attr("fill", "black");
    }

    buildAlmostCompleteLabels(texts, x, y) {
        texts.append("text")
            .text((d) => {
                if (+d.xAlmostDone > 0 && +d.xAlmostDone < 25) {
                    return '';
                } else if (+d.xAlmostDone > 0) {
                    return -parseInt(d.xAlmostDone);
                }
            })
            .attr("text-anchor", "middle")
            .attr("x", (d) => {
                return x(new Date(d.estimateDate));
            })
            .attr("y", (d) => {
                return y(d.verifyStoryPointsY()) + this.options.medFontSize;
            })
            .attr("class", "soliantD3Label")
            .attr("font-size", this.options.medFontSize + "px")
            .attr("fill", "black");
    }

    buildCompletedScopeLabels(texts, x, y) {
        texts.append("text")
            .text((d) => {
                if (+d.xDone > 0 && +d.xDone < 25) {
                    return '';
                } else if (+d.xDone > 0) {
                    return -parseInt(d.xDone);
                }
            })
            .attr("text-anchor", "middle")
            .attr("x", (d) => {
                return x(new Date(d.estimateDate));
            })
            .attr("y", (d) => {
                return y(d.doneY()) + this.options.medFontSize;
            })
            .attr("class", "soliantD3Label")
            .attr("font-size", this.options.medFontSize + "px")
            .attr("fill", "black");
    }

    buildGreenRectangles(rects, x, y) {
        rects.append('rect')
            .attr('class', 'completedScopeBar')
            .attr('x', (d) => {
                return x(new Date(d.estimateDate)) - (this.options.rectWidth / 2);
            })
            .attr('y', (d) => {
                return y(d.doneY());
            })
            .attr('width', this.options.rectWidth)
            .attr('height', (d) => {
                return y(0) - y(+d.xDone);
            })
            .on("mouseover", this.mouseoverRectTransition)
            .on("mouseout", this.mouseoutRectTransition);
    }

    buildOrangeRectangles(rects, x, y) {
        rects.append('rect')
            .attr('class', 'verifyStoryPointsBar')
            .attr('x',  (d) => {
                return x(new Date(d.estimateDate)) - (this.options.rectWidth / 2);
            })
            .attr('y',  (d) => {
                return y(d.verifyStoryPointsY());
            })
            .attr('width', this.options.rectWidth)
            .attr('height',  (d) => {
                return y(0) - y(+d.xAlmostDone);
            })
            .on("mouseover", this.mouseoverRectTransition)
            .on("mouseout", this.mouseoutRectTransition);
    }

    buildBlueRectangles(rects, x, y, div) {
        rects.append('rect')
            .attr('class', 'storyPointsBar')
            .attr('x',  (d) => {
                return x(new Date(d.estimateDate)) - (this.options.rectWidth / 2);
            })
            .attr('y',  (d) => {
                return y(d.storyPointsY());
            })
            .attr('width', this.options.rectWidth)
            .attr('height',  (d) => {
                return y(0) - y(+d.xStoryPoints);
            })
            .on("mouseover",  (d) => {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(d.tooltip())
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout",  () => {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("mouseover", this.mouseoverRectTransition)
            .on("mouseout", this.mouseoutRectTransition);
    }

    buildRedRectangles(svg, data, x, y) {
        svg.selectAll('.chart')
            .data(data)
            .enter().append('rect')
            .attr('class', 'addedScopeBar')
            .attr('x', (d) => {
                return x(new Date(d.estimateDate)) - (this.options.rectWidth / 2);
            })
            .attr('y', (d) => {
                return y(d.lowestY() + d.xAddedScope);
            })
            .attr('width', this.options.rectWidth)
            .attr('height', (d) => {
                if (undefined !== d.xAddedScope) {
                    return y(0) - y(+d.xAddedScope);
                }
            })
            .on("mouseover", this.mouseoverRectTransition)
            .on("mouseout", this.mouseoutRectTransition);
    }

    buildChartHeader(svg) {
        svg.append("text")
            .attr("x", (this.options.width - this.options.margin.left - this.options.margin.right) / 2)
            .attr("y", 0)
            .style("text-anchor", "middle")
            .style("font-size", this.options.bigFontSize + "px")
            .text(this.options.title);
    }

    buildRedLine(svg, dots, totalAddedScope) {
        if (0 !== totalAddedScope) {
            svg.append("line")
                .style("stroke", "red")
                .attr("x1", dots.firstDayZero.x)
                .attr("y1", dots.firstDayZero.y)
                .attr("x2", dots.dayLastScopeValue.x)
                .attr("y2", dots.dayLastScopeValue.y);
        }
    }

    buildOrangeLine(svg, x, firstRow, y, lastRow) {
        svg.append("line")
            .style("stroke", "orange")
            .attr("x1", x(new Date(firstRow.estimateDate)))
            .attr("y1", y(-firstRow.xCurrentTotalAddedScope + firstRow.xStoryPoints))
            .attr("x2", x(new Date(lastRow.estimateDate)))
            .attr("y2", y(-lastRow.xCurrentTotalAddedScope + lastRow.xStoryPoints + lastRow.xAddedScope));
    }

    buildGridLines(svg, y, x, xAxisTicks) {
        svg.selectAll("line.horizontalGrid").data(y.ticks(16)).enter()
            .append("line")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", "lightgray")
            .attr("x1", 0)
            .attr("x2", this.graphWidth)
            .attr("y1", (d) => {return y(d);})
            .attr("y2", (d) => {return y(d);});

        svg.selectAll("line.verticalGrid").data(x.ticks(xAxisTicks)).enter()
            .append("line")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", "lightgray")
            .attr("y1", 0)
            .attr("y2", this.graphHeight)
            .attr("x1", (d) => {return x(d);})
            .attr("x2", (d) => {return x(d);});
    }

    setMaxY(value) {
        if (value > this.maxY) {
            this.maxY = value;
        }
    }

    getMaxY() {
        return this.maxY + this.options.margin.top;
    }

    buildGreenSolidLine(svg, x, y, firstRow, lastRow, totalAddedScope, remainingWork) {
        // lines - green
        svg.append("line")
            .style("stroke", "green")
            .attr("x1", x(new Date(firstRow.estimateDate)))
            .attr("y1", y(firstRow.storyPoints))
            .attr("x2", x(new Date(lastRow.estimateDate)))
            .attr("y2", y(remainingWork));
    }

    buildActuals(svg, x, y, data) {
        // lines
        let prevBlue = null;
        let prevOrange = null;
        let prevGreen = null;
        let prevRed = null;
        let previousSprintRecord = null;
        $.each(data, (index, sprintRecord) =>  {
            if (null !== previousSprintRecord) {
                // draws line from previous bar to current bar
                // orange
                svg.append("line")
                    .style("stroke", "orange")
                    .style("stroke-width", "2")
                    .attr("x1", x(new Date(previousSprintRecord.estimateDate)))
                    .attr("y1", y(prevBlue))
                    .attr("x2", x(new Date(sprintRecord.estimateDate)))
                    .attr("y2", y(-sprintRecord.xCurrentTotalAddedScope + sprintRecord.xStoryPoints + sprintRecord.xAddedScope));
                prevBlue = -sprintRecord.xCurrentTotalAddedScope + sprintRecord.xStoryPoints + sprintRecord.xAddedScope;

                // green
                svg.append("line")
                    .style("stroke", "green")
                    .style("stroke-width", "2")
                    .attr("x1", x(new Date(previousSprintRecord.estimateDate)))
                    .attr("y1", y(prevOrange))
                    .attr("x2", x(new Date(sprintRecord.estimateDate)))
                    .attr("y2", y(-sprintRecord.xCurrentTotalAddedScope + sprintRecord.xStoryPoints + sprintRecord.xAlmostDone + sprintRecord.xAddedScope));
                prevOrange = -sprintRecord.xCurrentTotalAddedScope + sprintRecord.xStoryPoints + sprintRecord.xAlmostDone + sprintRecord.xAddedScope;

                // red
                svg.append("line")
                    .style("stroke", "red")
                    .style("stroke-width", "2")
                    .attr("x1", x(new Date(previousSprintRecord.estimateDate)))
                    .attr("y1", y(prevRed))
                    .attr("x2", x(new Date(sprintRecord.estimateDate)))
                    .attr("y2", y(-sprintRecord.xCurrentTotalAddedScope));
                prevRed = -sprintRecord.xCurrentTotalAddedScope;
            } else {
                prevRed = -sprintRecord.xCurrentTotalAddedScope;
                prevBlue = prevOrange = prevGreen = -sprintRecord.xCurrentTotalAddedScope + sprintRecord.xStoryPoints + sprintRecord.xAddedScope;
            }
            previousSprintRecord = sprintRecord;
        });
    }

    buildGreenDashedLine(svg, x, y, lastRow, projections, totalAddedScope, remainingWork) {
        // lines - green
        svg.append("line")
            .style("stroke", "green")
            .style("stroke-dasharray", ("3, 3"))
            .attr("x1", x(new Date(lastRow.estimateDate)))
            .attr("y1", y(remainingWork))
            .attr("x2", projections.verifyComplete.dot.x)
            .attr("y2", projections.verifyComplete.dot.y);

        svg.append("line")
            .style("stroke", "green")
            .style("stroke-dasharray", ("3, 3"))
            .attr("x1", projections.verifyComplete.dot.x)
            .attr("y1", projections.verifyComplete.dot.y)
            .attr("x2", projections.verifyCompleteWithCreep.dot.x)
            .attr("y2", projections.verifyCompleteWithCreep.dot.y);
    }

    clearDebugLinesAndCircles() {
        if (document.getElementById("debugBars")) {
            $('.debugLine').each(function (index, row) {
                row.remove();
            });
        }
    }

    createDebugLine(sprintRecord) {
        if (document.getElementById("debugBars")) {
            let template = "<tr class='debugLine'>";
            template += "<td style='text-align: right'>{{estimateDate}}</td>";
            template += "<td style='text-align: right'>{{#xDone}}{{parseInt}}{{/xDone}}</td>";
            template += "<td style='text-align: right'>{{#xAlmostDone}}{{parseInt}}{{/xAlmostDone}}</td>";
            template += "<td style='text-align: right'>{{#xStoryPoints}}{{parseInt}}{{/xStoryPoints}}</td>";
            template += "<td style='text-align: right'>{{#xAddedScope}}{{parseInt}}{{/xAddedScope}}</td>";
            template += "</tr>";

            let html = Mustache.to_html(template, sprintRecord);
            $('#debugBars').append(html);
        }
    }

    createDebugDot(name, date, scope) {
        let dot = {
            'name': name,
            'date': date,
            'scope': scope
        };
        if (document.getElementById("debugDots")) {
            let template = "<tr class='debugLine'>";
            template += "<td style='text-align: right'>{{name}}</td>";
            template += "<td style='text-align: right'>{{date}}</td>";
            template += "<td style='text-align: right'>{{scope}}</td>";
            template += "</tr>";

            let html = Mustache.to_html(template, dot);
            $('#debugDots').append(html);
        }
    }

    buildTotalAddedScope(projectStartDate, data) {
        let currentTotalScope = null;
        let lastSprintStoryPoints = null;
        let totalAddedScope = 0;
        let firstRecord = null;
        $.each(data, (index, sprintRecord) => {
            if (null == currentTotalScope) {
                currentTotalScope = sprintRecord.storyPoints;
            }

            // has scope been added
            if (currentTotalScope !== sprintRecord.storyPoints) {
                // convert to compare against last rec

                sprintRecord.xAddedScope = sprintRecord.storyPoints - currentTotalScope;

                currentTotalScope = sprintRecord.storyPoints;

                totalAddedScope += +sprintRecord.xAddedScope;
            } else {
                sprintRecord.xAddedScope = 0;
            }

            sprintRecord.xAlmostDone = sprintRecord.verifyStoryPoints - sprintRecord.completedStoryPoints;
            sprintRecord.xStoryPoints = sprintRecord.storyPoints - +sprintRecord.verifyStoryPoints - +sprintRecord.xAddedScope;
            sprintRecord.xCurrentTotalAddedScope = totalAddedScope;

            // calculate the amount of work that's been done since the last sprint
            if (null == lastSprintStoryPoints) {
                sprintRecord.xDone = sprintRecord.completedStoryPoints;
            } else {
                let doneSinceLastSprint = lastSprintStoryPoints - sprintRecord.xStoryPoints;
                if (sprintRecord.xAlmostDone > 0) {
                    doneSinceLastSprint -= sprintRecord.xAlmostDone;
                }
                sprintRecord.xDone = doneSinceLastSprint;
            }

            lastSprintStoryPoints = sprintRecord.xStoryPoints;
            if (sprintRecord.xAlmostDone > 0) {
                lastSprintStoryPoints += sprintRecord.xAlmostDone;
            }
            if (sprintRecord.xAddedScope > 0) {
                lastSprintStoryPoints += sprintRecord.xAddedScope;
            }

            if (null == firstRecord) {
                // firstRecord = Object.assign({}, sprintRecord);
                firstRecord = jQuery.extend({}, sprintRecord);
                firstRecord.xStoryPoints = sprintRecord.storyPoints - +sprintRecord.verifyStoryPoints - +sprintRecord.xAddedScope;
                firstRecord.xStoryPoints += +sprintRecord.verifyStoryPoints;
                firstRecord.estimateDate = projectStartDate;
                firstRecord.xAlmostDone = 0;
                firstRecord.xDone = 0;
                this.createDebugLine(firstRecord);
                this.setMaxY(firstRecord.xStoryPoints - totalAddedScope);
            }
            this.setMaxY((+sprintRecord.xStoryPoints + +sprintRecord.xDone + +sprintRecord.xAlmostDone) - totalAddedScope);
            this.createDebugLine(sprintRecord);
        });
        data.unshift(firstRecord);

        return totalAddedScope;
    };

    setDataBasedDefaults(data) {
        if (null == this.options.rectWidth) {
            this.options.rectWidth = Math.min(Math.max(parseInt(0.8 * this.graphWidth / (data.length)), 10), 200);
        }
        if (null == this.options.bigFontSize) {
            this.options.bigFontSize = Math.min(Math.max(parseInt(0.8 * this.graphWidth / (data.length)), 6), 48);
        }
        if (null == this.options.medFontSize) {
            this.options.medFontSize = Math.min(Math.max(parseInt(0.4 * this.graphWidth / (data.length)), 6), 48);
        }
    };

    convertToObjects(data, prototype) {
        let returnData = [];
        data.forEach(function (sprintRecord) {
            returnData.push(new prototype(sprintRecord));
        });
        return returnData;
    };
}