/*
  MEDIVISIT HQ — ALL-IN-ONE JAVASCRIPT DATA LAYER
  Exactly three project files are used: index.html, style.css, script.js.

  Visitor data is saved in localStorage. It survives refreshes and reopening
  the same browser on the same device. This is a local browser data store,
  not a shared online server database. Use fictional data for this demo.
*/

const $ = id => document.getElementById(id);
const STORAGE_KEY = "medivisit_hq_visitors_v2";
const STAFF_KEY = "medivisit_hq_staff_v1";

const state = {
  staff: sessionStorage.getItem(STAFF_KEY) || "",
  visitors: [],
  activePassId: null
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function readVisitors() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveVisitors() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.visitors));
}
function makePassId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MVH-${stamp}${random}`;
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function setStaff(name) {
  state.staff = name;
  sessionStorage.setItem(STAFF_KEY, name);
  $("staffNameSide").textContent = name;
  $("staffAvatar").textContent = name.charAt(0).toUpperCase();
  $("staffAvatarTop").textContent = name.charAt(0).toUpperCase();
}
function showApplication() {
  $("loginPage").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  $("staffNameSide").textContent = state.staff;
  $("staffAvatar").textContent = state.staff.charAt(0).toUpperCase();
  $("staffAvatarTop").textContent = state.staff.charAt(0).toUpperCase();
}
const routeNames = {
  dashboard: { title: "Overview", eyebrow: "VISITOR OPERATIONS / DASHBOARD" },
  checkin: { title: "New check-in", eyebrow: "VISITOR OPERATIONS / REGISTRATION" },
  visitors: { title: "Visitor records", eyebrow: "VISITOR OPERATIONS / DATABASE" }
};
function navigate() {
  if (!state.staff) {
    $("loginPage").classList.remove("hidden");
    $("appShell").classList.add("hidden");
    return;
  }
  showApplication();
  const requested = location.hash.replace("#", "") || "dashboard";
  const page = routeNames[requested] ? requested : "dashboard";
  Object.keys(routeNames).forEach(name => {
    $(`${name}View`).classList.toggle("hidden", name !== page);
    document.querySelector(`[data-route="${name}"]`).classList.toggle("active", name === page);
  });
  $("pageTitle").textContent = routeNames[page].title;
  $("pageEyebrow").textContent = routeNames[page].eyebrow;
  if (page === "dashboard") loadDashboard();
  if (page === "visitors") loadVisitors();
  if (page === "checkin") $("visit_date").value ||= new Date().toLocaleDateString("en-CA");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function badge(status) {
  return `<span class="badge ${status === "Inside" ? "inside" : "done"}">${escapeHTML(status)}</span>`;
}
function loadDashboard() {
  state.visitors = readVisitors();
  const today = new Date().toLocaleDateString("en-CA");
  $("totalStat").textContent = state.visitors.length;
  $("todayStat").textContent = state.visitors.filter(v => v.visit_date === today).length;
  $("insideStat").textContent = state.visitors.filter(v => v.status === "Inside").length;
  $("completedStat").textContent = state.visitors.filter(v => v.status === "Checked out").length;
  $("connectionLabel").textContent = "Saved on this device";
  $("recentRows").innerHTML = state.visitors.length ? state.visitors.slice(0, 6).map(v => `
    <tr><td><strong>${escapeHTML(v.visitor_name)}</strong><span class="sub-cell">${escapeHTML(v.phone)}</span></td>
    <td>${escapeHTML(v.patient_name)}</td><td>${escapeHTML(v.department)}</td>
    <td>${escapeHTML(v.check_in)}</td><td>${badge(v.status)}</td></tr>`).join("")
    : '<tr><td colspan="5" class="empty-cell">No visitors yet. Register your first visitor to get started.</td></tr>';
}
function openPass(visitor) {
  state.activePassId = visitor.pass_id;
  $("generatedPassId").textContent = visitor.pass_id;
  $("passDetails").innerHTML = [
    ["Visitor", visitor.visitor_name],
    ["Patient", visitor.patient_name],
    ["Department", visitor.department],
    ["Visit date", visitor.visit_date],
    ["Check-in", visitor.check_in],
    ["Status", visitor.status]
  ].map(([label, value]) => `<div class="pass-detail"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("");
  $("passModal").classList.remove("hidden");
}
function closePass() {
  $("passModal").classList.add("hidden");
}
function loadVisitors() {
  state.visitors = readVisitors();
  const search = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const filtered = state.visitors.filter(v => {
    const text = [v.pass_id, v.visitor_name, v.patient_name, v.phone, v.department, v.purpose]
      .join(" ").toLowerCase();
    return (!search || text.includes(search)) && (status === "All" || v.status === status);
  });
  $("recordCount").textContent = `${filtered.length} RECORD${filtered.length === 1 ? "" : "S"}`;
  $("visitorRows").innerHTML = filtered.length ? filtered.map(v => `
    <tr>
      <td><strong>${escapeHTML(v.visitor_name)}</strong><span class="sub-cell">${escapeHTML(v.phone)} · ${escapeHTML(v.pass_id)}</span></td>
      <td>${escapeHTML(v.patient_name)}</td>
      <td>${escapeHTML(v.department)}</td>
      <td>${escapeHTML(v.visit_date)}<span class="sub-cell">${escapeHTML(v.check_in)}${v.check_out ? " – " + escapeHTML(v.check_out) : ""}</span></td>
      <td>${badge(v.status)}</td>
      <td><button class="table-action secondary" data-viewpass="${escapeHTML(v.pass_id)}">View pass</button>
      ${v.status === "Inside" ? `<button class="table-action" data-checkout="${escapeHTML(v.pass_id)}">Check out</button>` : '<span class="muted">Completed</span>'}</td>
    </tr>`).join("")
    : '<tr><td colspan="6" class="empty-cell">No matching visitor records found.</td></tr>';
}
function verifyPass(passId) {
  const record = readVisitors().find(v => v.pass_id.toLowerCase() === passId.trim().toLowerCase());
  if (!record) {
    showToast("No record found for that pass ID.");
    return;
  }
  openPass(record);
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("staffName").value.trim();
  if (!name) return;
  setStaff(name);
  location.hash = "dashboard";
  navigate();
});
$("logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem(STAFF_KEY);
  state.staff = "";
  location.hash = "";
  $("staffName").value = "";
  $("appShell").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
});
window.addEventListener("hashchange", navigate);

