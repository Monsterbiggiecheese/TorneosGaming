"use strict";
const DATOS = [
  {id:1,nombre:"ObreeoTournament",juego:"Left4Dead2",formatos:["1vs1","2vs2","3vs3"],nivel:"1500 horas",acceso:"Solo invitación",fecha:"2026-11-02T15:00",premio:50000,jugadores:10,cupos:30,color:"verde",desc:"Torneo en modalidad de duelos entre equipos, prueba tus habilidades y demuestra que eres el mejor"},
  {id:2,nombre:"Checkmate Knock Out",juego:"Ajedrez",formatos:["Rapid","10+0","Suizo"],nivel:"1200-1400 ELO",acceso:"Abierto",fecha:"2026-10-26T19:00",premio:20000,jugadores:39,cupos:40,color:"rojo",desc:"Torneo rápido para jugadores intermedios. ¡Quedan pocos cupos!"},
  {id:3,nombre:"Copa Fénix 5v5",juego:"Valorant",formatos:["5v5","Bo3","Eliminación"],nivel:"Diamante+",acceso:"Abierto",fecha:"2026-11-08T18:00",premio:80000,jugadores:16,cupos:16,color:"rojo",desc:"Cupos agotados. Revisa los próximos torneos."},
  {id:4,nombre:"Liga Pixel FIFA",juego:"FIFA",formatos:["1v1","Liga","8 jugadores"],nivel:"Todos",acceso:"Abierto",fecha:"2026-11-12T20:00",premio:5000,jugadores:3,cupos:8,color:"azul",desc:"Liga corta, ideal para empezar a competir."},
  {id:5,nombre:"Torneo Arena Fortnite",juego:"Fortnite",formatos:["Dúos","3 partidas","Puntos"],nivel:"Todos",acceso:"Abierto",fecha:"2026-11-15T17:00",premio:12000,jugadores:22,cupos:50,color:"morado",desc:"Gana puntos por eliminaciones y posición final."},
  {id:6,nombre:"Rocket Cup Lima",juego:"Rocket League",formatos:["3v3","Bo5","Doble elim."],nivel:"Oro+",acceso:"Abierto",fecha:"2026-11-20T19:30",premio:30000,jugadores:11,cupos:12,color:"azul",desc:"Equipos de 3. Se inscribe cada jugador de forma individual."}
];

class Torneo {
  constructor(d) {
    Object.assign(this, d);
    this.inscrito = false;
  }
  get lleno() {
    return this.jugadores >= this.cupos;
  }
  get libres() {
    return this.cupos - this.jugadores;
  }
  dias() {
    return Math.ceil((new Date(this.fecha) - new Date()) / 864e5);
  }
  inscribir() {
    if (this.inscrito || this.lleno) return false;
    this.inscrito = true;
    this.jugadores++;
    return true;
  }
  cancelar() {
    if (!this.inscrito) return false;
    this.inscrito = false;
    this.jugadores--;
    return true;
  }
}

class GestorTorneos {
  constructor(datos) {
    this.torneos = datos.map((d) => new Torneo(d));
    const guardados = JSON.parse(localStorage.getItem("inscritos") || "[]");
    guardados.forEach((id) => this.buscar(id)?.inscribir());
  }
  buscar(id) {
    return this.torneos.find((t) => t.id === id);
  }
  inscritos() {
    return this.torneos.filter((t) => t.inscrito);
  }
  juegos() {
    return [...new Set(this.torneos.map((t) => t.juego))];
  }
  guardar() {
    localStorage.setItem(
      "inscritos",
      JSON.stringify(this.inscritos().map((t) => t.id)),
    );
  }
  alternar(id) {
    const t = this.buscar(id);
    if (t.inscrito) {
      t.cancelar();
      this.guardar();
      return `Cancelaste tu inscripción en ${t.nombre}.`;
    }
    if (t.lleno) return `${t.nombre} ya no tiene cupos.`;
    t.inscribir();
    this.guardar();
    return `Te inscribiste en ${t.nombre}.`;
  }
  filtrar({ texto, juego, estado }) {
    return this.torneos.filter(
      (t) =>
        t.nombre.toLowerCase().includes(texto.toLowerCase()) &&
        (juego === "todos" || t.juego === juego) &&
        (estado === "todos" ||
          (estado === "inscritos" && t.inscrito) ||
          (estado === "disponibles" && !t.lleno) ||
          (estado === "llenos" && t.lleno)),
    );
  }
}

