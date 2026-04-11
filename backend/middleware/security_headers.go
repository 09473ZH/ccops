package middleware

import "github.com/gin-gonic/gin"

// SecurityHeaders attaches a small set of defensive response headers on every
// HTTP response. Defaults are conservative and API-safe:
//
//   - X-Content-Type-Options: nosniff — prevent MIME sniffing attacks
//   - X-Frame-Options: DENY          — block clickjacking via iframe embedding
//   - Referrer-Policy: no-referrer   — never leak the URL to third parties
//   - Cross-Origin-Opener-Policy: same-origin — isolates browsing context
//
// HSTS is NOT set here because ccops is often fronted by a TLS-terminating
// reverse proxy (Caddy/NPM) where it belongs. Setting it twice is harmless but
// setting it on plain-HTTP responses during local dev is confusing.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("Cross-Origin-Opener-Policy", "same-origin")
		c.Next()
	}
}