$("visitorForm").addEventListener("submit", event => {
  event.preventDefault();
  const button = $("saveVisitorButton");
  button.disabled = true;
  button.textContent = "Saving…";
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const visitor = {
    ...values,
    visitor_name: values.visitor_name.trim(),
    phone: values.phone.trim(),
    patient_name: values.patient_name.trim(),
    department: values.department.trim(),
    purpose: values.purpose.trim(),
    pass_id: makePassId(),
    check_in: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    check_out: "",
    status: "Inside",
    created_at: new Date().toISOString()
  };
  try {
    state.visitors = readVisitors();
    state.visitors.unshift(visitor);
    saveVisitors();
    $("formMessage").textContent = `✓ ${visitor.visitor_name} registered. Visitor pass generated.`;
    $("formMessage").className = "form-message success";
    event.currentTarget.reset();
    $("visit_date").value = new Date().toLocaleDateString("en-CA");
    openPass(visitor);
    showToast("Visitor record and pass saved successfully.");
    loadDashboard();
  } catch (error) {
    $("formMessage").textContent = "Could not save the record in this browser.";
    $("formMessage").className = "form-message error";
    showToast("Storage error. Check browser storage settings.");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Save visitor record <span>→</span>';
  }
});

$("searchInput").addEventListener("input", loadVisitors);
$("statusFilter").addEventListener("change", loadVisitors);
$("visitorRows").addEventListener("click", event => {
  const viewButton = event.target.closest("[data-viewpass]");
  if (viewButton) {
    verifyPass(viewButton.dataset.viewpass);
    return;
  }
  const checkoutButton = event.target.closest("[data-checkout]");
  if (!checkoutButton) return;
  const passId = checkoutButton.dataset.checkout;
  const visitor = readVisitors().find(v => v.pass_id === passId);
  if (!visitor) return showToast("Visitor record not found.");
  if (!confirm(`Check out ${visitor.visitor_name} (${visitor.pass_id})?`)) return;
  visitor.status = "Checked out";
  visitor.check_out = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  state.visitors = readVisitors().map(v => v.pass_id === passId ? visitor : v);
  saveVisitors();
  loadVisitors();
  showToast("Visitor checked out. Record updated.");
});
$("passModal").addEventListener("click", event => {
  if (event.target.closest("[data-close-pass]")) closePass();
});
$("printPassButton").addEventListener("click", () => window.print());
$("copyPassButton").addEventListener("click", async () => {
  if (!state.activePassId) return;
  try {
    await navigator.clipboard.writeText(state.activePassId);
    showToast("Pass ID copied.");
  } catch {
    showToast(`Pass ID: ${state.activePassId}`);
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePass();
});

state.visitors = readVisitors();
navigate();
