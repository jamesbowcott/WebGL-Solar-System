precision mediump float;

varying vec2 vTexcoord;
uniform sampler2D uSamplerScene;
uniform sampler2D uSamplerGlow;

void main() {
    gl_FragColor = texture2D(uSamplerScene, vTexcoord) + texture2D(uSamplerGlow, vTexcoord);
}