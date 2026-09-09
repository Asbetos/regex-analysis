/* Regex pre-filter dashboard — hand-rolled SVG, no dependencies. */
(function () {
  "use strict";
  const D = window.DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (t, a, kids) => {
    const n = document.createElementNS(t === "svg" || SVG_TAGS.has(t)
      ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml", t);
    for (const k in (a || {})) {
      if (k === "text") n.textContent = a[k];
      else if (k === "html") n.innerHTML = a[k];
      else n.setAttribute(k, a[k]);
    }
    (kids || []).forEach(c => c && n.appendChild(c));
    return n;
  };
  const SVG_TAGS = new Set(["svg","g","rect","line","path","text","circle","polyline","tspan"]);
  const pct = v => (v * 100).toFixed(1) + "%";
  const pct0 = v => Math.round(v * 100) + "%";
  const C1 = "var(--series-1)", C2 = "var(--series-2)";

  /* ── tooltip ─────────────────────────────────────────────── */
  const tip = $("#tip");
  function bindTip(node, html) {
    node.addEventListener("pointerenter", e => {
      tip.innerHTML = html; tip.classList.add("on"); place(e);
    });
    node.addEventListener("pointermove", place);
    node.addEventListener("pointerleave", () => tip.classList.remove("on"));
    function place(e) {
      const r = tip.getBoundingClientRect();
      let x = e.clientX + 14, y = e.clientY - r.height - 10;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y < 8) y = e.clientY + 16;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    }
  }

  /* ── tabs ────────────────────────────────────────────────── */
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", x === t));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("is-active"));
    $("#p-" + t.dataset.p).classList.add("is-active");
    location.hash = t.dataset.p;
    window.scrollTo({ top: 0, behavior: "instant" });
  }));
  if (location.hash) {
    const t = document.querySelector('.tab[data-p="' + location.hash.slice(1) + '"]');
    if (t) t.click();
  }

  /* ── theme ───────────────────────────────────────────────── */
  const btn = $("#themeBtn");
  const saved = localStorage.getItem("rx-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light"
      : cur === "light" ? "dark"
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("rx-theme", next);
  });

  /* ── regex cards ─────────────────────────────────────────── */
  function regexCard(host, q, recommended, blurb, stats) {
    const d = D[q];
    const box = el("div", { class: "rx-box" }, [el("code", { text: d.regex })]);
    const cp = el("button", { class: "copy", text: "Copy" });
    cp.addEventListener("click", () => {
      navigator.clipboard.writeText(d.regex).then(() => {
        cp.textContent = "Copied"; cp.classList.add("done");
        setTimeout(() => { cp.textContent = "Copy"; cp.classList.remove("done"); }, 1600);
      });
    });
    box.appendChild(cp);
    host.appendChild(el("div", { class: "rx-head" }, [
      el("h3", { text: q.toUpperCase() + " — " + d.stems.length + " word stems" }),
      el("span", {
        class: "rx-badge " + (recommended ? "rec" : "notrec"),
        text: recommended ? "Recommended" : "Reference only"
      })
    ]));
    host.appendChild(el("p", {
      html: blurb, style: "margin:8px 0 0;font-size:14.5px;color:var(--text-secondary)"
    }));
    host.appendChild(box);
    host.appendChild(el("div", { class: "stems" },
      d.stems.map(s => el("span", { class: "stem", text: s }))));
    if (stats) {
      const wrap = el("div", { class: "stats" });
      stats.forEach(s => wrap.appendChild(el("div", { class: "stat" }, [
        el("div", { class: "k", text: s[0] }),
        el("div", { class: "v" + (s[2] || ""), text: s[1] }),
        el("div", { class: "n", text: s[3] || "" })
      ])));
      host.appendChild(wrap);
    }
  }

  regexCard($("#rx-q1"), "q1", true,
    'Word <b>stems</b>, so <code>consult</code> also matches "consultation" and "consultant". ' +
    'These are Q1\'s own subject matter: consulting, coordinating, appointing, making rules.',
    [["AI calls needed", "23%", " up", "down from 100%"],
     ["Relevant sections lost", "2 of 68", "", "in the full system"],
     ["Accuracy of flagged", "64%", " up", "was 57% without it"],
     ["Needs text processing", "No", "", "plain regex works"]]);

  regexCard($("#rx-q6"), "q6", false,
    '<code>construct</code> and <code>mainten</code> were chosen in all 20 rebuilds — they are ' +
    'the dependable core. Useful for triage or sampling, but not as a cost filter.',
    [["Catches", "94.6%", "", "of relevant sections"],
     ["Keeps", "31%", "", "of all sections"],
     ["Why not deploy", "7.7%", "", "already reach the AI"]]);

  /* ── generic table builder ───────────────────────────────── */
  function table(host, cols, rows, opts) {
    const o = opts || {};
    const thead = el("thead", {}, [el("tr", {}, cols.map(c =>
      el("th", { text: c.h, ...(c.title ? { title: c.title } : {}) })))]);
    const tbody = el("tbody", {}, rows.map(r => {
      const tr = el("tr", r.__hl ? { class: "highlight" } : {});
      cols.forEach(c => {
        const v = c.f ? c.f(r) : r[c.k];
        const td = el("td", { class: c.k === cols[0].k ? "" : "num" });
        if (v instanceof Node) td.appendChild(v); else td.innerHTML = v;
        tr.appendChild(td);
      });
      return tr;
    }));
    host.innerHTML = "";
    host.appendChild(el("table", {}, [thead, tbody]));
  }
  const pill = (txt, cls) => el("span", { class: "pill " + cls, text: txt });

  /* ── CV tables ───────────────────────────────────────────── */
  function cvTable(host, q, recTarget) {
    const rows = D[q].cv.map(r => Object.assign({}, r, { __hl: r.target === recTarget }));
    table(host, [
      { h: "Setting", f: r => "Catch ≥ " + pct0(r.target) + (r.__hl ? " &nbsp;<b>← recommended</b>" : "") },
      { h: "Words", f: r => r.stems.toFixed(1) },
      { h: "Actually caught", f: r => "<b>" + pct(r.recall) + "</b>" },
      { h: "Worst split", f: r => pct(r.worst) },
      { h: "Sections discarded", f: r => "<b>" + pct(r.screen) + "</b>" },
      { h: "Reliable in", f: r => {
          const p = r.feasible === 20 ? "ok" : r.feasible >= 18 ? "mid" : "bad";
          return pill(r.feasible + " / 20 splits", p).outerHTML; } },
    ], rows);
  }
  cvTable($("#t-q1"), "q1", 0.9);
  cvTable($("#t-q6"), "q6", 0.95);

  /* ── stat strips ─────────────────────────────────────────── */
  function statStrip(host, items) {
    host.innerHTML = "";
    items.forEach(s => host.appendChild(el("div", { class: "stat" }, [
      el("div", { class: "k", text: s[0] }),
      el("div", { class: "v", text: s[1] }),
      el("div", { class: "n", text: s[2] })
    ])));
  }
  const q1rec = D.q1.cv.find(r => r.target === 0.9);
  const q6rec = D.q6.cv.find(r => r.target === 0.95);
  statStrip($("#s-q1"), [
    ["Relevant sections", "653", "4.6% of the corpus"],
    ["Caught by filter", pct(q1rec.recall), "20-rebuild average"],
    ["Sections discarded", pct(q1rec.screen), "20-rebuild average"],
    ["Dependable words", D.q1.stabSummary.over50 + " of " + D.q1.stabSummary.total, "chosen in ≥ half the rebuilds"]
  ]);
  statStrip($("#s-q6"), [
    ["Relevant sections", "1,604", "11.2% of the corpus"],
    ["Caught by filter", pct(q6rec.recall), "20-rebuild average"],
    ["Sections discarded", pct(q6rec.screen), "20-rebuild average"],
    ["Dependable words", D.q6.stabSummary.over50 + " of " + D.q6.stabSummary.total, "chosen in ≥ half the rebuilds"]
  ]);

  /* ── cascade table ───────────────────────────────────────── */
  (function () {
    const pickQ1 = D.cascade.find(r => r.stage.indexOf("variant") === 0 && r.matcher === "prefix_regex");
    const aloneQ1 = D.cascade.find(r => r.question === "Q1" && r.stage === "classifier_only");
    const aloneQ6 = D.cascade.find(r => r.question === "Q6" && r.stage === "classifier_only");
    const q6f = D.cascade.find(r => r.question === "Q6" && r.target === 0.95);
    const rows = [
      { n: "Q1 — AI alone (today)", llm: 1, rec: aloneQ1.recall, pr: aloneQ1.precision, lost: "—" },
      { n: "Q1 — filter + AI", llm: pickQ1.llm, rec: pickQ1.recall, pr: pickQ1.precision, lost: "2 of 68", __hl: true },
      { n: "Q6 — AI alone (today)", llm: 1, rec: aloneQ6.recall, pr: aloneQ6.precision, lost: "—" },
      { n: "Q6 — filter + AI", llm: q6f.llm, rec: q6f.recall, pr: q6f.precision, lost: "8 of 203" },
    ];
    table($("#t-cascade"), [
      { h: "Configuration", f: r => r.n + (r.__hl ? " &nbsp;<b>← recommended</b>" : "") },
      { h: "Sections sent to AI", f: r => "<b>" + pct0(r.llm) + "</b>" },
      { h: "Relevant found", f: r => pct(r.rec) },
      { h: "Accuracy of flagged", f: r => pct(r.pr) },
      { h: "Extra misses caused by filter", f: r => r.lost },
    ], rows);
  })();

  /* ── chart scaffolding ───────────────────────────────────── */
  function frame(host, title, sub, legend, W, H, pad) {
    host.innerHTML = "";
    host.appendChild(el("h3", { text: title }));
    if (sub) host.appendChild(el("p", { class: "sub", text: sub }));
    if (legend) {
      host.appendChild(el("div", { class: "legend" }, legend.map(l =>
        el("span", {}, [el("span", { class: "swatch", style: "background:" + l[1] }),
                        el("span", { text: l[0] })]))));
    }
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    host.appendChild(svg);
    return svg;
  }
  function yAxis(svg, x0, x1, yTop, yBot, max, ticks, fmt) {
    for (let i = 0; i <= ticks; i++) {
      const v = (max / ticks) * i, y = yBot - (v / max) * (yBot - yTop);
      svg.appendChild(el("line", { class: "grid-line" + (i === 0 ? " zero" : ""),
        x1: x0, x2: x1, y1: y, y2: y }));
      svg.appendChild(el("text", { x: x0 - 9, y: y + 4, "text-anchor": "end",
        "font-size": 11, text: fmt(v) }));
    }
  }

  /* ── grouped bars: LODO recall by decade, Q1 vs Q6 ───────── */
  (function () {
    const W = 900, H = 330, L = 52, R = 14, T = 14, B = 46;
    const svg = frame($("#c-lodo"),
      "How well the filter transfers to a decade it never saw",
      "Built on seven decades, tested on the eighth. Higher is better. Both stay high, so the word lists are not tied to one era.",
      [["Q1 — outside consultation", C1], ["Q6 — construction & maintenance", C2]], W, H);
    const decs = D.q1.lodo.map(d => d.decade);
    const max = 1, x0 = L, x1 = W - R, yT = T, yB = H - B;
    yAxis(svg, x0, x1, yT, yB, max, 5, v => Math.round(v * 100) + "%");
    const bw = (x1 - x0) / decs.length;
    decs.forEach((dec, i) => {
      const cx = x0 + bw * i, inner = bw * 0.66, gap = 2, w = (inner - gap) / 2;
      [[D.q1.lodo[i], C1, "Q1"], [D.q6.lodo[i], C2, "Q6"]].forEach((s, j) => {
        const d = s[0], h = (d.recall / max) * (yB - yT);
        const bx = cx + (bw - inner) / 2 + j * (w + gap);
        const r = el("rect", { class: "bar", x: bx, y: yB - h, width: w, height: Math.max(h, 1),
          rx: 4, fill: s[1] });
        bindTip(r, "<b>" + s[2] + " · " + dec + "s</b><br>Caught " + pct(d.recall) +
          " of " + d.n_pos + " relevant<br>Discarded " + pct(d.screen) + " of sections");
        svg.appendChild(r);
      });
      svg.appendChild(el("text", { x: cx + bw / 2, y: yB + 19, "text-anchor": "middle",
        "font-size": 12, text: dec + "s" }));
      if (D.q1.lodo[i].n_pos < 30) {
        svg.appendChild(el("text", { x: cx + bw / 2, y: yB + 34, "text-anchor": "middle",
          "font-size": 10, fill: "var(--text-muted)", text: "few cases" }));
      }
    });
    svg.appendChild(el("line", { class: "ax-line", x1: x0, x2: x1, y1: yB, y2: yB }));
  })();

  /* ── within vs LODO: discard rate ────────────────────────── */
  function cmpChart(host, q, label) {
    const W = 430, H = 300, L = 48, R = 12, T = 12, B = 46;
    const svg = frame(host, label + " — how much each approach discards",
      "A decade-only filter discards far less, so it saves little. Higher is better.",
      [["Hide-one-decade", C1], ["Decade-only", "var(--text-muted)"]], W, H);
    const rows = D[q].lodo, wr = D[q].within;
    const x0 = L, x1 = W - R, yT = T, yB = H - B;
    yAxis(svg, x0, x1, yT, yB, 1, 4, v => Math.round(v * 100) + "%");
    const bw = (x1 - x0) / rows.length;
    rows.forEach((d, i) => {
      const cx = x0 + bw * i, inner = bw * 0.7, gap = 2, w = (inner - gap) / 2;
      [[d.screen, C1, "Hide-one-decade"], [wr[i].screen, "var(--text-muted)", "Decade-only"]]
        .forEach((s, j) => {
          const h = s[0] * (yB - yT);
          const bx = cx + (bw - inner) / 2 + j * (w + gap);
          const r = el("rect", { class: "bar", x: bx, y: yB - h, width: w,
            height: Math.max(h, 1), rx: 3, fill: s[1] });
          bindTip(r, "<b>" + s[2] + " · " + d.decade + "s</b><br>Discards " + pct(s[0]) +
            " of sections<br>Uses " + (j ? wr[i].stems : d.stems) + " words");
          svg.appendChild(r);
        });
      svg.appendChild(el("text", { x: cx + bw / 2, y: yB + 18,
        "text-anchor": "middle", "font-size": 11, text: "'" + String(d.decade).slice(2) }));
    });
    svg.appendChild(el("line", { class: "ax-line", x1: x0, x2: x1, y1: yB, y2: yB }));
  }
  cmpChart($("#c-cmp-q1"), "q1", "Q1");
  cmpChart($("#c-cmp-q6"), "q6", "Q6");

  /* ── stability bars ──────────────────────────────────────── */
  function stabChart(host, q, note) {
    const rows = D[q].stability, W = 900, rowH = 27, H = rows.length * rowH + 34;
    const svg = frame(host, "Words chosen most often across 20 rebuilds",
      "A bar reaching the far right means that word was picked every single time.", null, W, H);
    const L = 128, x1 = W - 56;
    rows.forEach((r, i) => {
      const y = i * rowH + 8, h = rowH - 11;
      svg.appendChild(el("text", { x: L - 12, y: y + h - 2, "text-anchor": "end",
        "font-size": 13, "font-family": "ui-monospace, Menlo, monospace",
        fill: "var(--text-primary)", text: r.stem }));
      svg.appendChild(el("rect", { x: L, y: y, width: x1 - L, height: h, rx: 3,
        fill: "var(--surface-2)" }));
      const w = Math.max((x1 - L) * r.freq, 2);
      const bar = el("rect", { class: "bar", x: L, y: y, width: w, height: h, rx: 3,
        fill: q === "q1" ? C1 : C2 });
      bindTip(bar, "<b>" + r.stem + "</b><br>Chosen in " + Math.round(r.freq * 20) +
        " of 20 rebuilds<br>Typical importance rank: " + r.rank);
      svg.appendChild(bar);
      svg.appendChild(el("text", { x: x1 + 8, y: y + h - 2, "font-size": 12,
        text: Math.round(r.freq * 20) + "/20" }));
    });
    $(note).textContent = D[q].stabSummary.core
      ? D[q].stabSummary.core + " word(s) were chosen in all 20 rebuilds, and "
        + D[q].stabSummary.over50 + " of " + D[q].stabSummary.total
        + " in at least half — a dependable core."
      : "No word was chosen in all 20 rebuilds; the most reliable appears in "
        + Math.round(rows[0].freq * 20) + " of 20. Q1's vocabulary is more scattered than Q6's, "
        + "which is a reason to expect the list to need revisiting as new volumes are coded.";
  }
  stabChart($("#c-q1stab"), "q1", "#n-q1stab");
  stabChart($("#c-q6stab"), "q6", "#n-q6stab");

  /* ── decade failure table ────────────────────────────────── */
  (function () {
    const tg = ["0.9", "0.95", "0.98", "0.99"];
    const rows = tg.map(t => {
      const a = D.q1.withinFail[t], b = D.q6.withinFail[t];
      return { t: t, q1: a, q6: b };
    });
    table($("#t-fail"), [
      { h: "Setting", f: r => "Catch ≥ " + pct0(parseFloat(r.t)) },
      { h: "Q1 — failed attempts", f: r => r.q1[1] + " of " + r.q1[0] +
          " &nbsp;" + pill(pct0(r.q1[1] / r.q1[0]), r.q1[1] / r.q1[0] > .25 ? "bad" : "mid").outerHTML },
      { h: "Q6 — failed attempts", f: r => r.q6[1] + " of " + r.q6[0] +
          " &nbsp;" + pill(pct0(r.q6[1] / r.q6[0]), r.q6[1] / r.q6[0] > .25 ? "bad" : "mid").outerHTML },
    ], rows);
  })();

  /* ── decade detail table ─────────────────────────────────── */
  (function () {
    const rows = D.q1.lodo.map((d, i) => ({
      dec: d.decade, n1: d.n_pos, r1: d.recall, s1: d.screen,
      w1: D.q1.within[i].recall, ws1: D.q1.within[i].screen,
      n6: D.q6.lodo[i].n_pos, r6: D.q6.lodo[i].recall, s6: D.q6.lodo[i].screen,
      w6: D.q6.within[i].recall, ws6: D.q6.within[i].screen,
    }));
    table($("#t-decade"), [
      { h: "Decade", f: r => r.dec + "s" },
      { h: "Q1 cases", f: r => r.n1 + (r.n1 < 30 ? ' <span style="color:var(--text-muted)">(few)</span>' : "") },
      { h: "Q1 hide-one caught", f: r => "<b>" + pct(r.r1) + "</b>" },
      { h: "Q1 discarded", f: r => pct(r.s1) },
      { h: "Q1 decade-only discarded", f: r => '<span style="color:var(--text-muted)">' + pct(r.ws1) + "</span>" },
      { h: "Q6 cases", f: r => r.n6 },
      { h: "Q6 hide-one caught", f: r => "<b>" + pct(r.r6) + "</b>" },
      { h: "Q6 discarded", f: r => pct(r.s6) },
      { h: "Q6 decade-only discarded", f: r => '<span style="color:var(--text-muted)">' + pct(r.ws6) + "</span>" },
    ], rows);
  })();

  /* ── glossary ────────────────────────────────────────────── */
  const GLOSS = [
    ["Setting / “Catch ≥ X%”", "recall target",
     "How ambitious we asked the filter to be. A higher setting keeps more sections, so it finds more relevant ones but saves less money.",
     "“Catch ≥ 90%” means we asked for a word list that finds at least 90% of relevant sections."],
    ["Actually caught", "recall",
     "Of the relevant sections in the held-out set, the share the filter kept. This is the safety number — anything the filter discards can never be recovered later.",
     "94.6% caught means about 5 of every 100 relevant sections were thrown away."],
    ["Sections discarded", "screen-out",
     "The share of all sections the filter rejects. This is the money number — it is directly how much AI work you avoid.",
     "77% discarded means the AI reads fewer than a quarter of the sections."],
    ["Worst split", "worst-fold recall",
     "The lowest “actually caught” figure across all 20 rebuilds. A big gap between this and the average means the filter's performance depends on luck.",
     "Average 91.2% but worst 86.2% — expect occasional worse runs."],
    ["Reliable in", "strict feasibility",
     "How many of the 20 rebuilds met the target on every internal check, not just on average. An average can hide runs that fell short.",
     "16/20 means 4 rebuilds could not hit that target dependably."],
    ["Accuracy of flagged", "precision",
     "Of the sections the system flags as relevant, the share that truly are. Low precision is acceptable here — the AI re-checks everything the filter passes.",
     "64% means about a third of flagged sections turn out not to be relevant."],
    ["Words / word stems", "stems",
     "The filter matches word beginnings, not whole words, so one entry covers a family of words.",
     "consult → consultation, consultant, consulted, consulting."],
    ["Extra misses caused by filter", "incremental positives lost",
     "Relevant sections the filter threw away that the AI would otherwise have found. This is the true cost — sections the AI was going to miss anyway cost nothing to discard early.",
     "2 of 68 is the entire penalty for cutting AI work by 77%."],
    ["Hide-one-decade", "leave-one-decade-out",
     "Build the filter on seven decades, then test it on the eighth, which it never saw. This tests whether the word list survives changes in legal drafting style.",
     "The headline test for whether the filter works on older or newer laws."],
    ["Decade-only", "within-decade",
     "Build and test a separate filter inside a single decade. We report it to show why we did not take this approach — one decade has too few examples.",
     "Often looks fine on hit rate while discarding almost nothing."],
    ["Failed attempts", "infeasible selections",
     "Attempts where no word list met the target at all, so the attempt produced nothing usable. These are excluded from averages, which is why we report them separately.",
     "85 of 160 for Q1 at the 98% setting — over half produced nothing."],
    ["Few cases", "small-n flag",
     "That decade has under 30 relevant sections, so its figures rest on very few examples and can swing widely.",
     "Q1 in the 1990s has 21; a single section moves the rate by ~5 points."],
  ];
  (function () {
    const host = $("#gloss");
    GLOSS.forEach(g => host.appendChild(el("div", {}, [
      el("dt", { html: g[0] + '<span class="lit">technical term: ' + g[1] + "</span>" }),
      el("dd", { html: g[2] + '<span class="eg"><b>Example:</b> ' + g[3] + "</span>" })
    ])));
  })();
})();
