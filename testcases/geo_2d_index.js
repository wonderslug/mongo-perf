/**
 * Setup basic tests array
 */
if (typeof(tests) != "object") {
    tests = [];
}

/**
 * A Pseudo Random Number Generator that will generated random numbers in the same order based on the seed passed into
 * its.
 * @param seed
 * @constructor
 */
function PseudoRandomNumberGenerator(seed) {
    var __seed;
    __seed = seed;
    this.seed = function () {
        return __seed;
    };
    this.nextNumber = function () {
        __seed = (__seed * 9301 + 49297) % 233280;
        return __seed / 233280.0;
    };

    /**
     * Gets the next Pseudo Random Integer
     * @param max the maximum integer to return
     * @returns {number}
     */
    this.nextInt = function (max) {
        max = typeof max !== 'undefined' ? max : Number.MAX_VALUE;
        return max > 0 ? this.nextNumber() * max : this.nextNumber();
    };

    /**
     * Replication of Math.random() for direct replacement use
     * @returns {number}
     */
    this.random = function () {
        return this.nextInt(10000000000000000) / 10000000000000000
    }
}

/**
 * A Poisson Disc sample data creator using the PseudoRandomNumberGenerator to create a repeatable set of uniform
 * distributed data
 * Based on https://www.jasondavies.com/poisson-disc/
 * @param rng
 * @param width
 * @param height
 * @param radius
 * @returns {Function}
 */
function poissonDiscSampler(rng, width, height, radius) {
    var k = 30, // maximum number of samples before rejection
        radius2 = radius * radius,
        R = 3 * radius2,
        cellSize = radius * Math.SQRT1_2,
        gridWidth = Math.ceil(width / cellSize),
        gridHeight = Math.ceil(height / cellSize),
        grid = new Array(gridWidth * gridHeight),
        queue = [],
        queueSize = 0,
        sampleSize = 0,
        randNumGen = rng,
        w = width,
        l = height;

    return function () {
        if (!sampleSize) return sample(randNumGen.random() * width, randNumGen.random() * height);

        // Pick a random existing sample and remove it from the queue.
        while (queueSize) {
            var i = randNumGen.random() * queueSize | 0,
                s = queue[i];

            // Make a new candidate between [radius, 2 * radius] from the existing sample.
            for (var j = 0; j < k; ++j) {
                var a = 2 * Math.PI * randNumGen.random(),
                    r = Math.sqrt(randNumGen.random() * R + radius2),
                    x = s[0] + r * Math.cos(a),
                    y = s[1] + r * Math.sin(a);

                // Reject candidates that are outside the allowed extent,
                // or closer than 2 * radius to any existing sample.
                if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
            }

            queue[i] = queue[--queueSize];
            queue.length = queueSize;
        }
    };

    function far(x, y) {
        var i = x / cellSize | 0,
            j = y / cellSize | 0,
            i0 = Math.max(i - 2, 0),
            j0 = Math.max(j - 2, 0),
            i1 = Math.min(i + 3, gridWidth),
            j1 = Math.min(j + 3, gridHeight);

        for (j = j0; j < j1; ++j) {
            var o = j * gridWidth;
            for (i = i0; i < i1; ++i) {
                if (s = grid[o + i]) {
                    var s,
                        dx = s[0] - x,
                        dy = s[1] - y;
                    if (dx * dx + dy * dy < radius2) return false;
                }
            }
        }

        return true;
    }

    function sample(x, y) {
        var s = [x, y];
        queue.push(s);
        grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
        ++sampleSize;
        ++queueSize;
        return s;
    }
}


/**
 * Initialization variables
 */
var width = 1000,
    height = 1000,
    radius = 2,
    seed = 1000,
    maxPoints = 1000000;
var x_max = width / 2;
var x_min = (width / 2) * -1;
var y_max = height / 2;
var y_min = (height / 2) * -1;
var prng = new PseudoRandomNumberGenerator(seed);


/**
 * Helper function to get random string for use in the pre sections
 *
 * @param length
 * @returns {string}
 */
function randomString(length) {
    chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(prng.random() * (chars.length - 1))];
    return result;
}


