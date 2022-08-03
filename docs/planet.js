import * as THREE from "three";
import { MeshLine, MeshLineMaterial } from "three.meshline";

class Planet {
  constructor (params) {
    this.pos = new THREE.Vector3(params.x, params.y, params.z);
    this.velocity = new THREE.Vector3(params.vx, params.vy, params.vz);

    const geom = new THREE.SphereGeometry(1, 20, 20);
    this.mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
    this.name = params.name;
    this.mass = params.mass;
    this.lineMesh = new THREE.Object3D();
    this.timer = 0;

    this.points = [];

    this.lineMaterial = new MeshLineMaterial({
      useMap: false,
      color: new THREE.Color(1, 0, 0),
      opacity: 1,
      resolution: new THREE.Vector2(window.canvas.clientWidth, window.canvas.clientHeight),
      sizeAttenuation: false,
      lineWidth: 10,
    });
  }

  gm = 132712752000;

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

  update (dt, camera) {
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
    this.mesh.position.set(_p.x, _p.y, _p.z);

    const canvas = window.renderer.domElement;
    const worldPosition = this.mesh.getWorldPosition(new THREE.Vector3());
    // const projection = worldPosition.project(camera);
    const viewPosition = worldPosition.applyMatrix4(camera.matrixWorldInverse);
    viewPosition.add(new THREE.Vector3(1.5, 0.5, 0));
    const projection = viewPosition.applyMatrix4(camera.projectionMatrix);
    const sx = (canvas.clientWidth / 2) * (projection.x + 1.0);
    const sy = (canvas.clientHeight / 2) * (-projection.y + 1.0);

    this.timer += 0.03;
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

    const parent = document.getElementById(this.name);
    parent.innerHTML = `${this.name}:  ${Math.round(sx)}, ${Math.round(sy)}<br>mass: ${this.mass}`;
    parent.style.transform = `translate(${sx}px, ${sy}px)`;
  }
}

export default Planet;
