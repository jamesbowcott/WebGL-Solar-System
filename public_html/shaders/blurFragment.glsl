precision mediump float;

varying vec2 vTexcoord;
varying vec2 vBlurVec;
uniform sampler2D uSampler;

const float a = 1.0;
 
void main(void)
{
   vec4 sum = vec4(0.0);
   
   if (vBlurVec[0] > 0.0) {
    sum += texture2D(uSampler, vec2(vTexcoord.x - 4.0*vBlurVec[0], vTexcoord.y)) * (0.05*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x - 3.0*vBlurVec[0], vTexcoord.y)) * (0.09*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x - 2.0*vBlurVec[0], vTexcoord.y)) * (0.12*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x - vBlurVec[0], vTexcoord.y)) * (0.15*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y)) * (0.16*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x + vBlurVec[0], vTexcoord.y)) * (0.15*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x + 2.0*vBlurVec[0], vTexcoord.y)) * (0.12*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x + 3.0*vBlurVec[0], vTexcoord.y)) * (0.09*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x + 4.0*vBlurVec[0], vTexcoord.y)) * (0.05*a);
   } else {
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y - 4.0*vBlurVec[1])) * (0.05*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y - 3.0*vBlurVec[1])) * (0.09*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y - 2.0*vBlurVec[1])) * (0.12*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y - vBlurVec[1])) * (0.15*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y)) * (0.16*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y + vBlurVec[1])) * (0.15*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y + 2.0*vBlurVec[1])) * (0.12*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y + 3.0*vBlurVec[1])) * (0.09*a);
    sum += texture2D(uSampler, vec2(vTexcoord.x, vTexcoord.y + 4.0*vBlurVec[1])) * (0.05*a);
   }
 
   gl_FragColor = sum * 1.0;
}
