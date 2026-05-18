import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { postureAnnotations } from "./posture-annotations.js";

const MODEL_URL = "./models/skin.obj";
const VIEW_ORDER = ["front", "right", "back", "left"];
const VIEW_ROTATIONS = {
  front: 0,
  right: -Math.PI / 2,
  back: Math.PI,
  left: Math.PI / 2,
};
const FIXED_POLAR_ANGLE = Math.PI / 2 - 0.06;
const OVERLAY_COLORS = {
  normal: { hex: 0x4da8ff, css: "#4DA8FF" },
  abnormal: { hex: 0xff6b7a, css: "#FF6B7A" },
  midline: { hex: 0xffc857, css: "#FFC857" },
};
const POINT_RADII = {
  outer: 0.028,
  inner: 0.013,
};
const LINE_RADIUS = {
  solid: 0.009,
  dashed: 0.006,
  midline: 0.006,
};
const PLATFORM_BOTTOM_RATIO = -0.01;
const PLATFORM_HEIGHT_RATIO = 0.18;
const PLATFORM_MAX_HEIGHT = 116;
const PLATFORM_CENTER_X = 0.5;
const INACTIVE_OPACITY = {
  point: 0.28,
  line: 0.2,
  label: 0.42,
  pointInner: 0.46,
};

let viewer;

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

function averageVectors(points) {
  const sum = new THREE.Vector3();
  points.forEach((point) => sum.add(point));
  return sum.divideScalar(points.length || 1);
}

function annotationTone(annotation) {
  return annotation?.severity === "normal" ? "normal" : "abnormal";
}

