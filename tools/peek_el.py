import io, re
s = io.open(r"D:\xkmyth-eco\Timarsky\tools\tools.js", encoding="utf-8").read()
m = re.search(r"function el\([^)]*\)\s*\{.*?\n  \}", s, re.S)
print(m.group(0) if m else "el() 未找到")
m2 = re.search(r"function escHtml\([^)]*\)\s*\{.*?\n  \}", s, re.S)
print(m2.group(0)[:300] if m2 else "escHtml() 未找到")
