function docBoolean(ten: string, mac_dinh: boolean) {
  const gia_tri = process.env[ten]?.trim().toLowerCase();
  if (!gia_tri) return mac_dinh;
  return ["1", "true", "yes", "on"].includes(gia_tri);
}

function docSoDuong(ten: string, mac_dinh: number) {
  const gia_tri = Number(process.env[ten]);
  return Number.isFinite(gia_tri) && gia_tri > 0 ? gia_tri : mac_dinh;
}

export function docCauHinhSmtp() {
  const bat = docBoolean("MAIL_ENABLED", false);
  const from = process.env.MAIL_FROM?.trim() || process.env.MAIL_USERNAME?.trim() || "NhienIn3d <no-reply@nhienin3d.local>";
  if (!bat) return { bat: false as const, from };

  const host = process.env.MAIL_HOST?.trim();
  const port = docSoDuong("MAIL_PORT", 587);
  const username = process.env.MAIL_USERNAME?.trim() || process.env.MAIL_USER?.trim();
  const password = process.env.MAIL_PASSWORD;
  const smtpAuth = docBoolean("MAIL_SMTP_AUTH", Boolean(username));
  const starttls = docBoolean("MAIL_STARTTLS", port === 587);
  const starttlsRequired = docBoolean("MAIL_STARTTLS_REQUIRED", port === 587);
  const secure = docBoolean("MAIL_SECURE", port === 465);
  const rejectUnauthorized = docBoolean("MAIL_TLS_REJECT_UNAUTHORIZED", true);
  const connectionTimeout = docSoDuong("MAIL_CONNECTION_TIMEOUT", 5000);
  const greetingTimeout = docSoDuong("MAIL_TIMEOUT", 5000);
  const socketTimeout = docSoDuong("MAIL_WRITE_TIMEOUT", 5000);

  if (!host) throw new Error("MAIL_ENABLED=true nhưng MAIL_HOST chưa được cấu hình");
  if (smtpAuth && (!username || !password)) {
    throw new Error("MAIL_SMTP_AUTH=true nhưng MAIL_USERNAME/MAIL_PASSWORD chưa đầy đủ");
  }
  if (starttlsRequired && !starttls) {
    throw new Error("MAIL_STARTTLS_REQUIRED=true yêu cầu MAIL_STARTTLS=true");
  }

  return {
    bat: true as const,
    from,
    tuy_chon: {
      host,
      port,
      secure,
      auth: smtpAuth ? { user: username!, pass: password! } : undefined,
      ignoreTLS: !starttls,
      requireTLS: starttlsRequired,
      tls: { rejectUnauthorized },
      connectionTimeout,
      greetingTimeout,
      socketTimeout
    }
  };
}
