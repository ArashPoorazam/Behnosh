#!/usr/bin/env python3
"""Collect the official catalog, detail text and original images (stdlib only)."""
import hashlib
import json
import re
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://behnoushiran.com"
CACHE = ROOT / ".local/catalog-source"
DEST = ROOT / "api/catalog"


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self):
        return " ".join("".join(c if isinstance(c, str) else c.text() + " "
                                for c in self.children).split())

    def find(self, tag=None, cls=None, **attrs):
        found = []
        if ((tag is None or self.tag == tag)
                and (cls is None or cls in self.attrs.get("class", "").split())
                and all(self.attrs.get(k) == v for k, v in attrs.items())):
            found.append(self)
        for child in self.children:
            if isinstance(child, Node):
                found.extend(child.find(tag, cls, **attrs))
        return found


class DOM(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].children.append(n)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input",
                       "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def fetch(url):
    url = quote(urljoin(BASE, url), safe="%:/?=&+-")
    if urlsplit(url).netloc != urlsplit(BASE).netloc:
        raise ValueError(f"Unexpected source host: {url}")
    key = hashlib.sha256(url.encode()).hexdigest()
    path = CACHE / key
    if path.exists():
        return path.read_bytes()
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "BehnoshCatalogMigration/1.0"}), timeout=45) as r:
                data = r.read()
            path.write_bytes(data)
            return data
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def volume_ml(label):
    normalized = label.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    number = re.search(r"\d+(?:\.\d+)?", normalized)
    if not number:
        raise ValueError(f"Unknown volume: {label}")
    multiplier = 1 if "cc" in normalized or "میلی" in normalized else 1000
    return int(float(number[0]) * multiplier)


def cards(html):
    rows = []
    for n in DOM(html).root.find(cls="products-card"):
        a = n.attrs
        row = {"source_id": a["data-product-id"], "source_url": urljoin(BASE, a["href"]),
               "name": n.find("h2")[0].text()}
        for key in ["brand", "flavor", "size", "pack", "category"]:
            row[key] = a["data-" + key]
        row["volume_ml"] = volume_ml(row["size"])
        row["image_url"] = urljoin(BASE, n.find("img")[0].attrs["src"])
        rows.append(row)
    return rows


def detail(row):
    doc = DOM(fetch(row["source_url"]).decode()).root
    main = doc.find("main")[0]
    assert main.find("h1")[0].text() == row["name"], row["source_id"]
    descriptions = main.find(cls="product-item__desc")
    row["description"] = descriptions[0].text() if descriptions else ""
    facts = {}
    for li in main.find(cls="product-item__facts")[0].find("li"):
        facts[li.find("span")[0].text()] = li.find("strong")[0].text()
    row["facts"] = facts
    row["image_url"] = urljoin(BASE, main.find("img", id="product-hero-image")[0].attrs["src"])
    data = fetch(row["image_url"])
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Expected original PNG: {row['image_url']}")
    row["image_sha256"] = hashlib.sha256(data).hexdigest()
    row["image_path"] = f"api/catalog/images/{row['source_id']}.png"
    (ROOT / row["image_path"]).write_bytes(data)
    row["detail_sha256"] = hashlib.sha256(json.dumps(
        {k: row[k] for k in ["name", "description", "facts", "image_url"]},
        sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    # Independent inventory: the site's purchase dropdown lists every source ID.
    select = doc.find("select", name="line_product_id[]")[0]
    ids = {n.attrs["value"] for n in select.find("option") if n.attrs.get("value")}
    return row, ids


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    (DEST / "images").mkdir(parents=True, exist_ok=True)
    first = json.loads(fetch("/api/products?scope=products&page=1"))
    assert first["ok"] and first["total"] > 100
    rows = []
    for page in range(1, first["total_pages"] + 1):
        feed = first if page == 1 else json.loads(fetch(f"/api/products?scope=products&page={page}"))
        page_rows = cards(feed["html"])
        assert feed["ok"] and feed["page"] == page and feed["total"] == first["total"]
        assert [int(r["source_id"]) for r in page_rows] == feed["ids"]
        rows.extend(page_rows)
        print(f"Page {page}/{first['total_pages']}: {len(page_rows)} products", flush=True)
    ids = {r["source_id"] for r in rows}
    assert len(rows) == len(ids) == first["total"]
    assert len({r["source_url"] for r in rows}) == len(rows)
    products = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row, purchase_ids in pool.map(detail, rows):
            assert ids == purchase_ids, "Catalog and purchase dropdown disagree"
            products.append(row)
            print(f"Details/images {len(products)}/{len(rows)}: {row['source_id']}", flush=True)
    snapshot = {"source": BASE, "collected_at": datetime.now(timezone.utc).isoformat(),
                "total": len(products), "pages": first["total_pages"], "products": products}
    (DEST / "products.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(dict(Counter(r["brand"] for r in products)), ensure_ascii=False))


if __name__ == "__main__":
    main()
