var KEY = "market-cart-v1", photo = "", view = "cart", cal = new Date(), sel = null;
var S = { name: "", budget: 0, monthly: 0, items: [], regulars: [], trips: [] };
var $ = function (id) { return document.getElementById(id); };
cal.setDate(1);

function load() { try { var r = JSON.parse(localStorage.getItem(KEY)); if (r) for (var k in r) S[k] = r[k]; } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function pad(n) { return (n < 10 ? "0" : "") + n; }
function ds(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function inr(n) { return "₹" + (Math.round(n * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
function short(n) { return n >= 1000 ? (Math.round(n / 100) / 10) + "k" : String(Math.round(n)); }
function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function total() { return S.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0); }
function setv(id, v) { if (document.activeElement !== $(id)) $(id).value = v; }
function isReg(i) { return S.regulars.some(function (r) { return r.name === i.name && r.price === i.price; }); }
var TODAY = ds(new Date()); sel = TODAY;

/* ---------- cart ---------- */
function renderCart() {
  var t = total(), b = +S.budget || 0, left = b - t;
  var n = S.items.reduce(function (a, i) { return a + i.qty; }, 0);
  setv("budget", b || "");
  $("hello").textContent = S.name ? "Hi, " + S.name : "Market Cart";
  $("total").textContent = inr(t);
  $("count").textContent = n + (n === 1 ? " item" : " items");
  $("badge").textContent = n || "";
  $("left").textContent = inr(Math.abs(left));
  $("left").className = "left" + (left < 0 ? " bad" : "");
  $("lbl").textContent = b ? (left < 0 ? "Over budget by" : "Left to spend") : "Set a budget to track";
  $("fill").style.width = (b ? Math.min(100, t / b * 100) : 0) + "%";
  $("fill").className = left < 0 ? "bad" : "";
  $("pay").disabled = !S.items.length;
  $("pay").textContent = S.items.length ? "Go to counter · " + inr(t) : "Go to counter";
  var c = $("cart");
  if (!S.items.length) { c.innerHTML = '<p class="empty">Your cart is empty.<br>Snap an item or add from Regulars.</p>'; return; }
  c.innerHTML = S.items.map(function (i) {
    return '<div class="item"><img class="ph" alt="" ' + (i.photo ? 'src="' + i.photo + '"' : '') + '>' +
      '<div class="info"><div class="name">' + esc(i.name) + '</div><div class="sub">' + inr(i.price) + ' each</div>' +
      '<div class="qty"><button data-a="dec" data-id="' + i.id + '" aria-label="Less">−</button><b>' + i.qty +
      '</b><button data-a="inc" data-id="' + i.id + '" aria-label="More">+</button></div></div>' +
      '<div class="amt">' + inr(i.price * i.qty) + '</div>' +
      '<button class="fav" data-a="fav" data-id="' + i.id + '" aria-label="Save as regular">' + (isReg(i) ? "★" : "☆") + '</button>' +
      '<button class="x" data-a="del" data-id="' + i.id + '" aria-label="Remove">✕</button></div>';
  }).join("");
}
$("cart").addEventListener("click", function (e) {
  var a = e.target.dataset.a, id = e.target.dataset.id;
  if (!a) return;
  var it = S.items.filter(function (i) { return i.id == id; })[0];
  if (!it) return;
  if (a === "inc") it.qty++;
  if (a === "dec" && --it.qty < 1) S.items = S.items.filter(function (i) { return i !== it; });
  if (a === "del") S.items = S.items.filter(function (i) { return i !== it; });
  if (a === "fav") {
    if (isReg(it)) S.regulars = S.regulars.filter(function (r) { return !(r.name === it.name && r.price === it.price); });
    else S.regulars.push({ id: Date.now(), name: it.name, price: it.price, photo: it.photo });
  }
  save(); renderAll();
});

/* ---------- regulars ---------- */
function renderRegs() {
  var el = $("regs");
  if (!S.regulars.length) { el.innerHTML = '<p class="empty">No regulars yet.<br>Tap ☆ on a cart item to save it.</p>'; return; }
  el.innerHTML = S.regulars.map(function (r) {
    return '<div class="item"><img class="ph" alt="" ' + (r.photo ? 'src="' + r.photo + '"' : '') + '>' +
      '<div class="info"><div class="name">' + esc(r.name) + '</div><div class="sub">' + inr(r.price) + '</div></div>' +
      '<button class="fav" data-a="radd" data-id="' + r.id + '" aria-label="Add to cart">+</button>' +
      '<button class="x" data-a="rdel" data-id="' + r.id + '" aria-label="Remove">✕</button></div>';
  }).join("");
}
$("regs").addEventListener("click", function (e) {
  var a = e.target.dataset.a, id = e.target.dataset.id;
  if (!a) return;
  var r = S.regulars.filter(function (x) { return x.id == id; })[0];
  if (!r) return;
  if (a === "rdel") S.regulars = S.regulars.filter(function (x) { return x !== r; });
  if (a === "radd") {
    var same = S.items.filter(function (i) { return i.name === r.name && i.price === r.price; })[0];
    if (same) same.qty++; else S.items.push({ id: Date.now(), name: r.name, price: r.price, qty: 1, photo: r.photo });
  }
  save(); renderAll();
});

/* ---------- history ---------- */
function renderHist() {
  var y = cal.getFullYear(), m = cal.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  var ms = y + "-" + pad(m + 1), tot = {}, sum = 0, cnt = 0, i, d;
  S.trips.forEach(function (t) { if (t.date.slice(0, 7) === ms) { tot[t.date] = (tot[t.date] || 0) + t.total; sum += t.total; cnt++; } });
  $("mlabel").textContent = cal.toLocaleString("en-IN", { month: "long", year: "numeric" });
  var h = ["S", "M", "T", "W", "T", "F", "S"].map(function (x) { return '<div class="dow">' + x + '</div>'; }).join("");
  for (i = 0; i < first; i++) h += "<div></div>";
  for (d = 1; d <= days; d++) {
    var k = ms + "-" + pad(d);
    h += '<button class="day' + (tot[k] ? " has" : "") + (k === TODAY ? " today" : "") + (k === sel ? " sel" : "") + '" data-d="' + k + '">' + d + '<small>' + (tot[k] ? short(tot[k]) : "") + '</small></button>';
  }
  $("cal").innerHTML = h;
  var mb = +S.monthly || 0;
  $("mspent").textContent = inr(sum);
  $("mtrips").textContent = cnt + (cnt === 1 ? " trip" : " trips");
  $("mleft").textContent = mb ? (sum > mb ? "Over by " + inr(sum - mb) : inr(mb - sum) + " left of " + inr(mb)) : "Set a monthly budget in Profile";
  $("mfill").style.width = (mb ? Math.min(100, sum / mb * 100) : 0) + "%";
  $("mfill").className = mb && sum > mb ? "bad" : "";
  var trips = S.trips.filter(function (t) { return t.date === sel; });
  $("day").innerHTML = !sel ? "" : !trips.length ? '<p class="empty">No trips on this day.</p>' :
    trips.map(function (t) {
      return '<div class="trip"><div class="row"><span>Shopping trip</span><span>' + inr(t.total) + '</span></div><p>' +
        t.items.map(function (i) { return esc(i.name) + " × " + i.qty; }).join(", ") + '</p></div>';
    }).join("");
}
$("cal").addEventListener("click", function (e) { var b = e.target.closest(".day"); if (b) { sel = b.dataset.d; renderHist(); } });
$("prev").onclick = function () { cal.setMonth(cal.getMonth() - 1); renderHist(); };
$("next").onclick = function () { cal.setMonth(cal.getMonth() + 1); renderHist(); };

/* ---------- profile ---------- */
function renderProf() {
  setv("pname", S.name); setv("pbudget", S.budget || ""); setv("pmonthly", S.monthly || "");
  var sum = S.trips.reduce(function (a, t) { return a + t.total; }, 0), n = S.trips.length;
  $("stTrips").textContent = n; $("stTotal").textContent = inr(sum); $("stAvg").textContent = inr(n ? sum / n : 0);
}
$("pname").addEventListener("input", function () { S.name = this.value; save(); renderAll(); });
$("pbudget").addEventListener("input", function () { S.budget = +this.value || 0; save(); renderAll(); });
$("budget").addEventListener("input", function () { S.budget = +this.value || 0; save(); renderAll(); });
$("pmonthly").addEventListener("input", function () { S.monthly = +this.value || 0; save(); renderAll(); });
$("export").onclick = function () {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" }));
  a.download = "market-cart-data.json"; a.click();
};
$("reset").onclick = function () {
  if (!confirm("Erase all items, regulars, history and settings?")) return;
  S = { name: "", budget: 0, monthly: 0, items: [], regulars: [], trips: [] }; save(); renderAll();
};

/* ---------- navigation ---------- */
function renderAll() { renderCart(); renderRegs(); renderHist(); renderProf(); }
function show(v) {
  view = v;
  ["cart", "reg", "hist", "prof"].forEach(function (x) { $("v-" + x).classList.toggle("on", x === v); });
  Array.prototype.forEach.call($("nav").children, function (b) { b.classList.toggle("on", b.dataset.v === v); });
  $("paybar").classList.toggle("off", v !== "cart");
  window.scrollTo(0, 0);
}
$("nav").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) show(b.dataset.v); });

/* ---------- add item ---------- */
function snapHTML(img) {
  return (img ? '<img alt="Item photo" src="' + img + '">' : '<span>Tap to take a photo</span>') +
    '<input id="file" type="file" accept="image/*" capture="environment" hidden>';
}
function bindFile() {
  $("file").addEventListener("change", function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 240 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = im.width * k; c.height = im.height * k;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        photo = c.toDataURL("image/jpeg", 0.6);
        $("snap").innerHTML = snapHTML(photo); bindFile();
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  });
}
function preview() {
  var p = +$("iprice").value || 0, q = Math.max(1, +$("iqty").value || 1), t = total() + p * q, b = +S.budget || 0;
  $("preview").textContent = p ? "Cart will be " + inr(t) + (b ? (t > b ? ", over budget by " + inr(t - b) : ", " + inr(b - t) + " left") : "") : "";
}
$("iprice").addEventListener("input", preview);
$("iqty").addEventListener("input", preview);
$("add").onclick = function () {
  photo = ""; $("snap").innerHTML = snapHTML(""); bindFile();
  $("iname").value = ""; $("iprice").value = ""; $("iqty").value = 1; $("preview").textContent = "";
  $("addSheet").classList.add("on");
};
$("cancel").onclick = function () { $("addSheet").classList.remove("on"); };
$("save").onclick = function () {
  var p = +$("iprice").value;
  if (!(p > 0)) { $("iprice").focus(); $("preview").textContent = "Enter the price on the tag."; return; }
  S.items.push({ id: Date.now(), name: $("iname").value.trim() || "Item " + (S.items.length + 1), price: p,
    qty: Math.max(1, Math.floor(+$("iqty").value || 1)), photo: photo });
  save(); renderAll(); $("addSheet").classList.remove("on");
};

