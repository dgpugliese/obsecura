(async function () {
  const dot = document.getElementById("liveDot");
  const text = document.getElementById("liveText");
  const checkedAt = document.getElementById("checkedAt");
  const t0 = performance.now();
  try {
    const r = await fetch("/api/health", { cache: "no-store" });
    const ms = Math.round(performance.now() - t0);
    if (r.ok) {
      dot.className = "dot ok";
      text.textContent = "edge reachable · " + ms + "ms";
    } else {
      dot.className = "dot warn";
      text.textContent = "edge responding " + r.status + " · " + ms + "ms";
    }
  } catch (e) {
    dot.className = "dot crit";
    text.textContent = "edge unreachable from this browser";
  }
  checkedAt.textContent = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  let data = { incidents: [] };
  try {
    const r = await fetch("/incidents.json", { cache: "no-store" });
    if (r.ok) data = await r.json();
  } catch (e) { /* no incidents file */ }

  const incidents = (data.incidents || []).filter(i => i && i.date);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const byDate = {};
  for (const inc of incidents) {
    const sev = inc.severity || "minor";
    const cur = byDate[inc.date];
    const rank = { minor: 1, major: 2, critical: 3 };
    if (!cur || rank[sev] > rank[cur]) byDate[inc.date] = sev;
  }

  const cal = document.getElementById("calendar");
  let downMin = 0;
  const totalMin = 30 * 24 * 60;
  for (const d of days) {
    const sev = byDate[d];
    const el = document.createElement("div");
    el.className = "day";
    if (sev === "critical" || sev === "major") el.classList.add("crit");
    else if (sev === "minor") el.classList.add("warn");
    el.title = d + (sev ? " · " + sev : " · operational");
    cal.appendChild(el);
    if (sev) {
      const incOnDay = incidents.filter(i => i.date === d);
      for (const inc of incOnDay) {
        if (typeof inc.durationMinutes === "number") downMin += inc.durationMinutes;
      }
    }
  }
  const upPct = Math.max(0, Math.min(100, (1 - downMin / totalMin) * 100));
  document.getElementById("uptimePct").textContent = upPct.toFixed(3) + "% uptime";

  const incHost = document.getElementById("incidents");
  incHost.innerHTML = "";
  if (incidents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No incidents recorded.";
    incHost.appendChild(empty);
  } else {
    const recent = incidents.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
    for (const inc of recent) {
      const div = document.createElement("div");
      div.className = "incident";
      const dur = typeof inc.durationMinutes === "number"
        ? inc.durationMinutes + "m"
        : (inc.resolvedAt ? "resolved" : "ongoing");

      const h = document.createElement("div");
      h.className = "h";
      const title = document.createElement("span");
      title.className = "title";
      title.textContent = inc.title || "(untitled)";
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = inc.date + " · " + (inc.severity || "minor") + " · " + dur;
      h.appendChild(title);
      h.appendChild(meta);

      const summary = document.createElement("div");
      summary.className = "summary";
      summary.textContent = inc.summary || "";

      div.appendChild(h);
      div.appendChild(summary);
      incHost.appendChild(div);
    }
  }
  document.getElementById("incidentCount").textContent = incidents.length + " total";
})();
