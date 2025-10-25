// promociones.js (Tecno Galería) — FIX radio change fuera del <form>
// Agregamos listeners directos a los radios de promo para que recalculen al cambiar.

const PRODUCTOS = [
  { id: "vidrio", nombre: "Vidrio templado (celular)", precio: 3500 },
  { id: "funda", nombre: "Funda silicona premium", precio: 6000 },
  { id: "cargador20w", nombre: "Cargador rápido 20W", precio: 9500 },
  { id: "cableusbc", nombre: "Cable USB-C reforzado", precio: 4000 },
  { id: "earbuds", nombre: "Auriculares in-ear", precio: 12000 },
  { id: "mousewl", nombre: "Mouse inalámbrico", precio: 15000 },
  { id: "padxl", nombre: "Pad de mouse XL", precio: 8000 },
  { id: "coolerntb", nombre: "Cooler para notebook", precio: 22000 },
  { id: "service", nombre: "Service express limpieza", precio: 18000 }
];

const fmtARS = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

let lineas = [];

function initPromos() {
  const sel = document.getElementById("producto");
  const btn = document.getElementById("agregarBtn");
  const fallback = document.getElementById("fallbackJS");

  // Cargar productos
  PRODUCTOS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nombre} — ${fmtARS(p.precio)}`;
    sel.appendChild(opt);
  });
  btn.disabled = false;
  if (fallback) fallback.style.display = "none";

  // Listeners
  document.getElementById("agregarBtn").addEventListener("click", agregarLinea);
  document.getElementById("tablaCarrito").addEventListener("input", onCantidadEditada);
  document.getElementById("tablaCarrito").addEventListener("click", onTablaClick);

  // 🔧 FIX: los radios están fuera del <form>, agregamos listeners directos
  document.querySelectorAll('input[name="promo"]').forEach(r => {
    r.addEventListener("change", recalcular);
  });

  renderTabla();
  recalcular();
}

function productoPorId(pid) { return PRODUCTOS.find(p => p.id === pid); }

function agregarLinea(e) {
  e.preventDefault();
  const pid = document.getElementById("producto").value;
  const qty = parseInt(document.getElementById("cantidad").value, 10) || 1;
  const prod = productoPorId(pid);
  if (!prod) return;
  const existente = lineas.find(l => l.id === pid);
  if (existente) existente.cantidad += qty;
  else lineas.push({ id: pid, nombre: prod.nombre, precio: prod.precio, cantidad: qty });
  renderTabla();
  recalcular();
}

function onCantidadEditada(e) {
  if (!e.target.classList.contains("input-cantidad")) return;
  const idx = parseInt(e.target.dataset.index, 10);
  let nueva = parseInt(e.target.value, 10);
  if (isNaN(nueva) || nueva < 1) nueva = 1;
  lineas[idx].cantidad = nueva;
  renderTabla();
  recalcular();
}

function onTablaClick(e) {
  if (!e.target.classList.contains("btn-eliminar")) return;
  const idx = parseInt(e.target.dataset.index, 10);
  lineas.splice(idx, 1);
  renderTabla();
  recalcular();
}

function renderTabla() {
  const tbody = document.querySelector("#tablaCarrito tbody");
  tbody.innerHTML = "";
  lineas.forEach((l, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.nombre}</td>
      <td>${fmtARS(l.precio)}</td>
      <td><input class="input-cantidad" data-index="${i}" type="number" min="1" value="${l.cantidad}" aria-label="Cantidad para ${l.nombre}"></td>
      <td class="right">${fmtARS(l.precio * l.cantidad)}</td>
      <td class="right"><button class="btn-eliminar" data-index="${i}" aria-label="Eliminar ${l.nombre}">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("estadoVacio").style.display = lineas.length ? "none" : "block";
}

// Promos
function descDosPorCincuenta() {
  let desc = 0;
  for (const l of lineas) desc += Math.floor(l.cantidad / 2) * (l.precio * 0.5);
  return { descuento: desc, detalle: "50% sobre la segunda unidad en cada par del mismo producto." };
}
function descTresPorDos() {
  let desc = 0;
  for (const l of lineas) desc += Math.floor(l.cantidad / 3) * l.precio;
  return { descuento: desc, detalle: "Por cada 3 unidades del mismo producto, una sin cargo (3x2)." };
}
function descDiezPorcUmbral(subtotal) {
  return subtotal >= 30000 ? { descuento: subtotal * 0.10, detalle: "Subtotal supera $30.000: 10% de descuento." }
                           : { descuento: 0, detalle: "El subtotal no supera $30.000, no corresponde el 10%." };
}

function calcularSubtotal() { return lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0); }

function recalcular() {
  const subtotal = calcularSubtotal();
  const promo = document.querySelector('input[name="promo"]:checked')?.value || "ninguna";
  let res = { descuento: 0, detalle: "Sin promoción seleccionada." };
  if (promo === "50segundo") res = descDosPorCincuenta();
  else if (promo === "3x2") res = descTresPorDos();
  else if (promo === "10umbral") res = descDiezPorcUmbral(subtotal);

  const total = Math.max(0, subtotal - res.descuento);
  document.getElementById("subtotal").textContent = fmtARS(subtotal);
  document.getElementById("descuento").textContent = `− ${fmtARS(res.descuento)}`;
  document.getElementById("total").textContent = fmtARS(total);
  document.getElementById("detallePromo").textContent = res.detalle;
  const live = document.getElementById("liveRegion");
  if (live) live.textContent = `Subtotal ${fmtARS(subtotal)}. Descuento ${fmtARS(res.descuento)}. Total ${fmtARS(total)}.`;
}

document.addEventListener("DOMContentLoaded", initPromos);
