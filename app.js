/**
 * Circle of Fifths / Camelot Wheel for DJ harmonic mixing.
 * Order clockwise from 12 o'clock (C major / A minor at top).
 */

const KEYS = [
  { major: "C",  minor: "Am",  num: 8 },
  { major: "G",  minor: "Em",  num: 9 },
  { major: "D",  minor: "Bm",  num: 10 },
  { major: "A",  minor: "F♯m", num: 11 },
  { major: "E",  minor: "C♯m", num: 12 },
  { major: "B",  minor: "G♯m", num: 1 },
  { major: "F♯", minor: "E♭m", num: 2 },
  { major: "D♭", minor: "B♭m", num: 3 },
  { major: "A♭", minor: "Fm",  num: 4 },
  { major: "E♭", minor: "Cm",  num: 5 },
  { major: "B♭", minor: "Gm",  num: 6 },
  { major: "F",  minor: "Dm",  num: 7 },
];

const CX = 320;
const CY = 320;
const OUTER_R = 292;
const MID_R = 188;
const INNER_R = 92;
const START_ANGLE = -Math.PI / 2; // 12 o'clock

const segmentsEl = document.getElementById("segments");
const wheel = document.getElementById("wheel");
const hubKey = document.getElementById("hub-key");
const hubCamelot = document.getElementById("hub-camelot");
const hintEl = document.getElementById("hint");
const compatList = document.getElementById("compat-list");
const clearBtn = document.getElementById("clear-btn");

let selectedId = null;

function polar(r, angle) {
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function annularSector(r0, r1, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function camelot(num, letter) {
  return `${num}${letter}`;
}

function wrapNum(n) {
  return ((n - 1 + 12) % 12) + 1;
}

function keyMeta(id) {
  const [mode, indexStr] = id.split("-");
  const index = Number(indexStr);
  const row = KEYS[index];
  const isMajor = mode === "major";
  return {
    id,
    index,
    isMajor,
    name: isMajor ? row.major : row.minor,
    display: isMajor ? `${row.major} 大調` : `${row.minor} 小調`,
    num: row.num,
    letter: isMajor ? "B" : "A",
    code: camelot(row.num, isMajor ? "B" : "A"),
  };
}

function compatibility(fromId) {
  const from = keyMeta(fromId);
  const results = [];

  for (let i = 0; i < 12; i++) {
    for (const mode of ["major", "minor"]) {
      const id = `${mode}-${i}`;
      const to = keyMeta(id);
      let kind = null;
      let why = "";

      if (to.id === from.id) {
        kind = "selected";
        why = "目前這首歌";
      } else if (to.num === from.num && to.letter !== from.letter) {
        kind = "match";
        why = "關係大小調 · 很好接";
      } else if (to.letter === from.letter && to.num === wrapNum(from.num + 1)) {
        kind = "adjacent";
        why = "上五度 · 也好接";
      } else if (to.letter === from.letter && to.num === wrapNum(from.num - 1)) {
        kind = "adjacent";
        why = "下五度 · 也好接";
      }

      if (kind) {
        results.push({ ...to, kind, why });
      }
    }
  }

  const order = { selected: 0, match: 1, adjacent: 2 };
  results.sort((a, b) => order[a.kind] - order[b.kind] || a.num - b.num);
  return results;
}

function buildWheel() {
  const slice = (Math.PI * 2) / 12;
  const frag = document.createDocumentFragment();

  KEYS.forEach((row, i) => {
    const a0 = START_ANGLE + i * slice;
    const a1 = a0 + slice;
    const mid = (a0 + a1) / 2;

    // Outer = major
    const majorG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    majorG.classList.add("key-seg", "major");
    majorG.dataset.id = `major-${i}`;
    majorG.setAttribute("tabindex", "0");
    majorG.setAttribute("role", "button");
    majorG.setAttribute("aria-label", `${row.major} 大調，Camelot ${camelot(row.num, "B")}`);

    const majorPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    majorPath.setAttribute("d", annularSector(MID_R, OUTER_R, a0, a1));
    majorG.appendChild(majorPath);

    const majorPos = polar((MID_R + OUTER_R) / 2, mid);
    const majorText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    majorText.setAttribute("x", majorPos.x);
    majorText.setAttribute("y", majorPos.y - 4);
    majorText.setAttribute("text-anchor", "middle");
    majorText.setAttribute("dominant-baseline", "middle");
    majorText.setAttribute("font-size", "16");
    majorText.textContent = row.major;
    majorG.appendChild(majorText);

    const majorCode = document.createElementNS("http://www.w3.org/2000/svg", "text");
    majorCode.classList.add("camelot-label");
    majorCode.setAttribute("x", majorPos.x);
    majorCode.setAttribute("y", majorPos.y + 14);
    majorCode.setAttribute("text-anchor", "middle");
    majorCode.setAttribute("dominant-baseline", "middle");
    majorCode.textContent = camelot(row.num, "B");
    majorG.appendChild(majorCode);

    // Inner = minor
    const minorG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    minorG.classList.add("key-seg", "minor");
    minorG.dataset.id = `minor-${i}`;
    minorG.setAttribute("tabindex", "0");
    minorG.setAttribute("role", "button");
    minorG.setAttribute("aria-label", `${row.minor} 小調，Camelot ${camelot(row.num, "A")}`);

    const minorPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    minorPath.setAttribute("d", annularSector(INNER_R, MID_R, a0, a1));
    minorG.appendChild(minorPath);

    const minorPos = polar((INNER_R + MID_R) / 2, mid);
    const minorText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    minorText.setAttribute("x", minorPos.x);
    minorText.setAttribute("y", minorPos.y - 2);
    minorText.setAttribute("text-anchor", "middle");
    minorText.setAttribute("dominant-baseline", "middle");
    minorText.setAttribute("font-size", "13");
    minorText.textContent = row.minor;
    minorG.appendChild(minorText);

    const minorCode = document.createElementNS("http://www.w3.org/2000/svg", "text");
    minorCode.classList.add("camelot-label");
    minorCode.setAttribute("x", minorPos.x);
    minorCode.setAttribute("y", minorPos.y + 13);
    minorCode.setAttribute("text-anchor", "middle");
    minorCode.setAttribute("dominant-baseline", "middle");
    minorCode.textContent = camelot(row.num, "A");
    minorG.appendChild(minorCode);

    frag.appendChild(majorG);
    frag.appendChild(minorG);
  });

  segmentsEl.appendChild(frag);

  segmentsEl.addEventListener("click", (e) => {
    const seg = e.target.closest(".key-seg");
    if (!seg) return;
    selectKey(seg.dataset.id);
  });

  segmentsEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const seg = e.target.closest(".key-seg");
    if (!seg) return;
    e.preventDefault();
    selectKey(seg.dataset.id);
  });
}

