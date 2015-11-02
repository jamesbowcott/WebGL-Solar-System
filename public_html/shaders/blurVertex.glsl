attribute vec3 aPosition;
attribute vec2 aTexcoord;

uniform vec2 uBlurVec;

varying vec2 vTexcoord;
varying vec2 vBlurVec;


void main() {
    vTexcoord = aTexcoord;
    vBlurVec = uBlurVec;
    gl_Position = vec4(aPosition, 1.0);
}