class PostureViewer3D {
  constructor(stage) {
    this.stage = stage;
    this.canvasHost = stage.querySelector("[data-posture-3d-canvas]");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.selectionCamera = this.camera.clone();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvasHost.appendChild(this.renderer.domElement);

    this.annotationLayer = document.createElement("div");
    this.annotationLayer.className = "posture-annotation-layer";
    this.annotationLabels = document.createElement("div");
    this.annotationLabels.className = "posture-annotation-labels";
    this.annotationLayer.append(this.annotationLabels);
    this.stage.appendChild(this.annotationLayer);

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

    this.annotationGroup = new THREE.Group();
    this.root.add(this.annotationGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 1.45);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xd9e4ff, 1.25);
    key.position.set(2.6, 3.4, 3.2);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8eb6ff, 0.52);
    fill.position.set(-2.2, 1.5, 2.4);
    this.scene.add(fill);

    const backKey = new THREE.DirectionalLight(0xd9e4ff, 1.05);
    backKey.position.set(-2.6, 3.3, -3.2);
    this.scene.add(backKey);

    const rim = new THREE.DirectionalLight(0xffffff, 0.42);
    rim.position.set(0, 2.2, -3.2);
    this.scene.add(rim);

    this.loader = new OBJLoader();
    this.model = null;
    this.modelBounds = null;
    this.modelSize = new THREE.Vector3(1, 2.8, 1);
    this.modelPoints = [];
    this.footAnchor = new THREE.Vector3();
    this.headAnchor = new THREE.Vector3();
    this.baseDistance = 4.8;
    this.targetY = 0;
    this.currentView = "front";
    this.annotationState = {
      selectedId: null,
      visibleIds: [],
    };
    this.currentOrbitAngle = VIEW_ROTATIONS.front;
    this.targetOrbitAngle = VIEW_ROTATIONS.front;
    this.isViewAnimating = false;
    this.pendingViewRequest = null;
    this.summaryNodes = [];

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.loadModel();
    this.animate();
  }

  loadModel() {
    // 显示加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'model-loading';
    loadingDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#666;font-size:12px;z-index:10;';
    loadingDiv.textContent = '加载姿态模型...';
    this.stage.appendChild(loadingDiv);

    this.loader.load(
      MODEL_URL,
      (object) => {
        loadingDiv.remove();
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
        const scale = 2.6 / maxDim;
        object.scale.setScalar(scale);

        box.setFromObject(object);
        box.getCenter(center);
        object.position.sub(center);
        object.updateMatrixWorld(true);

        const centeredBox = new THREE.Box3().setFromObject(object);
        const centeredSize = centeredBox.getSize(new THREE.Vector3());
        const centeredPoints = this.captureModelPoints(object);
        const footAnchor = this.findFootAnchor(centeredPoints, centeredBox, centeredSize);
        object.position.x -= footAnchor.x;
        object.position.z -= footAnchor.z;
        object.updateMatrixWorld(true);

        box.setFromObject(object);
        this.modelBounds = box.clone();
        this.modelSize.copy(box.getSize(new THREE.Vector3()));
        this.modelPoints = this.captureModelPoints(object);
        this.footAnchor.copy(this.findFootAnchor(this.modelPoints, this.modelBounds, this.modelSize));
        this.headAnchor.copy(this.findHeadAnchor(this.modelPoints, this.modelBounds, this.modelSize));
        this.updateFraming();

        if (this.model) this.root.remove(this.model);
        this.model = object;
        this.root.add(object);
        this.root.remove(this.annotationGroup);
        this.root.add(this.annotationGroup);

        if (this.pendingViewRequest) {
          const pending = this.pendingViewRequest;
          this.pendingViewRequest = null;
          this.setView(pending.view, pending);
        } else {
          this.setView(this.currentView, { instant: true });
        }
        this.renderAnnotations();
      },
      undefined,
      (error) => {
        loadingDiv.remove();
        this.canvasHost.dataset.modelError = "true";
        console.error('Posture model load error:', error);
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

  findFootAnchor(points, bounds, size) {
    if (!points.length) return new THREE.Vector3();
    const bandHeight = Math.max(size.y * 0.035, 0.001);
    const thresholdY = bounds.min.y + bandHeight;
    const footPoints = points.filter((point) => point.y <= thresholdY);
    if (!footPoints.length) return new THREE.Vector3();
    const anchor = averageVectors(footPoints);
    return anchor;
  }

  findHeadAnchor(points, bounds, size) {
    if (!points.length) return new THREE.Vector3();
    const bandHeight = Math.max(size.y * 0.03, 0.001);
    const thresholdY = bounds.max.y - bandHeight;
    const headPoints = points.filter((point) => point.y >= thresholdY);
    if (!headPoints.length) return new THREE.Vector3(0, bounds.max.y, 0);
    return averageVectors(headPoints);
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
      this.renderAnnotations();
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
    this.renderAnnotations();
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

  updateFraming() {
    const aspect = this.camera.aspect || 1;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const verticalFit = (this.modelSize.y * 0.5) / Math.tan(fov * 0.5);
    const horizontalFit = (this.modelSize.x * 0.5) / (Math.tan(fov * 0.5) * aspect);
    const depthPadding = this.modelSize.z * 0.38;
    this.baseDistance = Math.max(verticalFit, horizontalFit) * 1.04 + depthPadding;
    this.targetY = this.resolveAlignedTargetY(this.baseDistance);
    this.baseDistance = this.resolveVisibleDistance(this.baseDistance);
    this.targetY = this.resolveAlignedTargetY(this.baseDistance);
    this.controls.minDistance = this.baseDistance * 0.78;
    this.controls.maxDistance = this.baseDistance;
  }

  resolveAlignedTargetY(distance) {
    if (!this.modelBounds) return 0;
    const desiredY = this.getPlatformCenterRatioY();
    const lowBound = this.modelBounds.min.y - this.modelSize.y;
    const highBound = this.modelBounds.max.y + this.modelSize.y;
    let low = lowBound;
    let high = highBound;
    let best = 0;
    let bestDelta = Infinity;

    for (let index = 0; index < 18; index += 1) {
      const mid = (low + high) * 0.5;
      const projected = this.projectPointWith(distance, mid, this.footAnchor, VIEW_ROTATIONS.front);
      if (!projected) break;
      const delta = projected.y - desiredY;
      if (Math.abs(delta) < bestDelta) {
        best = mid;
        bestDelta = Math.abs(delta);
      }
      if (delta > 0) low = mid;
      else high = mid;
    }

    return best;
  }

  resolveVisibleDistance(initialDistance) {
    if (!this.modelBounds) return initialDistance;
    const topLimit = 0.085;
    let distance = initialDistance;
    for (let index = 0; index < 12; index += 1) {
      const projectedHead = this.projectPointWith(distance, this.targetY, this.headAnchor, VIEW_ROTATIONS.front);
      if (!projectedHead || projectedHead.y >= topLimit) break;
      distance *= 1.03;
      this.targetY = this.resolveAlignedTargetY(distance);
    }
    return distance;
  }

  getPlatformCenterRatioY() {
    const stageHeight = this.canvasHost.clientHeight || this.stage.clientHeight || 1;
    const platformHeight = Math.min(stageHeight * PLATFORM_HEIGHT_RATIO, PLATFORM_MAX_HEIGHT);
    const bottom = stageHeight * PLATFORM_BOTTOM_RATIO;
    return (stageHeight - bottom - platformHeight * 0.5) / stageHeight;
  }

  projectPointWith(distance, targetY, point, angle) {
    const camera = this.getProjectionCamera(angle, distance, targetY);
    return this.projectPoint(point, camera);
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

  setAnnotations(state = {}) {
    this.annotationState = {
      selectedId: state.selectedId || null,
      visibleIds: Array.isArray(state.visibleIds) ? state.visibleIds : [],
    };
    this.renderAnnotations();
  }

  clearAnnotationScene() {
    while (this.annotationGroup.children.length) {
      const child = this.annotationGroup.children[0];
      this.annotationGroup.remove(child);
      child.traverse?.((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
          else node.material.dispose();
        }
      });
    }
    this.annotationLabels.innerHTML = "";
    this.summaryNodes = [];
  }

  renderAnnotations() {
    this.clearAnnotationScene();

    if (!this.model || !this.modelBounds || !this.modelPoints.length) return;

    const annotations = this.getVisibleAnnotationsForView();
    if (!annotations.length) return;
    const renderedMidlines = new Set();

    annotations.forEach((annotation) => {
      const pointMap = this.resolvePointMap(annotation);
      if (!pointMap.size) return;
      const active = annotation.id === this.annotationState.selectedId;

      pointMap.forEach((point, id) => {
        const pointDef = annotation.points.find((item) => item.id === id);
        const pointConfig = annotation.posture3d?.points?.[id];
        if (pointConfig?.hidden) return;
        this.annotationGroup.add(this.createPointMarker(point, pointDef?.colorType || "normal", active));
      });

      const lineDefs = annotation.posture3d?.lines || [];
      lineDefs.forEach((line) => {
        const start = this.resolveEndpoint(line.from, pointMap);
        const end = this.resolveEndpoint(line.to, pointMap);
        if (!start || !end || start.distanceTo(end) < 0.0001) return;
        if (line.colorType === "midline") {
          const midlineKey = `${this.currentView}:${start.x.toFixed(3)}:${start.y.toFixed(3)}:${end.x.toFixed(3)}:${end.y.toFixed(3)}`;
          if (renderedMidlines.has(midlineKey)) return;
          renderedMidlines.add(midlineKey);
        }
        const dashed = line.colorType === "midline" ? false : line.dashed ?? true;
        this.annotationGroup.add(this.createLineMarker(start, end, this.resolveLineColor(line, annotation), dashed, active));
      });

      if (active) this.renderSummary(annotation, pointMap, true);
    });
  }

  getVisibleAnnotationsForView() {
    const visibleIds = new Set(this.annotationState.visibleIds);
    return postureAnnotations.filter((annotation) => {
      const views = Array.isArray(annotation.views) ? annotation.views : [annotation.view];
      return visibleIds.has(annotation.id) && views.includes(this.currentView);
    });
  }

  resolvePointMap(annotation) {
    const pointMap = new Map();
    const pointConfig = annotation.posture3d?.points || {};
    const selectionCamera = this.getProjectionCamera(VIEW_ROTATIONS[this.currentView] ?? VIEW_ROTATIONS.front);
    const pointDefs = new Map(annotation.points.map((point) => [point.id, point]));
    const pointIds = new Set([...pointDefs.keys(), ...Object.keys(pointConfig)]);

    pointIds.forEach((pointId) => {
      const point = pointDefs.get(pointId) || null;
      const config = pointConfig[pointId] || {};
      const resolved = this.resolveSurfacePoint(point, config, selectionCamera);
      if (resolved) pointMap.set(pointId, resolved);
    });

    return pointMap;
  }

  resolveLineColor(line, annotation) {
    if (line.colorType === "midline") return "midline";
    return annotationTone(annotation);
  }

  resolveSurfacePoint(pointDef, config, camera) {
    const targetX = (config.target?.x ?? pointDef?.x ?? 50) / 100;
    const targetY = (config.target?.y ?? pointDef?.y ?? 50) / 100;
    const targetWorldY = THREE.MathUtils.clamp(1 - targetY, 0, 1);
    const yBand = config.yBand ?? 0.1;
    const withBand = this.collectPointCandidates(config, camera, targetX, targetY, targetWorldY, yBand, true);
    const fallback = withBand.length ? withBand : this.collectPointCandidates(config, camera, targetX, targetY, targetWorldY, yBand, false);
    if (!fallback.length) return null;
    if (config.locator) {
      const located = this.resolveLocatorCandidate(fallback, config.locator);
      if (located) return located;
    }
    return this.resolveCandidateCluster(fallback);
  }

  collectPointCandidates(config, camera, targetX, targetY, targetWorldY, yBand, enforceBand) {
    const bounds = this.modelBounds;
    const cameraPosition = camera.position.clone();
    const candidates = [];

    this.modelPoints.forEach((point) => {
      const normalized = this.normalizePoint(point, bounds);
      if (enforceBand && Math.abs(normalized.y - targetWorldY) > yBand) return;
      if (!this.matchesRegion(normalized, config.region)) return;

      const projected = this.projectPoint(point, camera);
      if (!projected || projected.z <= -1 || projected.z >= 1) return;

      const dx = projected.x - targetX;
      const dy = projected.y - targetY;
      const distanceToCamera = point.distanceTo(cameraPosition);
      const yPenalty = Math.abs(normalized.y - targetWorldY) * 0.12;
      const depthPenalty = distanceToCamera * 0.0025;
      candidates.push({
        point,
        normalized,
        projected,
        score: dx * dx + dy * dy + yPenalty + depthPenalty,
      });
    });

    candidates.sort((left, right) => left.score - right.score);
    return candidates;
  }

  resolveCandidateCluster(candidates) {
    const cluster = candidates.slice(0, Math.min(candidates.length, 18));
    if (!cluster.length) return null;
    const centroid = averageVectors(cluster.map((item) => item.point));
    let bestPoint = cluster[0].point.clone();
    let bestDistance = Infinity;

    cluster.forEach((candidate) => {
      const distance = candidate.point.distanceToSquared(centroid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = candidate.point.clone();
      }
    });

    return bestPoint;
  }

  resolveLocatorCandidate(candidates, locator = {}) {
    const sample = candidates.slice(0, Math.min(candidates.length, locator.topN || 96));
    if (!sample.length) return null;
    const prefer = Array.isArray(locator.prefer) ? locator.prefer : [];
    if (!prefer.length) return this.resolveCandidateCluster(sample);

    const ranked = [...sample].sort((left, right) => {
      for (const preference of prefer) {
        if (!Array.isArray(preference) || !preference.length) continue;
        const [field, direction = "asc"] = preference;
        const leftValue = this.getLocatorFieldValue(left, field);
        const rightValue = this.getLocatorFieldValue(right, field);
        if (Math.abs(leftValue - rightValue) < 1e-6) continue;
        return direction === "desc" ? rightValue - leftValue : leftValue - rightValue;
      }
      return left.score - right.score;
    });

    return ranked[0]?.point.clone() || this.resolveCandidateCluster(sample);
  }

  getLocatorFieldValue(candidate, field) {
    switch (field) {
      case "projectedX":
        return candidate.projected.x;
      case "projectedY":
        return candidate.projected.y;
      case "projectedZ":
        return candidate.projected.z;
      case "normalizedX":
        return candidate.normalized.x;
      case "normalizedY":
        return candidate.normalized.y;
      case "normalizedZ":
        return candidate.normalized.z;
      case "worldX":
        return candidate.point.x;
      case "worldY":
        return candidate.point.y;
      case "worldZ":
        return candidate.point.z;
      case "score":
        return candidate.score;
      default:
        return 0;
    }
  }

  normalizePoint(point, bounds) {
    return {
      x: (point.x - bounds.min.x) / (this.modelSize.x || 1),
      y: (point.y - bounds.min.y) / (this.modelSize.y || 1),
      z: (point.z - bounds.min.z) / (this.modelSize.z || 1),
    };
  }

  matchesRegion(point, region) {
    if (!region) return true;
    const [minX, maxX] = region.x || [0, 1];
    const [minY, maxY] = region.y || [0, 1];
    const [minZ, maxZ] = region.z || [0, 1];
    return (
      point.x >= minX &&
      point.x <= maxX &&
      point.y >= minY &&
      point.y <= maxY &&
      point.z >= minZ &&
      point.z <= maxZ
    );
  }

  getProjectionCamera(angle, distanceOverride = this.baseDistance, targetYOverride = this.targetY) {
    this.selectionCamera.fov = this.camera.fov;
    this.selectionCamera.aspect = this.camera.aspect;
    this.selectionCamera.near = this.camera.near;
    this.selectionCamera.far = this.camera.far;
    this.selectionCamera.updateProjectionMatrix();

    const distance = distanceOverride;
    const horizontalDistance = Math.sin(FIXED_POLAR_ANGLE) * distance;
    const y = Math.cos(FIXED_POLAR_ANGLE) * distance + targetYOverride;
    this.selectionCamera.position.set(
      Math.sin(angle) * horizontalDistance,
      y,
      Math.cos(angle) * horizontalDistance
    );
    this.selectionCamera.lookAt(0, targetYOverride, 0);
    this.selectionCamera.updateMatrixWorld(true);
    return this.selectionCamera;
  }

  projectPoint(point, camera = this.camera) {
    const ndc = point.clone().project(camera);
    return {
      x: ndc.x * 0.5 + 0.5,
      y: -ndc.y * 0.5 + 0.5,
      z: ndc.z,
    };
  }

  resolveEndpoint(definition, pointMap) {
    if (!definition) return null;

    let point = null;
    if (definition.point) {
      point = pointMap.get(definition.point)?.clone() || null;
      if (!point) return null;
    } else {
      point = new THREE.Vector3(
        this.modelBounds.min.x + this.modelSize.x * (definition.xRatio ?? 0.5),
        this.modelBounds.min.y + this.modelSize.y * (definition.yRatio ?? 0.5),
        this.modelBounds.min.z + this.modelSize.z * (definition.zRatio ?? 0.5)
      );
    }

    if (definition.xRatio !== undefined) point.x = this.modelBounds.min.x + this.modelSize.x * definition.xRatio;
    if (definition.yRatio !== undefined) point.y = this.modelBounds.min.y + this.modelSize.y * definition.yRatio;
    if (definition.zRatio !== undefined) point.z = this.modelBounds.min.z + this.modelSize.z * definition.zRatio;
    if (definition.matchYOf) {
      const matchPoint = pointMap.get(definition.matchYOf);
      if (matchPoint) point.y = matchPoint.y;
    }
    if (definition.matchXOf) {
      const matchPoint = pointMap.get(definition.matchXOf);
      if (matchPoint) point.x = matchPoint.x;
    }
    if (definition.matchZOf) {
      const matchPoint = pointMap.get(definition.matchZOf);
      if (matchPoint) point.z = matchPoint.z;
    }
    if (definition.xOffset) point.x += this.modelSize.x * definition.xOffset;
    if (definition.yOffset) point.y += this.modelSize.y * definition.yOffset;
    if (definition.zOffset) point.z += this.modelSize.z * definition.zOffset;
    return point;
  }

  createPointMarker(position, colorType, active = false) {
    const color = OVERLAY_COLORS[colorType]?.hex ?? OVERLAY_COLORS.normal.hex;
    const group = new THREE.Group();

    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(POINT_RADII.outer, 18, 18),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: active ? 1 : INACTIVE_OPACITY.point,
        depthTest: false,
        depthWrite: false,
      })
    );
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(POINT_RADII.outer * 0.48, 18, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: active ? 1 : INACTIVE_OPACITY.pointInner,
        depthTest: false,
        depthWrite: false,
      })
    );
    [outer, inner].forEach((mesh) => {
      mesh.renderOrder = 12;
    });
    group.position.copy(position);
    group.renderOrder = 12;
    group.add(outer, inner);
    return group;
  }

  createLineMarker(start, end, colorType, dashed = false, active = false) {
    if (!dashed) {
      const radius = colorType === "midline" ? LINE_RADIUS.midline : LINE_RADIUS.solid;
      return this.createSegmentMesh(start, end, colorType, radius, active ? 0.92 : INACTIVE_OPACITY.line);
    }

    const direction = end.clone().sub(start);
    const totalLength = direction.length();
    if (totalLength < 0.0001) return new THREE.Group();
    const group = new THREE.Group();
    const dashLength = totalLength / 8;
    const gapLength = dashLength * 0.55;
    const unit = direction.clone().normalize();
    let offset = 0;
    while (offset < totalLength) {
      const nextStart = start.clone().addScaledVector(unit, offset);
      const nextEnd = start.clone().addScaledVector(unit, Math.min(offset + dashLength, totalLength));
      group.add(this.createSegmentMesh(nextStart, nextEnd, colorType, LINE_RADIUS.dashed, active ? 0.82 : INACTIVE_OPACITY.line));
      offset += dashLength + gapLength;
    }
    return group;
  }

  createSegmentMesh(start, end, colorType, radius, opacity) {
    const color = OVERLAY_COLORS[colorType]?.hex ?? OVERLAY_COLORS.normal.hex;
    const direction = end.clone().sub(start);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.renderOrder = colorType === "midline" ? 11 : 10;
    return mesh;
  }

  renderSummary(annotation, pointMap, active = false) {
    const anchorConfig = annotation.posture3d?.labelAnchor;
    if (!anchorConfig) return;

    const anchor = this.resolveLabelAnchor(anchorConfig, pointMap);
    if (!anchor) return;

    const node = document.createElement("div");
    const tone = annotation.severity === "normal" ? "normal" : annotation.severity === "mild" ? "warn" : "abnormal";
    node.className = `posture-annotation-summary posture-annotation-summary--${tone} posture-annotation-summary--${anchorConfig.align || "center"} ${active ? "is-active" : ""}`;
    node.style.opacity = active ? "1" : `${INACTIVE_OPACITY.label}`;
    const value = `${annotation.value ?? "--"}${annotation.unit ?? ""}`;
    node.innerHTML = `
      <strong class="posture-annotation-summary__name">${annotation.name}</strong>
      <span class="posture-annotation-summary__metric">${value}</span>
      <b class="posture-annotation-summary__status">${annotation.status || ""}</b>
    `;
    this.annotationLabels.appendChild(node);
    this.summaryNodes.push({
      node,
      point: anchor,
      align: anchorConfig.align || "center",
      placement: anchorConfig.placement || "auto",
      gutter: anchorConfig.gutter || 18,
      active,
    });
    this.updateSummaryPositions();
  }

  resolveLabelAnchor(anchorConfig, pointMap) {
    let anchor = null;
    if (anchorConfig.type === "midpoint") {
      const from = pointMap.get(anchorConfig.from);
      const to = pointMap.get(anchorConfig.to);
      if (!from || !to) return null;
      anchor = averageVectors([from, to]);
    } else {
      anchor = pointMap.get(anchorConfig.point)?.clone() || null;
    }
    if (!anchor) return null;
    if (anchorConfig.xOffset) anchor.x += this.modelSize.x * anchorConfig.xOffset;
    if (anchorConfig.yOffset) anchor.y += this.modelSize.y * anchorConfig.yOffset;
    if (anchorConfig.zOffset) anchor.z += this.modelSize.z * anchorConfig.zOffset;
    return anchor;
  }

  updateSummaryPositions() {
    if (!this.summaryNodes.length) return;
    const width = this.stage.clientWidth || this.canvasHost.clientWidth || 1;
    const height = this.stage.clientHeight || this.canvasHost.clientHeight || 1;
    const modelBox = this.projectModelScreenBounds(width, height);
    this.summaryNodes.forEach((summary) => {
      const projected = this.projectPoint(summary.point, this.camera);
      if (!projected || projected.z <= -1 || projected.z >= 1) {
        summary.node.style.opacity = "0";
        return;
      }

      const anchorX = projected.x * width;
      const anchorY = projected.y * height;
      const cardWidth = summary.node.offsetWidth || 92;
      const cardHeight = summary.node.offsetHeight || 52;
      const gutter = summary.gutter || 18;
      const placement = summary.placement || "auto";

      let left = anchorX;
      let top = anchorY;

      if (placement === "side" && summary.align === "left") {
        left = Math.max(anchorX + gutter, modelBox.maxX + gutter);
        top = THREE.MathUtils.clamp(anchorY - cardHeight * 0.5, modelBox.minY, modelBox.maxY - cardHeight);
      } else if (placement === "side" && summary.align === "right") {
        left = Math.min(anchorX - gutter - cardWidth, modelBox.minX - gutter - cardWidth);
        top = THREE.MathUtils.clamp(anchorY - cardHeight * 0.5, modelBox.minY, modelBox.maxY - cardHeight);
      } else if (summary.align === "left") {
        left = Math.max(anchorX + gutter, modelBox.maxX + gutter);
        top = anchorY - cardHeight * 0.5;
      } else if (summary.align === "right") {
        left = Math.min(anchorX - gutter - cardWidth, modelBox.minX - gutter - cardWidth);
        top = anchorY - cardHeight * 0.5;
      } else if (placement === "top" || (placement === "auto" && anchorY <= modelBox.minY + modelBox.height * 0.4)) {
        left = anchorX - cardWidth * 0.5;
        top = modelBox.minY - gutter - cardHeight;
      } else {
        left = anchorX - cardWidth * 0.5;
        top = modelBox.maxY + gutter;
      }

      summary.node.style.opacity = summary.active ? "1" : `${INACTIVE_OPACITY.label}`;
      summary.node.style.left = `${THREE.MathUtils.clamp(left, 14, width - cardWidth - 14)}px`;
      summary.node.style.top = `${THREE.MathUtils.clamp(top, 14, height - cardHeight - 14)}px`;
    });
  }

  projectModelScreenBounds(width, height) {
    if (!this.modelBounds) {
      return { minX: width * 0.28, maxX: width * 0.72, minY: height * 0.14, maxY: height * 0.86, width: width * 0.44, height: height * 0.72 };
    }

    const { min, max } = this.modelBounds;
    const corners = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    corners.forEach((corner) => {
      const projected = this.projectPoint(corner, this.camera);
      if (!projected || projected.z <= -1 || projected.z >= 1) return;
      const screenX = projected.x * width;
      const screenY = projected.y * height;
      minX = Math.min(minX, screenX);
      maxX = Math.max(maxX, screenX);
      minY = Math.min(minY, screenY);
      maxY = Math.max(maxY, screenY);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return { minX: width * 0.28, maxX: width * 0.72, minY: height * 0.14, maxY: height * 0.86, width: width * 0.44, height: height * 0.72 };
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
    };
  }

  animate() {
    if (!this.renderer) return;
    this.raf = window.requestAnimationFrame(() => this.animate());
    if (this.isViewAnimating) {
      this.controls.enabled = false;
      this.currentOrbitAngle += shortestAngle(this.currentOrbitAngle, this.targetOrbitAngle) * 0.08;
      this.applyOrbitPosition(this.currentOrbitAngle);
      if (Math.abs(shortestAngle(this.currentOrbitAngle, this.targetOrbitAngle)) < 0.004) {
        this.currentOrbitAngle = this.targetOrbitAngle;
        this.applyOrbitPosition(this.currentOrbitAngle);
        this.isViewAnimating = false;
        this.controls.enabled = true;
        this.renderAnnotations();
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateSummaryPositions();
  }

  dispose() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.handleResize);
    this.clearAnnotationScene();
    this.controls.dispose();
    this.renderer.dispose();
    this.canvasHost.innerHTML = "";
  }
}

window.syncPostureModelViewer = function syncPostureModelViewer(view) {
  let nextView = view;
  let annotationState = null;
  let previousView = null;
  if (typeof view === "object" && view !== null) {
    nextView = view.view;
    annotationState = view.annotations || null;
    previousView = view.previousView || null;
  }
  const stage = document.querySelector("[data-posture-3d-stage]");
  if (!stage) {
    if (viewer) {
      viewer.dispose();
      viewer = null;
    }
    return;
  }

  if (!viewer || viewer.stage !== stage) {
    if (viewer) viewer.dispose();
    viewer = new PostureViewer3D(stage);
  }

  stage.dataset.view = nextView;
  stage.style.setProperty("--stage-rotation", ({
    front: "0deg",
    right: "90deg",
    back: "180deg",
    left: "-90deg",
  })[nextView] || "0deg");

  viewer.setAnnotations(annotationState || {});
  viewer.setView(nextView, { instant: !viewer.model, previousView });
};

window.requestAnimationFrame(() => {
  if (document.body.dataset.activeReport === "posture") {
    window.syncPostureModelViewer({ view: "front" });
  }
});
