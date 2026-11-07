import re


def has_private_marker(text):
    return bool(re.search(r"(?<![A-Za-z0-9])[A-Za-z]:[\\/]|file://|\.agent-context", text))


def chapter_content_pages(source, pages, chapters):
    if not isinstance(pages, int) or pages < source.get("minimumPages", 1):
        raise ValueError("Native edition does not meet its actual-page minimum.")
    content = set()
    for chapter in chapters:
        start, end = chapter["startPage"], chapter["endPage"]
        if (not isinstance(start, int) or not isinstance(end, int)
                or start <= chapter["openingPage"] or end < start or end > pages):
            raise ValueError(f"Invalid native chapter range: {chapter['id']}")
        content.update(range(start, end + 1))
    if len(content) < source.get("minimumBodyPages", 0):
        raise ValueError("Native edition does not meet its unique chapter-content-page minimum.")
    return len(content)
