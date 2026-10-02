/* nota. — scène 3D commune : un nuage de particules qui passe d'une forme à l'autre au scroll.
   Utilisation : NotaScene({ shapes: [formeA, formeB, formeC] })
   Chaque forme est une fonction (i, rnd, gauss) => [x, y, z].
   Si WebGL ou three.js ne sont pas disponibles, la page continue de marcher sans la 3D. */
(function () {
  const noop = { pulse() {} };

  // Formes prêtes à l'emploi
  const S = {
    sphere(i, rnd, g) {
      const u = rnd(-1, 1), a = rnd(0, Math.PI * 2), r = 1.9 + g() * 0.03, s = Math.sqrt(1 - u * u);
      return [Math.cos(a) * s * r, u * r, Math.sin(a) * s * r];
    },
    ring(i, rnd, g) {
      const k = i % 4, a = rnd(0, Math.PI * 2);
      let r, y;
      if (k === 0) { r = 2.3 + g() * 0.12; y = g() * 0.25; }
      else if (k === 1) { r = 1.55 + g() * 0.05; y = g() * 0.05; }
      else if (k === 2) { r = 0.9 + g() * 0.04; y = g() * 0.04; }
      else { r = Math.sqrt(Math.random()) * 0.45; y = g() * 0.15; }
      return tilt([Math.cos(a) * r, y, Math.sin(a) * r], 1.05);
    },
  };
  function tilt(p, t) { const y = p[1], z = p[2]; return [p[0], y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)]; }
  function spinY(p, t) { const x = p[0], z = p[2]; return [x * Math.cos(t) - z * Math.sin(t), p[1], x * Math.sin(t) + z * Math.cos(t)]; }

  function NotaScene(opts) {
    try {
      if (typeof THREE === "undefined") return noop;
      const canvas = document.getElementById("scene");
      if (!canvas) return noop;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = innerWidth < 860;
      const N = mobile ? 7000 : 16000;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

      const s3 = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      cam.position.set(0, 0.4, mobile ? 8.6 : 7.2);

      const rnd = (a, b) => a + Math.random() * (b - a);
      const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const shapes = (opts.shapes || [S.sphere, S.ring]).slice(0, 3);
      while (shapes.length < 3) shapes.push(shapes[shapes.length - 1]);

      const bufs = shapes.map(() => new Float32Array(N * 3));
      const R = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        shapes.forEach((f, k) => bufs[k].set(f(i, rnd, gauss), i * 3));
        R[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(bufs[0].slice(), 3));
      geo.setAttribute("aA", new THREE.BufferAttribute(bufs[0], 3));
      geo.setAttribute("aB", new THREE.BufferAttribute(bufs[1], 3));
      geo.setAttribute("aC", new THREE.BufferAttribute(bufs[2], 3));
      geo.setAttribute("aR", new THREE.BufferAttribute(R, 1));

      const uni = {
        uT: { value: 0 }, uTime: { value: 0 }, uBurst: { value: 0 }, uHeat: { value: 0 },
        uSize: { value: (mobile ? 46 : 52) * renderer.getPixelRatio() },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: uni, transparent: true, depthWrite: false,
        vertexShader: `
          attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute float aR;
          uniform float uT, uTime, uBurst, uSize;
          varying float vR; varying float vFade;
          void main() {
            float t1 = smoothstep(0.0, 1.0, clamp(uT, 0.0, 1.0));
            float t2 = smoothstep(0.0, 1.0, clamp(uT - 1.0, 0.0, 1.0));
            float lag = aR * 0.35;
            t1 = smoothstep(lag, lag + 0.65, t1); t2 = smoothstep(lag, lag + 0.65, t2);
            vec3 p = mix(mix(aA, aB, t1), aC, t2);
            float mid = sin(t1 * 3.1416) + sin(t2 * 3.1416);
            p += normalize(p + 0.001) * mid * (0.4 + aR) * 0.9;
            p += 0.035 * vec3(sin(uTime * 0.7 + aR * 40.0), cos(uTime * 0.6 + aR * 25.0), sin(uTime * 0.5 + aR * 13.0));
            p *= 1.0 + uBurst * (0.25 + aR * 0.6);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * (0.35 + aR * 0.9) / -mv.z;
            vR = aR;
            vFade = smoothstep(14.0, 4.0, -mv.z);
          }`,
        fragmentShader: `
          uniform float uHeat;
          varying float vR; varying float vFade;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.05, d);
            vec3 dark = vec3(0.33, 0.29, 0.25);
            vec3 light = vec3(1.0, 0.985, 0.96);
            vec3 warm = vec3(0.72, 0.5, 0.33);
            vec3 col = mix(dark, light, smoothstep(0.4, 0.95, vR));
            col = mix(col, warm, uHeat * step(0.7, vR) * 0.8);
            gl_FragColor = vec4(col, a * (0.65 + 0.35 * vR) * vFade);
          }`,
      });
      const pts = new THREE.Points(geo, mat);
      s3.add(pts);
      const hc = document.getElementById("hud-count");
      if (hc) hc.textContent = N.toLocaleString("fr-FR");

      let mx = 0, my = 0, tmx = 0, tmy = 0;
      const coords = document.getElementById("hud-coords");
      addEventListener("pointermove", e => {
        tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1;
        if (coords) coords.textContent = `X ${tmx.toFixed(2)} · Y ${(-tmy).toFixed(2)}`;
      });
      function resize() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
      addEventListener("resize", resize); resize();

      const secs = [...document.querySelectorAll("main > section")].slice(0, 3);
      function scrollT() {
        const y = scrollY + innerHeight * 0.5;
        let t = 0;
        for (let i = 0; i < secs.length - 1; i++) {
          const a = secs[i].offsetTop + secs[i].offsetHeight * 0.5, b = secs[i + 1].offsetTop + secs[i + 1].offsetHeight * 0.5;
          if (y >= b) t = i + 1; else if (y > a) { t = i + (y - a) / (b - a); break; } else break;
        }
        return Math.min(t, 2);
      }

      const pctEl = document.getElementById("hud-pct");
      let burst = 0, heat = 0, cur = 0, rot = 0;
      const clock = new THREE.Clock();
      function frame() {
        try {
          const dt = Math.min(clock.getDelta(), 0.05);
          cur += (scrollT() - cur) * Math.min(1, dt * 4);
          uni.uT.value = cur;
          uni.uTime.value += reduce ? 0 : dt;
          burst *= Math.pow(0.04, dt); uni.uBurst.value = burst;
          uni.uHeat.value += (heat - uni.uHeat.value) * Math.min(1, dt * 2);
          mx += (tmx - mx) * dt * 2; my += (tmy - my) * dt * 2;
          rot += reduce ? 0 : dt * 0.12;
          pts.rotation.y = rot + mx * 0.4;
          pts.rotation.x = my * 0.15;
          const side = mobile ? 0 : Math.min(1, Math.max(0, cur - 0.4)) * 1.6;
          pts.position.x += (side - pts.position.x) * Math.min(1, dt * 3);
          pts.position.y = mobile ? -0.6 * (1 - Math.min(cur, 1)) + Math.max(0, cur - 1) * 1.6 : -1.0 * (1 - Math.min(cur, 1));
          if (pctEl) pctEl.textContent = String(Math.round(cur / 2 * 100)).padStart(3, "0") + "%";
          renderer.render(s3, cam);
        } catch (e) { return; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      return {
        // force : 0 à 1, intensité de l'explosion ; chaleur : 0 à 1, teinte cuivrée
        pulse(force, chaleur) {
          burst = Math.max(burst, 0.3 + 0.5 * (force ?? 0.5));
          if (chaleur != null) heat = Math.min(1, Math.max(0, chaleur));
        },
      };
    } catch (e) { return noop; }
  }

  // Apparitions au scroll : le contenu reste visible si quelque chose ne marche pas
  function reveal() {
    try {
      if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const els = document.querySelectorAll(".reveal");
      const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
      els.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); io.observe(el); });
      document.documentElement.classList.add("js-anim");
      setTimeout(() => els.forEach(el => el.classList.add("in")), 4000);
    } catch (e) {}
  }

  window.NotaScene = NotaScene;
  window.NotaShapes = Object.assign(S, { tilt, spinY });
  window.NotaReveal = reveal;
})();
