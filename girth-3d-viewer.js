import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { circumferenceAnnotationMap } from "./circumference-annotations.js";

const MODEL_URL = "./models/B222.obj";
const VIEW_ORDER = ["front", "right", "back", "left"];
const VIEW_ROTATIONS = {
  front: 0,
  right: -Math.PI / 2,
  back: Math.PI,
  left: Math.PI / 2,
};
const FIXED_POLAR_ANGLE = Math.PI / 2 - 0.06;
const GIRTH_COLORS = {
  idle: 0xa9d6f2,
  active: 0x8fd4ff,
};
const PRIMARY_GIRTH_DISTANCE_SCALE = 0.92;
const GIRTH_TUBE_RADIUS = {
  idle: 0.0075,
  active: 0.0095,
};

const viewers = new Map();

function normalizedAngle(angle) {
  let next = angle;
  while (next > Math.PI) next -= Math.PI * 2;
  while (next < -Math.PI) next += Math.PI * 2;
  return next;
}

function shortestAngle(from, to) {
  let delta = normalizedAngle(to) - normalizedAngle(from);
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function convexHull(points) {
  if (points.length <= 3) return points.slice();
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const cross = (origin, a, b) => (a.x - origin.x) * (b.z - origin.z) - (a.z - origin.z) * (b.x - origin.x);
  const lower = [];
  sorted.forEach((point) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function chaikin(points, passes = 2) {
  let next = points.slice();
  for (let pass = 0; pass < passes; pass += 1) {
    const smoothed = [];
    for (let index = 0; index < next.length; index += 1) {
      const current = next[index];
      const following = next[(index + 1) % next.length];
      smoothed.push(
        {
          x: current.x * 0.75 + following.x * 0.25,
          z: current.z * 0.75 + following.z * 0.25,
        },
        {
          x: current.x * 0.25 + following.x * 0.75,
          z: current.z * 0.25 + following.z * 0.75,
        }
      );
    }
    next = smoothed;
  }
  return next;
}

function ellipseFallback(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  points.forEach((point) => {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.z < minZ) minZ = point.z;
    if (point.z > maxZ) maxZ = point.z;
  });
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const radiusX = Math.max((maxX - minX) / 2, 0.001);
  const radiusZ = Math.max((maxZ - minZ) / 2, 0.001);
  return Array.from({ length: 32 }, (_, index) => {
    const angle = (index / 32) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      z: centerZ + Math.sin(angle) * radiusZ,
    };
  });
}

function ellipseFromRegion(points, region, halfX, halfZ) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  points.forEach((point) => {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.z < minZ) minZ = point.z;
    if (point.z > maxZ) maxZ = point.z;
  });

  const regionMinX = (region?.x?.[0] ?? -1) * halfX;
  const regionMaxX = (region?.x?.[1] ?? 1) * halfX;
  const regionMinZ = (region?.z?.[0] ?? -1) * halfZ;
  const regionMaxZ = (region?.z?.[1] ?? 1) * halfZ;

  const centerX = Number.isFinite(minX) && Number.isFinite(maxX)
    ? (minX + maxX) / 2
    : (regionMinX + regionMaxX) / 2;
  const centerZ = Number.isFinite(minZ) && Number.isFinite(maxZ)
    ? (minZ + maxZ) / 2
    : (regionMinZ + regionMaxZ) / 2;
  const candidateRadiusX = Number.isFinite(minX) && Number.isFinite(maxX) ? (maxX - minX) / 2 : 0;
  const candidateRadiusZ = Number.isFinite(minZ) && Number.isFinite(maxZ) ? (maxZ - minZ) / 2 : 0;
  const regionRadiusX = Math.abs(regionMaxX - regionMinX) / 2;
  const regionRadiusZ = Math.abs(regionMaxZ - regionMinZ) / 2;
  const radiusX = Math.max(candidateRadiusX, regionRadiusX * 0.34, 0.001);
  const radiusZ = Math.max(candidateRadiusZ, regionRadiusZ * 0.24, 0.001);

  return Array.from({ length: 40 }, (_, index) => {
    const angle = (index / 40) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      z: centerZ + Math.sin(angle) * radiusZ,
    };
  });
}

