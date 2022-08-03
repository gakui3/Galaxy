import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import testVert from "./shaders/test.vert";
import testFrag from "./shaders/test.frag";
import Planet from "./planet.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { earth, mercury, mars, venus, jupiter, saturn, uranus, neptune, sun } from "./planetParams.js";

let canvas, renderer, scene, camera, gui, clock;
const planets = [];

const param = {
  value01: 1.0,
  value02: true,
  value03: 1.0,
  value04: "hoge01",
};

function init () {
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  window.renderer = renderer;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  clock.start();

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1, 100);
  directionalLight.position.set(-1, 4, -0.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0x404040, 5));
  directionalLight.shadow.mapSize.width = 4096; // default
  directionalLight.shadow.mapSize.height = 4096; // default
  directionalLight.shadow.camera.near = 0.05; // default
  directionalLight.shadow.camera.far = 100; // default
  directionalLight.shadow.camera.bottom = -15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;

  window.scene = scene;
  window.canvas = canvas;
}

function addCamera () {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
  camera.position.set(0, 0, -10);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  window.camera = camera;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
}

function addObject () {
  planets.push(new Planet(mercury));
  planets.push(new Planet(venus));
  planets.push(new Planet(earth));
  planets.push(new Planet(mars));
  planets.push(new Planet(jupiter));
  planets.push(new Planet(saturn));
  planets.push(new Planet(uranus));
  planets.push(new Planet(neptune));
  planets.push(new Planet(sun));

  // add sun
  // const texture = new THREE.TextureLoader().load("./assets/textures/Sun_1k.png");
  // const fbxLoader = new FBXLoader();

  // fbxLoader.load("./assets/3dmodels/Sun.fbx", (obj) => {
  //   const mat = new THREE.MeshPhongMaterial({ map: texture });
  //   mat.skinning = true;

  //   obj.traverse((child) => {
  //     if (child.isMesh) {
  //       child.castShadow = true;
  //       child.receiveShadow = true;

  //       child.material = mat;
  //     }
  //   });
  //   const scale = 0.01 * 3.0;
  //   obj.scale.set(scale, scale, scale);
  //   scene.add(obj);
  // });
}

function addGUI () {
  gui = new GUI();
  const folder = gui.addFolder("folder");
  gui.width = 300;

  folder.add(param, "value01").onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value02").onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value03", 0, 2.0).onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value04", ["hoge01", "hoge02"]).onChange((value) => {
    console.log(value);
  });
}

function update () {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const dt = clock.getDelta() * 100000;
  for (let i = 0; i < planets.length; i++) {
    planets[i].update(dt);
  }

  renderer.render(scene, camera);
}

function resizeRendererToDisplaySize (renderer) {
  const canvas = renderer.domElement;
  // const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  // console.log(width);

  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

(function () {
  init();
  addCamera();
  addObject();
  addGUI();
  update();
})();
