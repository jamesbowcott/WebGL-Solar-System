/* 
 * James Bowcott (jab41@aber.ac.uk)
 * CS323 Assignment 2014
 * Aberystwyth University
 */

function Body(name, object, parentBody) {
    this.fromObject = function(name, object, parentBody) {
        this.name = name;
        this.radius = object.radius;
        this.days = object.days;
        this.tilt = object.tilt;
        if ("orbit" in object) {
            this.orbit = new Orbit(object.orbit, parentBody);
        }
        if ("textures" in object) {
            this.textures = object.textures;
        }
        if ("satellites" in object) {
            this.satellites = {};
            for (var satName in object.satellites) {
                var sat = new Body(satName, object.satellites[satName], this);
                this.satellites[satName] = sat;
                //break; // Used for single orbit debugging
            }
        }
        if ("rings" in object) {
            this.rings = object.rings;
        }
    };
    this.createModel = function() {
        var r = this.radius * this.radiusScale;
        this.model = new Model(new models.Sphere(50,50,r));
        this.model.viewMatrix = mat4.create();
        if ('rings' in this) {
            this.ringsModel = new Model(models.Pane(this.rings.radius * this.radiusScale, this.rings.radius * this.radiusScale));
            this.ringsModel.light = false;
        }
        // Yuck...
        if (this.hasOwnProperty("textures")) {
            if ('base' in this.textures) {
                this.model.texture = newTexture("textures/"+this.textures.base.image);
            } else if ('day' in this.textures) {
                this.model.texture = newTexture("textures/"+this.textures.day.image);
                if ('night' in this.textures) {
                    this.model.nightTexture = newTexture("textures/"+this.textures.night.image);
                }
            }
            if ('rings' in this.textures) {
                this.ringsModel.texture = newTexture("textures/"+this.textures.rings.image);
            }
            if ('specular' in this.textures) {
                this.model.specularTexture = newTexture("textures/"+this.textures.specular.image);
            }
        }
        //
        mat4.rotateX(this.tiltMatrix, this.tiltMatrix, degToRad(this.tilt));
    };
    this.advance = function(days) {
        if ("orbit" in this) {
            this.orbit.advance(days);
            this.orbit.bodyMatrix(this.translationMatrix);
        }
        // Rotate planet
        if (solarOptions.rotateBodies) {
            mat4.rotateY(this.rotationMatrix, this.rotationMatrix, degToRad((days/this.days)*360.0));
        }
    };
    this.tick = function() {
        mat4.identity(this.model.matrix);
        mat4.multiply(this.model.matrix, this.model.matrix, this.translationMatrix);
        mat4.multiply(this.model.matrix, this.model.matrix, this.tiltMatrix);
        mat4.multiply(this.model.matrix, this.model.matrix, this.rotationMatrix);
        
        if ('orbit' in this) {
            this.orbit.tick();
        }
        if ('ringsModel' in this) {
            mat4.multiply(this.ringsModel.matrix, this.translationMatrix, this.tiltMatrix);
            mat4.rotateX(this.ringsModel.matrix, this.ringsModel.matrix, degToRad(90));
        }
    };
    this.setCamera = function() {
        var m = mat4.create();
        if ('orbit' in this) {
           mat4.rotateY(m, m, degToRad(this.orbit.trueanomaly()));
        }
        var eye = vec3.fromValues(
                this.model.matrix[12],
                this.model.matrix[13],
                this.model.matrix[14]);
        vec3.negate(eye,eye);
        mat4.translate(m, m, eye);
        updateCamera(m, (this.radius * this.radiusScale) * (glCamera.distance + 1.0));
    };
    
    this.translationMatrix = new mat4.create();
    this.rotationMatrix = mat4.create();
    this.tiltMatrix = mat4.create();
    
    this.radiusScale = 0.0001;
    if (object) this.fromObject(name, object, parentBody);
}

function Orbit(object, parentBody) {
    this.fromObject = function(object, parentBody) {
        this.radius = object.semimajoraxis * 20;
        this.eccentricity = object.eccentricity;
        this.inclination = object.inclination;
        this.ascendingnode = object.ascendingnode;
        this.days = object.days;
        if (parentBody) {
            this.baseMatrix = parentBody.translationMatrix;
        }
        // Set up the orbit matrix
        mat4.rotateY(this.orbitMatrix, this.orbitMatrix, degToRad(this.ascendingnode));
        mat4.rotateZ(this.orbitMatrix, this.orbitMatrix, degToRad(this.inclination));
        mat4.translate(this.orbitMatrix, this.orbitMatrix, vec3.fromValues(0,0,(this.radius*this.eccentricity)));

    };
    this.createModel = function() {
        var colour = [1,1,1,1];
        this.model = new Model(new models.Ellipse(this.radius, this.eccentricity, this.radius * 10, colour));
    };
    this.advance = function(days) {
        this.period = wrapNum(this.period + (days / this.days), 0.0, 1.0);
    };
    this.trueanomaly = function() {
        return 360.0 * this.period;
    };
    this.bodyMatrix = function(matIn) {
        var p = this.position();
        var t = mat4.create();
        mat4.translate(t, t, p);
        mat4.multiply(matIn, this.baseMatrix, this.orbitMatrix);
        mat4.multiply(matIn, matIn, t);
    };
    this.position = function() {
        majorRadius = this.radius;
        minorRadius = this.radius * Math.sqrt(1.0 - Math.pow(this.eccentricity,2));
        var theta = 2.0 * Math.PI * this.period;
        p = vec3.fromValues(
                minorRadius * Math.cos(theta),
                0.0,
                majorRadius * Math.sin(theta));
        vec3.negate(p,p);
        return p;
    };
    this.tick = function() {
        mat4.multiply(this.model.matrix, this.baseMatrix, this.orbitMatrix);
    };
    
    this.baseMatrix = mat4.create();
    this.orbitMatrix = mat4.create();
    this.period = Math.random();
    this.parentBody = null;
    if (object) this.fromObject(object, parentBody);
}

var solarBodies = {};
var solarSpeed = 1 / 60;
var solarOptions = {
    rotateBodies: true,
    drawOrbits: true
};
var solarViewingBody = "Sun";

function populateSolarBodies(body) {
    var count = 0;
    solarBodies[body.name] = body;
    if ("satellites" in body) {
        for (var satName in body.satellites) {
            populateSolarBodies(body.satellites[satName]);
            count++;
        }
    }
    return count + 1;
}

function initSolarSystem() {
    solarBodies = {};
    var bodyData = JSON.parse(loadFileSynchronous("data/solarsystem.json"));
    var sun = new Body("Sun", bodyData.Sun);
    var bodyCount = populateSolarBodies(sun);
    var i = 0;
    for (var bodyName in solarBodies) {
        body = solarBodies[bodyName];
        body.createModel();
        if (bodyName === 'Sun') {
            body.model.light = false;
        }
        glModels.push(body.model);
        if ('orbit' in body) {
            body.orbit.createModel();
            body.orbit.model.setColour(HSVtoRGB(i / bodyCount, 0.75, 0.5));
            glModels.push(body.orbit.model);
            i++;
        }
        if ('ringsModel' in body) {
            glModels.push(body.ringsModel);
        }
    }
}

function tickSolarSystem() {
    for (bodyName in solarBodies) {
        body = solarBodies[bodyName];
        body.advance(solarSpeed);
        body.tick();
    }
    solarBodies[solarViewingBody].setCamera();
}