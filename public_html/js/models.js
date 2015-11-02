/* 
 * James Bowcott (jab41@aber.ac.uk)
 * CS323 Assignment 2014
 * Aberystwyth University
 */


var models = {

Pane: function(width, height) {
    var w = width/2.0;
    var h = height/2.0;
    var model = {
        vertices: [
            -w, -h, 0,
            -w, h, 0,
            w, h, 0,
            -w, -h, 0,
            w, -h, 0,
            w, h, 0],
        normals: [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
        textureCoords: [0,0,0,1,1,1,0,0,1,0,1,1],
        drawmode: glDRAWMODES.TRIANGLES
    };
    return model;
},

Circle: function(radius, resolution, colour) {
    var model = {
        vertices:[],
        normals:[],
        colours:[],
        drawmode:glDRAWMODES.LINE_STRIP
    };
    for (var i = 0; i <= resolution; i++) {
        var theta = 2.0 * Math.PI * i / resolution;
        model.vertices.push(radius * Math.cos(theta)); // x
        model.vertices.push(0); // y
        model.vertices.push(radius * Math.sin(theta)); // z
        model.normals = model.normals.concat([0,1,0]);
        model.colours = model.colours.concat(colour);
    }
    return model;
},

Ellipse: function(radius, eccentricity, resolution, colour) {
    var model = {
        vertices:[],
        normals:[],
        colours:[],
        drawmode:glDRAWMODES.LINE_STRIP
    };
    resolution=360;
    for (var i = 0; i <= resolution; i++) {
        majorRadius = radius;
        minorRadius = radius * Math.sqrt(1.0 - Math.pow(eccentricity,2));
        var theta = 2.0 * Math.PI * (i / resolution);
        model.vertices.push(minorRadius * Math.cos(theta)); // x
        model.vertices.push(0); // y
        model.vertices.push(majorRadius * Math.sin(theta)); // z
        model.normals = model.normals.concat([0,1,0]);
        model.colours = model.colours.concat(colour);
    }
    return model;
},



Sphere: function(latitudeBands, longitudeBands, radius) {
    var model = {vertices: [], normals: [], indices: [], textureCoords: [],
        drawmode: glDRAWMODES.TRIANGLE_STRIP};
    
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1-(longNumber / longitudeBands);
        var v = (latNumber / latitudeBands);

        model.normals.push(x);
        model.normals.push(y);
        model.normals.push(z);
        model.textureCoords.push(u);
        model.textureCoords.push(v);
        model.vertices.push(radius * x);
        model.vertices.push(radius * y);
        model.vertices.push(radius * z);
      }
    }
    
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        model.indices.push(first);
        model.indices.push(second);
        model.indices.push(first + 1);

        model.indices.push(second);
        model.indices.push(second + 1);
        model.indices.push(first + 1);
      }
    }

    return model;
},

Axes: function() {
    return {
        vertices: [
            0.0, 0.0, 0.0,  1000.0, 0.0, 0.0,
            0.0, 0.0, 0.0,  0.0, 1000.0, 0.0,
            0.0, 0.0, 0.0,  0.0, 0.0, 1000.0,
            0.0, 0.0, 0.0,  -1000.0, 0.0, 0.0,
            0.0, 0.0, 0.0,  0.0, -1000.0, 0.0,
            0.0, 0.0, 0.0,  0.0, 0.0, -1000.0],
        normals: [
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
            -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,
            0.0, -1.0, 0.0,  0.0, -1.0, 0.0,
            0.0, 0.0, -1.0,  0.0, 0.0, -1.0],
        colours: [
            1.0, 0.0, 0.0, 1.0,     1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,     0.0, 0.0, 1.0, 1.0,
            0.5, 0.0, 0.0, 1.0,     0.5, 0.0, 0.0, 1.0,
            0.0, 0.5, 0.0, 1.0,     0.0, 0.5, 0.0, 1.0,
            0.0, 0.0, 0.5, 1.0,     0.0, 0.0, 0.5, 1.0],
        drawmode: glDRAWMODES.LINES
    };
}

};