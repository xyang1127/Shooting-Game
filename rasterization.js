/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var shaderProgram;

var eyePosition = new vec3.fromValues(0, 0, 5.5);
var Center = new vec3.fromValues(0, 0, 0);
var viewUp = new vec3.fromValues(-1, 0, 0);

var VertexBuffer;
var NormBuffer;
var CubeBuffer;
var cubeVerticesColorBuffer;

// set up the webGL environment
function setupWebGL() {
    
    let berzerkCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
    gl = berzerkCanvas.getContext("webgl"); // get a webgl object from it
    try {
        if (gl == null) {
            throw "unable to create gl context -- is your browser gl ready?";
        } else {
            gl.clearDepth(1.0); // use max when we clear the depth buffer
            gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
            //ToDo
        }
    } catch(e) {
        console.log(e);
    }
} // end setupWebGL


function setupShaders() {

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 a_vertexPosition;
        attribute vec3 norm;
		varying vec4 vColor;
        uniform mat4 u_pvmMatrix;
        uniform mat4 tMatrix;
        uniform vec3 eyePosition;
        uniform vec3 diffuse;
		
        void main() {

            mediump vec4 tmpPosition = tMatrix * vec4(a_vertexPosition,1);
            mediump vec3 position = vec3(tmpPosition[0], tmpPosition[1], tmpPosition[2]);

            gl_Position = u_pvmMatrix * vec4(a_vertexPosition,1);

            mediump vec3 N = norm;
            mediump vec3 V = normalize(eyePosition - position);
            mediump vec3 L = normalize(vec3(-2,-2,3) - position);
            mediump vec3 H = normalize(L + V);

            mediump float diffuseCo = dot(N, L);
            mediump float specularCo = pow(dot(N, H), 40.0);

            mediump vec3 ambient = vec3(0.2,0.2,0.2);
            mediump vec3 specular = vec3(0.1,0.1,0.1);

            mediump float r = ambient[0] + max(0.0, diffuse[0] * diffuseCo) + max(0.0, specular[0] * specularCo);
            mediump float g = ambient[1] + max(0.0, diffuse[1] * diffuseCo) + max(0.0, specular[1] * specularCo);
            mediump float b = ambient[2] + max(0.0, diffuse[2] * diffuseCo) + max(0.0, specular[2] * specularCo);

            vColor = vec4(r, g, b, 1.0);

        }
    `;

    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec4 vColor;
        
        uniform float stuffType;
        
        void main() {
            gl_FragColor = vColor;
        }
    `;

    try {
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            // gl.deleteShader(vShader);
        } else if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            // gl.deleteShader(fShader);
        } else { // no compile errors

            shaderProgram = gl.createProgram(); // create the single shader program

            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                //ToDo

                shaderProgram.a_vertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition");
                gl.enableVertexAttribArray(shaderProgram.a_vertexPosition);

                shaderProgram.norm = gl.getAttribLocation(shaderProgram, "norm");
                gl.enableVertexAttribArray(shaderProgram.norm);

                shaderProgram.u_pvmMatrix = gl.getUniformLocation(shaderProgram, "u_pvmMatrix");
                gl.enableVertexAttribArray(shaderProgram.u_pvmMatrix);

                shaderProgram.eye = gl.getUniformLocation(shaderProgram, "eyePosition");
                gl.enableVertexAttribArray(shaderProgram.eye);

                shaderProgram.tMatrix = gl.getUniformLocation(shaderProgram, "tMatrix");
                gl.enableVertexAttribArray(shaderProgram.tMatrix);

                shaderProgram.stuffType = gl.getUniformLocation(shaderProgram, "stuffType");
                gl.enableVertexAttribArray(shaderProgram.stuffType);

                shaderProgram.diffuse = gl.getUniformLocation(shaderProgram, "diffuse");
                gl.enableVertexAttribArray(shaderProgram.diffuse);

            } // end if no shader program link errors
        } // end if no compile errors
    } catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders



