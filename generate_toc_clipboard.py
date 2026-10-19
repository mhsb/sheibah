import re
import html
import pyperclip  # pip install pyperclip

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", flags=re.MULTILINE)

def slugify(text: str) -> str:
    t = text.strip().lower()
    t = re.sub(r"[^\w\s\-\u0600-\u06FF]", "", t)
    t = re.sub(r"\s+", "-", t)
    return t

def extract_headings(md: str):
    items = []
    for m in HEADING_RE.finditer(md):
        hashes, title = m.group(1), m.group(2).strip()
        level = len(hashes)
        slug = slugify(title)
        items.append({"level": level, "text": title, "slug": slug, "start": m.start()})
    return items

def insert_anchors(md: str, headings):
    out = md
    for h in reversed(headings):
        anchor = f'<a id="{h["slug"]}"></a>\n'
        out = out[:h["start"]] + anchor + out[h["start"]:]
    return out

def build_toc(headings, min_level=2):
    filtered = [h for h in headings if h["level"] >= min_level]
    if not filtered:
        return ""
    lines = ['<nav class="toc">', "<ul>"]
    base = min(h["level"] for h in filtered)
    prev = base
    for h in filtered:
        lvl = h["level"]
        while prev < lvl:
            lines.append("<ul>")
            prev += 1
        while prev > lvl:
            lines.append("</ul>")
            prev -= 1
        text = html.escape(h["text"])
        lines.append(f'<li><a href="#{h["slug"]}">{text}</a></li>')
    while prev > base:
        lines.append("</ul>")
        prev -= 1
    lines.extend(["</ul>", "</nav>", ""])
    return "\n".join(lines)

def normalize_paragraph_spacing(md: str) -> str:
    lines = md.splitlines()
    output = []
    in_code_block = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code_block = not in_code_block
            output.append(line)
            continue

        output.append(line)

        if in_code_block:
            continue

        if i < len(lines) - 1:
            next_line = lines[i + 1].strip()
            if (
                stripped
                and next_line
                and not next_line.startswith(("#", "-", "*", ">"))
                and not stripped.endswith("  ")
            ):
                output.append("")  # extra blank line

    return "\n".join(output)

def main(include_h1=False):
    # 1. Get text from clipboard
    md = pyperclip.paste()

    # 2. Fix paragraph spacing
    md = normalize_paragraph_spacing(md)

    # 3. Extract headings and build TOC
    headings = extract_headings(md)
    if not headings:
        pyperclip.copy(md)
        print("No headings found. Copied original content back to clipboard.")
        return

    toc = build_toc(headings, min_level=1 if include_h1 else 2)
    md_with_anchors = insert_anchors(md, headings)
    result = (toc + "\n" + md_with_anchors).lstrip()

    # 4. Copy result back to clipboard
    pyperclip.copy(result)
    print(f"Processed content copied to clipboard with {len([h for h in headings if (h['level']>=2 or include_h1)])} TOC items.")

if __name__ == "__main__":
    main(include_h1=False)  # Change to True if you want H1 in TOC