function dedupePoints(points) {
  const seen = new Set();
  const result = [];
  points.forEach((point) => {
    const key = `${point.x.toFixed(4)}:${point.z.toFixed(4)}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(point);
  });
  return result;
}

class GirthViewer3D {
  constructor(stage) {
    this.stage = stage;
    this.canvasHost = stage.querySelector("[data-girth-3d-canvas]");
    this.isCompareStage = stage.classList.contains("model-stage--compare");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.touchAction = "none";
    this.canvasHost.appendChild(this.renderer.domElement);

    this.overlay = document.createElement("div");
    this.overlay.className = "girth-annotation-layer";
    this.overlay.style.pointerEvents = "none";
    this.overlayLabels = document.createElement("div");
    this.overlayLabels.className = "girth-annotation-labels";
    this.overlayLabels.style.pointerEvents = "none";
    this.overlay.append(this.overlayLabels);
    this.stage.appendChild(this.overlay);
    this.stage.style.touchAction = "none";

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.72;
    this.controls.zoomSpeed = 0.85;
    this.controls.minPolarAngle = FIXED_POLAR_ANGLE;
    this.controls.maxPolarAngle = FIXED_POLAR_ANGLE;
    this.controls.target.set(0, 0, 0);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.ringGroup = new THREE.Group();
    this.root.add(this.ringGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 1.45);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xd9e4ff, 1.25);
    key.position.set(2.6, 3.4, 3.2);
    this.scene.add(key);

    const backKey = new THREE.DirectionalLight(0xd9e4ff, 1.05);
    backKey.position.set(-2.6, 3.3, -3.2);
    this.scene.add(backKey);

    const fill = new THREE.DirectionalLight(0x8eb6ff, 0.52);
    fill.position.set(-2.2, 1.5, 2.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.42);
    rim.position.set(0, 2.2, -3.2);
    this.scene.add(rim);

    this.loader = new OBJLoader();
    this.raycaster = new THREE.Raycaster();
    this.model = null;
    this.modelBounds = null;
    this.modelSize = new THREE.Vector3(1, 2.8, 1);
    this.modelPoints = [];
    this.baseDistance = 4.8;
    this.targetY = 0;
    this.currentView = "front";
    this.currentOrbitAngle = VIEW_ROTATIONS.front;
    this.targetOrbitAngle = VIEW_ROTATIONS.front;
    this.isViewAnimating = false;
    this.pendingViewRequest = null;
    this.rings = new Map();
    this.annotationState = {
      selectedId: null,
      visibleIds: [],
      values: {},
      forceFrontAll: false,
    };
    this.swipePointerId = null;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.swipeTriggered = false;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    window.addEventListener("resize", this.handleResize);
    this.stage.addEventListener("pointerdown", this.handlePointerDown);
    this.stage.addEventListener("pointermove", this.handlePointerMove);
    this.stage.addEventListener("pointerup", this.handlePointerUp);
    this.stage.addEventListener("pointercancel", this.handlePointerUp);
    this.stage.addEventListener("pointerleave", this.handlePointerUp);
    this.handleResize();
    this.loadModel();
    this.animate();
  }

  loadModel() {
    this.loader.load(
      MODEL_URL,
      (object) => {
        const material = new THREE.MeshStandardMaterial({
          color: 0xdcebff,
          emissive: 0xb9d4ff,
          emissiveIntensity: 0.08,
          roughness: 0.82,
          metalness: 0.04,
          side: THREE.DoubleSide,
        });

        object.traverse((child) => {
          if (!child.isMesh) return;
          child.material = material;
          child.castShadow = false;
          child.receiveShadow = false;
          if (child.geometry && !child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
        });

        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.4 / maxDim;
        object.scale.setScalar(scale);

        box.setFromObject(object);
        box.getCenter(center);
        object.position.sub(center);
        if (this.isCompareStage) {
          // In compare mode, anchor the model closer to the scan ring so the feet
          // visually sit on top of it instead of floating in the middle of the frame.
          object.position.y -= size.y * scale * 0.165;
        }
        object.updateMatrixWorld(true);

        box.setFromObject(object);
        const scaledSize = box.getSize(new THREE.Vector3());
        this.modelBounds = box.clone();
        this.modelSize.copy(scaledSize);
        this.modelPoints = this.captureModelPoints(object);
        this.targetY = 0;
        this.updateFraming();

        if (this.model) this.root.remove(this.model);
        this.model = object;
        this.root.add(object);
        this.buildRings();

        if (this.pendingViewRequest) {
          const pending = this.pendingViewRequest;
          this.pendingViewRequest = null;
          this.setView(pending.view, pending);
        } else {
          this.setView(this.currentView, { instant: true });
        }
        this.refreshAnnotations();
      },
      undefined,
      () => {
        this.canvasHost.dataset.modelError = "true";
      }
    );
  }

  captureModelPoints(object) {
    const points = [];
    object.updateMatrixWorld(true);
    object.traverse((child) => {
      if (!child.isMesh) return;
      const positions = child.geometry?.attributes?.position;
      if (!positions) return;
      for (let index = 0; index < positions.count; index += 1) {
        points.push(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld));
      }
    });
    return points;
  }

  updateFraming() {
    const aspect = this.camera.aspect || 1;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const verticalFit = (this.modelSize.y * 0.5) / Math.tan(fov * 0.5);
    const horizontalFit = (this.modelSize.x * 0.5) / (Math.tan(fov * 0.5) * aspect);
    const depthPadding = this.modelSize.z * 0.45;
    this.baseDistance = Math.max(verticalFit, horizontalFit) * 1.16 + depthPadding;
    this.baseDistance *= PRIMARY_GIRTH_DISTANCE_SCALE;
    if (this.isCompareStage) this.baseDistance *= 1.25;
    this.controls.minDistance = this.baseDistance * 0.68;
    this.controls.maxDistance = this.baseDistance;
  }

  setView(view, options = {}) {
    const { instant = false, previousView = null } = options;
    this.currentView = VIEW_ORDER.includes(view) ? view : "front";
    if (!this.model) {
      this.pendingViewRequest = { view: this.currentView, instant, previousView };
      return;
    }

    const nextAngle = VIEW_ROTATIONS[this.currentView];

    if (instant) {
      this.currentOrbitAngle = nextAngle;
      this.targetOrbitAngle = nextAngle;
      this.applyOrbitPosition(this.currentOrbitAngle);
      this.controls.target.set(0, this.targetY, 0);
      this.isViewAnimating = false;
      this.refreshAnnotations();
      return;
    }

    if (previousView && VIEW_ROTATIONS[previousView] !== undefined) {
      this.currentOrbitAngle = VIEW_ROTATIONS[previousView];
      this.applyOrbitPosition(this.currentOrbitAngle);
    }

    const delta = shortestAngle(this.currentOrbitAngle, nextAngle);
    this.targetOrbitAngle = this.currentOrbitAngle + delta;
    this.controls.target.set(0, this.targetY, 0);
    this.isViewAnimating = true;
    this.refreshAnnotations();
  }

  handleResize() {
    const width = this.canvasHost.clientWidth || this.stage.clientWidth || 1;
    const height = this.canvasHost.clientHeight || this.stage.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this.model) {
      this.updateFraming();
      this.setView(this.currentView, { instant: true });
    }
  }

  handlePointerDown(event) {
    if (event.button !== 0 || this.isViewAnimating) return;
    this.swipePointerId = event.pointerId;
    this.swipeStartX = event.clientX;
    this.swipeStartY = event.clientY;
    this.swipeTriggered = false;
  }

  handlePointerMove(event) {
    if (event.pointerId !== this.swipePointerId || this.swipeTriggered || this.isViewAnimating) return;
    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = event.clientY - this.swipeStartY;
    if (Math.abs(deltaX) < 28 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    this.swipeTriggered = true;
    window.dispatchEvent(new CustomEvent("girth-view-swipe", { detail: { step: deltaX < 0 ? -1 : 1 } }));
  }

  handlePointerUp(event) {
    if (event.pointerId !== this.swipePointerId) return;
    const movedDistance = Math.hypot(event.clientX - this.swipeStartX, event.clientY - this.swipeStartY);
    if (!this.swipeTriggered && movedDistance < 8) {
      this.pickRing(event);
    }
    this.swipePointerId = null;
    this.swipeTriggered = false;
  }

  pickRing(event) {
    if (!this.rings.size) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    const targets = [];
    this.rings.forEach((entry) => {
      if (entry.group.visible) {
        targets.push(entry.baseMesh, entry.activeMesh);
      }
    });
    const intersections = this.raycaster.intersectObjects(targets, false);
    const annotationId = intersections[0]?.object?.userData?.annotationId;
    if (!annotationId) return;
    window.dispatchEvent(new CustomEvent("girth-annotation-select", { detail: { id: annotationId } }));
  }

  setAnnotations(state = {}) {
    this.annotationState = {
      selectedId: state.selectedId || null,
      visibleIds: Array.isArray(state.visibleIds) ? state.visibleIds : [],
      values: state.values || {},
      forceFrontAll: Boolean(state.forceFrontAll),
    };
    this.refreshAnnotations();
  }

  buildRings() {
    this.rings.forEach((entry) => {
      [entry.baseMesh, entry.activeMesh].forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    });
    this.rings.clear();
    this.ringGroup.clear();
    if (!this.modelBounds || !this.modelPoints.length) return;

    Object.values(circumferenceAnnotationMap).forEach((annotation) => {
      const ring = this.createRingEntry(annotation);
      if (!ring) return;
      this.rings.set(annotation.id, ring);
      this.ringGroup.add(ring.group);
    });
  }

  createRingEntry(annotation) {
    const ringPoints = this.computeRingPoints(annotation);
    if (!ringPoints?.length) return null;

    const curve = new THREE.CatmullRomCurve3(ringPoints, true, "catmullrom", 0.12);
    const tubularSegments = Math.max(96, ringPoints.length * 3);
    const radialSegments = 10;
    const createMesh = (color, radius) => {
      const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, true);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: color === GIRTH_COLORS.active ? 0.9 : 0.76,
          depthTest: true,
          depthWrite: true,
        })
      );
      mesh.userData.annotationId = annotation.id;
      return mesh;
    };

    const baseMesh = createMesh(GIRTH_COLORS.idle, GIRTH_TUBE_RADIUS.idle);
    const activeMesh = createMesh(GIRTH_COLORS.active, GIRTH_TUBE_RADIUS.active);
    activeMesh.visible = false;

    const group = new THREE.Group();
    group.add(baseMesh, activeMesh);

    return {
      annotation,
      group,
      baseMesh,
      activeMesh,
      points: ringPoints,
    };
  }

  computeRingPoints(annotation) {
    const config = annotation.girth3d;
    if (!config || !this.modelBounds) return null;
    const halfX = this.modelSize.x * 0.5;
    const halfZ = this.modelSize.z * 0.5;
    const y = this.modelBounds.min.y + this.modelSize.y * config.plane.offset;
    const thickness = Math.max(this.modelSize.y * config.plane.thickness, 0.01);

    const collectPoints = (bandThickness) => {
      const matches = [];
      this.modelPoints.forEach((point) => {
        if (Math.abs(point.y - y) > bandThickness) return;
        if (!this.matchesRegion(point, config.region, halfX, halfZ)) return;
        matches.push({ x: point.x, z: point.z });
      });
      return matches;
    };

    let candidates = collectPoints(thickness);
    if (candidates.length < 24) candidates = collectPoints(thickness * 1.6);
    if (candidates.length < 16) candidates = collectPoints(thickness * 2.2);
    if (candidates.length < 8) return null;

    const deduped = dedupePoints(candidates);
    let hull;
    if (config.loopMode === "ellipse") {
      hull = ellipseFromRegion(deduped, config.region, halfX, halfZ);
    } else {
      hull = convexHull(deduped);
      if (hull.length < 8) {
        hull = ellipseFallback(deduped);
      }
    }
    let smoothed = chaikin(hull, 2);
    if (smoothed.length > 80) {
      smoothed = smoothed.filter((_, index) => index % 2 === 0);
    }

    const centerX = smoothed.reduce((sum, point) => sum + point.x, 0) / smoothed.length;
    const centerZ = smoothed.reduce((sum, point) => sum + point.z, 0) / smoothed.length;
    const padding = Math.max(config.padding * Math.max(this.modelSize.x, this.modelSize.z), 0.002);

    return smoothed.map((point) => {
      const radial = new THREE.Vector2(point.x - centerX, point.z - centerZ);
      if (radial.lengthSq() > 0) radial.setLength(radial.length() + padding);
      return new THREE.Vector3(centerX + radial.x, y, centerZ + radial.y);
    });
  }

  matchesRegion(point, region, halfX, halfZ) {
    if (!region) return true;
    const [minX, maxX] = region.x || [-1, 1];
    const [minZ, maxZ] = region.z || [-1, 1];
    return (
      point.x >= minX * halfX &&
      point.x <= maxX * halfX &&
      point.z >= minZ * halfZ &&
      point.z <= maxZ * halfZ
    );
  }

  getVisibleRingIds() {
    return this.annotationState.visibleIds.filter((id) => Boolean(circumferenceAnnotationMap[id]));
  }

  refreshAnnotations() {
    this.updateRingStates();
    this.renderSelectedLabel();
  }

  updateRingStates() {
    const visibleIds = new Set(this.getVisibleRingIds());
    const selectedId = this.annotationState.selectedId;
    this.rings.forEach((entry, id) => {
      const visible = visibleIds.has(id);
      const active = visible && selectedId === id;
      entry.group.visible = visible;
      entry.baseMesh.visible = visible && !active;
      entry.activeMesh.visible = active;
    });
  }

  renderSelectedLabel() {
    this.overlayLabels.innerHTML = "";
    if (this.isCompareStage) return;
    const selectedId = this.annotationState.selectedId;
    if (!selectedId) return;
    const ring = this.rings.get(selectedId);
    if (!ring?.group.visible) return;

    const anchor = this.projectLabelAnchor(ring);
    if (!anchor) return;
    const value = this.annotationState.values[selectedId] ?? ring.annotation.value;
    const label = document.createElement("span");
    label.className = `girth-annotation-label is-active girth-annotation-label--${anchor.align}`;
    label.style.left = `${anchor.x}px`;
    label.style.top = `${anchor.y}px`;
    label.innerHTML = `<b>${ring.annotation.name}</b><em>${Number(value).toFixed(1)} ${ring.annotation.unit}</em>`;
    this.overlayLabels.appendChild(label);
  }

  projectLabelAnchor(ring) {
    const width = this.stage.clientWidth || this.canvasHost.clientWidth || 1;
    const height = this.stage.clientHeight || this.canvasHost.clientHeight || 1;
    const anchorPreference = ring.annotation.girth3d?.label?.anchor || "right";
    const projected = ring.points
      .map((point) => {
        const world = this.root.localToWorld(point.clone());
        const ndc = world.clone().project(this.camera);
        return {
          x: (ndc.x * 0.5 + 0.5) * width,
          y: (-ndc.y * 0.5 + 0.5) * height,
          z: ndc.z,
        };
      })
      .filter((point) => point.z > -1 && point.z < 1);

    if (!projected.length) return null;

    const target = anchorPreference === "left"
      ? projected.reduce((best, point) => (point.x < best.x ? point : best))
      : projected.reduce((best, point) => (point.x > best.x ? point : best));

    return {
      x: THREE.MathUtils.clamp(target.x, 16, width - 16),
      y: THREE.MathUtils.clamp(target.y, 18, height - 18),
      align: anchorPreference === "left" ? "right" : "left",
    };
  }

  applyOrbitPosition(angle) {
    const distance = this.baseDistance;
    const horizontalDistance = Math.sin(FIXED_POLAR_ANGLE) * distance;
    const y = Math.cos(FIXED_POLAR_ANGLE) * distance + this.targetY;
    this.camera.position.set(
      Math.sin(angle) * horizontalDistance,
      y,
      Math.cos(angle) * horizontalDistance
    );
    this.camera.lookAt(0, this.targetY, 0);
    this.controls.update();
  }

  animate() {
    if (!this.renderer) return;
    this.raf = window.requestAnimationFrame(() => this.animate());
    if (this.isViewAnimating) {
      this.controls.enabled = false;
      this.currentOrbitAngle += shortestAngle(this.currentOrbitAngle, this.targetOrbitAngle) * 0.14;
      this.applyOrbitPosition(this.currentOrbitAngle);
      if (Math.abs(shortestAngle(this.currentOrbitAngle, this.targetOrbitAngle)) < 0.01) {
        this.currentOrbitAngle = this.targetOrbitAngle;
        this.applyOrbitPosition(this.currentOrbitAngle);
        this.isViewAnimating = false;
        this.controls.enabled = true;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (!this.isCompareStage) this.renderSelectedLabel();
  }

  dispose() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.handleResize);
    this.stage.removeEventListener("pointerdown", this.handlePointerDown);
    this.stage.removeEventListener("pointermove", this.handlePointerMove);
    this.stage.removeEventListener("pointerup", this.handlePointerUp);
    this.stage.removeEventListener("pointercancel", this.handlePointerUp);
    this.stage.removeEventListener("pointerleave", this.handlePointerUp);
    this.rings.forEach((entry) => {
      [entry.baseMesh, entry.activeMesh].forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    });
    this.controls.dispose();
    this.renderer.dispose();
    this.canvasHost.innerHTML = "";
  }
}

window.syncGirthModelViewers = function syncGirthModelViewers(view) {
  let nextView = view;
  let previousView = null;
  let annotationState = null;
  if (typeof view === "object" && view !== null) {
    nextView = view.view;
    previousView = view.previousView || null;
    annotationState = view.annotations || null;
  }

  const stages = Array.from(document.querySelectorAll("[data-girth-3d-stage]"));
  for (const [stage, viewer] of viewers.entries()) {
    if (!stages.includes(stage)) {
      viewer.dispose();
      viewers.delete(stage);
    }
  }

  stages.forEach((stage) => {
    if (!viewers.has(stage)) {
      viewers.set(stage, new GirthViewer3D(stage));
    }
    const viewer = viewers.get(stage);
    stage.dataset.view = nextView;
    stage.style.setProperty("--stage-rotation", ({
      front: "0deg",
      right: "90deg",
      back: "180deg",
      left: "-90deg",
    })[nextView] || "0deg");
    viewer?.setAnnotations(annotationState || {});
    viewer?.setView(nextView, { instant: !viewer?.model, previousView });
  });
};

window.requestAnimationFrame(() => {
  if (document.body.dataset.activeReport === "girth") {
    window.syncGirthModelViewers?.("front");
  }
});