/**
 * Gets a Random x and Y coordinate based on the width and height
 * @returns {{x: Number, y: Number}}
 */
function getXYCoordinatePosition() {
    return {
        x: parseFloat(((prng.nextInt(10000000) / 10000) - (width / 2))),
        y: parseFloat(((prng.nextInt(10000000) / 10000) - (height / 2)))
    };
}
/**
 * Gets a random long/lat coordinate
 * @returns {{long: Number, lat: Number}}
 */
function getLongLatCoordinatePosition() {
    return {
        long: parseFloat(((prng.nextInt(3600000) / 10000) - (360 / 2))),
        lat: parseFloat(((prng.nextInt(1800000) / 10000) - (180 / 2)))
    };
}

/**
 * Generates random grid data
 * @param collection
 */
var populateGridData = function (collection) {
    var sampler = poissonDiscSampler(prng, width, height, radius);
    populateData(collection, sampler, width, height);
};

/**
 * Generate random Sphereical data
 * @param collection
 */
var populateSphericalData = function (collection) {
    var sampler = poissonDiscSampler(prng, 360, 180, radius);
    populateData(collection, sampler, 360, 180);
};

/**
 * Populate the passed collection with a random set of data based for the height and width passed in
 *
 * @param collection
 * @param sampler
 * @param width
 * @param height
 */
var populateData = function (collection, sampler, width, height) {
    for (var i = 0; i < maxPoints; ++i) {
        var s = sampler();
        var type = '';
        if (!s) return true;
        var x = s[0] - (width / 2);
        var y = s[1] - (height / 2);
        var val = prng.nextInt(100);
        if (val <= 5) {
            type = 'gas-station';
        }
        else if (val <= 15) {
            type = 'store';
        }
        else if (val <= 25) {
            type = 'restaurant';
        }
        else if (val <= 30) {
            type = 'school';
        }
        else if (val <= 90) {
            type = 'resident'
        }
        collection.insert({"type": type, "loc": [x, y]});
    }
};

/**
 * Gets a random box that encloses a number of points based on the radius used for the Poisson-Disc distribution
 * @param points
 * @returns {{bottomLeft: {x: Number, y: Number}, upperRight: {x: Number, y: Number}}}
 */
function getRandomBox(points) {
    var good = false;
    var area = Number(points + (points * (1 / 25))) * (radius * Math.PI);
    do {
        var bottomLeft = getXYCoordinatePosition();
        var x_size = parseFloat(prng.nextInt(Math.sqrt(area) * 2));
        var urx = parseFloat(bottomLeft.x + x_size);
        var ury = parseFloat(bottomLeft.y + ( area / x_size));
        var box = {
            bottomLeft: bottomLeft,
            upperRight: {
                x: urx,
                y: ury
            }
        };
        if (box.upperRight.x <= x_max && box.upperRight.y <= y_max && box.bottomLeft.x >= x_min && box.bottomLeft.y >= y_min) {
            good = true;
        }
    }
    while (good == false);
    return box;
}

/**
 * Gets a random circle that encloses a number of points based on the radius used for the Poisson-Disc distribution
 * @param points
 * @returns {{center: {x: Number, y: Number}, radius: number}}
 */
function getRandomCircle(points) {
    var good = false;
    var area = Number(points + (points * (1 / 25))) * (radius * Math.PI);
    var circle_radius = Math.sqrt(area / Math.PI);
    do {
        var center = getXYCoordinatePosition();
        var circle = {
            center: center,
            radius: circle_radius
        };
        if ((circle.center.x + circle.radius) <= x_max && (circle.center.x - circle.radius) >= x_min && (circle.center.y + circle.radius) <= y_max && (circle.center.y - circle.radius) >= y_min) {
            good = true;
        }
    }
    while (good == false);
    return circle;
}

/**
 * Gets a random regular hexagon that encloses a number of points based on the radius used for the Poisson-Disc
 * distribution
 * @param points
 * @returns {*[]}
 */
