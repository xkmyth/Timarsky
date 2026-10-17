import io
s = io.open(r"D:\xkmyth-eco\Timarsky\tools\tools.js", encoding="utf-8").read()
i = s.find("主题（跟随工具箱主页的开关）")
print(s[max(0, i-600):i+200])
