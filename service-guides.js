(() => {
  const search = document.getElementById("guide-search");
  const items = Array.from(document.querySelectorAll("[data-guide-item]"));
  const previous = document.getElementById("guide-prev");
  const next = document.getElementById("guide-next");
  const counter = document.getElementById("guide-page-number");
  const results = document.getElementById("guide-results");
  if (!search || !previous || !next || !counter || !results || !items.length) return;
  let page = 1;
  const size = 9;
  const normalize = (text) => text.normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").toLowerCase();
  function render() {
    const query = normalize(search.value.trim());
    const matches = items.filter((item) => normalize(item.textContent || "").includes(query));
    const pages = Math.max(1, Math.ceil(matches.length / size));
    page = Math.min(page, pages);
    const visible = new Set(matches.slice((page - 1) * size, page * size));
    items.forEach((item) => { item.hidden = !visible.has(item); });
    previous.disabled = page === 1;
    next.disabled = page === pages;
    counter.textContent = `${page} / ${pages}`;
    results.textContent = matches.length ? `${matches.length} مقال` : "لا توجد مقالات تطابق البحث";
  }
  search.addEventListener("input", () => { page = 1; render(); });
  previous.addEventListener("click", () => { page -= 1; render(); });
  next.addEventListener("click", () => { page += 1; render(); });
  render();
})();
