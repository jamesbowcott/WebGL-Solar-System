/* 
 * James Bowcott (jab41@aber.ac.uk)
 * CS323 Assignment 2014
 * Aberystwyth University
 */

/* Variables */
var gl;
var glShaders = {};
var glFramebuffers = {};
var glMatrices = {};
var glModels = [];
var glOptions = {
    wireframe: false,
    lighting: true,
    textures: true,
    bloom: true,
    bloomAmount: 1.0/256.0,
    screen: 3
};
var glCamera = {
    pitch: 90.0,
    yaw: 0.0,
    distance: 30.0
};
var glAxesModel;
var glBlitPane;

/* Constants */
var glDRAWMODES = {
    TRIANGLES: 0,
    TRIANGLE_STRIP: 1,
    LINES: 2,
    LINE_STRIP: 3,
    QUAD: 4
};

/* Prototypes */
function Model(object) {
    this.fromObject = function(object)
    {
        this.vertexArray = new Float32Array(object.vertices);
        this.vertexCount = object.vertices.length / 3;
        this.normalArray = new Float32Array(object.normals);
        if (object.hasOwnProperty("colours")) {
            this.setColours(object.colours);
        } else {
            this.setColours(null);
        }
        if (object.hasOwnProperty("indices")) {
            this.indexArray = new Uint16Array(object.indices);
            this.elementCount = object.indices.length;
            this.indexed = true;
        }
        if (object.hasOwnProperty("textureCoords")) {
            this.textureCoordArray = new Float32Array(object.textureCoords);
        }
        this.drawmode = object.drawmode;
        this.initBuffers();
    };
    
    this.initBuffers = function()
    {
        // Vertices
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.STATIC_DRAW);
        // Normals
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
        // Colours are done in setColours
        // Indices
        if (this.hasOwnProperty("indexArray")) {
            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexArray, gl.STATIC_DRAW);
        }
        // Texture
        if (this.hasOwnProperty("textureCoordArray")) {
            this.textureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.textureCoordArray, gl.STATIC_DRAW);
        }
    };
    
    this.setColours = function(colours)
    {
        if (!colours) {
            // If we pass in null, set some random colours
            colours = [];
            for (i = 0; i < this.vertexArray.length; i++) {
                colours.push(Math.random(), Math.random(), Math.random(), 1.0);
            }
        }
        this.colourArray = new Float32Array(colours);
        this.colourBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colourArray, gl.STATIC_DRAW);
    };
    
    this.setColour = function(rgb)
    {
        var colourArray = [];
        for (var i = 0; i < this.vertexCount; i++) {
            colourArray = colourArray.concat([rgb[0],rgb[1],rgb[2],1.0]);
        }
        this.setColours(colourArray);
    };
    
    this.toShader = function(colours, textures, lighting) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(glShaders.main.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(glShaders.main.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
        
        /* Colours */
        if (colours) {
            gl.enableVertexAttribArray(glShaders.main.aVertexColour);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
            gl.vertexAttribPointer(glShaders.main.aVertexColour, 4, gl.FLOAT, false, 0, 0);
        } else {
            gl.disableVertexAttribArray(glShaders.main.aVertexColour);
        }
        
        /* Textures */
        if (textures && this.texture && this.texture.image.status === 1) {
            if (!this.texture.status) {
                initTexture(this.texture);
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // Night texture
            gl.activeTexture(gl.TEXTURE1);
            if (this.nightTexture && this.nightTexture.image.status === 1) {
                if (!this.nightTexture.status) {
                    initTexture(this.nightTexture);
                }
                gl.bindTexture(gl.TEXTURE_2D, this.nightTexture);
                gl.uniform1i(glShaders.main.uEnableNightTexture, true);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.uniform1i(glShaders.main.uEnableNightTexture, false);
            }
            // Specular Map
            gl.activeTexture(gl.TEXTURE2);
            if (this.specularTexture && this.specularTexture.image.status === 1) {
                if (!this.specularTexture.status) initTexture(this.specularTexture);
                gl.bindTexture(gl.TEXTURE_2D, this.specularTexture);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
            
            gl.enableVertexAttribArray(glShaders.main.aTextureCoord);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
            gl.vertexAttribPointer(glShaders.main.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1i(glShaders.main.uEnableDayTexture, true);
        } else {
            gl.disableVertexAttribArray(glShaders.main.aTextureCoord);
            gl.uniform1i(glShaders.main.uEnableDayTexture, false);
        }
        
        /* Lighting */
        gl.uniform1i(glShaders.main.uEnableLighting,
            lighting && this.light && (this.drawmode < 2));
    };
    
    this.dontdraw = false;
    this.indexed = false;
    this.drawmode = 0;
    this.light = true;
    this.matrix = mat4.create();
    if (object) this.fromObject(object);
};

function Framebuffer(depthbuffer, width, height) {    
    this.create = function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);    
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        /* These parameters allow non-PO2 dimensions. We don't need mipmapping */
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        if (this.hasDepthBuffer) {
            this.depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    
    this.resize = function(width, height) {
        this.width = width;
        this.height = height;
        
        if (this.tex) {
            gl.deleteTexture(this.tex);
            delete this.tex;
        }
        if (this.depthBuffer) {
            gl.deleteRenderbuffer(this.depthBuffer);
            delete this.depthBuffer;
        }
        this.create();
    };
    
    this.fbo = gl.createFramebuffer();
    this.hasDepthBuffer = depthbuffer;
    if (width && height) {
        this.resize(width, height);
    }
}

/* Functions */
function initGL(canvas) {
    gl = canvas.getContext("experimental-webgl");
    if (!gl) {
        error("Could not initialise WebGL. Make sure your browser supports it.");
    } else {
        // Keep reference to canvas as we need to know it's dimensions when rendering
        gl.canvas = canvas;

        // Setup WebGL context
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        initFramebuffers();
        initShaders();
        initMatrices();
        
        glAxesModel = new Model(models.Axes());
        glAxesModel.dontdraw = true; // Dont show by default
        glModels.push(glAxesModel);
        
        glBlitPane = new Model(models.Pane(2,2));
    }
};

function loadShader(source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        error(gl.getShaderInfoLog(shader));
        return null;
    } else {
        return shader;
    }
};

function initShaders() {
    initShaderMain();
    initShaderBlur();
    initShaderBlit();
}

function initShaderMain() {
    var vertexShader = loadShader(loadFileSynchronous("shaders/vertex.glsl"), gl.VERTEX_SHADER);
    var fragmentShader = loadShader(loadFileSynchronous("shaders/fragment.glsl"), gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
        error("Failed to load shader source");
        return false;
    }
    glShaders.main = gl.createProgram();
    gl.attachShader(glShaders.main, vertexShader);
    gl.attachShader(glShaders.main, fragmentShader);
    
    /* Bind variable locations */
    glShaders.main.aVertexPosition        = 0;
    glShaders.main.aVertexNormal          = 1;
    glShaders.main.aVertexColour          = 2;
    glShaders.main.aTextureCoord          = 3;
    gl.bindAttribLocation(glShaders.main, glShaders.main.aVertexPosition, "aVertexPosition");
    gl.bindAttribLocation(glShaders.main, glShaders.main.aVertexNormal, "aVertexNormal");
    gl.bindAttribLocation(glShaders.main, glShaders.main.aVertexColour, "aVertexColour");
    gl.bindAttribLocation(glShaders.main, glShaders.main.aTextureCoord, "aTextureCoord");
    
    /* Link and use shader */
    gl.linkProgram(glShaders.main);
    if (!gl.getProgramParameter(glShaders.main, gl.LINK_STATUS)) {
        error("Could not link shader program");
        return false;
    }
    gl.useProgram(glShaders.main);
    
    /* Get locations for uniform variables */
    glShaders.main.uMatModel              = gl.getUniformLocation(glShaders.main, "uMatModel");
    glShaders.main.uMatView               = gl.getUniformLocation(glShaders.main, "uMatView");
    glShaders.main.uMatProj               = gl.getUniformLocation(glShaders.main, "uMatProj");
    glShaders.main.uMatNorm               = gl.getUniformLocation(glShaders.main, "uMatNorm");
    glShaders.main.uEnableDayTexture      = gl.getUniformLocation(glShaders.main, "uEnableDayTexture");
    glShaders.main.uEnableNightTexture    = gl.getUniformLocation(glShaders.main, "uEnableNightTexture");
    glShaders.main.uEnableLighting        = gl.getUniformLocation(glShaders.main, "uEnableLighting");
    glShaders.main.uSamplerDay            = gl.getUniformLocation(glShaders.main, "uSamplerDay");
    glShaders.main.uSamplerNight          = gl.getUniformLocation(glShaders.main, "uSamplerNight");
    glShaders.main.uSamplerSpecmap        = gl.getUniformLocation(glShaders.main, "uSamplerSpecmap");

    /* Enable vertex attribute arrays */
    gl.enableVertexAttribArray(glShaders.main.aVertexPosition);
    gl.enableVertexAttribArray(glShaders.main.aVertexNormal);
    gl.enableVertexAttribArray(glShaders.main.aVertexColour);
    
    /* Set texture samplers to their respective texture unit numbers */
    gl.uniform1i(glShaders.main.uSamplerDay, 0);
    gl.uniform1i(glShaders.main.uSamplerNight, 1);
    gl.uniform1i(glShaders.main.uSamplerSpecmap, 2);

    return true;
};

function initShaderBlur() {
    var vertexShader = loadShader(loadFileSynchronous("shaders/blurVertex.glsl"), gl.VERTEX_SHADER);
    var fragmentShader = loadShader(loadFileSynchronous("shaders/blurFragment.glsl"), gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
        error("Failed to load shader source");
        return false;
    }
    glShaders.blur = gl.createProgram();
    gl.attachShader(glShaders.blur, vertexShader);
    gl.attachShader(glShaders.blur, fragmentShader);
    gl.linkProgram(glShaders.blur);
    if (!gl.getProgramParameter(glShaders.blur, gl.LINK_STATUS)) {
        error("Could not link shader program");
        return false;
    }
    gl.useProgram(glShaders.blur);
    glShaders.blur.aPosition    = gl.getAttribLocation(glShaders.blur, "aPosition");
    glShaders.blur.aTexcoord    = gl.getAttribLocation(glShaders.blur, "aTexcoord");
    glShaders.blur.uBlurVec     = gl.getUniformLocation(glShaders.blur, "uBlurVec");
    glShaders.blur.uSampler     = gl.getUniformLocation(glShaders.blur, "uSampler");
    gl.enableVertexAttribArray(glShaders.blur.aPosition);
    gl.enableVertexAttribArray(glShaders.blur.aTexcoord);
    gl.uniform1i(glShaders.blur.uSampler, 0);
}

function initShaderBlit() {
    var vertexShader = loadShader(loadFileSynchronous("shaders/blitVertex.glsl"), gl.VERTEX_SHADER);
    var fragmentShader = loadShader(loadFileSynchronous("shaders/blitFragment.glsl"), gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
        error("Failed to load shader source");
        return false;
    }
    glShaders.blit = gl.createProgram();
    gl.attachShader(glShaders.blit, vertexShader);
    gl.attachShader(glShaders.blit, fragmentShader);
    gl.linkProgram(glShaders.blit);
    if (!gl.getProgramParameter(glShaders.blit, gl.LINK_STATUS)) {
        error("Could not link shader program");
        return false;
    }
    gl.useProgram(glShaders.blit);
    glShaders.blit.aPosition        = gl.getAttribLocation(glShaders.blit, "aPosition");
    glShaders.blit.aTexcoord        = gl.getAttribLocation(glShaders.blit, "aTexcoord");
    glShaders.blit.uSamplerScene    = gl.getUniformLocation(glShaders.blit, "uSamplerScene");
    glShaders.blit.uSamplerGlow     = gl.getUniformLocation(glShaders.blit, "uSamplerGlow");
    gl.enableVertexAttribArray(glShaders.blit.aPosition);
    gl.uniform1i(glShaders.blit.uSamplerScene, 0);
    gl.uniform1i(glShaders.blit.uSamplerGlow, 1);
}

function initMatrices() {
    glMatrices.model = mat4.create();
    glMatrices.view = mat4.create();
    glMatrices.projection = mat4.create();
    glMatrices.normals = mat3.create();
};

function initFramebuffers() {
    glFramebuffers.scene = new Framebuffer(true);
    glFramebuffers.bloomA = new Framebuffer(true); // Scene image to bloom
    glFramebuffers.bloomB = new Framebuffer(false); // Horizontal blur
    glFramebuffers.bloomC = new Framebuffer(false); // Vertical blur (final bloom image)
}

function updateShaderParameters() {
    // Update normal matrix
    mat3.fromMat4(glMatrices.normals, glMatrices.model);
    mat3.invert(glMatrices.normals, glMatrices.normals);
    mat3.transpose(glMatrices.normals, glMatrices.normals);
    // Matrix uniforms
    gl.uniformMatrix4fv(glShaders.main.uMatModel, false, glMatrices.model);
    gl.uniformMatrix4fv(glShaders.main.uMatView, false, glMatrices.view);
    gl.uniformMatrix4fv(glShaders.main.uMatProj, false, glMatrices.projection);
    gl.uniformMatrix3fv(glShaders.main.uMatNorm, false, glMatrices.normals);
};

function updateCamera(baseMatrix, distance) {
    var cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0.0, 0.0, -distance));
    mat4.rotateX(cameraMatrix, cameraMatrix, degToRad(glCamera.pitch));
    mat4.rotateY(cameraMatrix, cameraMatrix, degToRad(glCamera.yaw));
    mat4.multiply(glMatrices.view, cameraMatrix, baseMatrix);
}

