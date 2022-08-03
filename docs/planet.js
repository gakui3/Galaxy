import * as THREE from "three";
import { MeshLine, MeshLineMaterial } from "three.meshline";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

class Planet {
  gm = 132712752000;

  constructor (params) {
    this.params = params;
    this.isReady = false;
    this.pos = new THREE.Vector3(params.x, params.y, params.z);
    this.velocity = new THREE.Vector3(params.vx, params.vy, params.vz);

    // const geom = new THREE.SphereGeometry(1, 20, 20);
    // this.planet = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());

    const texture = new THREE.TextureLoader().load(params.texturePath);
    const fbxLoader = new FBXLoader();

    fbxLoader.load(params.modelPath, (obj) => {
      const mat = new THREE.MeshPhongMaterial({ map: texture });
      mat.skinning = true;

      obj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          child.material = mat;
        }
      });
      const scale = 0.01 * params.scaleRate;
      obj.scale.set(scale, scale, scale);
      this.planet = obj.clone();
      window.scene.add(this.planet);
      this.isReady = true;
    });

    this.name = params.name;
    this.mass = params.mass;
    this.lineMesh = new THREE.Object3D();
    this.timer = 0;
    this.isCalculate = params.isCalculate;

    this.points = [];

    this.lineMaterial = new MeshLineMaterial({
      useMap: false,
      color: params.lineColor,
      opacity: 1,
      resolution: new THREE.Vector2(window.canvas.clientWidth, window.canvas.clientHeight),
      sizeAttenuation: false,
      lineWidth: 10,
    });
  }

  fv (p, n) {
    const n3 = n ** 3;
    return -1 * this.gm * p / n3;
  }

  fx (v) {
    return v;
  }

  runge_kutta (dt, p, v, n) {
    const kv1 = dt * this.fv(p, n);
    const kx1 = dt * this.fx(v);

    const kv2 = dt * this.fv(p + kx1 * 0.5, n);
    const kx2 = dt * this.fx(v + kv1 * 0.5);

    const kv3 = dt * this.fv(p + kx2 * 0.5, n);
    const kx3 = dt * this.fx(v + kv2 * 0.5);

    const kv4 = dt * this.fv(p + kx3, n);
    const kx4 = dt * this.fx(v + kv3);

    const nv = v + (1 / 6) * (kv1 + 2 * kv2 + 2 * kv3 + kv4);
    const nx = p + (1 / 6) * (kx1 + 2 * kx2 + 2 * kx3 + kx4);
    return [nx, nv];
  }

  displayParams () {
    const canvas = window.renderer.domElement;
    const worldPosition = this.planet.getWorldPosition(new THREE.Vector3());
    // const projection = worldPosition.project(camera);
    const viewPosition = worldPosition.applyMatrix4(window.camera.matrixWorldInverse);
    viewPosition.add(new THREE.Vector3(0.58 * this.params.scaleRate, 0.5, 0));
    const projection = viewPosition.applyMatrix4(window.camera.projectionMatrix);
    const sx = (canvas.clientWidth / 2) * (projection.x + 1.0);
    const sy = (canvas.clientHeight / 2) * (-projection.y + 1.0);
    const parent = document.getElementById(this.name);
    if (viewPosition.z > 1) {
      parent.innerHTML = " ";
      return;
    }
    parent.innerHTML = `${this.name}:  ${Math.round(sx)}, ${Math.round(sy)}<br>mass: ${this.mass}`;
    parent.style.transform = `translate(${sx}px, ${sy}px)`;
  }

  update (dt) {
    if (!this.isReady) { return; }

    if (!this.isCalculate) {
      this.displayParams();
      return;
    }

    let p = this.pos.clone();
    const norm = p.length();
    const xs = this.runge_kutta(dt, p.x, this.velocity.x, norm);
    const ys = this.runge_kutta(dt, p.y, this.velocity.y, norm);
    const zs = this.runge_kutta(dt, p.z, this.velocity.z, norm);

    p = new THREE.Vector3(xs[0], ys[0], zs[0]);
    const v = new THREE.Vector3(xs[1], ys[1], zs[1]);
    this.pos = p;
    this.velocity = v;

    const _p = p.clone().multiplyScalar(0.00000005);
    this.planet.position.set(_p.x, _p.y, _p.z);

    this.displayParams();

    this.timer += 0.05;
    if (this.timer > 0.5) {
      this.points.unshift(_p);
      if (this.points.length > 200) {
        this.points.pop();
      }
      window.scene.remove(this.lineMesh);

      const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
      const line = new MeshLine();
      line.setGeometry(geometry, p => 1.0 - p);
      this.lineMesh = new THREE.Mesh(line, this.lineMaterial);
      window.scene.add(this.lineMesh);
      this.timer = 0;
    }
  }
}

export default Planet;
