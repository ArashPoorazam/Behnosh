package app

import (
	"crypto/subtle"
	"errors"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
	"net"
	"net/http"
	"strings"
	"time"
)

var unauthenticated = &fault{401, "unauthenticated", "نشست منقضی شده است. صفحه را تازه کنید."}

func (a *App) readSession(r *http.Request) (*Session, error) {
	c, err := r.Cookie("behnosh_session")
	if err != nil {
		return nil, unauthenticated
	}
	s := &Session{}
	err = a.DB.QueryRow(r.Context(), `SELECT s.id,s.csrf_token,coalesce(u.active AND u.role_id='admin',false) FROM sessions s LEFT JOIN admin_users u ON s.admin_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`, hash(c.Value)).Scan(&s.ID, &s.CSRF, &s.Admin)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, unauthenticated
	}
	return s, err
}
func (a *App) cookie(w http.ResponseWriter, value string, age int) {
	http.SetCookie(w, &http.Cookie{Name: "behnosh_session", Value: value, Path: "/", HttpOnly: true, Secure: a.Config.SecureCookies, SameSite: http.SameSiteLaxMode, MaxAge: age})
}
func (a *App) checkCSRF(r *http.Request, s *Session) error {
	if !allowedOrigin(a.Config.Origin, r.Header.Get("Origin")) || subtle.ConstantTimeCompare([]byte(r.Header.Get("X-CSRF-Token")), []byte(s.CSRF)) != 1 {
		return &fault{403, "csrf", "درخواست معتبر نیست. صفحه را تازه کنید."}
	}
	return nil
}
func (a *App) session(w http.ResponseWriter, r *http.Request, _ *Session) error {
	s, err := a.readSession(r)
	if err == nil {
		write(w, 200, s)
		return nil
	}
	if !errors.Is(err, unauthenticated) {
		return err
	}
	secret := token(32)
	s = &Session{ID: token(16), CSRF: token(32)}
	err = a.transact(r.Context(), func(tx pgx.Tx) error {
		_, e := tx.Exec(r.Context(), "INSERT INTO sessions(id,token_hash,csrf_token,expires_at) VALUES($1,$2,$3,$4)", s.ID, hash(secret), s.CSRF, time.Now().Add(7*24*time.Hour))
		if e != nil {
			return e
		}
		_, e = tx.Exec(r.Context(), "INSERT INTO carts(id,session_id) VALUES($1,$2)", token(16), s.ID)
		return e
	})
	if err != nil {
		return err
	}
	a.cookie(w, secret, 7*86400)
	write(w, 200, s)
	return nil
}
func (a *App) login(w http.ResponseWriter, r *http.Request, s *Session) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decode(w, r, &body); err != nil {
		return err
	}
	if len(body.Username) > 80 || len(body.Password) > 72 || len(body.Password) < 1 {
		return bad("نام کاربری یا گذرواژه معتبر نیست.")
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	identity := hash(host) // Do not trust forwarded IP headers.
	var failures int
	err := a.DB.QueryRow(r.Context(), `INSERT INTO login_attempts(identity_hash,failures,window_start) VALUES($1,1,now()) ON CONFLICT(identity_hash) DO UPDATE SET failures=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.failures+1 END,window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END RETURNING failures`, identity).Scan(&failures)
	if err != nil {
		return err
	}
	if failures > 10 {
		return &fault{429, "rate_limited", "تلاش‌های زیادی انجام شده؛ ۱۵ دقیقه بعد تلاش کنید."}
	}
	var adminID, passwordHash string
	err = a.DB.QueryRow(r.Context(), "SELECT id,password_hash FROM admin_users WHERE username=$1 AND active AND role_id='admin'", strings.TrimSpace(body.Username)).Scan(&adminID, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		passwordHash = "$2a$12$P.CRPcYzOWG0VvVhjHCgWuEeMLvI06XSEbFlfyRmC7fzr7a/7CRRa"
	} else if err != nil {
		return err
	}
	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(body.Password)) != nil || adminID == "" {
		return &fault{401, "invalid_credentials", "نام کاربری یا گذرواژه نادرست است."}
	}
	secret := token(32)
	s.CSRF = token(32)
	s.Admin = true
	_, err = a.DB.Exec(r.Context(), "UPDATE sessions SET token_hash=$1,csrf_token=$2,admin_id=$3,expires_at=now()+interval '8 hours' WHERE id=$4", hash(secret), s.CSRF, adminID, s.ID)
	if err != nil {
		return err
	}
	a.cookie(w, secret, 8*3600)
	write(w, 200, s)
	return nil
}
func (a *App) logout(w http.ResponseWriter, r *http.Request, s *Session) error {
	secret := token(32)
	s.CSRF = token(32)
	s.Admin = false
	_, err := a.DB.Exec(r.Context(), "UPDATE sessions SET admin_id=NULL,token_hash=$1,csrf_token=$2,expires_at=now()+interval '7 days' WHERE id=$3", hash(secret), s.CSRF, s.ID)
	if err != nil {
		return err
	}
	a.cookie(w, secret, 7*86400)
	write(w, 200, s)
	return nil
}
