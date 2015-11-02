precision mediump float;

varying vec4 vColour;
varying highp vec2 vTextureCoord;
varying vec3 vLightDirection;
varying vec3 vNormal;

uniform sampler2D uSamplerDay;
uniform sampler2D uSamplerNight;
uniform sampler2D uSamplerSpecmap;
uniform bool uEnableDayTexture;
uniform bool uEnableNightTexture;
uniform bool uEnableLighting;

void main(void) {
    float I = 1.0;
    float Idiffuse = 1.0;
    float Ispecular = 0.0;
    float Iambient = 0.2;
    vec2 texCoords = vec2(vTextureCoord.s, vTextureCoord.t);

    if (uEnableLighting) {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(vLightDirection);
        float dotNL = dot(N, L);

        Idiffuse = min(1.0, max(dotNL + 0.2, 0.0));
        Idiffuse = pow(Idiffuse, 1.0);

        if (dotNL > 0.0) {
            Ispecular = pow(max(dotNL, 0.0), 20.0);
            Ispecular *= (texture2D(uSamplerSpecmap, texCoords)[0]);
        }

        I = Iambient + Idiffuse + Ispecular;
    }

    vec3 c;
    if (uEnableDayTexture) {
        vec4 dayColour = texture2D(uSamplerDay, texCoords);
        if (dayColour.a < 0.1) discard;
        if (uEnableNightTexture) {
            vec4 nightColour = texture2D(uSamplerNight, vec2(vTextureCoord.s, vTextureCoord.t));
            float m = min(1.0, max(0.0, Idiffuse * 2.0));
            c = (nightColour.rgb * (1.0 - m)) + (dayColour.rgb * m);
            gl_FragColor = vec4(c * (1.0+Ispecular), 1.0);
        } else {
            gl_FragColor = vec4(dayColour.rgb * I, dayColour.a);
        }
    } else {
        gl_FragColor = vec4(vColour.rgb * I, 1.0);
    }

}