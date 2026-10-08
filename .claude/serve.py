# Local preview server for the static site. Same as `python3 -m http.server`, but tells the
# browser not to cache anything, so every reload shows the latest HTML, CSS and JS (Safari
# otherwise keeps serving stale copies).
import http.server
import os
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def send_head(self):
        # Drop conditional headers so the browser always gets a full 200, never a 304.
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                del self.headers[header]
        return super().send_head()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8083
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    http.server.ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
