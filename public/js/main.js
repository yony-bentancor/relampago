/* Comportamientos del sitio. Todo funciona también sin JavaScript (salvo el QR). */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Menú del sitio (celulares)
  const botonMenu = $("[data-menu]");
  const nav = $("nav.pub");
  if (botonMenu && nav) {
    botonMenu.addEventListener("click", () => {
      const abierto = nav.classList.toggle("abierto");
      botonMenu.setAttribute("aria-expanded", abierto);
    });
  }

  // Cajón de secciones del panel (celulares)
  const side = $("aside.side");
  const velo = $(".velo");
  const abrirSide = (abrir) => {
    if (!side) return;
    side.classList.toggle("abierto", abrir);
    if (velo) velo.hidden = !abrir;
    document.body.style.overflow = abrir ? "hidden" : "";
    $$("[data-secciones]").forEach((b) => b.setAttribute("aria-expanded", abrir));
    if (abrir) { const a = $("a.on", side) || $("a", side); a && a.focus(); }
  };
  $$("[data-secciones]").forEach((b) => b.addEventListener("click", () => abrirSide(!side.classList.contains("abierto"))));
  $$("[data-cerrar-secciones]").forEach((b) => b.addEventListener("click", () => abrirSide(false)));
  if (velo) velo.addEventListener("click", () => abrirSide(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrirSide(false); });

  // Confirmación antes de acciones importantes
  $$("form[data-confirmar]").forEach((f) => f.addEventListener("submit", (e) => {
    if (e.submitter && e.submitter.dataset.confirmar) return;
    if (!window.confirm(f.dataset.confirmar)) e.preventDefault();
  }));
  $$("button[data-confirmar]").forEach((b) => b.addEventListener("click", (e) => {
    if (!window.confirm(b.dataset.confirmar)) e.preventDefault();
  }));

  // Filtros que se aplican al cambiar
  $$("[data-autoenviar]").forEach((el) => el.addEventListener("change", () => el.form && el.form.submit()));

  // Marcar todos (asistencia, convocatorias)
  $$("[data-marcar-todos]").forEach((b) => b.addEventListener("click", () => {
    $$(`input[type=checkbox][name="${b.dataset.marcarTodos}"]`).forEach((c) => { c.checked = true; });
    contarMarcados();
  }));
  function contarMarcados() {
    $$("[data-contador]").forEach((el) => {
      const n = $$(`input[type=checkbox][name="${el.dataset.contador}"]:checked`).length;
      el.textContent = n;
    });
  }
  document.addEventListener("change", (e) => { if (e.target.matches("input[type=checkbox]")) contarMarcados(); });
  contarMarcados();

  // Archivos adjuntos: mostrar el nombre elegido
  $$(".drop input[type=file]").forEach((inp) => inp.addEventListener("change", () => {
    const d = inp.closest(".drop");
    const etiqueta = d && $(".nombre-archivo", d);
    if (inp.files[0] && etiqueta) { etiqueta.textContent = inp.files[0].name; d.classList.add("ok"); }
  }));

  // Destinatario de un comunicado: mostrar el selector de socio
  const para = $("#cm-para");
  if (para) {
    const fila = $("#cm-socio-fila");
    const actualizar = () => { fila.hidden = para.value !== "socio"; };
    para.addEventListener("change", actualizar); actualizar();
  }

  // Origen del comunicado: cambia los destinatarios posibles
  const origen = $("#cm-origen"), datosDestinos = $("#cm-destinos");
  if (origen && para && datosDestinos) {
    const mapa = JSON.parse(datosDestinos.textContent);
    origen.addEventListener("change", () => {
      para.innerHTML = "";
      (mapa[origen.value] || []).forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; para.appendChild(o); });
      para.dispatchEvent(new Event("change"));
    });
  }

  // Plantillas de comunicados
  $$("[data-plantilla]").forEach((b) => b.addEventListener("click", () => {
    $("#cm-titulo").value = b.dataset.plantilla;
    $("#cm-texto").value = b.dataset.texto;
  }));

  // Códigos QR
  $$("[data-qr]").forEach((el) => {
    if (window.QRCode) new window.QRCode(el, { text: el.dataset.qr, width: Number(el.dataset.tam || 200), height: Number(el.dataset.tam || 200), colorDark: "#18151A", colorLight: "#ffffff" });
    else el.textContent = el.dataset.qr;
  });

  // Copiar al portapapeles
  $$("[data-copiar]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copiar); b.textContent = "Copiado"; } catch { /* sin permiso */ }
  }));

  // Ocultar avisos flash después de unos segundos
  const flash = $(".flash[data-auto]");
  if (flash) setTimeout(() => { flash.hidden = true; }, 7000);
})();
