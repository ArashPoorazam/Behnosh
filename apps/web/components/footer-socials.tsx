const socials = [
  {
    platform: "instagram",
    title: "اینستاگرام دلستر",
    account: "delster.club",
    href: "https://www.instagram.com/delster.club?igsi=N2RraWZ4Z3Y3b2Rp",
  },
  {
    platform: "instagram",
    title: "اینستاگرام بهنوش",
    account: "behnoush.co",
    href: "https://www.instagram.com/behnoush.co",
  },
  {
    platform: "castbox",
    title: "پادکست بهنوش",
    account: "Castbox",
    href: "https://castbox.fm/channel/id7283405?country=us",
  },
  {
    platform: "aparat",
    title: "بهنوش در آپارات",
    account: "BEHNOUSH.CO",
    href: "https://www.aparat.com/BEHNOUSH.CO",
  },
];

export function FooterSocials() {
  return (
    <nav className="footer-socials" aria-labelledby="footer-social-title">
      <h3 id="footer-social-title">در شبکه‌های اجتماعی همراه ما باشید</h3>
      <div className="footer-social-grid">
        {socials.map(({ platform, title, account, href }) => (
          <a
            key={href}
            className={`social-sticker social-sticker--${platform}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-sticker-icon" aria-hidden="true">
              <img
                src={`/assets/social/${platform}.svg`}
                width={28}
                height={28}
                alt=""
              />
            </span>
            <span className="social-sticker-copy">
              <strong>{title}</strong>
              <span dir="ltr">{account}</span>
            </span>
            <span className="sr-only"> (در پنجرهٔ جدید)</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