function getRandomRegularHexagon(points) {
    var area = Number(points + (points * (1 / 25))) * (radius * Math.PI);
    var C = Math.sqrt((2 * area) / (3 * Math.sqrt(3)));
    var B = Math.sin(60 * Math.PI / 180) * C;
    var A = C * .5;
    do {
        var good = true;
        var center = getXYCoordinatePosition();
        var polygon = [
            [(-1 * B) + center.x, A + center.y],
            [(-1 * B) + center.x, A - C + center.y],
            [center.x, (-1 * C) + center.y],
            [B + center.x, A - C + center.y],
            [B + center.x, A + center.y],
            [center.x, C + center.y]
        ];
        for (var point in polygon) {
            if (point[0] > x_max || point[0] < x_min || point[1] > y_max || point[1] < y_min) {
                good = false;
            }
        }
    }
    while (good = false);
    return polygon;
}

/**
 * Gets a random sphereical circle based on lat/long that encloses a number of points based on the radius used for
 * the Poisson-Disc distribution
 * @param points
 * @returns {{center: *, radius: number}}
 */
function getRandomSphericalCircleArea(points) {
    var area = Number(points + (points * (1 / 25))) * (radius * Math.PI);
    var circle_radius = area / width;
    var center = getLongLatCoordinatePosition();
    var circle = {
        center: center,
        radius: circle_radius
    };
    return circle;
}

/**
 * Helper function to build a testName with run data
 * @param base
 * @param run
 * @returns string the test name
 */
function buildTestName(base, run) {
    base += run.points;
    if (run.skip > 0) {
        base += "Skip" + run.skip;
    }
    if (run.limit > 0) {
        base += "Limit" + run.limit;
    }
    return base;
}

/**
 * Helper function to build an update test base.
 * @param base
 * @param multi
 * @returns string the test name
 */
function buildUpdateTestName(base, multi) {
    if (multi) {
        base += "MultiTrue";
    }
    else {
        base += "MultiFalse";
    }
    return base;
}

/**
 * Helper function to build an Op for the fun runs
 * @param run
 * @param op
 * @returns {skip: int, limit: int}
 */
function buildOp(run, op) {
    if (run.skip > 0) {
        op.skip = run.skip;
    }
    if (run.limit > 0) {
        op.limit = run.limit;
    }
    return op;
}

/******************
 * Find runs
 */
var find_runs = [
    { ops: 100, points: 30, skip: 0, limit: 0 },
    { ops: 100, points: 1000, skip: 0, limit: 0 },
    { ops: 100, points: 30, skip: 15, limit: 0 },
    { ops: 100, points: 1000, skip: 500, limit: 0 },
    { ops: 100, points: 30, skip: 0, limit: 15 },
    { ops: 100, points: 1000, skip: 0, limit: 500 }
];
for (var run in find_runs) {
    var ops_list = [];

// $box
    ops_list = [];
    for (var i = 0; i < find_runs[run].ops; ++i) {
        var box = getRandomBox(find_runs[run].points);
        var op = buildOp(find_runs[run],
            { op: "find", query: { loc: { $geoWithin: {   $box: [
                [box.bottomLeft.x, box.bottomLeft.y],
                [box.upperRight.x, box.upperRight.y]
            ] } }}});
        ops_list.push(op);
    }
    tests.push({ name: buildTestName("Geo2DIndex.FindGeoWithinBoxFind", find_runs[run]),
        pre: function (collection) {
            populateGridData(collection);
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    });

// $polygon
    ops_list = [];
    for (var i = 0; i < find_runs[run].ops; ++i) {
        var polygon = getRandomRegularHexagon(find_runs[run].points);
        var op = buildOp(find_runs[run],
            {
                op: "find",
                query: { loc: { $geoWithin: { $polygon: polygon } }}
            });
        ops_list.push(op);
    }
    tests.push({ name: buildTestName("Geo2DIndex.FindGeoWithinPolygonFind", find_runs[run]),
        pre: function (collection) {
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
            populateGridData(collection);
        },
        ops: ops_list
    });

// $center
    ops_list = [];
    for (var i = 0; i < find_runs[run].ops; ++i) {
        var circle = getRandomCircle(find_runs[run].points);
        ops_list.push();
        var op = buildOp(find_runs[run],
            {
                op: "find",
                query: { loc: { $geoWithin: { $center: [
                    [circle.center.x, circle.center.y],
                    circle.radius
                ] } }}
            });
        ops_list.push(op);
    }
    tests.push({ name: buildTestName("Geo2DIndex.FindGeoWithinCenterFind", find_runs[run]),
        pre: function (collection) {
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
            populateGridData(collection);
        },
        ops: ops_list
    });
// $centerSphere
    ops_list = [];
    for (var i = 0; i < find_runs[run].ops; ++i) {
        var circle = getRandomSphericalCircleArea(find_runs[run].points);
        var op = buildOp(find_runs[run],
            { op: "find",
                query: { loc: { $geoWithin: { $centerSphere: [
                    [circle.center.long, circle.center.lat],
                    circle.radius
                ] } }}
            });
        ops_list.push(op);
    }
    tests.push({ name: buildTestName("Geo2DIndex.FindGeoWithinCenterSphereFind", find_runs[run]),
        pre: function (collection) {
            collection.ensureIndex({ "loc": "2d" });
            populateSphericalData(collection);
        },
        ops: ops_list
    });
}

/**********************
 * Map Reduce
 */
var mapper = function () {
    emit(this.type, 1);
};
var reducer = function (type, count) {
    return Array.sum(count);
};
// $box
ops_list = [];
for (var i = 0; i < 100; ++i) {
    var box = getRandomBox(1000);
    ops_list.push({ op: "command",
        ns: "#B_DB",
        command: { mapReduce: "#B_COLL",
            map: mapper,
            reduce: reducer,
            out: { inline: 1 },
            query: { loc: { $geoWithin: {   $box: [
                [box.bottomLeft.x, box.bottomLeft.y],
                [box.upperRight.x, box.upperRight.y]
            ] } }}
        }});
}
tests.push({ name: "Geo2DIndex.MapReduceGeoWithinBox",
    pre: function (collection) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
    },
    ops: ops_list
});

