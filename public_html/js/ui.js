/* 
 * James Bowcott (jab41@aber.ac.uk)
 * CS323 Assignment 2014
 * Aberystwyth University
 */


var canvasLastMouseX = null;
var canvasLastMouseY = null;
var canvasMouseIsDown = false;
var uiOptions = {
    movementScaler: 0.5,
    zoomScaler: 0.05
};

function initUI() {
    /* Add event listeners */
    var canvas = document.getElementById("glcanvas");
    canvas.onmousedown = uiCanvasMouseDown;
    document.onmouseup = uiCanvasMouseUp;
    document.onmousemove = uiCanvasMouseMove;
    canvas.addEventListener("wheel", function(event){
        uiCanvasMouseWheel(event);
        event.preventDefault();
        return false;
    }, false);


    uiPopulateSelectBodies();
    uiUpdateControls();
}

function uiCanvasMouseDown(event) {
    canvasMouseIsDown = true;
    canvasLastMouseX = event.clientX;
    canvasLastMouseY = event.clientY;
}

function uiCanvasMouseUp(event) {
    canvasMouseIsDown = false;
}

function uiCanvasMouseMove(event) {
    if (canvasMouseIsDown) {
        var deltaX = event.clientX - canvasLastMouseX;
        var deltaY = event.clientY - canvasLastMouseY;
        glCamera.pitch = wrapNum(glCamera.pitch - (deltaY * uiOptions.movementScaler), 0, 360);
        glCamera.yaw = wrapNum(glCamera.yaw - (deltaX * uiOptions.movementScaler), 0, 360);
        canvasLastMouseX = event.clientX;
        canvasLastMouseY = event.clientY;
    }
}

function uiCanvasMouseWheel(event) {
    var delta = Math.max(-1, Math.min(1, (event.deltaY || -event.detail)));
    glCamera.distance += delta * Math.max(0,glCamera.distance * uiOptions.zoomScaler);
    glCamera.distance = Math.min(1500, Math.max(glCamera.distance, 0));
    return false;
}

function updateMat4Fields(containerId, matrix) {
    if (!document.getElementById(containerId)) return;
    if (!document.getElementById('chkMatrices').checked) return;
    var elements = document.getElementById(containerId).getElementsByTagName("input");
    for (var i = 0; i < 16; i++) {
        elements[i].value = matrix[i];
    }
}

function createMat4Fields(containerId) {
    var eTable = document.createElement("table");
    for (var r = 0; r < 4; r++) {
        var eTr = document.createElement("tr");
        for (var c = 0; c < 4; c++) {
            var eTd = document.createElement("td");
            var eInput = document.createElement("input");
            eInput.setAttribute("type", "number");
            eInput.setAttribute("readonly", "readonly");
            eTd.appendChild(eInput);
            eTr.appendChild(eTd);
        }
        eTable.appendChild(eTr);
    }
    document.getElementById(containerId).appendChild(eTable);
}

function uiPopulateSelectBodies() {
    var elSelect = document.getElementById('selectBodies');
    var size = 0;
    for (var bodyName in solarBodies) {
        var elOption = document.createElement('option');
        elOption.setAttribute("name", bodyName);
        elOption.innerHTML = bodyName;
        elSelect.appendChild(elOption);
        size++;
    }
    elSelect.setAttribute("size", size);
}

function uiSelectBodiesChanged() {
    elSelect = document.getElementById('selectBodies');
    solarViewingBody = elSelect.options[elSelect.selectedIndex].text;
}

function uiChkDrawOrbits() {
    solarOptions.drawOrbits = !document.getElementById('chkDrawOrbits').checked;
    for (var bodyName in solarBodies) {
        body = solarBodies[bodyName];
        if ('orbit' in body) {
            body.orbit.model.dontdraw = solarOptions.drawOrbits;
        }
    }
}

function uiOnClick(e) {
    switch (e.id) {
        case "chkLighting": glOptions.lighting = e.checked; break;
        case "chkBloom": glOptions.bloom = e.checked; break;
        case "chkWireframe": glOptions.wireframe = e.checked; break;
        case "chkDrawAxes": glAxesModel.dontdraw = !e.checked; break;
        case "chkRotateBodies": solarOptions.rotateBodies = e.checked; break;
        case "chkDrawOrbits": uiChkDrawOrbits(); break;
        case "rdoScreenScene": glOptions.screen = 0; break;
        case "rdoScreenBloomscene": glOptions.screen = 1; break;
        case "rdoScreenBloom": glOptions.screen = 2; break;
        case "rdoScreenFinal": glOptions.screen = 3; break;
    }
}

function uiRangeSpeedChanged(e) {
    solarSpeed = Math.pow(e.value, 4);
    document.getElementById('uiSpanDaysPerSecond').innerHTML = (solarSpeed * 60).toFixed(1);
}

function uiUpdateControls() {
    document.getElementById('chkLighting').checked = glOptions.lighting;
    document.getElementById('chkBloom').checked = glOptions.bloom;
    document.getElementById('chkWireframe').checked = glOptions.wireframe;
    document.getElementById('chkDrawAxes').checked = !glAxesModel.dontdraw;
    document.getElementById('chkRotateBodies').checked = solarOptions.rotateBodies;
    document.getElementById('chkDrawOrbits').checked = solarOptions.drawOrbits;
    // TODO update body selection
    document.getElementById('rangeSpeed').value = Math.pow(solarSpeed, 1/4);
    document.getElementById('uiSpanDaysPerSecond').innerHTML = (solarSpeed * 60).toFixed(1);
}

function tickUI() {
    if (document.getElementById('uiBoxCamera')) {
        document.getElementById('uiCameraDisplayDistance').innerHTML = glCamera.distance.toFixed(2);
        document.getElementById('uiCameraDisplayPitch').innerHTML = glCamera.pitch.toFixed(2);
        document.getElementById('uiCameraDisplayYaw').innerHTML = glCamera.yaw.toFixed(2);
    }
}