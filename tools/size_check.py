import gzip, io, os
for p in (r"D:\xkmyth-eco\Timarsky\tools\tools.js", r"D:\xkmyth-eco\Timarsky\tools\tools.css", r"D:\xkmyth-eco\Timarsky\script.js", r"D:\xkmyth-eco\Timarsky\style.css"):
    b = io.open(p, "rb").read()
    print("%-22s raw %7.1f KiB  gzip %6.1f KiB" % (os.path.basename(p), len(b)/1024, len(gzip.compress(b, 9))/1024))