function selectKey(id) {
  selectedId = id;
  render();
}

function clearSelection() {
  selectedId = null;
  render();
}

function render() {
  const segs = segmentsEl.querySelectorAll(".key-seg");

  segs.forEach((seg) => {
    seg.classList.remove("is-lit", "is-selected", "is-match", "is-adjacent", "is-energy");
  });

  if (!selectedId) {
    wheel.classList.remove("wheel-active");
    hubKey.textContent = "—";
    hubCamelot.textContent = "";
    hintEl.textContent = "還沒選調——先點圓盤上任意一個。";
    compatList.innerHTML = "";
    return;
  }

  wheel.classList.add("wheel-active");
  const from = keyMeta(selectedId);
  hubKey.textContent = from.name;
  hubCamelot.textContent = from.code;

  const compat = compatibility(selectedId);
  const byId = Object.fromEntries(compat.map((c) => [c.id, c]));

  segs.forEach((seg) => {
    const info = byId[seg.dataset.id];
    if (!info) return;
    seg.classList.add("is-lit", `is-${info.kind}`);
  });

  hintEl.textContent = `現在是 ${from.display}。亮起來的都可以接：`;

  compatList.innerHTML = compat
    .filter((c) => c.kind !== "selected")
    .map(
      (c) => `<li>
        <span class="name"><span class="tag">${c.code}</span>${c.display}</span>
        <span class="why">${c.why}</span>
      </li>`
    )
    .join("");
}

clearBtn.addEventListener("click", clearSelection);

buildWheel();
render();
