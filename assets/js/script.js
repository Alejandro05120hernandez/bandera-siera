/* ============================================================
   BANDERA SIERA — script.js
   Museo Digital + ruta + programa + canal de WhatsApp del XXXV Recorrido.

   La página ya no usa un login municipal ni guarda registros de
   ayuntamientos en localStorage. La suscripción ciudadana con Google
   requiere un endpoint de servidor que valide el ID token y guarde
   el consentimiento. Google Calendar funciona mediante OAuth y crea
   el evento directamente en el calendario del usuario.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------- HIMNO MANUAL ----------------
     Los fondos son imágenes estáticas. El himno comienza únicamente
     cuando el usuario pulsa “Reproducir himno” junto a la BANDERA SIERA. */
  const himnoBackground = document.getElementById("himnoBackground");
  const himnoToggle = document.getElementById("himnoToggle");

  if (himnoBackground && himnoToggle) {
    himnoBackground.volume = 0.65;

    const icon = himnoToggle.querySelector(".himno-symbol-icon");
    const label = himnoToggle.querySelector(".himno-symbol-label");

    function actualizarBotonHimno() {
      const reproduciendo = !himnoBackground.paused && !himnoBackground.ended;
      himnoToggle.classList.toggle("is-playing", reproduciendo);
      himnoToggle.setAttribute("aria-pressed", String(reproduciendo));
      himnoToggle.setAttribute(
        "aria-label",
        reproduciendo ? "Pausar himno" : "Reproducir himno"
      );

      if (icon) {
        icon.textContent = reproduciendo ? "❚❚" : "▶";
      }

      if (label) {
        label.textContent = reproduciendo
          ? "Pausar himno"
          : "Reproducir himno";
      }
    }

    himnoToggle.addEventListener("click", async () => {
      if (himnoBackground.paused) {
        try {
          await himnoBackground.play();
        } catch (error) {
          console.warn("No fue posible reproducir el himno:", error);
        }
      } else {
        himnoBackground.pause();
      }

      actualizarBotonHimno();
    });

    himnoBackground.addEventListener(
      "play",
      actualizarBotonHimno
    );

    himnoBackground.addEventListener(
      "pause",
      actualizarBotonHimno
    );

    himnoBackground.addEventListener(
      "ended",
      actualizarBotonHimno
    );

    actualizarBotonHimno();
  }


  /* ---------------- EXPERIENCIA DE SCROLL · CINEMÁTICA ----------------
     Mejora únicamente la sensación al desplazarse por la página.
     No cambia contenido, estructura, fondos, mapa, galería ni botones.

     La idea es que cada sección se sienta como un "capítulo":
       - entra con profundidad y un pequeño desplazamiento vertical;
       - al cruzar el centro de la pantalla recupera escala 1:1;
       - al salir mantiene una profundidad muy ligera;
       - títulos y líneas reaccionan de forma sutil al movimiento;
       - en móvil el efecto se reduce para mantener fluidez.
  ------------------------------------------------------------------- */

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const scrollStages = Array.from(
    document.querySelectorAll("main > section")
  );

  scrollStages.forEach((section) => {
    section.classList.add(
      "scroll-stage",
      "scroll-live-stage"
    );
  });


  /* Las secciones cortas reciben un punto de snap más firme.
     Las secciones largas conservan desplazamiento completamente natural. */

  function actualizarSeccionesSnap() {
    const limite =
      Math.max(window.innerHeight, 1) * 1.28;

    scrollStages.forEach((section) => {
      const esCorta =
        section.scrollHeight <= limite;

      section.classList.toggle(
        "scroll-snap-short",
        esCorta
      );
    });
  }

  actualizarSeccionesSnap();

  window.addEventListener(
    "resize",
    actualizarSeccionesSnap
  );


  /* Entrada inicial de cada capítulo. */

  if (
    "IntersectionObserver" in window &&
    !reduceMotion.matches
  ) {
    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-in-view"
            );

            sectionObserver.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.055,
          rootMargin: "0px 0px -4% 0px"
        }
      );

    scrollStages.forEach(
      section =>
        sectionObserver.observe(section)
    );
  } else {
    scrollStages.forEach(
      section =>
        section.classList.add("is-in-view")
    );
  }


  const panoBackgrounds =
    document.querySelectorAll(
      ".pano-static-bg"
    );

  const heroTextScroll =
    document.querySelector(".hero-text");

  let cinematicTicking = false;
  let previousScrollY = window.scrollY;
  let smoothedVelocity = 0;

  const clamp = (value, min, max) =>
    Math.max(
      min,
      Math.min(max, value)
    );


  function updateCinematicScroll() {
    cinematicTicking = false;

    const viewportH =
      Math.max(
        window.innerHeight,
        1
      );

    const viewportCenter =
      viewportH / 2;

    const currentScrollY =
      window.scrollY;

    const rawVelocity =
      currentScrollY - previousScrollY;

    previousScrollY =
      currentScrollY;

    smoothedVelocity +=
      (rawVelocity - smoothedVelocity) *
      0.16;

    document.documentElement.style.setProperty(
      "--page-scroll-velocity",
      String(
        clamp(
          smoothedVelocity,
          -24,
          24
        ).toFixed(2)
      )
    );


    /* Respeta la preferencia del sistema. */

    if (reduceMotion.matches) {
      scrollStages.forEach(
        section => {
          section.style.setProperty(
            "--stage-y",
            "0px"
          );

          section.style.setProperty(
            "--stage-scale",
            "1"
          );

          section.style.setProperty(
            "--stage-opacity",
            "1"
          );

          section.style.setProperty(
            "--stage-rotate",
            "0deg"
          );

          section.style.setProperty(
            "--heading-x",
            "0px"
          );

          section.style.setProperty(
            "--stage-glow",
            "0"
          );
        }
      );

      panoBackgrounds.forEach(
        bg =>
          bg.style.setProperty(
            "--pano-shift",
            "0px"
          )
      );

      if (heroTextScroll) {
        heroTextScroll.style.removeProperty(
          "transform"
        );

        heroTextScroll.style.removeProperty(
          "opacity"
        );
      }

      return;
    }


    const mobile =
      window.innerWidth <= 900;


    scrollStages.forEach(
      (section) => {
        const rect =
          section.getBoundingClientRect();

        if (
          rect.bottom <
            -viewportH * 0.35 ||
          rect.top >
            viewportH * 1.35
        ) {
          return;
        }

        const sectionCenter =
          rect.top +
          rect.height / 2;

        const signedDistance =
          clamp(
            (
              sectionCenter -
              viewportCenter
            ) /
            (
              viewportH *
              0.82
            ),
            -1.15,
            1.15
          );

        const distance =
          Math.min(
            1,
            Math.abs(
              signedDistance
            )
          );


        /*
         * Scroll limpio:
         * no existe ningún blur.
         */

        const maxY =
          mobile ? 20 : 48;

        const maxScaleLoss =
          mobile
            ? 0.018
            : 0.055;

        const maxOpacityLoss =
          mobile
            ? 0.055
            : 0.18;

        const maxRotate = 0;

        const y =
          signedDistance *
          maxY;

        const scale =
          1 -
          distance *
          maxScaleLoss;

        const opacity =
          1 -
          distance *
          maxOpacityLoss;

        const rotate =
          signedDistance *
          -maxRotate;

        const headingX = 0;

        const glow =
          1 - distance;


        section.style.setProperty(
          "--stage-y",
          `${y.toFixed(2)}px`
        );

        section.style.setProperty(
          "--stage-scale",
          scale.toFixed(4)
        );

        section.style.setProperty(
          "--stage-opacity",
          opacity.toFixed(3)
        );

        section.style.setProperty(
          "--stage-rotate",
          `${rotate.toFixed(3)}deg`
        );

        section.style.setProperty(
          "--heading-x",
          `${headingX.toFixed(2)}px`
        );

        section.style.setProperty(
          "--stage-glow",
          glow.toFixed(3)
        );


        const visibleNow =
          rect.bottom >
            viewportH * 0.14 &&
          rect.top <
            viewportH * 0.86;

        section.classList.toggle(
          "is-scroll-current",
          visibleNow &&
          distance < 0.72
        );
      }
    );


    /* Parallax de fondos existentes. */

    panoBackgrounds.forEach(
      bg => {

        if (mobile) {
          bg.style.setProperty(
            "--pano-shift",
            "0px"
          );

          return;
        }

        const section =
          bg.parentElement;

        if (!section) {
          return;
        }

        const rect =
          section.getBoundingClientRect();

        if (
          rect.bottom < 0 ||
          rect.top > viewportH
        ) {
          return;
        }

        const centerOffset =
          (
            rect.top +
            rect.height / 2
          ) -
          viewportCenter;

        const shift =
          clamp(
            centerOffset *
            -0.052,
            -42,
            42
          );

        bg.style.setProperty(
          "--pano-shift",
          `${shift.toFixed(1)}px`
        );
      }
    );


    /* Portada */

    if (heroTextScroll) {

      const hero =
        heroTextScroll.closest(
          ".hero"
        );

      if (hero) {

        const rect =
          hero.getBoundingClientRect();

        const progress =
          clamp(
            -rect.top /
            Math.max(
              1,
              rect.height
            ),
            0,
            1
          );

        const move =
          mobile
            ? progress * 12
            : progress * 28;

        heroTextScroll.style.transform =
          `translate3d(0, ${move.toFixed(1)}px, 0) scale(${(1 - progress * .012).toFixed(4)})`;

        heroTextScroll.style.opacity =
          String(
            Math.max(
              .82,
              1 -
              progress *
              .18
            )
          );
      }
    }
  }


  function requestCinematicUpdate() {

    if (cinematicTicking) {
      return;
    }

    cinematicTicking = true;

    requestAnimationFrame(
      updateCinematicScroll
    );
  }


  window.addEventListener(
    "scroll",
    requestCinematicUpdate,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    requestCinematicUpdate
  );

  reduceMotion.addEventListener?.(
    "change",
    requestCinematicUpdate
  );

  updateCinematicScroll();


  /* ---------------- REVELADO ESCALONADO ---------------- */

  const scrollRevealSelector = [
    ".museum-gateway-card",
    ".historia-resumen-card",
    ".historia-resumen-bloque",
    ".juan-story-timeline article",
    ".valor-card",
    ".simbolo-defs > div",
    ".route-stat",
    ".timeline-item",
    ".agenda-feature",
    ".agenda-item",
    ".alerts-benefits li"
  ].join(",");


  const staggerItems =
    Array.from(
      document.querySelectorAll(
        scrollRevealSelector
      )
    );


  staggerItems.forEach(
    (item, index) => {

      item.classList.add(
        "scroll-reveal-item"
      );

      item.style.setProperty(
        "--scroll-delay",
        `${(index % 4) * 62}ms`
      );
    }
  );


  if (
    "IntersectionObserver" in window &&
    !reduceMotion.matches
  ) {

    const itemObserver =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            entry => {

              if (!entry.isIntersecting) {
                return;
              }

              entry.target.classList.add(
                "is-revealed"
              );

              itemObserver.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: .10,
          rootMargin:
            "0px 0px -4% 0px"
        }
      );


    staggerItems.forEach(
      item =>
        itemObserver.observe(item)
    );

  } else {

    staggerItems.forEach(
      item =>
        item.classList.add(
          "is-revealed"
        )
    );
  }


  /* ---------------- MENÚ MÓVIL ---------------- */

  const navToggle =
    document.getElementById(
      "navToggle"
    );

  const mainNav =
    document.getElementById(
      "mainNav"
    );


  function cerrarNav() {

    if (!mainNav || !navToggle) {
      return;
    }

    mainNav.classList.remove(
      "is-open"
    );

    navToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    navToggle.classList.remove(
      "is-active"
    );
  }


  if (navToggle && mainNav) {

    navToggle.addEventListener(
      "click",
      () => {

        const abierto =
          mainNav.classList.toggle(
            "is-open"
          );

        navToggle.classList.toggle(
          "is-active",
          abierto
        );

        navToggle.setAttribute(
          "aria-expanded",
          String(abierto)
        );
      }
    );


    mainNav
      .querySelectorAll("a")
      .forEach(
        a =>
          a.addEventListener(
            "click",
            cerrarNav
          )
      );


    document.addEventListener(
      "keydown",
      (e) => {

        if (
          e.key === "Escape" &&
          mainNav.classList.contains(
            "is-open"
          )
        ) {
          cerrarNav();
        }
      }
    );
  }


  /* ---------------- UTILIDAD ---------------- */

  function escapeHTML(str) {

    const div =
      document.createElement("div");

    div.textContent =
      String(str ?? "");

    return div.innerHTML;
  }


  /* ---------------- MUSEO DIGITAL: ACORDEÓN ---------------- */

  document
    .querySelectorAll(
      "[data-museum-accordion]"
    )
    .forEach(
      (card) => {

        const trigger =
          card.querySelector(
            ".museum-accordion-trigger"
          );

        const panel =
          card.querySelector(
            ".museum-accordion-panel"
          );

        const label =
          card.querySelector(
            ".museum-accordion-label"
          );


        if (!trigger || !panel) {
          return;
        }


        trigger.addEventListener(
          "click",
          () => {

            const open =
              !card.classList.contains(
                "is-open"
              );

            card.classList.toggle(
              "is-open",
              open
            );

            trigger.setAttribute(
              "aria-expanded",
              String(open)
            );

            panel.setAttribute(
              "aria-hidden",
              String(!open)
            );

            if (label) {
              label.textContent =
                open
                  ? "Ocultar historia ↑"
                  : "Ver historia del recorrido ↓";
            }
          }
        );
      }
    );


  /* ---------------- GALERÍA ---------------- */

  const galeriaPanelsEl =
    document.querySelector(
      ".gallery-panels"
    );


  if (galeriaPanelsEl) {

    const track =
      galeriaPanelsEl.querySelector(
        ".gallery-grid"
      );

    const items =
      track
        ? Array.from(
            track.querySelectorAll(
              ".gallery-item"
            )
          )
        : [];


    if (track && items.length) {

      galeriaPanelsEl.classList.add(
        "gallery-depth-experience"
      );

      track.classList.add(
        "gallery-depth-track"
      );


      const hint =
        document.createElement("p");

      hint.className =
        "gallery-hint gallery-depth-hint";

      hint.textContent =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches
          ? "Desplázate con la rueda, arrastra o usa las flechas para explorar la memoria gráfica."
          : "Desliza con el dedo para explorar la memoria gráfica.";


      galeriaPanelsEl.insertAdjacentElement(
        "beforebegin",
        hint
      );


      const controls =
        document.createElement("div");

      controls.className =
        "gallery-carousel-controls gallery-depth-controls";

      controls.innerHTML = `
        <div class="gallery-carousel-status" aria-live="polite">
          <strong data-gallery-current>01</strong>
          <span>/</span>
          <span data-gallery-total>${String(items.length).padStart(2, "0")}</span>
        </div>

        <div class="gallery-carousel-actions">
          <button
            type="button"
            class="gallery-carousel-btn"
            data-gallery-prev
            aria-label="Fotografía anterior">

            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button
            type="button"
            class="gallery-carousel-btn"
            data-gallery-next
            aria-label="Fotografía siguiente">

            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
      `;


      galeriaPanelsEl.insertAdjacentElement(
        "beforebegin",
        controls
      );


      const progress =
        document.createElement("div");

      progress.className =
        "gallery-carousel-progress gallery-depth-progress";

      progress.setAttribute(
        "aria-hidden",
        "true"
      );

      progress.innerHTML =
        "<span></span>";


      galeriaPanelsEl.insertAdjacentElement(
        "afterend",
        progress
      );


      const currentEl =
        controls.querySelector(
          "[data-gallery-current]"
        );

      const prevBtn =
        controls.querySelector(
          "[data-gallery-prev]"
        );

      const nextBtn =
        controls.querySelector(
          "[data-gallery-next]"
        );

      const progressFill =
        progress.querySelector("span");

      const reduceMotionGallery =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      const finePointer =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        );


      let activeIndex = 0;
      let rafId = 0;
      let dragging = false;
      let dragged = false;
      let dragStartX = 0;
      let dragStartScroll = 0;


      function updateGalleryDepth() {

        rafId = 0;

        const viewport =
          track.getBoundingClientRect();

        const center =
          viewport.left +
          viewport.width / 2;

        let nearest = 0;

        let nearestDistance =
          Infinity;


        items.forEach(
          (item, index) => {

            const rect =
              item.getBoundingClientRect();

            const itemCenter =
              rect.left +
              rect.width / 2;

            const signed =
              (
                itemCenter -
                center
              ) /
              Math.max(
                rect.width,
                1
              );

            const distance =
              Math.min(
                1.5,
                Math.abs(signed)
              );


            if (
              distance <
              nearestDistance
            ) {
              nearestDistance =
                distance;

              nearest = index;
            }


            if (!reduceMotionGallery) {

              const scale =
                1 -
                Math.min(
                  distance *
                  0.105,
                  0.16
                );

              const lift =
                Math.min(
                  distance * 22,
                  24
                );

              const rotate =
                Math.max(
                  -8,
                  Math.min(
                    8,
                    signed * -5.5
                  )
                );

              const opacity =
                1 -
                Math.min(
                  distance * 0.28,
                  0.42
                );


              item.style.transform =
                `perspective(1000px) translateY(${lift}px) rotateY(${rotate}deg) scale(${scale})`;

              item.style.opacity =
                opacity.toFixed(3);

              item.style.zIndex =
                String(
                  100 -
                  Math.round(
                    distance * 20
                  )
                );

            } else {

              item.style.transform = "";
              item.style.opacity = "";
              item.style.zIndex = "";
            }
          }
        );


        if (
          nearest !== activeIndex ||
          !items[
            activeIndex
          ]?.classList.contains(
            "is-gallery-active"
          )
        ) {

          activeIndex =
            nearest;

          items.forEach(
            (item, index) =>
              item.classList.toggle(
                "is-gallery-active",
                index === activeIndex
              )
          );
        }


        if (currentEl) {
          currentEl.textContent =
            String(
              activeIndex + 1
            ).padStart(
              2,
              "0"
            );
        }


        const maxScroll =
          Math.max(
            1,
            track.scrollWidth -
            track.clientWidth
          );


        const pct =
          Math.max(
            0,
            Math.min(
              100,
              (
                track.scrollLeft /
                maxScroll
              ) *
              100
            )
          );


        if (progressFill) {
          progressFill.style.width =
            `${Math.max(2.5, pct)}%`;
        }


        if (prevBtn) {
          prevBtn.disabled =
            track.scrollLeft <= 3;
        }

        if (nextBtn) {
          nextBtn.disabled =
            track.scrollLeft >=
            maxScroll - 3;
        }
      }


      function scheduleGalleryUpdate() {

        if (!rafId) {
          rafId =
            requestAnimationFrame(
              updateGalleryDepth
            );
        }
      }


      function goToItem(index) {

        const target =
          items[
            Math.max(
              0,
              Math.min(
                items.length - 1,
                index
              )
            )
          ];


        if (!target) {
          return;
        }


        const left =
          target.offsetLeft -
          (
            track.clientWidth -
            target.clientWidth
          ) /
          2;


        track.scrollTo({
          left,
          behavior:
            reduceMotionGallery
              ? "auto"
              : "smooth"
        });
      }


      prevBtn?.addEventListener(
        "click",
        () =>
          goToItem(
            activeIndex - 1
          )
      );


      nextBtn?.addEventListener(
        "click",
        () =>
          goToItem(
            activeIndex + 1
          )
      );


      track.addEventListener(
        "wheel",
        (e) => {

          if (
            !finePointer.matches
          ) {
            return;
          }


          const dominant =
            Math.abs(e.deltaY) >=
            Math.abs(e.deltaX)
              ? e.deltaY
              : e.deltaX;


          if (!dominant) {
            return;
          }


          const maxScroll =
            track.scrollWidth -
            track.clientWidth;


          const canMoveForward =
            dominant > 0 &&
            track.scrollLeft <
              maxScroll - 2;


          const canMoveBack =
            dominant < 0 &&
            track.scrollLeft > 2;


          if (
            canMoveForward ||
            canMoveBack
          ) {

            e.preventDefault();

            track.scrollLeft +=
              dominant * 1.05;

            scheduleGalleryUpdate();
          }
        },
        {
          passive: false
        }
      );


      track.addEventListener(
        "pointerdown",
        (e) => {

          if (
            e.pointerType !==
            "mouse"
          ) {
            return;
          }

          dragging = true;
          dragged = false;

          dragStartX =
            e.clientX;

          dragStartScroll =
            track.scrollLeft;

          track.classList.add(
            "is-grabbing"
          );

          track.setPointerCapture?.(
            e.pointerId
          );
        }
      );


      track.addEventListener(
        "pointermove",
        (e) => {

          if (
            !dragging ||
            e.pointerType !==
              "mouse"
          ) {
            return;
          }

          const dx =
            e.clientX -
            dragStartX;

          if (
            Math.abs(dx) > 4
          ) {
            dragged = true;
          }

          track.scrollLeft =
            dragStartScroll -
            dx;

          scheduleGalleryUpdate();
        }
      );


      function stopDrag(e) {

        if (!dragging) {
          return;
        }

        dragging = false;

        track.classList.remove(
          "is-grabbing"
        );

        if (
          e?.pointerId != null
        ) {
          track.releasePointerCapture?.(
            e.pointerId
          );
        }
      }


      track.addEventListener(
        "pointerup",
        stopDrag
      );

      track.addEventListener(
        "pointercancel",
        stopDrag
      );

      track.addEventListener(
        "pointerleave",
        (e) => {

          if (
            dragging &&
            e.buttons === 0
          ) {
            stopDrag(e);
          }
        }
      );


      track.addEventListener(
        "click",
        (e) => {

          if (!dragged) {
            return;
          }

          e.preventDefault();
          e.stopImmediatePropagation();

          dragged = false;
        },
        true
      );


      items.forEach(
        (item, index) => {

          const img =
            item.querySelector("img");

          if (!img) {
            return;
          }

          img.addEventListener(
            "focus",
            () => {

              if (
                index !==
                activeIndex
              ) {
                goToItem(index);
              }
            }
          );
        }
      );


      track.addEventListener(
        "scroll",
        scheduleGalleryUpdate,
        {
          passive: true
        }
      );

      window.addEventListener(
        "resize",
        scheduleGalleryUpdate
      );


      track.setAttribute(
        "tabindex",
        "0"
      );

      track.setAttribute(
        "role",
        "region"
      );

      track.setAttribute(
        "aria-label",
        "Memoria gráfica de la BANDERA SIERA"
      );


      track.addEventListener(
        "keydown",
        (e) => {

          if (
            e.key ===
            "ArrowRight"
          ) {
            e.preventDefault();

            goToItem(
              activeIndex + 1
            );
          }

          if (
            e.key ===
            "ArrowLeft"
          ) {
            e.preventDefault();

            goToItem(
              activeIndex - 1
            );
          }
        }
      );


      requestAnimationFrame(
        () => {
          goToItem(0);
          updateGalleryDepth();
        }
      );
    }
  }


  /* ---------------- PLAYERAS ---------------- */

  const playerasShowcase =
    document.querySelector(
      ".recorrido-shirts-showcase"
    );


  if (playerasShowcase) {

    const playerasTrack =
      playerasShowcase.querySelector(
        ".recorrido-shirts-track"
      );


    const playerasItems =
      playerasTrack
        ? Array.from(
            playerasTrack.querySelectorAll(
              ".recorrido-shirt-card"
            )
          )
        : [];


    if (
      playerasTrack &&
      playerasItems.length
    ) {

      const header =
        playerasShowcase.querySelector(
          ".recorrido-shirts-header"
        );


      const hint =
        document.createElement("p");

      hint.className =
        "recorrido-shirts-hint";

      hint.textContent =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches
          ? "Desplázate con la rueda, arrastra o usa las flechas."
          : "Desliza con el dedo para explorar.";


      header?.insertAdjacentElement(
        "afterend",
        hint
      );


      const controls =
        document.createElement("div");

      controls.className =
        "shirts-carousel-controls";


      controls.innerHTML = `
        <div
          class="shirts-carousel-status"
          aria-live="polite">

          <strong data-shirts-current>
            01
          </strong>

          <span>/</span>

          <span data-shirts-total>
            ${String(playerasItems.length).padStart(2, "0")}
          </span>
        </div>

        <div class="shirts-carousel-actions">

          <button
            type="button"
            class="shirts-carousel-btn"
            data-shirts-prev
            aria-label="Playera anterior">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button
            type="button"
            class="shirts-carousel-btn"
            data-shirts-next
            aria-label="Playera siguiente">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </button>

        </div>
      `;


      hint.insertAdjacentElement(
        "afterend",
        controls
      );


      const progress =
        document.createElement("div");

      progress.className =
        "shirts-carousel-progress";

      progress.setAttribute(
        "aria-hidden",
        "true"
      );

      progress.innerHTML =
        "<span></span>";

      playerasShowcase.appendChild(
        progress
      );


      const currentEl =
        controls.querySelector(
          "[data-shirts-current]"
        );

      const prevBtn =
        controls.querySelector(
          "[data-shirts-prev]"
        );

      const nextBtn =
        controls.querySelector(
          "[data-shirts-next]"
        );

      const progressFill =
        progress.querySelector(
          "span"
        );


      const reduceMotionShirts =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;


      const finePointer =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        );


      let activeIndex = 0;
      let rafId = 0;
      let dragging = false;
      let dragged = false;
      let dragStartX = 0;
      let dragStartScroll = 0;


      function updateShirtsDepth() {

        rafId = 0;


        const viewport =
          playerasTrack.getBoundingClientRect();


        const center =
          viewport.left +
          viewport.width / 2;


        let nearest = 0;

        let nearestDistance =
          Infinity;


        playerasItems.forEach(
          (item, index) => {

            const rect =
              item.getBoundingClientRect();

            const itemCenter =
              rect.left +
              rect.width / 2;

            const signed =
              (
                itemCenter -
                center
              ) /
              Math.max(
                rect.width,
                1
              );

            const distance =
              Math.min(
                1.5,
                Math.abs(signed)
              );


            if (
              distance <
              nearestDistance
            ) {

              nearestDistance =
                distance;

              nearest =
                index;
            }


            if (!reduceMotionShirts) {

              const scale =
                1 -
                Math.min(
                  distance *
                  0.085,
                  0.13
                );

              const lift =
                Math.min(
                  distance *
                  15,
                  18
                );

              const rotate =
                Math.max(
                  -6,
                  Math.min(
                    6,
                    signed *
                    -4.2
                  )
                );

              const opacity =
                1 -
                Math.min(
                  distance *
                  0.24,
                  0.36
                );


              item.style.transform =
                `perspective(1000px) translateY(${lift}px) rotateY(${rotate}deg) scale(${scale})`;

              item.style.opacity =
                opacity.toFixed(3);

              item.style.zIndex =
                String(
                  100 -
                  Math.round(
                    distance *
                    20
                  )
                );

            } else {

              item.style.transform = "";
              item.style.opacity = "";
              item.style.zIndex = "";
            }
          }
        );


        activeIndex =
          nearest;


        playerasItems.forEach(
          (item, index) => {

            item.classList.toggle(
              "is-shirt-active",
              index === activeIndex
            );
          }
        );


        if (currentEl) {
          currentEl.textContent =
            String(
              activeIndex + 1
            ).padStart(
              2,
              "0"
            );
        }


        const maxScroll =
          Math.max(
            1,
            playerasTrack.scrollWidth -
            playerasTrack.clientWidth
          );


        const pct =
          Math.max(
            0,
            Math.min(
              100,
              (
                playerasTrack.scrollLeft /
                maxScroll
              ) *
              100
            )
          );


        if (progressFill) {
          progressFill.style.width =
            `${Math.max(3, pct)}%`;
        }


        if (prevBtn) {
          prevBtn.disabled =
            playerasTrack.scrollLeft <= 3;
        }

        if (nextBtn) {
          nextBtn.disabled =
            playerasTrack.scrollLeft >=
            maxScroll - 3;
        }
      }


      function scheduleShirtsUpdate() {

        if (!rafId) {
          rafId =
            requestAnimationFrame(
              updateShirtsDepth
            );
        }
      }


      function goToShirt(index) {

        const target =
          playerasItems[
            Math.max(
              0,
              Math.min(
                playerasItems.length - 1,
                index
              )
            )
          ];


        if (!target) {
          return;
        }


        const left =
          target.offsetLeft -
          (
            playerasTrack.clientWidth -
            target.clientWidth
          ) /
          2;


        playerasTrack.scrollTo({
          left,
          behavior:
            reduceMotionShirts
              ? "auto"
              : "smooth"
        });
      }


      prevBtn?.addEventListener(
        "click",
        () =>
          goToShirt(
            activeIndex - 1
          )
      );


      nextBtn?.addEventListener(
        "click",
        () =>
          goToShirt(
            activeIndex + 1
          )
      );


      playerasTrack.addEventListener(
        "wheel",
        (e) => {

          if (
            !finePointer.matches
          ) {
            return;
          }


          const dominant =
            Math.abs(e.deltaY) >=
            Math.abs(e.deltaX)
              ? e.deltaY
              : e.deltaX;


          if (!dominant) {
            return;
          }


          const maxScroll =
            playerasTrack.scrollWidth -
            playerasTrack.clientWidth;


          const canForward =
            dominant > 0 &&
            playerasTrack.scrollLeft <
              maxScroll - 2;


          const canBack =
            dominant < 0 &&
            playerasTrack.scrollLeft >
              2;


          if (
            canForward ||
            canBack
          ) {

            e.preventDefault();

            playerasTrack.scrollLeft +=
              dominant * 1.02;

            scheduleShirtsUpdate();
          }
        },
        {
          passive: false
        }
      );


      playerasTrack.addEventListener(
        "pointerdown",
        (e) => {

          if (
            e.pointerType !==
            "mouse"
          ) {
            return;
          }


          dragging = true;
          dragged = false;

          dragStartX =
            e.clientX;

          dragStartScroll =
            playerasTrack.scrollLeft;


          playerasTrack.classList.add(
            "is-grabbing"
          );


          playerasTrack.setPointerCapture?.(
            e.pointerId
          );
        }
      );


      playerasTrack.addEventListener(
        "pointermove",
        (e) => {

          if (
            !dragging ||
            e.pointerType !==
              "mouse"
          ) {
            return;
          }


          const dx =
            e.clientX -
            dragStartX;


          if (
            Math.abs(dx) >
            4
          ) {
            dragged = true;
          }


          playerasTrack.scrollLeft =
            dragStartScroll -
            dx;


          scheduleShirtsUpdate();
        }
      );


      function stopShirtsDrag(e) {

        if (!dragging) {
          return;
        }

        dragging = false;

        playerasTrack.classList.remove(
          "is-grabbing"
        );


        if (
          e?.pointerId !=
          null
        ) {

          playerasTrack.releasePointerCapture?.(
            e.pointerId
          );
        }
      }


      playerasTrack.addEventListener(
        "pointerup",
        stopShirtsDrag
      );

      playerasTrack.addEventListener(
        "pointercancel",
        stopShirtsDrag
      );

      playerasTrack.addEventListener(
        "pointerleave",
        (e) => {

          if (
            dragging &&
            e.buttons === 0
          ) {

            stopShirtsDrag(e);
          }
        }
      );


      playerasTrack.addEventListener(
        "click",
        (e) => {

          if (!dragged) {
            return;
          }

          e.preventDefault();

          e.stopImmediatePropagation();

          dragged = false;
        },
        true
      );


      playerasTrack.addEventListener(
        "scroll",
        scheduleShirtsUpdate,
        {
          passive: true
        }
      );


      window.addEventListener(
        "resize",
        scheduleShirtsUpdate
      );


      playerasTrack.setAttribute(
        "tabindex",
        "0"
      );

      playerasTrack.setAttribute(
        "role",
        "region"
      );


      playerasTrack.setAttribute(
        "aria-label",
        "Carrusel de playeras conmemorativas del Recorrido de la Insurgencia"
      );


      playerasTrack.addEventListener(
        "keydown",
        (e) => {

          if (
            e.key ===
            "ArrowRight"
          ) {

            e.preventDefault();

            goToShirt(
              activeIndex + 1
            );
          }


          if (
            e.key ===
            "ArrowLeft"
          ) {

            e.preventDefault();

            goToShirt(
              activeIndex - 1
            );
          }
        }
      );


      requestAnimationFrame(
        () => {

          goToShirt(0);

          updateShirtsDepth();
        }
      );
    }
  }


  /* ---------------- ESCUDO ---------------- */

  function activarDibujoDeEscudo(svgEl) {

    if (!svgEl) {
      return;
    }


    const trazos =
      svgEl.querySelectorAll(
        ".st-line"
      );


    trazos.forEach(
      trazo => {

        try {

          const largo =
            trazo.getTotalLength();

          trazo.style.strokeDasharray =
            largo;

          trazo.style.strokeDashoffset =
            largo;

        } catch {

        }
      }
    );


    svgEl.classList.add(
      "isotipo-dibujar"
    );


    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {

      trazos.forEach(
        trazo => {
          trazo.style.strokeDashoffset =
            "0";
        }
      );

      return;
    }


    const dibujoObserver =
      new IntersectionObserver(
        (entradas) => {

          entradas.forEach(
            entrada => {

              if (
                entrada.isIntersecting
              ) {

                trazos.forEach(
                  (trazo, i) => {

                    setTimeout(
                      () => {
                        trazo.style.strokeDashoffset =
                          "0";
                      },
                      i * 70
                    );
                  }
                );


                dibujoObserver.unobserve(
                  entrada.target
                );
              }
            }
          );
        },
        {
          threshold: 0.4
        }
      );


    dibujoObserver.observe(
      svgEl
    );
  }


  activarDibujoDeEscudo(
    document.querySelector(
      ".intro-card .isotipo"
    )
  );


  activarDibujoDeEscudo(
    document.querySelector(
      ".simbolismo-shield .isotipo"
    )
  );


  /* ---------------- SIMBOLISMO ---------------- */

  const escudoGrande =
    document.querySelector(
      ".simbolismo-shield .isotipo"
    );


  if (escudoGrande) {

    const trazosEscudo =
      escudoGrande.querySelectorAll(
        ".st-line"
      );


    const gruposEscudo = {
      flechas: [
        0,
        1,
        2,
        3,
        4
      ],

      carcaj: [
        6
      ],

      sable: [
        7
      ],

      arco: [
        8
      ]
    };


    document
      .querySelectorAll(
        ".simbolo-defs > div"
      )
      .forEach(
        bloque => {

          const titulo =
            bloque.querySelector(
              "h4"
            );

          if (!titulo) {
            return;
          }


          const clave =
            titulo.textContent
              .trim()
              .toLowerCase();


          const indices =
            gruposEscudo[
              clave
            ];


          if (!indices) {
            return;
          }


          const resaltar =
            (activo) => {

              indices.forEach(
                i => {

                  const trazo =
                    trazosEscudo[i];

                  if (trazo) {

                    trazo.classList.toggle(
                      "is-highlight",
                      activo
                    );
                  }
                }
              );
            };


          bloque.addEventListener(
            "mouseenter",
            () =>
              resaltar(true)
          );


          bloque.addEventListener(
            "mouseleave",
            () =>
              resaltar(false)
          );
        }
      );
  }


  /* ---------------- VALORES ---------------- */

  function mejorarValores() {

    const seccionValores =
      document.getElementById(
        "valores"
      );


    if (!seccionValores) {
      return;
    }


    const plantillaEscudo =
      document.querySelector(
        ".brand .isotipo, .intro-card .isotipo"
      );


    function crearOrnamento() {

      const ornamento =
        document.createElement(
          "div"
        );

      ornamento.className =
        "valores-ornament";

      ornamento.setAttribute(
        "aria-hidden",
        "true"
      );


      const l1 =
        document.createElement(
          "span"
        );

      l1.className =
        "rule-line";


      const l2 =
        document.createElement(
          "span"
        );

      l2.className =
        "rule-line";


      ornamento.appendChild(
        l1
      );


      if (plantillaEscudo) {

        ornamento.appendChild(
          plantillaEscudo.cloneNode(
            true
          )
        );
      }


      ornamento.appendChild(
        l2
      );


      return ornamento;
    }


    const tituloValores =
      seccionValores.querySelector(
        ".eyebrow"
      );


    if (tituloValores) {

      const ornamento =
        crearOrnamento();


      tituloValores.insertAdjacentElement(
        "beforebegin",
        ornamento
      );


      const kicker =
        document.createElement(
          "span"
        );


      kicker.className =
        "valores-kicker";


      kicker.textContent =
        "Nuestros";


      tituloValores.insertAdjacentElement(
        "beforebegin",
        kicker
      );
    }


    const etiquetasPorValor = {
      patriotismo:
        "Unidos por nuestra historia",

      solidaridad:
        "Juntos somos más fuertes",

      respeto:
        "Valoramos a cada persona",

      libertad:
        "Expresamos nuestra identidad"
    };


    const coloresPanel = [
      "var(--verde-dark)",
      "var(--rojo-dark)",
      "var(--tinta)",
      "var(--verde-dark)"
    ];


    const fotosPorValor = {

      patriotismo:
        "assets/images/values/foto-patriotismo.webp",

      solidaridad:
        "assets/images/values/foto-solidaridad.webp",

      respeto:
        "assets/images/values/foto-respeto.webp",

      libertad:
        "assets/images/values/foto-libertad.webp"
    };


    seccionValores
      .querySelectorAll(
        ".valor-card"
      )
      .forEach(
        (tarjeta, i) => {

          const icono =
            tarjeta.querySelector(
              ".valor-icon"
            );

          const h3 =
            tarjeta.querySelector(
              "h3"
            );


          const textoDiv =
            h3
              ? h3.parentElement
              : null;


          if (
            !icono ||
            !textoDiv
          ) {
            return;
          }


          const contenido =
            document.createElement(
              "div"
            );


          contenido.className =
            "valor-content";


          const cabecera =
            document.createElement(
              "div"
            );


          cabecera.className =
            "valor-content-head";


          tarjeta.insertBefore(
            contenido,
            icono
          );


          cabecera.append(
            icono,
            textoDiv
          );


          contenido.appendChild(
            cabecera
          );


          const divisor =
            document.createElement(
              "span"
            );


          divisor.className =
            "valor-divider";


          divisor.setAttribute(
            "aria-hidden",
            "true"
          );


          h3.insertAdjacentElement(
            "afterend",
            divisor
          );


          const clave =
            h3.textContent
              .trim()
              .toLowerCase();


          const frase =
            etiquetasPorValor[
              clave
            ];


          if (frase) {

            const tag =
              document.createElement(
                "div"
              );


            tag.className =
              "valor-tag";


            tag.innerHTML = `
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true">

                <path d="M17 20a4 4 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>

              <span>
                ${frase}
              </span>
            `;


            contenido.appendChild(
              tag
            );
          }


          const panel =
            document.createElement(
              "div"
            );


          panel.className =
            "valor-image";


          panel.style.setProperty(
            "--img-bg",
            coloresPanel[
              i %
              coloresPanel.length
            ]
          );


          const rutaFoto =
            fotosPorValor[
              clave
            ];


          if (rutaFoto) {

            const foto =
              document.createElement(
                "img"
              );


            foto.src =
              rutaFoto;


            foto.alt =
              `Fotografía representando el valor de ${clave}`;


            foto.loading =
              "lazy";


            panel.appendChild(
              foto
            );

          } else {

            panel.setAttribute(
              "aria-hidden",
              "true"
            );


            const svgOriginal =
              icono.querySelector(
                "svg, img"
              );


            if (svgOriginal) {

              const envoltorio =
                document.createElement(
                  "span"
                );


              envoltorio.className =
                "valor-image-icon";


              envoltorio.appendChild(
                svgOriginal.cloneNode(
                  true
                )
              );


              panel.appendChild(
                envoltorio
              );
            }


            const nota =
              document.createElement(
                "span"
              );


            nota.className =
              "valor-image-note";


            nota.textContent =
              "Espacio para fotografía";


            panel.appendChild(
              nota
            );
          }


          tarjeta.appendChild(
            panel
          );
        }
      );


    const grid =
      seccionValores.querySelector(
        ".valores-grid"
      );


    if (grid) {

      const cierre =
        document.createElement(
          "div"
        );


      cierre.className =
        "valores-close";


      cierre.appendChild(
        crearOrnamento()
      );


      const frase =
        document.createElement(
          "p"
        );


      frase.className =
        "valores-quote";


      frase.innerHTML = `
        <span class="valores-quote-mark">“</span>
        Nuestra fuerza está en nuestra historia y en cada municipio que la sostiene.
        <span class="valores-quote-mark">”</span>
      `;


      const atrib =
        document.createElement(
          "p"
        );


      atrib.className =
        "valores-attrib";


      atrib.textContent =
        "— Recorrido de la BANDERA SIERA";


      cierre.append(
        frase,
        atrib
      );


      grid.insertAdjacentElement(
        "afterend",
        cierre
      );
    }
  }


  mejorarValores();


  /* ---------------- LIGHTBOX ---------------- */

  const imagenesAmpliables =
    document.querySelectorAll(
      ".simbolismo-flag img, " +
      ".gallery-item img, " +
      ".recorrido-shirt-card img, " +
      ".story-media img, " +
      ".story-doc-card img, " +
      ".bandera-researcher-media img, " +
      ".recorrido-origin-media img, " +
      ".program-shirt-card img, " +
      ".valor-image img"
    );


  if (
    imagenesAmpliables.length
  ) {

    const overlay =
      document.createElement(
        "div"
      );


    overlay.className =
      "lightbox-overlay";


    overlay.setAttribute(
      "role",
      "dialog"
    );


    overlay.setAttribute(
      "aria-modal",
      "true"
    );


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );


    overlay.setAttribute(
      "aria-label",
      "Visor de imagen ampliada"
    );


    overlay.innerHTML = `
      <button
        type="button"
        class="lightbox-close"
        aria-label="Cerrar imagen ampliada">

        &times;
      </button>

      <img alt="">
    `;


    document.body.appendChild(
      overlay
    );


    const imgGrande =
      overlay.querySelector(
        "img"
      );


    const closeButton =
      overlay.querySelector(
        ".lightbox-close"
      );


    let ultimoFoco =
      null;


    function abrirLightbox(
      origen
    ) {

      if (
        !origen ||
        !origen.src
      ) {
        return;
      }


      ultimoFoco =
        document.activeElement;


      imgGrande.src =
        origen.currentSrc ||
        origen.src;


      imgGrande.alt =
        origen.alt ||
        "Imagen ampliada";


      overlay.classList.add(
        "is-open"
      );


      overlay.setAttribute(
        "aria-hidden",
        "false"
      );


      document.body.style.overflow =
        "hidden";


      requestAnimationFrame(
        () =>
          closeButton.focus()
      );
    }


    function cerrarLightbox() {

      if (
        !overlay.classList.contains(
          "is-open"
        )
      ) {
        return;
      }


      overlay.classList.remove(
        "is-open"
      );


      overlay.setAttribute(
        "aria-hidden",
        "true"
      );


      document.body.style.overflow =
        "";


      imgGrande.removeAttribute(
        "src"
      );


      if (
        ultimoFoco &&
        typeof ultimoFoco.focus ===
          "function"
      ) {

        ultimoFoco.focus();
      }
    }


    imagenesAmpliables.forEach(
      img => {

        img.style.cursor =
          "zoom-in";


        img.setAttribute(
          "tabindex",
          "0"
        );


        img.setAttribute(
          "role",
          "button"
        );


        if (
          !img.getAttribute(
            "aria-label"
          )
        ) {

          img.setAttribute(
            "aria-label",
            `Ampliar imagen: ${
              img.alt ||
              "fotografía"
            }`
          );
        }


        img.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            abrirLightbox(
              img
            );
          }
        );


        img.addEventListener(
          "keydown",
          event => {

            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {

              event.preventDefault();

              abrirLightbox(
                img
              );
            }
          }
        );
      }
    );


    closeButton.addEventListener(
      "click",
      cerrarLightbox
    );


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {

          cerrarLightbox();
        }
      }
    );


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Escape" &&
          overlay.classList.contains(
            "is-open"
          )
        ) {

          cerrarLightbox();
        }
      }
    );
  }


  /* ---------------- MAPA ---------------- */

  const RECORRIDO_EN_VIVO = {
    activo: false,
    finalizado: false,
    paradaActual: 0,
    ultimaActualizacion: ""
  };


  const RUTA = [

    {
      nombre: "Tehuacán",
      estado: "Puebla",
      lat: 18.4665063,
      lng: -97.4003801,

      foto:
        "assets/images/route/mapi-40-tehuacan.webp",

      historia:
        "Punto de salida del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "8:00 a. m.",

      salida:
        "9:25 a. m.",

      traslado:
        "75 min",

      responsable:
        "Lic. Ignacio Ramírez Flores",

      recibe:
        "Palacio Municipal",

      entrega:
        "Gasolinera de salida de Tehuacán, carretera libre"
    },

    {
      nombre: "Acultzingo",
      estado: "Veracruz",
      lat: 18.7157218,
      lng: -97.3057581,

      foto:
        "assets/images/route/mapi-41-acultzingo.webp",

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "10:40 a. m.",

      salida:
        "11:10 a. m.",

      traslado:
        "40 min",

      responsable:
        "Lic. Merly Cristina Lara Pérez",

      recibe:
        "Puerto del Aire",

      entrega:
        "A la altura de Ojo Zarco"
    },

    {
      nombre:
        "Maltrata",

      estado:
        "Veracruz",

      lat:
        18.8109128,

      lng:
        -97.2780102,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "10:40 a. m.",

      salida:
        "11:20 a. m.",

      traslado:
        "30 min",

      responsable:
        "Profr. Bartolo Carrera González",

      recibe:
        "Explanada del Palacio Municipal",

      entrega:
        "Recorrido por calles principales"
    },

    {
      nombre:
        "Ciudad Mendoza",

      estado:
        "Veracruz",

      lat:
        18.8042090,

      lng:
        -97.1808552,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "11:50 a. m.",

      salida:
        "12:10 p. m.",

      traslado:
        "30 min",

      responsable:
        "Lic. Janeth Guadalupe Ortega Meza",

      recibe:
        "A la altura de la Clínica de Pemex",

      entrega:
        "A la altura de La Choza"
    },

    {
      nombre:
        "Huiloapan",

      estado:
        "Veracruz",

      lat:
        18.8175606,

      lng:
        -97.1534390,

      foto:
        "assets/images/route/bandera-siera-huiloapan.webp",

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "12:40 p. m.",

      salida:
        "1:10 p. m.",

      traslado:
        "20 min",

      responsable:
        "Lic. Getulio Alfaro Carrera",

      recibe:
        "A la altura de La Choza",

      entrega:
        "A la altura de la fábrica Sivesa"
    },

    {
      nombre:
        "Nogales",

      estado:
        "Veracruz",

      lat:
        18.8213983,

      lng:
        -97.1624594,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "1:30 p. m.",

      salida:
        "2:00 p. m.",

      traslado:
        "20 min",

      responsable:
        "Profra. Nadia Irais Mazahua Hernández",

      recibe:
        "A la altura de la fábrica Sivesa",

      entrega:
        "A la altura de Pizzas Angeloti"
    },

    {
      nombre:
        "Río Blanco",

      estado:
        "Veracruz",

      lat:
        18.8382010,

      lng:
        -97.1397530,

      foto:
        "assets/images/route/bandera-siera-rio-blanco.webp",

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "2:20 p. m.",

      salida:
        "2:50 p. m.",

      traslado:
        "50 min",

      responsable:
        "Profr. Octavio Temoxtle Dolores",

      recibe:
        "A la altura de Pizzas Angeloti",

      entrega:
        "En Los Arcos, entrada a Orizaba"
    },

    {
      nombre:
        "Orizaba",

      estado:
        "Veracruz",

      lat:
        18.8504744,

      lng:
        -97.1036396,

      foto:
        "assets/images/route/mapi-42-orizaba.webp",

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "3:40 p. m.",

      salida:
        "4:10 p. m.",

      traslado:
        null,

      responsable:
        "Lic. Ignacio Ramírez Flores",

      recibe:
        "En Los Arcos, entrada a Orizaba",

      entrega:
        "A la altura de Alimentos Ochoa"
    },

    {
      nombre:
        "Rafael Delgado",

      estado:
        "Veracruz",

      lat:
        18.8106854,

      lng:
        -97.0721359,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "5:30 p. m.",

      salida:
        "6:00 p. m.",

      traslado:
        "40 min",

      responsable:
        "Profra. Nadia Irais Mazahua Hernández",

      recibe:
        "A la altura de Alimentos Ochoa",

      entrega:
        "A la altura de la iglesia de Jalapilla"
    },

    {
      nombre:
        "Tlilapan",

      estado:
        "Veracruz",

      lat:
        18.8053094,

      lng:
        -97.0978119,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "6:40 p. m.",

      salida:
        "7:10 p. m.",

      traslado:
        "30 min",

      responsable:
        "Lic. Getulio Alfaro Carrera",

      recibe:
        "A la altura de la iglesia de Jalapilla",

      entrega:
        "En el Puente de Matzinga"
    },

    {
      nombre:
        "San Andrés Tenejapan",

      estado:
        "Veracruz",

      lat:
        18.7882037,

      lng:
        -97.0930049,

      foto:
        null,

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "7:40 p. m.",

      salida:
        "8:10 p. m.",

      traslado:
        "50 min",

      responsable:
        "Profr. Octavio Temoxtle Dolores",

      recibe:
        "En el Puente de Matzinga",

      entrega:
        "Cumbre de San Andrés"
    },

    {
      nombre:
        "Tequila",

      estado:
        "Veracruz",

      lat:
        18.7295682,

      lng:
        -97.0711071,

      foto:
        "assets/images/route/mapi-37-tequila.webp",

      historia:
        "Parada oficial del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "9:00 p. m.",

      salida:
        "9:30 p. m.",

      traslado:
        "40 min",

      responsable:
        "Lic. Merly Cristina Lara Pérez",

      recibe:
        "Cumbre de San Andrés",

      entrega:
        "Las Tlaxcas"
    },

    {
      nombre:
        "Los Reyes",

      estado:
        "Veracruz",

      lat:
        18.6730869,

      lng:
        -97.0457357,

      foto:
        null,

      historia:
        "Penúltima parada oficial antes de la llegada a Zongolica.",

      hora:
        "10:10 p. m.",

      salida:
        "10:40 p. m.",

      traslado:
        "10 min",

      responsable:
        "Lic. Ignacio Ramírez Flores",

      recibe:
        "Las Tlaxcas; los corredores parten desde La Hernita hacia Los Reyes",

      entrega:
        "Desviación a la entrada a Los Reyes"
    },

    {
      nombre:
        "Zongolica",

      estado:
        "Veracruz",

      lat:
        18.6668459,

      lng:
        -97.0001223,

      foto:
        "assets/images/route/mapi-38-zongolica.webp",

      historia:
        "Meta del XXXV Recorrido de la BANDERA SIERA.",

      hora:
        "11:00 p. m.",

      salida:
        null,

      traslado:
        null,

      responsable:
        null,

      recibe:
        "Desviación a la entrada a Los Reyes",

      entrega:
        "Palacio Municipal"
    }
  ];


  const mapEl =
    document.getElementById(
      "routeMap"
    );


  const liveRoutePanel =
    document.getElementById(
      "liveRoutePanel"
    );


  const liveRouteBadge =
    document.getElementById(
      "liveRouteBadge"
    );


  const liveCurrentPlace =
    document.getElementById(
      "liveCurrentPlace"
    );


  const liveRouteDescription =
    document.getElementById(
      "liveRouteDescription"
    );


  const liveCurrentMunicipality =
    document.getElementById(
      "liveCurrentMunicipality"
    );


  const liveNextMunicipality =
    document.getElementById(
      "liveNextMunicipality"
    );


  const liveDistance =
    document.getElementById(
      "liveDistance"
    );


  const liveLastUpdate =
    document.getElementById(
      "liveLastUpdate"
    );


  const liveRouteProgressBar =
    document.getElementById(
      "liveRouteProgressBar"
    );


  const focusLiveRoute =
    document.getElementById(
      "focusLiveRoute"
    );


  function distanciaKm(a, b) {

    const R = 6371;

    const rad =
      n =>
        n *
        Math.PI /
        180;


    const dLat =
      rad(
        b.lat -
        a.lat
      );


    const dLng =
      rad(
        b.lng -
        a.lng
      );


    const lat1 =
      rad(a.lat);


    const lat2 =
      rad(b.lat);


    const h =
      Math.sin(
        dLat / 2
      ) ** 2 +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(
        dLng / 2
      ) ** 2;


    return (
      2 *
      R *
      Math.asin(
        Math.sqrt(h)
      )
    );
  }


  const distanciasAcumuladas =
    [0];


  for (
    let i = 1;
    i < RUTA.length;
    i++
  ) {

    distanciasAcumuladas[i] =
      distanciasAcumuladas[
        i - 1
      ] +
      distanciaKm(
        RUTA[i - 1],
        RUTA[i]
      );
  }


  const distanciaGeodesicaTotal =
    distanciasAcumuladas[
      distanciasAcumuladas.length -
      1
    ] ||
    1;


  const kmEstimadosEnParada =
    i =>
      Math.round(
        (
          distanciasAcumuladas[i] /
          distanciaGeodesicaTotal
        ) *
        150
      );


  function estadoParada(i) {

    if (
      RECORRIDO_EN_VIVO.finalizado
    ) {
      return "Llegó";
    }


    if (
      !RECORRIDO_EN_VIVO.activo
    ) {
      return "Pendiente";
    }


    if (
      i <
      RECORRIDO_EN_VIVO.paradaActual
    ) {
      return "Llegó";
    }


    if (
      i ===
      RECORRIDO_EN_VIVO.paradaActual
    ) {
      return "En camino";
    }


    return "Pendiente";
  }


  function claseEstado(estado) {

    if (
      estado ===
      "Llegó"
    ) {
      return "done";
    }


    if (
      estado ===
      "En camino"
    ) {
      return "live";
    }


    return "pending";
  }


  function fechaEventoEstado() {

    const ahora =
      new Date();


    const inicio =
      new Date(
        2026,
        8,
        15,
        0,
        0,
        0
      );


    const cierre =
      new Date(
        2026,
        8,
        16,
        1,
        0,
        0
      );


    if (
      ahora < inicio
    ) {
      return "proximo";
    }


    if (
      ahora > cierre &&
      !RECORRIDO_EN_VIVO.activo
    ) {
      return "finalizado";
    }


    return "dia-evento";
  }


  function pintarPanelEnVivo() {

    if (!liveRoutePanel) {
      return;
    }


    const fase =
      fechaEventoEstado();


    const actualIndex =
      Math.max(
        0,
        Math.min(
          RECORRIDO_EN_VIVO.paradaActual,
          RUTA.length - 1
        )
      );


    const actual =
      RUTA[
        actualIndex
      ];


    const siguiente =
      RUTA[
        Math.min(
          actualIndex + 1,
          RUTA.length - 1
        )
      ];


    if (liveRouteBadge) {
      liveRouteBadge.className =
        "live-route-badge";
    }


    if (
      RECORRIDO_EN_VIVO.finalizado ||
      fase ===
        "finalizado"
    ) {

      if (liveRouteBadge) {
        liveRouteBadge.textContent =
          "RECORRIDO FINALIZADO";

        liveRouteBadge.classList.add(
          "is-finished"
        );
      }


      if (liveCurrentPlace) {
        liveCurrentPlace.textContent =
          "La BANDERA SIERA llegó a Zongolica";
      }


      if (liveRouteDescription) {
        liveRouteDescription.textContent =
          "Consulta en el mapa la ruta completa y las paradas del recorrido.";
      }


      if (liveCurrentMunicipality) {
        liveCurrentMunicipality.textContent =
          "Zongolica, Veracruz";
      }


      if (liveNextMunicipality) {
        liveNextMunicipality.textContent =
          "Meta alcanzada";
      }


      if (liveDistance) {
        liveDistance.textContent =
          "150 km de 150 km";
      }


      if (liveLastUpdate) {
        liveLastUpdate.textContent =
          RECORRIDO_EN_VIVO.ultimaActualizacion ||
          "Recorrido concluido";
      }


      if (liveRouteProgressBar) {
        liveRouteProgressBar.style.width =
          "100%";
      }


      if (focusLiveRoute) {
        focusLiveRoute.textContent =
          "Ver llegada en el mapa";
      }


      return;
    }


    if (
      !RECORRIDO_EN_VIVO.activo
    ) {

      if (liveRouteBadge) {

        liveRouteBadge.textContent =
          fase ===
            "dia-evento"
            ? "SEGUIMIENTO POR INICIAR"
            : "PRÓXIMO RECORRIDO";
      }


      if (liveCurrentPlace) {
        liveCurrentPlace.textContent =
          "Seguimiento disponible el 15 de septiembre";
      }


      if (liveRouteDescription) {
        liveRouteDescription.textContent =
          "El mapa ya muestra la ruta completa. Cuando inicie el recorrido, este espacio señalará la ubicación actual de la BANDERA SIERA.";
      }


      if (liveCurrentMunicipality) {
        liveCurrentMunicipality.textContent =
          "Aún no inicia";
      }


      if (liveNextMunicipality) {
        liveNextMunicipality.textContent =
          "Tehuacán · Punto de salida";
      }


      if (liveDistance) {
        liveDistance.textContent =
          "0 km de 150 km";
      }


      if (liveLastUpdate) {
        liveLastUpdate.textContent =
          "Aún no inicia";
      }


      if (liveRouteProgressBar) {
        liveRouteProgressBar.style.width =
          "0%";
      }


      if (focusLiveRoute) {
        focusLiveRoute.textContent =
          "Ver punto de salida";
      }


      return;
    }


    const km =
      kmEstimadosEnParada(
        actualIndex
      );


    const porcentaje =
      Math.max(
        0,
        Math.min(
          100,
          (
            km /
            150
          ) *
          100
        )
      );


    if (liveRouteBadge) {

      liveRouteBadge.textContent =
        "RECORRIDO EN CURSO";

      liveRouteBadge.classList.add(
        "is-live"
      );
    }


    if (liveCurrentPlace) {
      liveCurrentPlace.textContent =
        `La BANDERA SIERA se encuentra en ${actual.nombre}`;
    }


    if (liveRouteDescription) {
      liveRouteDescription.textContent =
        `Seguimiento del recorrido por ${actual.estado}. El siguiente punto se actualizará conforme avance la BANDERA SIERA.`;
    }


    if (liveCurrentMunicipality) {
      liveCurrentMunicipality.textContent =
        `${actual.nombre}, ${actual.estado}`;
    }


    if (liveNextMunicipality) {

      liveNextMunicipality.textContent =
        actualIndex ===
          RUTA.length - 1
          ? "Meta · Zongolica"
          : `${siguiente.nombre}, ${siguiente.estado}`;
    }


    if (liveDistance) {
      liveDistance.textContent =
        `${km} km de 150 km`;
    }


    if (liveLastUpdate) {
      liveLastUpdate.textContent =
        RECORRIDO_EN_VIVO.ultimaActualizacion ||
        "Actualización pendiente";
    }


    if (liveRouteProgressBar) {
      liveRouteProgressBar.style.width =
        `${porcentaje}%`;
    }


    if (focusLiveRoute) {
      focusLiveRoute.textContent =
        "Ver ubicación en el mapa";
    }
  }


  pintarPanelEnVivo();


  /* ---------------- MAPA INTERACTIVO ---------------- */

  function mostrarFallbackMapa() {

    if (!mapEl) {
      return;
    }


    mapEl.classList.remove(
      "is-map-loading"
    );


    mapEl.innerHTML = `
      <div class="route-map-fallback">
        <div>
          <strong>
            Mapa temporalmente no disponible
          </strong>

          <p>
            La ruta sigue disponible para consultarse directamente en Google Maps.
          </p>

          <a
            href="https://www.google.com/maps/dir/?api=1&origin=18.4665063,-97.4003801&destination=18.6668459,-97.0001223"
            target="_blank"
            rel="noopener noreferrer">

            Abrir ruta Tehuacán → Zongolica
          </a>
        </div>
      </div>
    `;
  }


  function cargarLeafletSiHaceFalta() {

    return new Promise(
      (resolve, reject) => {

        if (window.L) {
          resolve(window.L);
          return;
        }


        if (
          !document.querySelector(
            "link[data-leaflet-backup]"
          )
        ) {

          const link =
            document.createElement(
              "link"
            );

          link.rel =
            "stylesheet";

          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";

          link.dataset.leafletBackup =
            "true";

          document.head.appendChild(
            link
          );
        }


        const existente =
          document.querySelector(
            "script[data-leaflet-backup]"
          );


        if (existente) {

          if (window.L) {

            resolve(
              window.L
            );

            return;
          }


          existente.addEventListener(
            "load",
            () => {

              window.L
                ? resolve(window.L)
                : reject(
                    new Error(
                      "Leaflet no disponible"
                    )
                  );
            },
            {
              once: true
            }
          );


          existente.addEventListener(
            "error",
            reject,
            {
              once: true
            }
          );


          return;
        }


        const script =
          document.createElement(
            "script"
          );


        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";


        script.async =
          true;


        script.dataset.leafletBackup =
          "true";


        script.onload =
          () => {

            window.L
              ? resolve(window.L)
              : reject(
                  new Error(
                    "Leaflet no disponible"
                  )
                );
          };


        script.onerror =
          reject;


        document.head.appendChild(
          script
        );
      }
    );
  }


  let routeMapInstance =
    null;


  let routeMapInitialized =
    false;


  function iniciarMapaInteractivo() {

    if (
      !mapEl ||
      !window.L ||
      routeMapInitialized
    ) {
      return;
    }


    routeMapInitialized =
      true;


    mapEl.dataset.mapReady =
      "true";


    mapEl.classList.add(
      "is-map-loading"
    );


    mapEl.setAttribute(
      "tabindex",
      "0"
    );


    const map =
      L.map(
        mapEl,
        {
          center: [
            18.70,
            -97.17
          ],

          zoom:
            9,

          zoomControl:
            false,

          scrollWheelZoom:
            false,

          doubleClickZoom:
            true,

          touchZoom:
            true,

          dragging:
            true,

          keyboard:
            true,

          attributionControl:
            true,

          preferCanvas:
            true,

          zoomSnap:
            .5,

          zoomDelta:
            .5,

          minZoom:
            6,

          maxZoom:
            18
        }
      );


    routeMapInstance =
      map;


    let tileLayer =
      null;


    let usandoRespaldo =
      false;


    let erroresTiles =
      0;


    const crearEsri =
      () =>
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom:
              19,

            attribution:
              "Tiles &copy; Esri"
          }
        );


    const crearOSM =
      () =>
        L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom:
              19,

            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
        );


    function usarCapa(
      capa
    ) {

      if (
        tileLayer &&
        map.hasLayer(
          tileLayer
        )
      ) {

        map.removeLayer(
          tileLayer
        );
      }


      tileLayer =
        capa;


      tileLayer.on(
        "tileload",
        () => {

          mapEl.classList.remove(
            "is-map-loading"
          );

          mapEl.classList.add(
            "route-map-ready"
          );
        }
      );


      tileLayer.on(
        "load",
        () => {

          mapEl.classList.remove(
            "is-map-loading"
          );

          mapEl.classList.add(
            "route-map-ready"
          );
        }
      );


      tileLayer.on(
        "tileerror",
        () => {

          erroresTiles +=
            1;


          if (
            !usandoRespaldo &&
            erroresTiles >=
              5
          ) {

            usandoRespaldo =
              true;

            erroresTiles =
              0;


            usarCapa(
              crearOSM()
            );
          }
        }
      );


      tileLayer.addTo(
        map
      );
    }


    usarCapa(
      crearEsri()
    );


    L.control.zoom({
      position:
        "bottomright"
    }).addTo(
      map
    );


    L.control.scale({
      position:
        "bottomleft",

      metric:
        true,

      imperial:
        false,

      maxWidth:
        110
    }).addTo(
      map
    );


    const puntos =
      RUTA.map(
        parada => [
          parada.lat,
          parada.lng
        ]
      );


    const bounds =
      L.latLngBounds(
        puntos
      );


    const marcadoresRuta =
      [];


    L.polyline(
      puntos,
      {
        color:
          "#F7F8F8",

        weight:
          8,

        opacity:
          .86,

        lineCap:
          "round",

        lineJoin:
          "round",

        interactive:
          false
      }
    ).addTo(
      map
    );


    L.polyline(
      puntos,
      {
        color:
          "#03694D",

        weight:
          5,

        opacity:
          .95,

        lineCap:
          "round",

        lineJoin:
          "round",

        interactive:
          false
      }
    ).addTo(
      map
    );


    L.polyline(
      puntos,
      {
        color:
          "#D41F35",

        weight:
          2,

        opacity:
          .92,

        dashArray:
          "3 12",

        lineCap:
          "round",

        lineJoin:
          "round",

        interactive:
          false
      }
    ).addTo(
      map
    );


    function iconoNumerado(
      numero,
      tipo
    ) {

      if (
        tipo ===
          "inicio" ||
        tipo ===
          "final"
      ) {

        const color =
          tipo ===
            "inicio"
            ? "#D41F35"
            : "#03694D";


        return L.divIcon({
          className:
            "route-marker-wrapper",

          html: `
            <div
              class="route-pin-place"
              style="--marker-color:${color}">

              <span>
                ${
                  tipo ===
                    "inicio"
                    ? "S"
                    : "M"
                }
              </span>
            </div>
          `,

          iconSize:
            [38, 46],

          iconAnchor:
            [19, 43],

          popupAnchor:
            [0, -39]
        });
      }


      return L.divIcon({
        className:
          "route-marker-wrapper",

        html:
          `<div class="route-pin">${numero}</div>`,

        iconSize:
          [30, 30],

        iconAnchor:
          [15, 15],

        popupAnchor:
          [0, -16]
      });
    }


    RUTA.forEach(
      (parada, index) => {

        const esInicio =
          index === 0;

        const esFinal =
          index ===
          RUTA.length - 1;


        const tipo =
          esInicio
            ? "inicio"
            : esFinal
              ? "final"
              : "parada";


        const estado =
          estadoParada(
            index
          );


        const estadoClase =
          claseEstado(
            estado
          );


        const foto =
          parada.foto
            ? `
              <img
                class="route-popup-photo"
                src="${escapeHTML(parada.foto)}"
                alt="${escapeHTML(parada.nombre)}"
                loading="lazy">
            `
            : "";


        const hora =
          parada.hora ||
          "Por confirmar";


        const mapsUrl =
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            parada.lat +
            "," +
            parada.lng
          )}`;


        const popupHTML = `
          <div
            class="route-popup route-popup-rich">

            ${foto}

            <div class="route-popup-head">

              <span>
                ${escapeHTML(parada.nombre)}
              </span>

              <span class="route-popup-stop">
                ${
                  esInicio
                    ? "Salida"
                    : esFinal
                      ? "Meta"
                      : `Parada ${index + 1}`
                }
              </span>
            </div>

            <div class="route-popup-body">

              <span
                class="route-popup-status ${estadoClase}">

                ${escapeHTML(estado)}
              </span>

              <p class="route-popup-info">
                ${escapeHTML(parada.historia)}
              </p>

              <div class="route-popup-meta">

                <div>
                  <span>Estado</span>
                  <strong>
                    ${escapeHTML(parada.estado)}
                  </strong>
                </div>

                <div>
                  <span>Recepción</span>
                  <strong>
                    ${escapeHTML(hora)}
                  </strong>
                </div>

                ${
                  parada.salida
                    ? `
                      <div>
                        <span>Salida</span>
                        <strong>
                          ${escapeHTML(parada.salida)}
                        </strong>
                      </div>
                    `
                    : ""
                }

                ${
                  parada.traslado
                    ? `
                      <div>
                        <span>Traslado</span>
                        <strong>
                          ${escapeHTML(parada.traslado)}
                        </strong>
                      </div>
                    `
                    : ""
                }

                ${
                  parada.recibe
                    ? `
                      <div class="route-popup-meta-wide">
                        <span>Recibe</span>
                        <strong>
                          ${escapeHTML(parada.recibe)}
                        </strong>
                      </div>
                    `
                    : ""
                }

                ${
                  parada.entrega
                    ? `
                      <div class="route-popup-meta-wide">
                        <span>Entrega</span>
                        <strong>
                          ${escapeHTML(parada.entrega)}
                        </strong>
                      </div>
                    `
                    : ""
                }

                ${
                  parada.responsable
                    ? `
                      <div class="route-popup-meta-wide">
                        <span>Agradecimiento</span>
                        <strong>
                          ${escapeHTML(parada.responsable)}
                        </strong>
                      </div>
                    `
                    : ""
                }

              </div>

              <a
                class="route-popup-directions"
                href="${mapsUrl}"
                target="_blank"
                rel="noopener noreferrer">

                Cómo llegar
              </a>

            </div>
          </div>
        `;


        const marker =
          L.marker(
            [
              parada.lat,
              parada.lng
            ],
            {
              icon:
                iconoNumerado(
                  index + 1,
                  tipo
                ),

              riseOnHover:
                true,

              keyboard:
                true,

              title:
                `${index + 1}. ${parada.nombre}`,

              alt:
                `${index + 1}. ${parada.nombre}`
            }
          )
            .addTo(
              map
            )
            .bindPopup(
              popupHTML,
              {
                maxWidth:
                  320,

                minWidth:
                  230,

                autoPan:
                  true,

                keepInView:
                  true,

                closeButton:
                  true
              }
            );


        marcadoresRuta.push(
          marker
        );
      }
    );


    function ajustarRutaCompleta(
      animar = false
    ) {

      map.invalidateSize({
        pan:
          false,

        debounceMoveend:
          true
      });


      map.fitBounds(
        bounds,
        {
          paddingTopLeft:
            [44, 58],

          paddingBottomRight:
            [44, 58],

          maxZoom:
            10.5,

          animate:
            animar,

          duration:
            animar
              ? .55
              : 0
        }
      );
    }


    const InfoControl =
      L.Control.extend({

        options: {
          position:
            "topleft"
        },


        onAdd() {

          const div =
            L.DomUtil.create(
              "div",
              "route-info-chip"
            );


          div.innerHTML = `
            <span
              class="route-info-chip-icon">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true">

                <path
                  d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
              </svg>
            </span>

            <span
              class="route-info-chip-text">

              <strong>
                SIERA 2026
              </strong>

              <span>
                Tehuacán → Zongolica
              </span>

            </span>
          `;


          L.DomEvent.disableClickPropagation(
            div
          );


          L.DomEvent.disableScrollPropagation(
            div
          );


          return div;
        }
      });


    map.addControl(
      new InfoControl()
    );


    const ResetControl =
      L.Control.extend({

        options: {
          position:
            "topright"
        },


        onAdd() {

          const button =
            L.DomUtil.create(
              "button",
              "route-reset-btn"
            );


          button.type =
            "button";


          button.innerHTML = `
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true">

              <path
                d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                stroke-linecap="round"
                stroke-linejoin="round"/>
            </svg>

            Ver recorrido
          `;


          L.DomEvent.disableClickPropagation(
            button
          );


          L.DomEvent.disableScrollPropagation(
            button
          );


          button.addEventListener(
            "click",
            () => {

              map.closePopup();

              ajustarRutaCompleta(
                true
              );
            }
          );


          return button;
        }
      });


    map.addControl(
      new ResetControl()
    );


    map.scrollWheelZoom.disable();


    mapEl.addEventListener(
      "wheel",
      event => {

        if (
          event.ctrlKey ||
          event.metaKey
        ) {

          map.scrollWheelZoom.enable();

        } else {

          map.scrollWheelZoom.disable();
        }
      },
      {
        passive:
          true,

        capture:
          true
      }
    );


    mapEl.addEventListener(
      "mouseleave",
      () => {

        map.scrollWheelZoom.disable();
      }
    );


    document
      .querySelectorAll(
        "#recorrido .timeline-item"
      )
      .forEach(
        (item, index) => {

          const marker =
            marcadoresRuta[
              index
            ];


          const parada =
            RUTA[
              index
            ];


          if (
            !marker ||
            !parada
          ) {
            return;
          }


          item.setAttribute(
            "tabindex",
            "0"
          );


          item.setAttribute(
            "role",
            "button"
          );


          item.setAttribute(
            "aria-label",
            `Ver ${parada.nombre} en el mapa`
          );


          const abrirParada =
            (event) => {

              /* Evita que el clic o el scroll-snap regresen
                 al inicio de la sección. */
              event?.preventDefault?.();
              event?.stopPropagation?.();

              const reducirMovimiento =
                window.matchMedia(
                  "(prefers-reduced-motion: reduce)"
                ).matches;

              const html =
                document.documentElement;

              const snapAnterior =
                html.style.getPropertyValue(
                  "scroll-snap-type"
                );

              const snapPrioridadAnterior =
                html.style.getPropertyPriority(
                  "scroll-snap-type"
                );

              /* Desactiva temporalmente el snap solo mientras
                 se lleva al usuario al mapa. */
              html.style.setProperty(
                "scroll-snap-type",
                "none",
                "important"
              );

              const rectMapa =
                mapEl.getBoundingClientRect();

              const posicionMapa =
                window.scrollY +
                rectMapa.top;

              const margenSuperior =
                window.innerWidth <= 900
                  ? 82
                  : 96;

              const espacioVisible =
                Math.max(
                  0,
                  window.innerHeight -
                  rectMapa.height -
                  margenSuperior
                );

              const destinoScroll =
                Math.max(
                  0,
                  posicionMapa -
                  margenSuperior -
                  espacioVisible / 2
                );

              window.scrollTo({
                top:
                  destinoScroll,

                behavior:
                  reducirMovimiento
                    ? "auto"
                    : "smooth"
              });

              const enfocarMunicipio =
                () => {

                  map.invalidateSize({
                    pan:
                      false
                  });

                  /* Enfoca el municipio seleccionado y se queda ahí. */
                  map.flyTo(
                    marker.getLatLng(),
                    window.innerWidth <=
                      640
                      ? 11.5
                      : 12,
                    {
                      animate:
                        !reducirMovimiento,

                      duration:
                        reducirMovimiento
                          ? 0
                          : .65
                    }
                  );

                  setTimeout(
                    () => {
                      marker.openPopup();
                    },
                    reducirMovimiento
                      ? 40
                      : 360
                  );
                };

              setTimeout(
                enfocarMunicipio,
                reducirMovimiento
                  ? 20
                  : 420
              );

              /* Restaura el scroll-snap una vez terminado el movimiento. */
              setTimeout(
                () => {

                  if (snapAnterior) {
                    html.style.setProperty(
                      "scroll-snap-type",
                      snapAnterior,
                      snapPrioridadAnterior
                    );
                  } else {
                    html.style.removeProperty(
                      "scroll-snap-type"
                    );
                  }
                },
                reducirMovimiento
                  ? 120
                  : 1100
              );
            };


          item.addEventListener(
            "click",
            abrirParada
          );


          item.addEventListener(
            "keydown",
            event => {

              if (
                event.key ===
                  "Enter" ||
                event.key ===
                  " "
              ) {

                event.preventDefault();

                abrirParada(event);
              }
            }
          );
        }
      );


    let resizeTimer =
      null;


    const recalcularMapa =
      () => {

        clearTimeout(
          resizeTimer
        );


        resizeTimer =
          setTimeout(
            () => {

              if (
                !routeMapInstance
              ) {
                return;
              }


              routeMapInstance.invalidateSize({
                pan:
                  false,

                debounceMoveend:
                  true
              });
            },
            70
          );
      };


    if (
      "ResizeObserver" in window
    ) {

      const resizeObserver =
        new ResizeObserver(
          () => {

            recalcularMapa();
          }
        );


      resizeObserver.observe(
        mapEl
      );


      resizeObserver.observe(
        mapEl.parentElement
      );
    }


    const recorridoSection =
      document.getElementById(
        "recorrido"
      );


    if (
      "IntersectionObserver" in window &&
      recorridoSection
    ) {

      const observer =
        new IntersectionObserver(
          entries => {

            entries.forEach(
              entry => {

                if (
                  !entry.isIntersecting
                ) {
                  return;
                }


                recalcularMapa();


                setTimeout(
                  () => {

                    map.invalidateSize({
                      pan:
                        false
                    });
                  },
                  180
                );


                setTimeout(
                  () => {

                    map.invalidateSize({
                      pan:
                        false
                    });
                  },
                  520
                );
              }
            );
          },
          {
            threshold:
              .04,

            rootMargin:
              "180px 0px"
          }
        );


      observer.observe(
        recorridoSection
      );
    }


    window.addEventListener(
      "resize",
      recalcularMapa,
      {
        passive:
          true
      }
    );


    window.addEventListener(
      "orientationchange",
      () => {

        setTimeout(
          recalcularMapa,
          260
        );
      }
    );


    window.addEventListener(
      "pageshow",
      () => {

        setTimeout(
          recalcularMapa,
          120
        );
      }
    );


    map.whenReady(
      () => {

        requestAnimationFrame(
          () => {

            map.invalidateSize({
              pan:
                false
            });


            ajustarRutaCompleta(
              false
            );


            setTimeout(
              () => {

                map.invalidateSize({
                  pan:
                    false
                });


                ajustarRutaCompleta(
                  false
                );
              },
              180
            );
          }
        );
      }
    );


    setTimeout(
      () => {

        mapEl.classList.remove(
          "is-map-loading"
        );
      },
      4500
    );
  }


  function prepararMapa() {

    if (!mapEl) {
      return;
    }


    const arrancar =
      () => {

        cargarLeafletSiHaceFalta()
          .then(
            () =>
              iniciarMapaInteractivo()
          )
          .catch(
            () =>
              mostrarFallbackMapa()
          );
      };


    if (
      !(
        "IntersectionObserver" in window
      )
    ) {

      arrancar();

      return;
    }


    let iniciado =
      false;


    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(
            entry => {

              if (
                !entry.isIntersecting ||
                iniciado
              ) {
                return;
              }


              iniciado =
                true;


              observer.disconnect();


              arrancar();
            }
          );
        },
        {
          threshold:
            0,

          rootMargin:
            "500px 0px"
        }
      );


    observer.observe(
      mapEl
    );


    setTimeout(
      () => {

        if (iniciado) {
          return;
        }


        iniciado =
          true;


        observer.disconnect();


        arrancar();
      },
      3500
    );
  }


  prepararMapa();


  /* ---------------- BARRA DE PROGRESO ---------------- */

  const progressBar =
    document.createElement(
      "div"
    );


  progressBar.id =
    "progressBar";


  progressBar.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.appendChild(
    progressBar
  );


  function actualizarProgreso() {

    const alto =
      document.documentElement.scrollHeight -
      window.innerHeight;


    const porcentaje =
      alto > 0
        ? (
            window.scrollY /
            alto
          ) *
          100
        : 0;


    progressBar.style.width =
      porcentaje +
      "%";
  }


  window.addEventListener(
    "scroll",
    actualizarProgreso,
    {
      passive:
        true
    }
  );


  window.addEventListener(
    "resize",
    actualizarProgreso
  );


  actualizarProgreso();


  /* ---------------- HERO ---------------- */

  const heroSection =
    document.querySelector(
      ".hero"
    );


  if (heroSection) {

    const orb1 =
      document.createElement(
        "span"
      );


    orb1.className =
      "hero-orb hero-orb-1";


    orb1.setAttribute(
      "aria-hidden",
      "true"
    );


    const orb2 =
      document.createElement(
        "span"
      );


    orb2.className =
      "hero-orb hero-orb-2";


    orb2.setAttribute(
      "aria-hidden",
      "true"
    );


    const spotlight =
      document.createElement(
        "div"
      );


    spotlight.className =
      "hero-spotlight";


    spotlight.setAttribute(
      "aria-hidden",
      "true"
    );


    heroSection.append(
      orb1,
      orb2,
      spotlight
    );


    heroSection.addEventListener(
      "pointermove",
      (e) => {

        const rect =
          heroSection.getBoundingClientRect();


        const mx =
          (
            (
              e.clientX -
              rect.left
            ) /
            rect.width
          ) *
          100;


        const my =
          (
            (
              e.clientY -
              rect.top
            ) /
            rect.height
          ) *
          100;


        heroSection.style.setProperty(
          "--mx",
          mx +
          "%"
        );


        heroSection.style.setProperty(
          "--my",
          my +
          "%"
        );
      }
    );
  }


  /* ---------------- NAVEGACIÓN POR PUNTOS ---------------- */

  const seccionesPrincipales =
    Array.from(
      document.querySelectorAll(
        "main section[id]"
      )
    );


  if (
    seccionesPrincipales.length
  ) {

    const nombresSeccion = {
      inicio:
        "Inicio",

      introduccion:
        "Introducción",

      preparate:
        "Prepárate",

      historia:
        "Historia",

      "juan-moctezuma":
        "Juan Moctezuma",

      valores:
        "Valores",

      museo:
        "Museo Digital",

      simbolismo:
        "Simbolismo",

      recorrido:
        "Recorrido",

      programa:
        "Programa",

      galeria:
        "Memoria gráfica",

      "canal-whatsapp":
        "WhatsApp"
    };


    const dotsNav =
      document.createElement(
        "nav"
      );


    dotsNav.className =
      "section-dots";


    dotsNav.setAttribute(
      "aria-label",
      "Ir a sección"
    );


    const sectionIndicator =
      document.createElement(
        "div"
      );


    sectionIndicator.className =
      "scroll-section-indicator";


    sectionIndicator.setAttribute(
      "aria-hidden",
      "true"
    );


    sectionIndicator.innerHTML = `
      <span class="scroll-section-number">
        01
      </span>

      <span class="scroll-section-name">
        Inicio
      </span>
    `;


    const dots =
      seccionesPrincipales.map(
        (
          seccion,
          index
        ) => {

          const dot =
            document.createElement(
              "button"
            );


          const label =
            nombresSeccion[
              seccion.id
            ] ||
            seccion.id;


          dot.type =
            "button";


          dot.className =
            "section-dot";


          dot.dataset.label =
            label;


          dot.setAttribute(
            "aria-label",
            `Ir a ${label}`
          );


          dot.addEventListener(
            "click",
            () => {

              seccion.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
              });
            }
          );


          dotsNav.appendChild(
            dot
          );


          return {
            seccion,
            dot,
            label,
            index
          };
        }
      );


    document.body.append(
      dotsNav,
      sectionIndicator
    );


    const numberEl =
      sectionIndicator.querySelector(
        ".scroll-section-number"
      );


    const nameEl =
      sectionIndicator.querySelector(
        ".scroll-section-name"
      );


    const activarSeccion =
      (item) => {

        dots.forEach(
          d =>
            d.dot.classList.remove(
              "is-active"
            )
        );


        item.dot.classList.add(
          "is-active"
        );


        if (numberEl) {

          numberEl.textContent =
            String(
              item.index + 1
            ).padStart(
              2,
              "0"
            );
        }


        if (nameEl) {

          nameEl.textContent =
            item.label;
        }
      };


    const dotObserver =
      new IntersectionObserver(
        (entradas) => {

          const visibles =
            entradas
              .filter(
                entrada =>
                  entrada.isIntersecting
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              );


          if (
            !visibles.length
          ) {
            return;
          }


          const item =
            dots.find(
              d =>
                d.seccion ===
                visibles[0].target
            );


          if (item) {
            activarSeccion(
              item
            );
          }
        },
        {
          threshold:
            [
              0.22,
              0.4,
              0.6
            ],

          rootMargin:
            "-18% 0px -36% 0px"
        }
      );


    seccionesPrincipales.forEach(
      seccion =>
        dotObserver.observe(
          seccion
        )
    );


    if (dots[0]) {
      activarSeccion(
        dots[0]
      );
    }
  }


  /* ---------------- TICKER ---------------- */

  const datosTicker = [
    "XXXV Recorrido de la Insurgencia",
    "150 km de recorrido",
    "14 municipios",
    "15 de septiembre de 2026",
    "Historia e identidad serrana",
    "Sierra de Zongolica"
  ];


  const tickerBand =
    document.createElement(
      "div"
    );


  tickerBand.className =
    "ticker-band";


  tickerBand.setAttribute(
    "aria-hidden",
    "true"
  );


  const tickerTrack =
    document.createElement(
      "div"
    );


  tickerTrack.className =
    "ticker-track";


  function llenarTicker() {

    tickerTrack.innerHTML =
      "";


    for (
      let vuelta = 0;
      vuelta < 2;
      vuelta++
    ) {

      datosTicker.forEach(
        texto => {

          const item =
            document.createElement(
              "span"
            );


          item.textContent =
            texto;


          const separador =
            document.createElement(
              "span"
            );


          separador.className =
            "sep";


          separador.textContent =
            "✦";


          tickerTrack.append(
            item,
            separador
          );
        }
      );
    }
  }


  llenarTicker();


  tickerBand.appendChild(
    tickerTrack
  );


  const headerSitio =
    document.querySelector(
      ".site-header"
    );


  if (headerSitio) {

    headerSitio.insertAdjacentElement(
      "afterend",
      tickerBand
    );
  }


  /* ---------------- CUENTA REGRESIVA ---------------- */

  if (heroSection) {

    const heroCta =
      heroSection.querySelector(
        ".hero-cta"
      );


    if (heroCta) {

      const countdownEl =
        document.createElement(
          "div"
        );


      countdownEl.className =
        "hero-countdown";


      countdownEl.innerHTML = `
        <span class="hero-countdown-label">
          Faltan para el próximo recorrido
        </span>

        <div class="hero-countdown-grid">

          <div class="hero-countdown-item">
            <span
              class="num"
              data-cd="dias">
              00
            </span>

            <span class="lab">
              Días
            </span>
          </div>

          <span class="hero-countdown-sep">
            :
          </span>

          <div class="hero-countdown-item">
            <span
              class="num"
              data-cd="horas">
              00
            </span>

            <span class="lab">
              Hrs
            </span>
          </div>

          <span class="hero-countdown-sep">
            :
          </span>

          <div class="hero-countdown-item">
            <span
              class="num"
              data-cd="min">
              00
            </span>

            <span class="lab">
              Min
            </span>
          </div>

          <span class="hero-countdown-sep">
            :
          </span>

          <div class="hero-countdown-item">
            <span
              class="num"
              data-cd="seg">
              00
            </span>

            <span class="lab">
              Seg
            </span>
          </div>
        </div>
      `;


      heroCta.insertAdjacentElement(
        "beforebegin",
        countdownEl
      );


      function proximoQuinceSeptiembre() {

        const ahora =
          new Date();


        let objetivo =
          new Date(
            ahora.getFullYear(),
            8,
            15,
            0,
            0,
            0
          );


        if (
          ahora >=
          objetivo
        ) {

          objetivo =
            new Date(
              ahora.getFullYear() +
              1,
              8,
              15,
              0,
              0,
              0
            );
        }


        return objetivo;
      }


      const dias =
        countdownEl.querySelector(
          '[data-cd="dias"]'
        );


      const horas =
        countdownEl.querySelector(
          '[data-cd="horas"]'
        );


      const mins =
        countdownEl.querySelector(
          '[data-cd="min"]'
        );


      const segs =
        countdownEl.querySelector(
          '[data-cd="seg"]'
        );


      const dosDigitos =
        n =>
          String(n).padStart(
            2,
            "0"
          );


      function actualizarCuentaRegresiva() {

        const restante =
          proximoQuinceSeptiembre() -
          new Date();


        if (
          restante <= 0
        ) {
          return;
        }


        const totalSeg =
          Math.floor(
            restante /
            1000
          );


        dias.textContent =
          dosDigitos(
            Math.floor(
              totalSeg /
              86400
            )
          );


        horas.textContent =
          dosDigitos(
            Math.floor(
              (
                totalSeg %
                86400
              ) /
              3600
            )
          );


        mins.textContent =
          dosDigitos(
            Math.floor(
              (
                totalSeg %
                3600
              ) /
              60
            )
          );


        segs.textContent =
          dosDigitos(
            totalSeg %
            60
          );
      }


      actualizarCuentaRegresiva();


      setInterval(
        actualizarCuentaRegresiva,
        1000
      );
    }
  }


  /* ---------------- REVELADO SUAVE ---------------- */

  const prefiereMenosMovimiento =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (
    !prefiereMenosMovimiento &&
    "IntersectionObserver" in window
  ) {

    const elementosRevelado =
      document.querySelectorAll(
        ".intro-card, " +
        ".event-promise-card, " +
        ".story-context-card, " +
        ".story-doc-card, " +
        ".story-timeline article, " +
        ".bandera-story-timeline article, " +
        ".bandera-researcher-card, " +
        ".recorrido-origin-story, " +
        ".hymn-annex, " +
        ".program-shirt-card, " +
        ".feature-fact, " +
        ".article-section-card, " +
        ".history-card, " +
        ".juan-moctezuma-banner, " +
        ".valor-card, " +
        ".route-stat, " +
        ".timeline-item, " +
        ".agenda-item, " +
        ".gallery-item, " +
        ".alert-card"
      );


    const observador =
      new IntersectionObserver(
        (entradas) => {

          entradas.forEach(
            entrada => {

              if (
                entrada.isIntersecting
              ) {

                entrada.target.classList.add(
                  "reveal-visible"
                );


                observador.unobserve(
                  entrada.target
                );
              }
            }
          );
        },
        {
          threshold:
            0.15,

          rootMargin:
            "0px 0px -40px 0px"
        }
      );


    elementosRevelado.forEach(
      el => {

        el.classList.add(
          "reveal"
        );


        observador.observe(
          el
        );
      }
    );
  }


  /* ---------------- CONTADORES ---------------- */

  const numerosRuta =
    document.querySelectorAll(
      ".route-stat-num"
    );


  if (
    !prefiereMenosMovimiento &&
    "IntersectionObserver" in window &&
    numerosRuta.length
  ) {

    const contadorObserver =
      new IntersectionObserver(
        (entradas) => {

          entradas.forEach(
            entrada => {

              if (
                !entrada.isIntersecting
              ) {
                return;
              }


              const el =
                entrada.target;


              const destino =
                parseInt(
                  el.textContent,
                  10
                );


              contadorObserver.unobserve(
                el
              );


              if (
                Number.isNaN(
                  destino
                )
              ) {
                return;
              }


              const duracion =
                900;


              const inicio =
                performance.now();


              function paso(ahora) {

                const avance =
                  Math.min(
                    (
                      ahora -
                      inicio
                    ) /
                    duracion,
                    1
                  );


                const facilitado =
                  1 -
                  Math.pow(
                    1 -
                    avance,
                    3
                  );


                el.textContent =
                  Math.round(
                    destino *
                    facilitado
                  );


                if (
                  avance < 1
                ) {

                  requestAnimationFrame(
                    paso
                  );
                }
              }


              requestAnimationFrame(
                paso
              );
            }
          );
        },
        {
          threshold:
            0.6
        }
      );


    numerosRuta.forEach(
      el =>
        contadorObserver.observe(
          el
        )
    );
  }

});


/* ============================================================
   CANAL DE WHATSAPP
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const meta =
      document.querySelector(
        'meta[name="whatsapp-channel-url"]'
      );


    const url =
      meta?.content?.trim() ||
      "";


    const enlaces =
      document.querySelectorAll(
        ".js-whatsapp-channel"
      );


    const configurado =
      Boolean(
        url &&
        !url.includes(
          "REEMPLAZAR_CON_"
        ) &&
        /^https?:\/\//i.test(
          url
        )
      );


    enlaces.forEach(
      (enlace) => {

        if (configurado) {

          enlace.href =
            url;


          enlace.target =
            "_blank";


          enlace.rel =
            "noopener noreferrer";


          enlace.removeAttribute(
            "aria-disabled"
          );


          enlace.classList.remove(
            "is-disabled"
          );

        } else {

          enlace.href =
            "#canal-whatsapp";


          enlace.removeAttribute(
            "target"
          );


          enlace.removeAttribute(
            "rel"
          );


          if (
            enlace.classList.contains(
              "whatsapp-main-button"
            )
          ) {

            enlace.textContent =
              "Configura el enlace del canal";


            enlace.setAttribute(
              "aria-disabled",
              "true"
            );


            enlace.classList.add(
              "is-disabled"
            );


            enlace.title =
              "Pega el enlace real del canal de WhatsApp en el meta whatsapp-channel-url";


            enlace.addEventListener(
              "click",
              (event) =>
                event.preventDefault()
            );
          }
        }
      }
    );
  }
);
/* ============================================================
   MEMORIA GRÁFICA · RECORRIDO 2026
   BLOQUE INDEPENDIENTE

   PEGAR AL FINAL DE assets/js/script.js

   NO reemplaza:
   - Memoria Gráfica histórica
   - Carrusel histórico
   - Playeras
   - Mapa
   - Scroll
   - Lightbox actual

   Agrega:
   - Botón 2026
   - Carrusel independiente con 100 fotografías
   - Flechas
   - Arrastre con mouse
   - Swipe móvil
   - Rueda en PC
   - Apertura de fotografía en el MISMO lightbox actual
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const section =
    document.getElementById("galeria");

  if (!section) {
    return;
  }


  /* Evita duplicarlo si por error se pega dos veces */

  if (
    document.getElementById(
      "mg2026Toggle"
    )
  ) {
    return;
  }


  const wrap =
    section.querySelector(
      ".wrap"
    );

  const lead =
    section.querySelector(
      ".section-lead"
    );

  const originalPanels =
    section.querySelector(
      ".gallery-panels"
    );


  if (
    !wrap ||
    !lead ||
    !originalPanels
  ) {
    return;
  }



  /* ============================================================
     ELEMENTOS ACTUALES DE LA MEMORIA GRÁFICA
     ============================================================ */

  const originalHint =
    section.querySelector(
      ".gallery-depth-hint"
    );

  const originalControls =
    section.querySelector(
      ".gallery-depth-controls"
    );

  const originalProgress =
    section.querySelector(
      ".gallery-depth-progress"
    );



  /* ============================================================
     RECORRIDO 2026
     Carpetas verificadas directamente del ZIP.

     TOTAL: 100 fotografías WEBP
     ============================================================ */

  const grupos2026 = [

    {
      carpeta:
        "Acultzingo recibe el legado de la Bandera Siera",

      titulo:
        "Acultzingo recibe el legado de la Bandera Siera",

      total:
        8
    },


    {
      carpeta:
        "Camerino Z. Mendoza se une al recorrido de nuestra historia",

      titulo:
        "Camerino Z. Mendoza se une al recorrido de nuestra historia",

      total:
        7
    },


    {
      carpeta:
        "Huiloapan se suma al latir histórico de la Bandera Siera",

      titulo:
        "Huiloapan se suma al latir histórico de la Bandera Siera",

      total:
        7
    },


    {
      carpeta:
        "La Bandera Siera llevará su legado hasta Tequila",

      titulo:
        "La BANDERA SIERA llevará su legado hasta Tequila",

      total:
        6
    },


    {
      carpeta:
        "Los Reyes, la tradición será parte del recorrido",

      titulo:
        "Los Reyes · La tradición será parte del recorrido",

      total:
        2
    },


    {
      carpeta:
        "Maltrata se suma al camino de la Bandera Siera",

      titulo:
        "Maltrata se suma al camino de la BANDERA SIERA",

      total:
        4
    },


    {
      carpeta:
        "Nogales es parte del legado de la Bandera Siera",

      titulo:
        "Nogales es parte del legado de la BANDERA SIERA",

      total:
        7
    },


    {
      carpeta:
        "Orizaba recibe una historia que marcó el camino de la libertad",

      titulo:
        "Orizaba recibe una historia que marcó el camino de la libertad",

      total:
        8
    },


    {
      carpeta:
        "Rafael Delgado recibe el legado de la Bandera Siera",

      titulo:
        "Rafael Delgado recibe el legado de la BANDERA SIERA",

      total:
        4
    },


    {
      carpeta:
        "Recibimos con orgullo a  Xochiojca, Amatepec, El Porvenir, Comalapa, Piedras Blancas y Zomajapa",

      titulo:
        "Xochiojca, Amatepec, El Porvenir, Comalapa, Piedras Blancas y Zomajapa",

      total:
        3
    },


    {
      carpeta:
        "Río Blanco   Una bandera histórica llegará",

      titulo:
        "Río Blanco · Una bandera histórica llegará",

      total:
        5
    },


    {
      carpeta:
        "San Andrés Tenejapan se une al eco de la historia",

      titulo:
        "San Andrés Tenejapan se une al eco de la historia",

      total:
        4
    },


    {
      carpeta:
        "Tehuacán recibe la historia de la Bandera Siera",

      titulo:
        "Tehuacán recibe la historia de la BANDERA SIERA",

      total:
        8
    },


    {
      carpeta:
        "Tlilapan será parte de una historia que camina con orgullo",

      titulo:
        "Tlilapan será parte de una historia que camina con orgullo",

      total:
        5
    },


    {
      carpeta:
        "grito 15 se septiembre ZONGOLICA",

      titulo:
        "Grito del 15 de septiembre · Zongolica",

      total:
        9
    },


    {
      carpeta:
        "izamiento de nuestra bandera palacion municipal",

      titulo:
        "Izamiento de nuestra bandera · Palacio Municipal",

      total:
        3
    },


    {
      carpeta:
        "¡Recibimos con alegría a las niñas y niños de los Clubs de COMUDE",

      titulo:
        "Niñas y niños de los Clubs de COMUDE",

      total:
        4
    },


    {
      carpeta:
        "¡Recibimos con orgullo a Mixtla de Altamirano",

      titulo:
        "Mixtla de Altamirano",

      total:
        6
    }

  ];



  const totalFotos =
    grupos2026.reduce(
      (suma, grupo) =>
        suma + grupo.total,
      0
    );


  const base2026 =
    "assets/images/route/recorrido 2026";



  /* ============================================================
     BOTÓN 2026
     ============================================================ */

  const switcher =
    document.createElement(
      "div"
    );


  switcher.className =
    "mg2026-switch";


  const toggle =
    document.createElement(
      "button"
    );


  toggle.type =
    "button";


  toggle.id =
    "mg2026Toggle";


  toggle.className =
    "mg2026-btn";


  toggle.textContent =
    "2026";


  toggle.setAttribute(
    "aria-pressed",
    "false"
  );


  toggle.setAttribute(
    "aria-controls",
    "mg2026Experience"
  );


  switcher.appendChild(
    toggle
  );


  lead.insertAdjacentElement(
    "afterend",
    switcher
  );



  /* ============================================================
     ESTRUCTURA DEL CARRUSEL 2026

     Se utilizan las mismas clases visuales de tu carrusel
     actual para que mantenga el mismo diseño.
     ============================================================ */

  const experience =
    document.createElement(
      "div"
    );


  experience.id =
    "mg2026Experience";


  experience.className =
    "mg2026-experience";


  experience.hidden =
    true;


  experience.innerHTML = `

    <div class="mg2026-head">

      <span>
        XXXV RECORRIDO DE LA INSURGENCIA
      </span>

      <h3>
        Memoria Gráfica · 2026
      </h3>

      <p>
        Registro fotográfico del Recorrido de la
        BANDERA SIERA 2026.
      </p>

    </div>


    <p
      class="gallery-hint mg2026-hint">
    </p>


    <div
      class="gallery-carousel-controls mg2026-controls"
    >

      <div
        class="gallery-carousel-status"
        aria-live="polite"
      >

        <strong data-mg2026-current>
          01
        </strong>

        <span>
          /
        </span>

        <span data-mg2026-total>
          ${String(totalFotos).padStart(2, "0")}
        </span>

      </div>


      <div
        class="gallery-carousel-actions"
      >

        <button
          type="button"
          class="gallery-carousel-btn"
          data-mg2026-prev
          aria-label="Fotografía anterior"
        >

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6"/>
          </svg>

        </button>


        <button
          type="button"
          class="gallery-carousel-btn"
          data-mg2026-next
          aria-label="Fotografía siguiente"
        >

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6"/>
          </svg>

        </button>

      </div>

    </div>



    <div
      class="gallery-panels gallery-depth-experience mg2026-panels"
    >

      <div
        class="gallery-grid gallery-depth-track mg2026-track"
        tabindex="0"
        role="region"
        aria-label="Memoria gráfica del recorrido 2026"
      >
      </div>

    </div>



    <div
      class="gallery-carousel-progress gallery-depth-progress mg2026-progress"
      aria-hidden="true"
    >

      <span></span>

    </div>

  `;


  originalPanels.insertAdjacentElement(
    "afterend",
    experience
  );



  /* ============================================================
     ELEMENTOS DEL NUEVO CARRUSEL
     ============================================================ */

  const hint =
    experience.querySelector(
      ".mg2026-hint"
    );


  const track =
    experience.querySelector(
      ".mg2026-track"
    );


  const currentEl =
    experience.querySelector(
      "[data-mg2026-current]"
    );


  const prevBtn =
    experience.querySelector(
      "[data-mg2026-prev]"
    );


  const nextBtn =
    experience.querySelector(
      "[data-mg2026-next]"
    );


  const progressFill =
    experience.querySelector(
      ".mg2026-progress span"
    );


  const finePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );


  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );



  hint.textContent =
    finePointer.matches
      ? "Desplázate con la rueda, arrastra o usa las flechas para explorar las fotografías de 2026."
      : "Desliza con el dedo para explorar las fotografías de 2026.";



  /* ============================================================
     CREAR LAS 100 FOTOGRAFÍAS
     ============================================================ */

  let globalIndex =
    0;


  grupos2026.forEach(
    grupo => {


      for (
        let numero = 1;
        numero <= grupo.total;
        numero += 1
      ) {


        globalIndex +=
          1;


        const archivo =
          `${String(numero).padStart(2, "0")}.webp`;


        const ruta =
          `${base2026}/${grupo.carpeta}/${archivo}`;



        const figure =
          document.createElement(
            "figure"
          );


        figure.className =
          "gallery-item mg2026-item";


        figure.dataset.mg2026Index =
          String(
            globalIndex - 1
          );



        const img =
          document.createElement(
            "img"
          );


        img.src =
          ruta;


        img.alt =
          `${grupo.titulo} · fotografía ${String(numero).padStart(2, "0")}`;


        img.loading =
          "lazy";


        img.decoding =
          "async";


        img.draggable =
          false;



        const caption =
          document.createElement(
            "figcaption"
          );


        const captionTitle =
          document.createElement(
            "strong"
          );


        captionTitle.textContent =
          grupo.titulo;


        const captionNumber =
          document.createElement(
            "span"
          );


        captionNumber.textContent =
          `Recorrido 2026 · ${String(numero).padStart(2, "0")}`;


        caption.append(
          captionTitle,
          captionNumber
        );


        figure.append(
          img,
          caption
        );


        track.appendChild(
          figure
        );

      }

    }
  );



  const items =
    Array.from(
      track.querySelectorAll(
        ".mg2026-item"
      )
    );


  const images =
    Array.from(
      track.querySelectorAll(
        ".mg2026-item img"
      )
    );



  /* ============================================================
     LIGHTBOX PARA LAS FOTOGRAFÍAS 2026

     IMPORTANTE:
     reutiliza el mismo .lightbox-overlay que ya usa tu página.

     Esto hace que:
     - las fotos históricas sigan funcionando;
     - las playeras sigan funcionando;
     - las fotos 2026 también se puedan presionar;
     - funcione en PC, iPhone y Android.
     ============================================================ */

  function abrirLightbox2026(
    img
  ) {


    const overlay =
      document.querySelector(
        ".lightbox-overlay"
      );


    if (
      !overlay ||
      !img
    ) {
      return;
    }


    const bigImage =
      overlay.querySelector(
        "img"
      );


    const closeButton =
      overlay.querySelector(
        ".lightbox-close"
      );


    if (!bigImage) {
      return;
    }



    bigImage.src =
      img.currentSrc ||
      img.src;


    bigImage.alt =
      img.alt ||
      "Fotografía ampliada del recorrido 2026";


    overlay.classList.add(
      "is-open"
    );


    overlay.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";


    requestAnimationFrame(
      () => {

        closeButton?.focus();

      }
    );

  }



  /* ============================================================
     HACER CLICABLE CADA FOTO 2026
     ============================================================ */

  images.forEach(
    img => {


      img.style.cursor =
        "zoom-in";


      img.setAttribute(
        "tabindex",
        "0"
      );


      img.setAttribute(
        "role",
        "button"
      );


      img.setAttribute(
        "aria-label",
        `Ampliar imagen: ${img.alt}`
      );



      /* CLIC / TAP */

      img.addEventListener(
        "click",
        event => {


          event.stopPropagation();


          abrirLightbox2026(
            img
          );

        }
      );



      /* TECLADO */

      img.addEventListener(
        "keydown",
        event => {


          if (
            event.key === "Enter" ||
            event.key === " "
          ) {


            event.preventDefault();


            abrirLightbox2026(
              img
            );

          }

        }
      );

    }
  );



  /* ============================================================
     CARRUSEL 2026
     ============================================================ */

  let activeIndex =
    0;


  let rafId =
    0;


  let dragging =
    false;


  let dragged =
    false;


  let dragStartX =
    0;


  let dragStartScroll =
    0;



  function updateCarousel() {


    rafId =
      0;


    const viewport =
      track.getBoundingClientRect();


    const center =
      viewport.left +
      viewport.width / 2;


    let nearest =
      0;


    let nearestDistance =
      Infinity;



    items.forEach(
      (
        item,
        index
      ) => {


        const rect =
          item.getBoundingClientRect();


        const itemCenter =
          rect.left +
          rect.width / 2;


        const signed =
          (
            itemCenter -
            center
          ) /
          Math.max(
            rect.width,
            1
          );


        const distance =
          Math.min(
            1.5,
            Math.abs(
              signed
            )
          );



        if (
          distance <
          nearestDistance
        ) {


          nearestDistance =
            distance;


          nearest =
            index;

        }



        if (
          !reduceMotion.matches
        ) {


          const scale =
            1 -
            Math.min(
              distance *
              0.105,
              0.16
            );


          const lift =
            Math.min(
              distance *
              22,
              24
            );


          const rotate =
            Math.max(
              -8,
              Math.min(
                8,
                signed *
                -5.5
              )
            );


          const opacity =
            1 -
            Math.min(
              distance *
              0.28,
              0.42
            );



          item.style.transform =
            `perspective(1000px)
             translateY(${lift}px)
             rotateY(${rotate}deg)
             scale(${scale})`;


          item.style.opacity =
            opacity.toFixed(
              3
            );


          item.style.zIndex =
            String(
              100 -
              Math.round(
                distance *
                20
              )
            );


        } else {


          item.style.transform =
            "";


          item.style.opacity =
            "";


          item.style.zIndex =
            "";

        }

      }
    );



    activeIndex =
      nearest;



    items.forEach(
      (
        item,
        index
      ) => {


        item.classList.toggle(
          "is-gallery-active",
          index === activeIndex
        );

      }
    );



    if (currentEl) {


      currentEl.textContent =
        String(
          activeIndex + 1
        ).padStart(
          2,
          "0"
        );

    }



    const maxScroll =
      Math.max(
        1,
        track.scrollWidth -
        track.clientWidth
      );



    const percentage =
      Math.max(
        0,
        Math.min(
          100,
          (
            track.scrollLeft /
            maxScroll
          ) *
          100
        )
      );



    if (progressFill) {


      progressFill.style.width =
        `${Math.max(
          2.5,
          percentage
        )}%`;

    }



    if (prevBtn) {


      prevBtn.disabled =
        track.scrollLeft <=
        3;

    }



    if (nextBtn) {


      nextBtn.disabled =
        track.scrollLeft >=
        maxScroll -
        3;

    }

  }



  function scheduleUpdate() {


    if (!rafId) {


      rafId =
        requestAnimationFrame(
          updateCarousel
        );

    }

  }



  /* ============================================================
     IR A UNA FOTO
     ============================================================ */

  function goToItem(
    index
  ) {


    if (!items.length) {
      return;
    }


    const safeIndex =
      Math.max(
        0,
        Math.min(
          items.length -
          1,
          index
        )
      );


    const target =
      items[
        safeIndex
      ];


    if (!target) {
      return;
    }



    const left =
      target.offsetLeft -
      (
        track.clientWidth -
        target.clientWidth
      ) /
      2;



    track.scrollTo({

      left,

      behavior:
        reduceMotion.matches
          ? "auto"
          : "smooth"

    });

  }



  /* ============================================================
     FLECHAS
     ============================================================ */

  prevBtn?.addEventListener(
    "click",
    () => {


      goToItem(
        activeIndex -
        1
      );

    }
  );



  nextBtn?.addEventListener(
    "click",
    () => {


      goToItem(
        activeIndex +
        1
      );

    }
  );



  /* ============================================================
     ACTUALIZAR AL DESPLAZAR
     ============================================================ */

  track.addEventListener(
    "scroll",
    scheduleUpdate,
    {
      passive:
        true
    }
  );



  /* ============================================================
     RUEDA DEL MOUSE EN PC
     ============================================================ */

  track.addEventListener(
    "wheel",
    event => {


      if (
        !finePointer.matches
      ) {
        return;
      }



      const delta =
        Math.abs(
          event.deltaY
        ) >=
        Math.abs(
          event.deltaX
        )
          ? event.deltaY
          : event.deltaX;



      if (!delta) {
        return;
      }



      const maxScroll =
        track.scrollWidth -
        track.clientWidth;



      const canForward =
        delta > 0 &&
        track.scrollLeft <
        maxScroll -
        2;



      const canBack =
        delta < 0 &&
        track.scrollLeft >
        2;



      if (
        canForward ||
        canBack
      ) {


        event.preventDefault();


        track.scrollLeft +=
          delta *
          1.05;


        scheduleUpdate();

      }

    },
    {
      passive:
        false
    }
  );



  /* ============================================================
     ARRASTRAR CON MOUSE EN PC
     ============================================================ */

  track.addEventListener(
    "pointerdown",
    event => {


      if (
        event.pointerType !==
        "mouse"
      ) {
        return;
      }



      dragging =
        true;


      dragged =
        false;


      dragStartX =
        event.clientX;


      dragStartScroll =
        track.scrollLeft;


      track.classList.add(
        "is-grabbing"
      );


      track.setPointerCapture?.(
        event.pointerId
      );

    }
  );



  track.addEventListener(
    "pointermove",
    event => {


      if (
        !dragging ||
        event.pointerType !==
        "mouse"
      ) {
        return;
      }



      const dx =
        event.clientX -
        dragStartX;



      if (
        Math.abs(
          dx
        ) >
        4
      ) {


        dragged =
          true;

      }



      track.scrollLeft =
        dragStartScroll -
        dx;


      scheduleUpdate();

    }
  );



  function stopDrag(
    event
  ) {


    if (!dragging) {
      return;
    }


    dragging =
      false;


    track.classList.remove(
      "is-grabbing"
    );



    if (
      event?.pointerId !=
      null
    ) {


      track.releasePointerCapture?.(
        event.pointerId
      );

    }

  }



  track.addEventListener(
    "pointerup",
    stopDrag
  );


  track.addEventListener(
    "pointercancel",
    stopDrag
  );


  track.addEventListener(
    "pointerleave",
    event => {


      if (
        dragging &&
        event.buttons ===
        0
      ) {


        stopDrag(
          event
        );

      }

    }
  );



  /* ============================================================
     MUY IMPORTANTE

     Si arrastras la galería con el mouse,
     al soltar NO abre accidentalmente la fotografía.
     ============================================================ */

  track.addEventListener(
    "click",
    event => {


      if (!dragged) {
        return;
      }


      event.preventDefault();


      event.stopImmediatePropagation();


      dragged =
        false;

    },
    true
  );



  /* ============================================================
     FLECHAS DEL TECLADO
     ============================================================ */

  track.addEventListener(
    "keydown",
    event => {


      if (
        event.key ===
        "ArrowRight"
      ) {


        event.preventDefault();


        goToItem(
          activeIndex +
          1
        );

      }



      if (
        event.key ===
        "ArrowLeft"
      ) {


        event.preventDefault();


        goToItem(
          activeIndex -
          1
        );

      }

    }
  );



  window.addEventListener(
    "resize",
    scheduleUpdate
  );



  /* ============================================================
     MOSTRAR / OCULTAR MEMORIA HISTÓRICA
     ============================================================ */

  let showing2026 =
    false;



  function setOriginalHidden(
    hidden
  ) {


    originalPanels.classList.toggle(
      "mg2026-hidden",
      hidden
    );


    originalHint?.classList.toggle(
      "mg2026-hidden",
      hidden
    );


    originalControls?.classList.toggle(
      "mg2026-hidden",
      hidden
    );


    originalProgress?.classList.toggle(
      "mg2026-hidden",
      hidden
    );

  }



  /* ============================================================
     BOTÓN 2026

     Primer clic:
     muestra fotografías 2026.

     Segundo clic:
     regresa exactamente a la Memoria Gráfica histórica.
     ============================================================ */

  toggle.addEventListener(
    "click",
    () => {


      showing2026 =
        !showing2026;



      toggle.classList.toggle(
        "is-active",
        showing2026
      );


      toggle.setAttribute(
        "aria-pressed",
        String(
          showing2026
        )
      );



      setOriginalHidden(
        showing2026
      );


      experience.hidden =
        !showing2026;



      if (
        showing2026
      ) {


        requestAnimationFrame(
          () => {


            goToItem(
              activeIndex
            );


            updateCarousel();

          }
        );

      }

    }
  );
});