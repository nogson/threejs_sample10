(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var myVert = require('./../shader/sample.vert');
var myFrag = require('./../shader/sample.frag');

var notWebGL = function notWebGL() {
    // webGL非対応時の記述
    console.log('this browser does not support webGL');
};

if (document.getElementsByTagName('html')[0].classList.contains('no-webgl')) {
    notWebGL();
}

// three.jsのとき
try {
    var renderer = new THREE.WebGLRenderer();
} catch (e) {
    notWebGL();
}

// 返ってくる値を確認してみましょう！
console.log(ubu.detect);
// IEの時
if (ubu.detect.browser.ie) {
    console.log('IEさん、動画テクスチャはちょっと…無理ですね…');
}

window.onload = function () {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var aspect = windowWidth / windowHeight;

    var clock = new THREE.Clock();
    var time = 0.0;

    // rendererの作成
    var renderer = new THREE.WebGLRenderer();
    // canvasをbodyに追加
    document.body.appendChild(renderer.domElement);

    // canvasをリサイズ（学習用なのでリサイズイベント登録は省略）
    renderer.setSize(windowWidth, windowHeight);

    // scene作成
    var scene = new THREE.Scene();
    // camera作成
    var camera = new THREE.PerspectiveCamera(80, windowWidth / windowHeight, 0.1, 10);
    camera.position.z = 1;

    var video = document.createElement('video');
    video.src = "movie/mv.mp4";
    video.load();
    video.play();

    var uniforms = {
        'uTex': {
            type: 't',
            value: new THREE.VideoTexture(video)
        },
        'uTime': {
            type: 'f',
            value: time
        },
        'uResolution': {
            type: 'v2',
            value: new THREE.Vector2(windowWidth, windowHeight)
        }
    };

    //Geometryを作成
    var geometry = new THREE.BufferGeometry();

    //頂点座標
    var vertices = new Float32Array([-1.0 * aspect, 1.0, 0.0, 1.0 * aspect, 1.0, 0.0, -1.0 * aspect, -1.0, 0.0, 1.0 * aspect, -1.0, 0.0]);

    //頂点インデックス
    var index = new Uint32Array([0, 2, 1, 1, 2, 3]);

    var uvs = new Float32Array([0.0, 1.0, //1つ目の頂点のUV座標
    1.0, 1.0, //2つ目の頂点のUV座標
    0.0, 0.0, //3つ目の頂点のUV座標
    1.0, 0.0 //4つ目の頂点のUV座標
    ]);

    //頂点座標
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    //テクスチャ座標
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    //頂点のつなげ順
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    //マテリアルを設定。シェーダーファイルや、uniform変数を指定
    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: myVert,
        fragmentShader: myFrag
    });

    var mesh = new THREE.Mesh(geometry, material);

    // Meshをシーンに追加
    scene.add(mesh);
    render();

    function render() {
        material.uniforms.uTex.value.needsUpdate = true;

        time = clock.getElapsedTime();
        material.uniforms.uTime.value = time;

        // draw
        renderer.render(scene, camera);

        window.requestAnimationFrame(render);
    }
};

},{"./../shader/sample.frag":2,"./../shader/sample.vert":3}],2:[function(require,module,exports){
module.exports = "precision mediump float;\nvarying vec2 vUv;\nuniform sampler2D uTex;\nuniform float uTime;\nuniform vec2 uResolution;\n\nfloat rnd(vec2 n){\n    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nvoid main(){\n  \n  vec2 p = (gl_FragCoord.st*2.0 - uResolution)/min(uResolution.x,uResolution.y);\n\n  float c = length(p);\n\n  vec4 dest = texture2D(uTex, vUv); \n\n  float vignette = 1.9 - length(p);\n\n\n  float noise = rnd(gl_FragCoord.st + mod(uTime, 10.0));\n\n  float scanLineY = abs(sin(p.y * 200.0 + uTime * 5.0)) * 0.5 + 0.9;\n  float scanLineX = cos(scanLineY + uTime* 5.0) /2.0;\n\n  dest *= vignette * scanLineY;\n\n  if((dest.r + dest.g + dest.b)/3.0 < 0.7){\n    dest.r =  dest.g = dest.b = 0.0;\n  }else{\n     dest.r = abs(dest.r * tan(uTime));\n     dest.g = abs(1.0 - dest.r);\n     dest.b = abs(2.0 - dest.r - dest.g);\n  }\n\n  gl_FragColor = vec4(vec3(dest.r,dest.g,dest.b),1.0);\n}\n";

},{}],3:[function(require,module,exports){
module.exports = "varying vec2 vUv;\n\nvoid main() {\n  //uv => テクスチャを貼るためのUV座標\n  vUv = uv;\n  //projectionMatrix => カメラの各種パラメータから３次元を２次元に射影し、クリップ座標系に変換する行列\n  //modelViewMatrix => modelMatrix(オブジェクト座標からワールド座標へ変換する行列)とviewMatrix(ワールド座標から視点座標へ変換する行列)の積算\n  //position => 頂点座標\n  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n";

},{}]},{},[1]);
