/* Real-time 3D bar chart (three.js) for bookings / revenue.
   Lazy-loaded by Chart3DPanel ONLY on the dashboard and only when WebGL works, so
   three.js never lands in the main bundle. Bars grow when the data changes, the
   chart sways gently and tilts toward the mouse, mouse-drag or arrow keys rotate it,
   hovering a bar highlights it. prefers-reduced-motion → static frame, no sway/growth.
   Pauses off-screen / in hidden tabs and frees GPU memory on unmount. */
import { useEffect, useRef } from "react";
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Color, Vector2, Vector3, Raycaster,
  BoxGeometry, PlaneGeometry, MeshStandardMaterial, HemisphereLight, DirectionalLight, AmbientLight,
  SRGBColorSpace,
} from "three";

const MAX_H = 4.2;     // tallest bar height (world units)
const BAR_W = 0.9;
const GAP = 0.55;

export default function BookingsChart3D({ data = [], format = (v) => v, reducedMotion = false, paused = false, onError }) {
  const wrapRef = useRef(null);
  const labelsRef = useRef(null);
  const tipRef = useRef(null);
  const stateRef = useRef({ paused, reducedMotion });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch (err) {
      onError?.(err);
      return undefined;
    }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "adm3d-canvas";
    wrap.prepend(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 100);
    const chart = new Group();
    scene.add(chart);
    scene.add(new HemisphereLight(0xf2fbff, 0x6b8f78, 1.2));
    scene.add(new AmbientLight(0xffffff, 0.35));
    const sun = new DirectionalLight(0xffffff, 1.9);
    sun.position.set(4, 9, 6);
    scene.add(sun);

    const disposables = [];
    const track = (o) => { disposables.push(o); return o; };

    const n = Math.max(1, data.length);
    const span = n * BAR_W + (n - 1) * GAP;
    const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));

    /* floor slab + grid lines give the chart a physical base */
    const floor = new Mesh(track(new BoxGeometry(span + 1.6, 0.18, 2.4)),
      track(new MeshStandardMaterial({ color: "#eef6f1", roughness: 0.9 })));
    floor.position.y = -0.09;
    chart.add(floor);
    const lineMat = track(new MeshStandardMaterial({ color: "#c9ddd0", roughness: 1 }));
    const lineGeo = track(new PlaneGeometry(span + 1.2, 0.025));
    const backWall = new Group();
    [0.25, 0.5, 0.75, 1].forEach((k) => {
      const line = new Mesh(lineGeo, lineMat);
      line.position.set(0, k * MAX_H, -0.95);
      backWall.add(line);
    });
    chart.add(backWall);

    const barGeo = track(new BoxGeometry(BAR_W, 1, BAR_W));
    barGeo.translate(0, 0.5, 0);          // grow from the floor
    const bars = data.map((d, i) => {
      const mat = track(new MeshStandardMaterial({ color: d.color || "#198754", roughness: 0.45, metalness: 0.05, emissive: "#000000" }));
      const mesh = new Mesh(barGeo, mat);
      mesh.position.set(-span / 2 + BAR_W / 2 + i * (BAR_W + GAP), 0, 0);
      const target = Math.max(0.04, ((Number(d.value) || 0) / max) * MAX_H);
      mesh.scale.y = stateRef.current.reducedMotion ? target : 0.001;
      mesh.userData = { target, index: i };
      chart.add(mesh);
      return mesh;
    });

    /* HTML labels (crisp text, no font assets): value on top, name below */
    const labelRoot = labelsRef.current;
    labelRoot.textContent = "";
    const labels = data.map((d) => {
      const top = document.createElement("span");
      top.className = "adm3d-label adm3d-label--value";
      top.textContent = format(d.value);
      const bottom = document.createElement("span");
      bottom.className = "adm3d-label adm3d-label--axis";
      bottom.textContent = d.label;
      labelRoot.append(top, bottom);
      return { top, bottom };
    });

    let width = 1, height = 1;
    const resize = () => {
      width = Math.max(1, wrap.clientWidth);
      height = Math.max(1, wrap.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };

    /* camera distance so the whole row of bars fits the width */
    let yaw = 0, userYaw = 0, swayYaw = 0, tiltPx = 0, tiltPy = 0, dragging = false, lastX = 0;
    const placeCamera = () => {
      const fitW = (span + 2.2) / 2 / Math.tan((camera.fov * Math.PI) / 360) / Math.max(0.6, camera.aspect);
      const fitH = (MAX_H + 3.4) / 2 / Math.tan((camera.fov * Math.PI) / 360);
      const R = Math.max(fitW, fitH) * 1.02;
      const el = 0.36 - tiltPy * 0.08;
      const ang = yaw + tiltPx * 0.25;
      camera.position.set(Math.sin(ang) * R * Math.cos(el), R * Math.sin(el) + MAX_H * 0.35, Math.cos(ang) * R * Math.cos(el));
      camera.lookAt(0, MAX_H * 0.36, 0);
    };

    const v = new Vector3();
    const toScreen = (x, y, z) => {
      v.set(x, y, z).applyMatrix4(chart.matrixWorld).project(camera);
      return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height, v.z < 1];
    };
    const projectLabels = () => {
      /* keep axis names from overlapping: width = on-screen gap between neighbouring bars */
      const xs = bars.map((bar) => toScreen(bar.position.x, -0.1, BAR_W * 0.9)[0]);
      const gapPx = xs.length > 1 ? Math.abs(xs[1] - xs[0]) : 120;
      const maxW = `${Math.max(36, Math.min(110, gapPx - 6))}px`;
      bars.forEach((bar, i) => {
        labels[i].bottom.style.maxWidth = maxW;
        const [tx, ty] = toScreen(bar.position.x, bar.scale.y + 0.15, 0);
        const [bx, by] = toScreen(bar.position.x, -0.1, BAR_W * 0.9);
        labels[i].top.style.transform = `translate(-50%, -100%) translate(${tx}px, ${ty}px)`;
        labels[i].bottom.style.transform = `translate(-50%, 0) translate(${bx}px, ${by}px)`;
      });
    };

    /* hover highlight via raycasting (mouse only) */
    const ray = new Raycaster();
    const ndc = new Vector2();
    let hovered = -1;
    const setHover = (idx) => {
      if (idx === hovered) return;
      if (hovered >= 0) bars[hovered].material.emissive.set("#000000");
      hovered = idx;
      const tip = tipRef.current;
      if (idx >= 0) {
        bars[idx].material.emissive.set(new Color(data[idx].color || "#198754").multiplyScalar(0.35));
        if (tip) { tip.textContent = `${data[idx].label}: ${format(data[idx].value)}`; tip.hidden = false; }
      } else if (tip) {
        tip.hidden = true;
      }
      requestRender();
    };

    let frame = 0, inView = true, last = performance.now(), start = last;
    const animating = () => !stateRef.current.reducedMotion && !stateRef.current.paused;
    const growing = () => bars.some((b) => Math.abs(b.scale.y - b.userData.target) > 0.002);
    function renderOnce(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      if (stateRef.current.reducedMotion) {
        bars.forEach((b) => { b.scale.y = b.userData.target; });
      } else {
        bars.forEach((b, i) => {
          if (t < i * 0.06) return;                       // staggered growth
          b.scale.y += (b.userData.target - b.scale.y) * Math.min(1, dt * 5);
        });
      }
      if (animating() && !dragging) swayYaw = Math.sin(t * 0.25) * 0.22;
      const targetYaw = -0.32 + userYaw + swayYaw;
      yaw += (targetYaw - yaw) * (stateRef.current.reducedMotion ? 1 : 0.08);
      placeCamera();
      chart.updateMatrixWorld();
      renderer.render(scene, camera);
      projectLabels();
      return Math.abs(targetYaw - yaw) > 0.002;
    }
    function loop(now) {
      frame = 0;
      if (!inView || document.hidden) return;
      const moving = renderOnce(now);
      if (animating() || dragging || moving || growing()) frame = requestAnimationFrame(loop);
    }
    function requestRender() {
      if (!frame) frame = requestAnimationFrame(loop);
    }

    const onPointerDown = (e) => {
      if (e.pointerType !== "mouse") return;          // touch keeps scrolling the page
      dragging = true; lastX = e.clientX; wrap.setPointerCapture?.(e.pointerId); requestRender();
    };
    const onPointerMove = (e) => {
      if (dragging) { userYaw += (e.clientX - lastX) * 0.008; lastX = e.clientX; requestRender(); return; }
      if (e.pointerType !== "mouse") return;
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      if (!stateRef.current.reducedMotion) { tiltPx = px - 0.5; tiltPy = py - 0.5; }
      ndc.set(px * 2 - 1, -(py * 2 - 1));
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(bars, false)[0];
      setHover(hit ? hit.object.userData.index : -1);
      requestRender();
    };
    const onPointerUp = () => { dragging = false; requestRender(); };
    const onLeave = () => { tiltPx = 0; tiltPy = 0; setHover(-1); };
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { userYaw -= 0.15; requestRender(); e.preventDefault(); }
      if (e.key === "ArrowRight") { userYaw += 0.15; requestRender(); e.preventDefault(); }
    };
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("keydown", onKey);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) requestRender(); });
    io.observe(wrap);
    const onVis = () => { if (!document.hidden) requestRender(); };
    document.addEventListener("visibilitychange", onVis);
    const onLost = (e) => { e.preventDefault(); onError?.(new Error("WebGL context lost")); };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    resize();
    stateRef.current.kick = requestRender;
    wrap.classList.add("is-ready");

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
      if (labelRoot) labelRoot.textContent = "";
    };
  }, [data, format, onError]);

  useEffect(() => {
    stateRef.current.paused = paused;
    stateRef.current.reducedMotion = reducedMotion;
    stateRef.current.kick?.();
  }, [paused, reducedMotion]);

  return (
    <div ref={wrapRef} className="adm3d-stage" tabIndex={0} aria-label="3D bar chart. Use the left and right arrow keys to rotate it.">
      <div ref={labelsRef} className="adm3d-labels" aria-hidden="true" />
      <div ref={tipRef} className="adm3d-tip" hidden aria-hidden="true" />
    </div>
  );
}
