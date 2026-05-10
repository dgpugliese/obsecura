(async function () {
  let data;
  try {
    // Honor the worker's 5-min max-age — public, aggregate, refreshed cheaply.
    // The "as of" timestamp in the UI already tells the user it's not real-time.
    const r = await fetch("/api/transparency");
    if (!r.ok) throw new Error("HTTP " + r.status);
    data = await r.json();
  } catch (e) {
    document.getElementById("generatedAt").textContent = "transparency endpoint unreachable";
    return;
  }

  const days = Object.values(data.daily || {});
  const totals = { created: 0, burned: 0, expired: 0, exhausted: 0 };
  for (const d of days) {
    totals.created += d.created || 0;
    totals.burned += d.burned || 0;
    totals.expired += d.expired || 0;
    totals.exhausted += d.exhausted || 0;
  }
  document.getElementById("t-created").textContent = totals.created.toLocaleString();
  document.getElementById("t-burned").textContent = totals.burned.toLocaleString();
  document.getElementById("t-expired").textContent = totals.expired.toLocaleString();
  document.getElementById("t-exhausted").textContent = totals.exhausted.toLocaleString();
  document.getElementById("generatedAt").textContent =
    "as of " + new Date(data.generatedAt).toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const bars = document.getElementById("bars");
  const max = Math.max(1, ...days.map(d => d.created || 0));
  let peak = { date: "—", count: 0 };
  for (const d of days) {
    const bar = document.createElement("div");
    const c = d.created || 0;
    bar.className = "bar" + (c === 0 ? " empty" : "");
    bar.style.height = (c === 0 ? 2 : Math.max(3, (c / max) * 90)) + "px";
    bar.title = d.date + " · " + c + " created";
    bars.appendChild(bar);
    if (c > peak.count) peak = { date: d.date, count: c };
  }
  document.getElementById("peakDay").textContent =
    peak.count > 0 ? "peak " + peak.count + " on " + peak.date : "no activity";

  const tbody = document.querySelector("#table tbody");
  for (const d of days.slice().reverse()) {
    const tr = document.createElement("tr");
    const cells = [
      { text: d.date, zero: false },
      { text: String(d.created || 0), zero: !d.created },
      { text: String(d.burned || 0), zero: !d.burned },
      { text: String(d.expired || 0), zero: !d.expired },
      { text: String(d.exhausted || 0), zero: !d.exhausted },
    ];
    for (const c of cells) {
      const td = document.createElement("td");
      if (c.zero) td.className = "zero";
      td.textContent = c.text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  document.getElementById("abuseReceived").textContent = (data.abuse && data.abuse.received) || 0;
  document.getElementById("abuseActioned").textContent = (data.abuse && data.abuse.actioned) || 0;
})();