/* ---------- counter ---------- */
$("pay").onclick = function () {
  var t = total(), b = +S.budget || 0;
  $("ctotal").textContent = inr(t);
  $("receipt").innerHTML = S.items.map(function (i) {
    return "<div><span>" + esc(i.name) + " × " + i.qty + "</span><span>" + inr(i.price * i.qty) + "</span></div>";
  }).join("") + '<div class="tot"><span>Total</span><span>' + inr(t) + "</span></div>" +
  (b ? "<div><span>Budget</span><span>" + inr(b) + "</span></div><div><span>" + (t > b ? "Over by" : "Saved") + "</span><span>" + inr(Math.abs(b - t)) + "</span></div>" : "");
  $("cSheet").classList.add("on");
};
$("back").onclick = function () { $("cSheet").classList.remove("on"); };
$("paid").onclick = function () {
  S.trips.push({ id: Date.now(), date: ds(new Date()), total: total(), budget: +S.budget || 0,
    items: S.items.map(function (i) { return { name: i.name, price: i.price, qty: i.qty }; }) });
  S.items = []; save();
  TODAY = ds(new Date()); sel = TODAY; cal = new Date(); cal.setDate(1);
  renderAll(); $("cSheet").classList.remove("on"); show("hist");
};

load(); renderAll(); show("cart");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