// $polygon
ops_list = [];
for (var i = 0; i < 100; ++i) {
    var polygon = getRandomRegularHexagon(1000);
    ops_list.push({ op: "command",
        ns: "#B_DB",
        command: { mapReduce: "#B_COLL",
            map: mapper,
            reduce: reducer,
            out: { inline: 1 },
            query: { loc: { $geoWithin: { $polygon: polygon } }}
        }});
}
tests.push({ name: "Geo2DIndex.MapReduceGeoWithinPolygon",
    pre: function (collection) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
    },
    ops: ops_list
});

// $center
ops_list = [];
for (var i = 0; i < 100; ++i) {
    var circle = getRandomCircle(1000);
    ops_list.push({ op: "command",
        ns: "#B_DB",
        command: { mapReduce: "#B_COLL",
            map: mapper,
            reduce: reducer,
            out: { inline: 1 },
            query: { loc: { $geoWithin: { $center: [
                [circle.center.x, circle.center.y],
                circle.radius
            ] } }}
        }});
}
tests.push({ name: "Geo2DIndex.MapReduceGeoWithinCenter",
    pre: function (collection) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
    },
    ops: ops_list
});

// $centerSphere
ops_list = [];
for (var i = 0; i < 100; ++i) {
    var circle = getRandomSphericalCircleArea(1000);
    ops_list.push({ op: "command",
        ns: "#B_DB",
        command: { mapReduce: "#B_COLL",
            map: mapper,
            reduce: reducer,
            out: { inline: 1 },
            query: { loc: { $geoWithin: { $centerSphere: [
                [circle.center.long, circle.center.lat],
                circle.radius
            ] } }}
        }});
}
tests.push({ name: "Geo2DIndex.MapReduceGeoWithinCenterSphere",
    pre: function (collection) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
    },
    ops: ops_list
});


/*************
 * Insert
 */
ops_list = [];
for (var i = 0; i < 10000; ++i) {
    var rand_coord = getXYCoordinatePosition();
    var op = { op: "insert",
        doc: {loc: [ rand_coord.x, rand_coord.y], type: {"#RAND_STRING": [ 20 ] }, note: { "#RAND_STRING": [ 50 ] }}};
    ops_list.push(op);
}