/* Textures */
function newTexture(imageSrc) {
    /* The texture image loads asynchronously, so we need to know if it has been
     * successfully loaded before we can use the texture. */
    var texture = gl.createTexture();
    texture.status = 0;
    texture.image = new Image();
    texture.image.onload = function() {
        this.status = 1;
    };
    texture.image.onerror = function() {
        this.status = -1;
    };
    texture.image.status = 0;
    texture.image.src = imageSrc;
    
    return texture;
};

function initTexture(texture) {
    if (texture.image.status === 1) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        //if (mipmap) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
        //}
        gl.bindTexture(gl.TEXTURE_2D, null);
        texture.status = 1;
    }
}

function drawScene() {
    // Render each model
    for (var mi in glModels) {
        try {
            model = glModels[mi];
            if (model.dontdraw) continue;
            // Set the model matrix and push model data to shader variables
            glMatrices.model = model.matrix;
            model.toShader(true, glOptions.textures, glOptions.lighting);
        } catch (err) {
            console.log("Unable to render invalid model object. Removing from stack. ("+err+")");
            glModels.splice(mi, 1);
            return;
        }
        
        updateShaderParameters();

        // Determine appropriate rendering function and mode
        var mode;
        if (glOptions.wireframe) {
            switch (model.drawmode) {
                case glDRAWMODES.TRIANGLE_STRIP:
                case glDRAWMODES.LINE_STRIP:
                    mode = gl.LINE_STRIP; break;
                case glDRAWMODES.TRIANGLES:
                case glDRAWMODES.LINES:
                    mode = gl.LINES; break;
            }
        } else {
            switch (model.drawmode) {
                case glDRAWMODES.TRIANGLES:
                    mode = gl.TRIANGLES; break;
                case glDRAWMODES.TRIANGLE_STRIP:
                    mode = gl.TRIANGLE_STRIP; break;
                case glDRAWMODES.LINES:
                    mode = gl.LINES; break;
                case glDRAWMODES.LINE_STRIP:
                    mode = gl.LINE_STRIP; break;
            }
        }
        if (model.indexed) {
            gl.drawElements(mode, model.elementCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(mode, 0, model.vertexCount);
        }
    }
};

function drawBloomScene() {
    for (var bodyName in solarBodies) {
        var model = solarBodies[bodyName].model;
        model.toShader(false, (bodyName === 'Sun'), false);
        glMatrices.model = model.matrix;
        updateShaderParameters();
        gl.drawElements(gl.TRIANGLE_STRIP, model.elementCount, gl.UNSIGNED_SHORT, 0);
    }
}

function tickGL() {
    // Has canvas (i.e. browser window) resized?
    if (gl.canvas.clientWidth !== gl.canvas.width || gl.canvas.clientHeight !== gl.canvas.height) {
        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        // Set view aspect
        mat4.perspective(glMatrices.projection, 45, gl.canvas.width / gl.canvas.height, 0.1, 5000.0);
        // Resize framebuffers
        glFramebuffers.scene.resize(gl.canvas.width, gl.canvas.height);
        glFramebuffers.bloomA.resize(gl.canvas.width/2, gl.canvas.height/2);
        glFramebuffers.bloomB.resize(gl.canvas.width/2, gl.canvas.height/2);
        glFramebuffers.bloomC.resize(gl.canvas.width/2, gl.canvas.height/2);
    }
    
    if (glOptions.bloom) {
        /* Bloom scene */
        gl.useProgram(glShaders.main);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffers.bloomA.fbo);
        gl.viewport(0, 0, glFramebuffers.bloomA.width, glFramebuffers.bloomA.height);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawBloomScene();

        /* Bloom blur vertical */
        gl.useProgram(glShaders.blur);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffers.bloomB.fbo);
        gl.viewport(0, 0, glFramebuffers.bloomB.width, glFramebuffers.bloomB.height);
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Shader input texture is the bloom scene we just rendered
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.bloomA.tex);
        gl.uniform2f(glShaders.blur.uBlurVec, 0.0, glOptions.bloomAmount);
        // Send 2D pane data
        gl.bindBuffer(gl.ARRAY_BUFFER, glBlitPane.vertexBuffer);
        gl.vertexAttribPointer(glShaders.blur.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, glBlitPane.textureCoordBuffer);
        gl.vertexAttribPointer(glShaders.blur.aTexcoord, 2, gl.FLOAT, false, 0, 0);
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, glBlitPane.vertexCount);

        /* Bloom blur horizontal */
        gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffers.bloomC.fbo);
        gl.viewport(0, 0, glFramebuffers.bloomC.width, glFramebuffers.bloomC.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.bloomB.tex);
        gl.uniform2f(glShaders.blur.uBlurVec, glOptions.bloomAmount, 0.0);
        gl.drawArrays(gl.TRIANGLES, 0, glBlitPane.vertexCount);
    }

    /* Normal scene */
    gl.useProgram(glShaders.main);
    gl.viewport(0, 0, glFramebuffers.scene.width, glFramebuffers.scene.height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffers.scene.fbo);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawScene();
    
    /* Blit composite */
    gl.useProgram(glShaders.blit);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, glBlitPane.vertexBuffer);
    gl.vertexAttribPointer(glShaders.blit.aPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    switch (glOptions.screen) {
        case 0: gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.scene.tex); break;
        case 1: gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.bloomA.tex); break;
        case 2: gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.bloomC.tex); break;
        case 3: {
                gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.scene.tex);
                if (glOptions.bloom) {
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, glFramebuffers.bloomC.tex);
                }
                break;
            }
    }
    
    gl.enableVertexAttribArray(glShaders.blit.aTexcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, glBlitPane.textureCoordBuffer);
    gl.vertexAttribPointer(glShaders.blit.aTexcoord, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, glBlitPane.vertexCount);
}