function setupCubeBuffer() {

    var cubeCoords = new Float32Array([
        // up
        0.1, 0.1, 0.1,    // 0
        0.1, -0.1, 0.1,   // 1
        -0.1, 0.1, 0.1,   // 2
        -0.1, -0.1, 0.1,  // 3

        // bottom
        0.1, 0.1, -0.1,    // 4
        0.1, -0.1, -0.1,   // 5
        -0.1, 0.1, -0.1,   // 6
        -0.1, -0.1, -0.1,  // 7

        // left
        -0.1, 0.1, 0.1,    // 8
        -0.1, 0.1, -0.1,   // 9
        -0.1, -0.1, 0.1,   // 10
        -0.1, -0.1, -0.1,   // 11

        // right
        0.1, 0.1, 0.1,    // 12
        0.1, 0.1, -0.1,   // 13
        0.1, -0.1, 0.1,   // 14
        0.1, -0.1, -0.1,   // 15

        // front
        0.1, 0.1, 0.1,    // 16
        0.1, 0.1, -0.1,   // 17
        -0.1, 0.1, 0.1,   // 18
        -0.1, 0.1, -0.1,   // 19

        // behind
        0.1, -0.1, 0.1,    // 20
        0.1, -0.1, -0.1,   // 21
        -0.1, -0.1, 0.1,   // 22
        -0.1, -0.1, -0.1   // 23
    ]);

    var norms = new Float32Array([
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,

        0,0,-1,
        0,0,-1,
        0,0,-1,
        0,0,-1,

        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0,
        
        1,0,0,
        1,0,0,
        1,0,0,
        1,0,0,

        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,

        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0,
    ]);

    var indices = new Uint8Array([
        0,3,1,
        0,3,2,

        4,7,5,
        4,7,6,

        8,11,9,
        8,11,10,

        12,15,13,
        12,15,14,

        16,19,17,
        16,19,18,

        20,23,21,
        20,23,22
    ]);

    // create buffer
    VertexBuffer = gl.createBuffer();
    NormBuffer = gl.createBuffer();
    CubeBuffer = gl.createBuffer();
    cubeVerticesColorBuffer = gl.createBuffer();

    // send cube coords to WebGL
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeCoords), gl.STATIC_DRAW); // coords to that buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, NormBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW); // coords to that buffer

    // send coords indices to WebGL
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CubeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

}

function drawOneCube(tMatrix, stuffType, diffuseColor) {

    // define perspective matrix
    var pMatrix = mat4.create();
    mat4.perspective(pMatrix, Math.PI/2, 1, 1, 100.0);

    // define viewing matrix
    var vMatrix = mat4.create();
    mat4.lookAt(vMatrix, eyePosition, Center, viewUp);

    // define model matrix
    var mMatrix = mat4.create();
    mat4.multiply(mMatrix, mMatrix, tMatrix);

    // caculate pvmMatrix
    var pvmMatrix = mat4.create();
    mat4.multiply(pvmMatrix, pMatrix, vMatrix);
    mat4.multiply(pvmMatrix, pvmMatrix, mMatrix);

    gl.uniformMatrix4fv(shaderProgram.u_pvmMatrix, false, pvmMatrix);
    gl.uniformMatrix4fv(shaderProgram.tMatrix, false, tMatrix);
    gl.uniform1f(shaderProgram.stuffType,  stuffType);
    gl.uniform3fv(shaderProgram.eye, eyePosition);
    gl.uniform3fv(shaderProgram.diffuse, diffuseColor);

    // -------------------
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer); // activate
    gl.vertexAttribPointer(shaderProgram.a_vertexPosition, 3, gl.FLOAT, false, 0, 0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER, NormBuffer); // activate
    gl.vertexAttribPointer(shaderProgram.norm, 3, gl.FLOAT, false, 0, 0); // feed

    // index buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CubeBuffer); // activate
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // render


}

function main() {

    setupWebGL(); // set up the webGL environment
    setupShaders(); // setup the webGL shaders
    setupCubeBuffer();
    gameStart();
    document.onkeypress = handleKeyDown;

}