tests.push({ name: "Geo2DIndex.Insert",
        pre: function (collection) {
            collection.ensureIndex({ "geometry": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    }
);

/****************
 * Updates
 */
var update_runs = [
    { ops: 100, points: 30, multi: false},
    { ops: 100, points: 30, multi: true},
];
for (var run in update_runs) {
    // $box
    ops_list = [];
    for (var i = 0; i < update_runs[run].ops; ++i) {
        var box = getRandomBox(update_runs[run].points);
        ops_list.push(
            {
                op: "update",
                query: { loc: { $geoWithin: {   $box: [
                    [box.bottomLeft.x, box.bottomLeft.y],
                    [box.upperRight.x, box.upperRight.y]
                ] } }},
                update: { $set: {note: { "#RAND_STRING": [ 50 ] }}},
                multi: update_runs[run].multi
            }
        );
    }
    tests.push({ name: buildUpdateTestName("Geo2DIndex.UpdateGeoWithinBox", update_runs[run].multi),
        pre: function (collection) {
            populateGridData(collection);
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    });

    // $polygon
    ops_list = [];
    for (var i = 0; i < update_runs[run].ops; ++i) {
        var polygon = getRandomRegularHexagon(update_runs[run].points);
        ops_list.push(
            {
                op: "update",
                query: { loc: { $geoWithin: { $polygon: polygon } }},
                update: { $set: {note: { "#RAND_STRING": [ 50 ] }}},
                multi: update_runs[run].multi
            }
        );
    }
    tests.push({ name: buildUpdateTestName("Geo2DIndex.UpdateGeoWithinPolygon", update_runs[run].multi),
        pre: function (collection) {
            populateGridData(collection);
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    });

    // $center
    ops_list = [];
    for (var i = 0; i < update_runs[run].ops; ++i) {
        var circle = getRandomCircle(update_runs[run].points);
        ops_list.push(
            {
                op: "update",
                query: { loc: { $geoWithin: { $center: [
                    [circle.center.x, circle.center.y],
                    circle.radius
                ] } }},
                update: { $set: {note: { "#RAND_STRING": [ 50 ] }}},
                multi: update_runs[run].multi
            }
        );
    }
    tests.push({ name: buildUpdateTestName("Geo2DIndex.UpdateGeoWithinCenter", update_runs[run].multi),
        pre: function (collection) {
            populateGridData(collection);
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    });

    // $centerSphere
    ops_list = [];
    for (var i = 0; i < update_runs[run].ops; ++i) {
        var circle = getRandomSphericalCircleArea(update_runs[run].points);
        ops_list.push(
            {
                op: "update",
                query: { loc: { $geoWithin: { $centerSphere: [
                    [circle.center.long, circle.center.lat],
                    circle.radius
                ] } }},
                update: { $set: {note: { "#RAND_STRING": [ 50 ] }}},
                multi: update_runs[run].multi
            }
        );
    }
    tests.push({ name: buildUpdateTestName("Geo2DIndex.UpdateGeoWithinCenterSphere", update_runs[run].multi),
        pre: function (collection) {
            populateGridData(collection);
            collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        },
        ops: ops_list
    });
}

/**********************
 * Remove
 */
var remove_shapes = [];
var remove_points = [];

// $box
ops_list = [];
remove_shapes = [];
remove_points = [];
for (var i = 0; i < 1000; ++i) {
    var box = getRandomBox(30);
    var shape = {loc: {$geoWithin: { $box: [
        [box.bottomLeft.x, box.bottomLeft.y],
        [box.upperRight.x, box.upperRight.y]
    ]}}};
    var point = { loc: [(box.upperRight.x - ((box.upperRight.x - box.bottomLeft.x) / 2)), (box.upperRight.y - ((box.upperRight.y - box.bottomLeft.y) / 2)) ]};
    remove_shapes.push(shape);
    remove_points.push(point);
    shape.thread = { "#VARIABLE": "thread" };
    point.thread = { "#VARIABLE": "thread" };
    ops_list.push({op: "let", target: "thread", value: {"#RAND_INT_PLUS_THREAD": [0, 1]}});
    ops_list.push({op: "remove", query: shape });
    ops_list.push({op: "insert", doc: point});
}
tests.push({ name: "Geo2DIndex.RemoveGeoWithinBox",
    pre: function (collection, env) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
        remove_shapes.forEach(function (shape) {
            collection.remove(shape);
        });
        for (var i = 0; i < env.threads; i++) {
            remove_points.forEach(function (point) {
                point.thread = i;
                collection.insert(point);
            });
        }
    },
    ops: ops_list
});

// $polygon
ops_list = [];
remove_shapes = [];
remove_points = [];
for (var i = 0; i < 1000; ++i) {
    var polygon = getRandomRegularHexagon(30);
    var shape = {loc: {$geoWithin: { $polygon: polygon } } };
    var point = { loc: [(polygon[3][0] - ((polygon[3][0] - polygon[0][0]) / 2)), (polygon[3][1] - ((polygon[3][1] - polygon[0][1]) / 2)) ]};
    remove_shapes.push(shape);
    remove_points.push(point);
    shape.thread = { "#VARIABLE": "thread" };
    point.thread = { "#VARIABLE": "thread" };
    ops_list.push({op: "let", target: "thread", value: {"#RAND_INT_PLUS_THREAD": [0, 1]}});
    ops_list.push({op: "remove", query: shape });
    ops_list.push({op: "insert", doc: point});
}
tests.push({ name: "Geo2DIndex.RemoveGeoWithinPolygon",
    pre: function (collection, env) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
        remove_shapes.forEach(function (shape) {
            collection.remove(shape);
        });
        for (var i = 0; i < env.threads; i++) {
            remove_points.forEach(function (point) {
                point.thread = i;
                collection.insert(point);
            });
        }
    },
    ops: ops_list
});

// $center
ops_list = [];
remove_shapes = [];
remove_points = [];
for (var i = 0; i < 1000; ++i) {
    var circle = getRandomCircle(30);
    var shape = {loc: {$geoWithin: { $center: [
        [circle.center.x, circle.center.y],
        circle.radius
    ] } } };
    var point = { loc: [circle.center.x, circle.center.y]};
    remove_shapes.push(shape);
    remove_points.push(point);
    shape.thread = { "#VARIABLE": "thread" };
    point.thread = { "#VARIABLE": "thread" };
    ops_list.push({op: "let", target: "thread", value: {"#RAND_INT_PLUS_THREAD": [0, 1]}});
    ops_list.push({op: "remove", query: shape });
    ops_list.push({op: "insert", doc: point});
}
tests.push({ name: "Geo2DIndex.RemoveGeoWithinCenter",
    pre: function (collection, env) {
        collection.ensureIndex({ "loc": "2d" }, { "min": x_min, "max": x_max });
        populateGridData(collection);
        remove_shapes.forEach(function (shape) {
            collection.remove(shape);
        });
        for (var i = 0; i < env.threads; i++) {
            remove_points.forEach(function (point) {
                point.thread = i;
                collection.insert(point);
            });
        }
    },
    ops: ops_list
});

// $centerSphere
ops_list = [];
remove_shapes = [];
remove_points = [];
for (var i = 0; i < 1000; ++i) {
    var circle = getRandomSphericalCircleArea(30);
    var shape = {loc: {$geoWithin: { $centerSphere: [
        [circle.center.x, circle.center.y],
        circle.radius
    ] } } };
    var point = { loc: [circle.center.x, circle.center.y]};
    remove_shapes.push(shape);
    remove_points.push(point);
    shape.thread = { "#VARIABLE": "thread" };
    point.thread = { "#VARIABLE": "thread" };
    ops_list.push({op: "let", target: "thread", value: {"#RAND_INT_PLUS_THREAD": [0, 1]}});
    ops_list.push({op: "remove", query: shape });
    ops_list.push({op: "insert", doc: point});
}
tests.push({ name: "Geo2DIndex.RemoveGeoWithinCenterSphere",
    pre: function (collection, env) {
        collection.ensureIndex({ "loc": "2d" });
        populateSphericalData(collection);
        remove_shapes.forEach(function (shape) {
            collection.remove(shape);
        });
        for (var i = 0; i < env.threads; i++) {
            remove_points.forEach(function (point) {
                point.thread = i;
                collection.insert(point);
            });
        }
    },
    ops: ops_list
});
