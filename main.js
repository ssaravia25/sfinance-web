(function () {
  'use strict';

  // Envío del formulario con FormSubmit (https://formsubmit.co).
  // Los mensajes llegan a contact@sfinance.world. La primera vez FormSubmit
  // envía un correo de activación a esa casilla: hay que confirmarlo.
  var CONFIG = {
    endpoint: 'https://formsubmit.co/ajax/contact@sfinance.world',
    asunto: 'Nuevo mensaje desde sfinance.world'
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
    if (f.web && f.web.value) return terminar();

    form.dataset.enviando = '1';
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var reloj = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombre,
        email: email,
        mensaje: mensaje,
        pagina: location.href,
        _subject: CONFIG.asunto,
        _template: 'table'
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json();
    }).then(function (j) {
      clearTimeout(reloj);
      // FormSubmit responde success como texto ("true") o booleano.
      if (j && (j.success === true || j.success === 'true')) terminar();
      else fallar();
    }).catch(function () {
      clearTimeout(reloj);
      fallar();
    });
  });
})();