class InterfazUI {
  constructor(gestor) {
    this.g = gestor;
    this.$ = (id) => document.getElementById(id);
    this.abierto = null;
    this.$("juego").insertAdjacentHTML(
      "beforeend",
      gestor
        .juegos()
        .map((j) => `<option>${j}</option>`)
        .join(""),
    );
    ["texto", "juego", "estado"].forEach((id) =>
      this.$(id).addEventListener(id === "texto" ? "input" : "change", () =>
        this.renderizar(),
      ),
    );
    document.addEventListener("click", (e) => this.clic(e));
    this.renderizar();
  }
  clic(e) {
    const b = e.target.closest("[data-accion]");
    if (!b) return;
    const id = Number(b.dataset.id),
      acc = b.dataset.accion;
    if (acc === "alternar") {
      this.aviso(this.g.alternar(id));
      this.renderizar();
      if (this.$("modal").open) this.detalle(id);
    } else if (acc === "detalle") this.detalle(id);
    else if (acc === "cerrar") this.$("modal").close();
    else if (acc === "irMis")
      this.$("mis").scrollIntoView({ behavior: "smooth" });
  }
  boton(t) {
    if (t.inscrito)
      return `<button class="btn btn-cancel" data-accion="alternar" data-id="${t.id}">Cancelar inscripción</button>`;
    if (t.lleno) return `<button class="btn" disabled>Cupos llenos</button>`;
    return `<button class="btn" data-accion="alternar" data-id="${t.id}">Unirme al torneo</button>`;
  }
  estadoFecha(t) {
    const d = t.dias();
    if (d < 0) return `<span class="rojo">Finalizado</span>`;
    return `<span class="ok">Empieza en ${d} ${d === 1 ? "día" : "días"}</span>`;
  }
  tarjeta(t) {
    const pct = Math.round((t.jugadores / t.cupos) * 100);
    const fecha = new Date(t.fecha).toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `<article class="card">
      <div class="banner v-${t.color}" role="img" aria-label="Portada de ${t.nombre}">${t.juego}<span class="badge">${t.acceso}</span></div>
      <div class="cuerpo">
        <h3>${t.nombre}</h3>
        <ul class="tags">${t.formatos.map((f) => `<li>${f}</li>`).join("")}</ul>
        <p class="meta">${t.nivel}</p>
        <div class="fecha"><span>${fecha}</span>${this.estadoFecha(t)}</div>
        <div class="stats">
          <div class="stat"><small>PREMIO</small><b>${t.premio.toLocaleString("es-PE")} 🪙</b></div>
          <div class="stat"><small>JUGADORES</small><b>${t.jugadores}/${t.cupos}</b>
            <div class="barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Cupos ocupados"><i class="${t.lleno ? "full" : ""}" style="width:${pct}%"></i></div></div>
        </div>
        <div class="acciones">${this.boton(t)}<button class="btn btn-sec" data-accion="detalle" data-id="${t.id}" aria-label="Ver detalles de ${t.nombre}">Detalles</button></div>
      </div></article>`;
  }
  renderizar() {
    const lista = this.g.filtrar({
      texto: this.$("texto").value,
      juego: this.$("juego").value,
      estado: this.$("estado").value,
    });
    this.$("lista").innerHTML =
      lista.map((t) => this.tarjeta(t)).join("") ||
      `<p class="vacio">No hay torneos con esos filtros. Prueba con otra búsqueda.</p>`;
    this.$("resultados").textContent =
      `${lista.length} torneo(s) encontrado(s)`;
    const ins = this.g.inscritos();
    this.$("contador").textContent = ins.length;
    this.$("listaMis").innerHTML =
      ins
        .map(
          (t) =>
            `<li><span><strong>${t.nombre}</strong> · ${t.juego}</span><button class="btn btn-cancel" data-accion="alternar" data-id="${t.id}">Cancelar inscripción</button></li>`,
        )
        .join("") ||
      `<li class="vacio">Aún no te inscribes en ningún torneo.</li>`;
  }
  detalle(id) {
    const t = this.g.buscar(id);
    this.$("modal").innerHTML =
      `<h2 id="mTitulo">${t.nombre}</h2><p>${t.desc}</p>
      <ul><li>Juego: ${t.juego}</li><li>Nivel: ${t.nivel}</li><li>Acceso: ${t.acceso}</li><li>Formato: ${t.formatos.join(", ")}</li>
      <li>Fecha: ${new Date(t.fecha).toLocaleString("es-PE", { dateStyle: "full", timeStyle: "short" })}</li>
      <li>Premio: ${t.premio.toLocaleString("es-PE")} monedas</li><li>Cupos libres: ${t.libres} de ${t.cupos}</li></ul>
      <div class="acciones">${this.boton(t)}<button class="btn btn-sec" data-accion="cerrar">Cerrar</button></div>`;
    if (!this.$("modal").open) this.$("modal").showModal();
  }
  aviso(msg) {
    const a = this.$("aviso");
    a.textContent = msg;
    a.classList.add("ver");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => a.classList.remove("ver"), 3000);
  }
}

new InterfazUI(new GestorTorneos(DATOS));
