attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColour;
attribute vec2 aTextureCoord;

uniform mat4 uMatModel;
uniform mat4 uMatView;
uniform mat4 uMatProj;
uniform mat3 uMatNorm;
uniform bool uEnableLighting;

varying vec4 vColour;
varying highp vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vLightDirection;

void main(void) {
    vColour = aVertexColour;
    vTextureCoord = aTextureCoord;
    gl_Position = uMatProj * uMatView * uMatModel * vec4(aVertexPosition, 1.0);
    if (uEnableLighting) {
        vec4 pos = uMatModel * vec4(aVertexPosition, 1.0);
        vNormal = normalize(uMatNorm * aVertexNormal);
        vLightDirection = vec3(vec4(0.0,0.0,0.0,1.0) - pos);
    }
}