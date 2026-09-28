var KEY = "market-cart-v1", S = { budget: 0, items: [] }, photo = "";
var $ = function (id) { return document.getElementById(id); };

function load() { try { var r = localStorage.getItem(KEY); if (r) S = JSON.parse(r); } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function inr(n) { return "₹" + (Math.round(n * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function total() { return S.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0); }

function render() {
  var t = total(), b = +S.budget || 0, left = b - t;
  var n = S.items.reduce(function (a, i) { return a + i.qty; }, 0);
  $("budget").value = b || "";
  $("total").textContent = inr(t);
  $("count").textContent = n + (n === 1 ? " item" : " items");
  $("left").textContent = inr(Math.abs(left));
  $("left").className = "left" + (left < 0 ? " bad" : "");
  $("lbl").textContent = b ? (left < 0 ? "Over budget by" : "Left to spend") : "Set a budget to track";
  $("fill").style.width = (b ? Math.min(100, t / b * 100) : 0) + "%";
  $("fill").className = left < 0 ? "bad" : "";
  $("pay").disabled = !S.items.length;
  $("pay").textContent = S.items.length ? "Go to counter · " + inr(t) : "Go to counter";
  var c = $("cart");
  if (!S.items.length) { c.innerHTML = '<p class="empty">Your cart is empty.<br>Snap an item and enter its price.</p>'; return; }
  c.innerHTML = S.items.map(function (i) {
    return '<div class="item">' +
      '<img class="ph" alt="" ' + (i.photo ? 'src="' + i.photo + '"' : '') + '>' +
      '<div class="info"><div class="name">' + esc(i.name) + '</div><div class="sub">' + inr(i.price) + ' each</div>' +
      '<div class="qty"><button data-a="dec" data-id="' + i.id + '" aria-label="Less">−</button><b>' + i.qty +
      '</b><button data-a="inc" data-id="' + i.id + '" aria-label="More">+</button></div></div>' +
      '<div class="amt">' + inr(i.price * i.qty) + '</div>' +
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
  save(); render();
});

$("budget").addEventListener("input", function () { S.budget = +this.value || 0; save(); render(); });

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
  save(); render(); $("addSheet").classList.remove("on");
};

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
$("paid").onclick = function () { S.items = []; save(); render(); $("cSheet").classList.remove("on"); };

load(); render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
