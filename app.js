'use strict';

var data = require('./data.js');

var Task = require('genetic').Task,
    options = {
        getRandomSolution : getRandomSolution,
        popSize : data.popSize,
        stopCriteria : stopCriteria,
        fitness : data.fitness,
        minimize : false,
        mutateProbability : data.mutateProbability,
        mutate : mutate,
        crossoverProbability : data.crossoverProbability,
        crossover : crossover
    };

function stopCriteria() {
    return (this.generation === data.generations);
}

var limitRow = data.limitRow;
var limitColumn = data.limitColumn;

function rowSum(graph, row) {
    var sum = 0;
    for (var j=0; j< graph.length; j++) {
        sum += graph[row][j] || 0;
    }
    return sum;
}

function columnSum(graph, col) {
    var sum = 0;
    for (var j=0; j < graph.length; j++) {
        sum += graph[j][col] || 0;
    }
    return sum;
}

function checkGraph(graph) {
    var length = graph.length;
    var isValid = true;
    for (var i=0; i< length; i++) {
        for (var j=0; j< length; j++) {
            if (columnSum(graph, j) <= limitColumn[j] && rowSum(graph, i) == limitRow[j]) {
                isValid = true;
            } else {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            break;
        }
    }
    return isValid;
}

function crossover(parent1, parent2, callback) {
    var child = parent1.slice();
    do {
        var k = Math.floor(Math.random() * parent1.length);
        var l = k;
        while (l == k) l = Math.floor(Math.random() * parent1.length);

        for (var j = 0 ; j < parent1.length; j++) {
            var inherit;
            var change = true;
            if (j == k || j == l) {
                change = !change;
            }
            if (change) {
                inherit = parent1;
            } else {
                inherit = parent2;
            }
            for (var i =0; i< inherit.length; i++) {
                child[i][j] = inherit[i][j];
            }
        }
    }
    while (!checkGraph(child));
    callback(child);
}

function mutate(solution, callback) {
    for (var i=0; i< solution.length; i++) {
        for (var j = 0; j < solution.length; j++) {
            if (Math.random() < 0.01) {
                do {
                    solution[i][j] = getRandomValue(0, 4);
                }
                while (!checkGraph(solution))
            }
        }
    }
    callback(solution);
}

function getRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initArray(dimensions, value) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? value : initArray(dimensions.slice(1)));
    }

    return array;
}

function getRandomSolution(callback) {
    var graph = initArray([data.limitRow.length, data.limitColumn.length], 0);

    for (var i=0; i< graph.length; i++) {
        do {
            for (var j = 0; j < graph.length; j++) {
                do {
                    graph[i][j] = getRandomValue(0, 4);
                }
                while (columnSum(graph, j) > limitColumn[j])
            }
        } while (rowSum(graph, i) != limitRow[i]);
    }
    callback(graph);
}

var t = new Task(options);
var timer;
var minStat = null;

t.on('run start', function () { timer = +new Date(); });

t.on('statistics', function (statistics) {
    //console.log("result on generation " + this.generation + ": ", statistics.minScore);
    if ((minStat && minStat.minScore > statistics.minScore) || !minStat) {
        minStat = statistics;
    }
});
t.on('error', function (error) { console.log('ERROR - ', error) });
t.run(function () {
    console.log('Results:', minStat.minScore.toFixed(2), '[' + ((+new Date() - timer)/1000).toFixed(3) + 's]');
    console.log(minStat.min);
});