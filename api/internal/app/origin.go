package app

import "net/url"

// Only local HTTP development accepts interchangeable loopback names. Deployed
// sites still require the exact configured origin; this never replaces CSRF tokens.
func allowedOrigin(configured, incoming string) bool {
	if incoming == configured {
		return true
	}
	local := func(raw string) (*url.URL, bool) {
		u, err := url.Parse(raw)
		if err != nil || u.Scheme != "http" || raw != u.Scheme+"://"+u.Host {
			return nil, false
		}
		return u, u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1"
	}
	expected, ok := local(configured)
	if !ok {
		return false
	}
	actual, ok := local(incoming)
	return ok && actual.Port() == expected.Port()
}
