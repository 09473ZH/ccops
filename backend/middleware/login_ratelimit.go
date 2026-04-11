package middleware

import (
	"sync"
	"time"
)

// Login rate limiter: per-IP and per-username sliding windows. In-memory
// (single instance) — if ccops is ever horizontally scaled this must be moved
// to a shared store (Redis).
//
// Thresholds are deliberately tight: the vulnerability report showed that an
// attacker guessed "admin:admin" on the first try, so we want to make credential
// stuffing noisy and slow enough that any brute-force attempt triggers an alert.

const (
	loginWindow          = time.Minute
	loginMaxPerIP        = 10
	loginMaxPerUser      = 5
	loginLockoutDuration = 5 * time.Minute
	loginSweepInterval   = 10 * time.Minute
)

type loginBucket struct {
	failures    []time.Time
	lockedUntil time.Time
}

var (
	loginMu      sync.Mutex
	loginByIP    = map[string]*loginBucket{}
	loginByUser  = map[string]*loginBucket{}
	loginSweeper sync.Once
)

// CheckLoginRate returns (allowed, message). Call this from the login handler
// before verifying credentials; reject with HTTP 429 when !allowed.
func CheckLoginRate(ip, username string) (bool, string) {
	loginSweeper.Do(startLoginSweeper)
	loginMu.Lock()
	defer loginMu.Unlock()
	if b := loginByIP[ip]; b != nil && isLocked(b) {
		return false, "登录尝试过多，请稍后再试"
	}
	if username != "" {
		if b := loginByUser[username]; b != nil && isLocked(b) {
			return false, "账号已临时锁定，请稍后再试"
		}
	}
	return true, ""
}

// RecordLoginFailure records a failed login attempt for the given IP and
// username, locking either bucket if its threshold is exceeded.
func RecordLoginFailure(ip, username string) {
	now := time.Now()
	loginMu.Lock()
	defer loginMu.Unlock()
	bumpBucket(loginByIP, ip, now, loginMaxPerIP)
	if username != "" {
		bumpBucket(loginByUser, username, now, loginMaxPerUser)
	}
}

// RecordLoginSuccess clears any throttling state for the IP and username after
// a successful login so legitimate users don't get locked out.
func RecordLoginSuccess(ip, username string) {
	loginMu.Lock()
	defer loginMu.Unlock()
	delete(loginByIP, ip)
	if username != "" {
		delete(loginByUser, username)
	}
}

func bumpBucket(store map[string]*loginBucket, key string, now time.Time, threshold int) {
	b := store[key]
	if b == nil {
		b = &loginBucket{}
		store[key] = b
	}
	cutoff := now.Add(-loginWindow)
	kept := b.failures[:0]
	for _, t := range b.failures {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	b.failures = append(kept, now)
	if len(b.failures) >= threshold {
		b.lockedUntil = now.Add(loginLockoutDuration)
	}
}

func isLocked(b *loginBucket) bool {
	return time.Now().Before(b.lockedUntil)
}

func startLoginSweeper() {
	go func() {
		ticker := time.NewTicker(loginSweepInterval)
		for range ticker.C {
			sweepLoginBuckets()
		}
	}()
}

func sweepLoginBuckets() {
	now := time.Now()
	cutoff := now.Add(-loginWindow)
	loginMu.Lock()
	defer loginMu.Unlock()
	for _, store := range []map[string]*loginBucket{loginByIP, loginByUser} {
		for key, b := range store {
			if now.After(b.lockedUntil) && (len(b.failures) == 0 || b.failures[len(b.failures)-1].Before(cutoff)) {
				delete(store, key)
			}
		}
	}
}
