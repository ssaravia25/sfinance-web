(function () {
  'use strict';

  // endpoint: URL /exec de la aplicación web de Apps Script (apps-script/Codigo.gs).
  // token: tiene que ser idéntico a TOKEN en Codigo.gs.
  var CONFIG = {
    endpoint: '',
    token: 'ahCGWKUtPDVMx3doMv17THrBoZSDUazD'
  };

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();

  var modal = document.getElementById('contacto');
  var form = document.getElementById('form-contacto');
  if (!modal || !form) return;

  var gracias = modal.querySelector('.gracias');
  var estado = form.querySelector('.form-estado');
  var btn = form.querySelector('.btn-enviar');

  function abrir() {
    form.hidden = false;
    gracias.hidden = true;
    limpiar();
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    form.elements.nombre.focus();
  }

  function cerrar() {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  }

  document.querySelectorAll('[data-abrir-contacto]').forEach(function (b) {
    b.addEventListener('click', abrir);
  });
  modal.querySelectorAll('[data-cerrar]').forEach(function (b) {
    b.addEventListener('click', cerrar);
  });
  // Clic fuera de la ventana (sobre el fondo) la cierra.
  modal.addEventListener('click', function (e) {
    if (e.target === modal) cerrar();
  });

  function limpiar() {
    estado.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
  }

  function avisar(campo, texto) {
    estado.textContent = texto;
    if (campo) {
      campo.setAttribute('aria-invalid', 'true');
      campo.focus();
    }
  }

  function terminar() {
    form.reset();
    form.hidden = true;
    gracias.hidden = false;
    gracias.querySelector('[data-cerrar]').focus();
    restaurar();
  }

  function fallar() {
    avisar(null, 'No se pudo enviar. Inténtalo de nuevo en unos minutos.');
    restaurar();
  }

  function restaurar() {
    form.dataset.enviando = '';
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }

  form.addEventListener('input', function (e) {
    if (e.target.hasAttribute('aria-invalid')) limpiar();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.dataset.enviando === '1') return;
    limpiar();

    var f = form.elements;
    var nombre = f.nombre.value.trim();
    var email = f.email.value.trim();
    var mensaje = f.mensaje.value.trim();
    if (!nombre) return avisar(f.nombre, 'Escribe tu nombre.');
    if (!EMAIL.test(email)) return avisar(f.email, 'Revisa tu email.');
    if (!mensaje) return avisar(f.mensaje, 'Escribe tu mensaje.');

    // Trampa para bots: si viene rellena, fingimos éxito y no enviamos nada.
    if (f.web.value) return terminar();

    if (!CONFIG.endpoint) return avisar(null, 'El formulario todavía no está activo.');

    form.dataset.enviando = '1';
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var reloj = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

    // Content-Type text/plain a propósito: mantiene la petición "simple" para
    // que el navegador no lance el preflight OPTIONS, que Apps Script no
    // responde. Con application/json el formulario falla en producción.
    fetch(CONFIG.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        form: 'contacto',
        token: CONFIG.token,
        nombre: nombre,
        email: email,
        mensaje: mensaje,
        pagina: location.href
      }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json();
    }).then(function (j) {
      clearTimeout(reloj);
      // Solo un ok explícito cuenta como enviado: un fetch resuelto no basta.
      if (j && j.ok) terminar(); else fallar();
    }).catch(function () {
      clearTimeout(reloj);
      fallar();
    });
  });
})();
