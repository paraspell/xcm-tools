import { escapeHtml } from '../../utils/escapeHtml.js';

export const generateNewHigherLimitRequestHtml = (
  userEmail: string,
  userId: string,
  reason: string,
  requestedLimit: string,
) => {
  const mailto = escapeHtml(
    encodeURIComponent(userEmail).replaceAll('%40', '@'),
  );
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>New higher limit request</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .ps-outer { padding: 24px 12px !important; }
      .ps-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .ps-h1 { font-size: 26px !important; line-height: 32px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .ps-bg { background-color: #121116 !important; }
      .ps-card { background-color: #1b1920 !important; border-color: #2a2731 !important; }
      .ps-tile { background-color: #201b12 !important; border-color: #3a3020 !important; }
      .ps-sunk { background-color: #0d0c10 !important; border-color: #322e3a !important; }
      .ps-rule { border-color: #2a2731 !important; }
      .ps-ink { color: #f3f1f7 !important; }
      .ps-muted { color: #a9a4b5 !important; }
      .ps-amber { color: #dcb874 !important; }
      .ps-link { color: #ff5fa6 !important; }
    }
    [data-ogsb] .ps-bg { background-color: #121116 !important; }
    [data-ogsb] .ps-card { background-color: #1b1920 !important; border-color: #2a2731 !important; }
    [data-ogsb] .ps-tile { background-color: #201b12 !important; border-color: #3a3020 !important; }
    [data-ogsb] .ps-sunk { background-color: #0d0c10 !important; border-color: #322e3a !important; }
    [data-ogsc] .ps-ink { color: #f3f1f7 !important; }
    [data-ogsc] .ps-muted { color: #a9a4b5 !important; }
    [data-ogsc] .ps-amber { color: #dcb874 !important; }
    [data-ogsc] .ps-link { color: #ff5fa6 !important; }
  </style>
</head>
<body class="ps-bg" style="margin: 0; padding: 0; width: 100%; background-color: #f8f9fa; word-spacing: normal;">
  <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; mso-hide: all; font-size: 1px; line-height: 1px; color: #f8f9fa;">${escapeHtml(userEmail)} is asking for ${escapeHtml(requestedLimit)} requests / min on the XCM API. Review and reply.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ps-bg" bgcolor="#f8f9fa" style="width: 100%; background-color: #f8f9fa;">
    <tr>
      <td align="center" class="ps-outer" style="padding: 40px 16px;">
        <!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td width="600"><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">

          <tr>
            <td align="center" style="padding: 0 0 28px;">
              <a href="https://paraspell.xyz/" target="_blank" style="display: inline-block;"><img src="https://paraspell.xyz/logo.png" width="168" height="48" alt="ParaSpell" style="display: block; width: 168px; max-width: 168px; height: auto; border: 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #f01879;"></a>
            </td>
          </tr>

          <tr>
            <td class="ps-card" bgcolor="#fffdfe" style="background-color: #fffdfe; border: 1px solid #e9ecef; border-radius: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">

                <tr>
                  <td class="ps-pad" style="padding: 40px 40px 0; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <p class="ps-amber" style="margin: 0; font-size: 12px; line-height: 16px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8a6a2c;">XCM API &middot; Admin</p>
                    <h1 class="ps-h1 ps-ink" style="margin: 12px 0 0; font-size: 30px; line-height: 36px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: -0.5px; color: #141317;">New higher limit request</h1>
                    <p class="ps-muted" style="margin: 14px 0 0; font-size: 16px; line-height: 26px; mso-line-height-rule: exactly; color: #5c636e;"><a class="ps-link" href="mailto:${mailto}" style="color: #d60867; font-weight: 700; text-decoration: none;">${escapeHtml(userEmail)}</a> is asking for a higher request limit on their API key.</p>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 28px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ps-tile" bgcolor="#fffaf0" style="width: 100%; background-color: #fffaf0; border: 1px solid #f6e8cb; border-radius: 16px;">
                      <tr>
                        <td style="padding: 20px 24px; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                          <p class="ps-amber" style="margin: 0; font-size: 12px; line-height: 16px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8a6a2c;">Requested limit</p>
                          <p class="ps-ink" style="margin: 6px 0 0; font-size: 32px; line-height: 38px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: -0.5px; color: #141317;">${escapeHtml(requestedLimit)} <span class="ps-muted" style="font-size: 15px; line-height: 20px; font-weight: 600; letter-spacing: 0; color: #6b6f78;">requests / min</span></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 24px 40px 0; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <p class="ps-muted" style="margin: 0; font-size: 12px; line-height: 16px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #6b6f78;">Reason</p>
                    <p class="ps-ink" style="margin: 8px 0 0; font-size: 15px; line-height: 24px; mso-line-height-rule: exactly; color: #25262b;">${escapeHtml(reason)}</p>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 20px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                      <tr><td class="ps-rule" height="1" style="height: 1px; font-size: 1px; line-height: 1px; mso-line-height-rule: exactly; border-top: 1px solid #f1f3f5;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 20px 40px 0; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <p class="ps-muted" style="margin: 0; font-size: 12px; line-height: 16px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #6b6f78;">User email</p>
                    <p style="margin: 6px 0 0; font-size: 15px; line-height: 22px; mso-line-height-rule: exactly;"><a class="ps-link" href="mailto:${mailto}" style="color: #d60867; font-weight: 700; text-decoration: none;">${escapeHtml(userEmail)}</a></p>
                    <p class="ps-muted" style="margin: 18px 0 0; font-size: 12px; line-height: 16px; mso-line-height-rule: exactly; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #6b6f78;">User ID</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 6px;">
                      <tr>
                        <td class="ps-sunk" bgcolor="#f8f9fa" style="padding: 10px 14px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; font-size: 13px; line-height: 20px; mso-line-height-rule: exactly; word-break: break-all;">
                          <span class="ps-ink" style="color: #25262b;">${escapeHtml(userId)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 28px 40px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#f01879" style="background-color: #f01879; border-radius: 12px; mso-padding-alt: 14px 26px;">
                          <a href="mailto:${mailto}?subject=Your%20XCM%20API%20higher%20limit%20request" target="_blank" style="display: inline-block; padding: 14px 26px; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 20px; mso-line-height-rule: exactly; font-weight: 700; color: #fffdfe; text-decoration: none; border-radius: 12px;">Reply to requester &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="ps-pad" style="padding: 20px 40px 40px; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <p class="ps-muted" style="margin: 0; font-size: 13px; line-height: 20px; mso-line-height-rule: exactly; color: #6b6f78;">To approve, set <span class="ps-ink" style="font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; color: #25262b;">requestLimit</span> for this user ID. It applies to their existing key right away.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 28px 24px 0; font-family: Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <p class="ps-muted" style="margin: 0; font-size: 13px; line-height: 20px; mso-line-height-rule: exactly; color: #6b6f78;">You're receiving this because your address is on the XCM API admin list for higher limit requests.</p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
