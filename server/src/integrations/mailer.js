const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('mailer');

const getFileContents = (relativePath) => {
  try {
    const resolvedPath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    logger.warn('Failed to load mailer asset', {
      path: relativePath,
      error: error.message,
    });
    return '';
  }
};

const cssSource = getFileContents('../config/index.css');
const faviconSource = getFileContents('../config/favicon.svg');

const CSS_DEFAULTS = {
  background: '#f4f4f5',
  foreground: '#0f172a',
  card: '#ffffff',
  cardForeground: '#0f172a',
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  muted: '#f8fafc',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  radius: '12px',
};

const extractCssVar = (source, variable, fallback) => {
  if (!source) {
    return fallback;
  }

  const pattern = new RegExp(`${variable}\\s*:\\s*([^;]+);`);
  const match = source.match(pattern);
  if (!match) {
    return fallback;
  }
  return match[1].trim();
};

const themeTokens = {
  background: extractCssVar(cssSource, '--background', CSS_DEFAULTS.background),
  foreground: extractCssVar(cssSource, '--foreground', CSS_DEFAULTS.foreground),
  card: extractCssVar(cssSource, '--card', CSS_DEFAULTS.card),
  cardForeground: extractCssVar(cssSource, '--card-foreground', CSS_DEFAULTS.cardForeground),
  primary: extractCssVar(cssSource, '--primary', CSS_DEFAULTS.primary),
  primaryForeground: extractCssVar(cssSource, '--primary-foreground', CSS_DEFAULTS.primaryForeground),
  secondary: extractCssVar(cssSource, '--secondary', CSS_DEFAULTS.secondary),
  muted: extractCssVar(cssSource, '--muted', CSS_DEFAULTS.muted),
  mutedForeground: extractCssVar(cssSource, '--muted-foreground', CSS_DEFAULTS.mutedForeground),
  border: extractCssVar(cssSource, '--border', CSS_DEFAULTS.border),
  radius: extractCssVar(cssSource, '--radius-lg', CSS_DEFAULTS.radius),
};

const faviconDataUri = (() => {
  if (!faviconSource) {
    return null;
  }

  const minified = faviconSource.replace(/\s+/g, ' ').trim();
  const encoded = encodeURIComponent(minified);
  return `data:image/svg+xml;utf8,${encoded}`;
})();

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripHtml = (value) => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const renderBodySegments = (segments = []) => {
  return segments
    .map((segment) => {
      if (!segment) {
        return '';
      }

      if (typeof segment === 'string') {
        const content = segment.trim();
        if (!content) {
          return '';
        }
        return `<p style="margin: 0 0 16px; line-height: 1.6;">${escapeHtml(content)}</p>`;
      }

      if (typeof segment === 'object' && Object.prototype.hasOwnProperty.call(segment, 'html')) {
        const htmlContent = segment.html || '';
        if (!htmlContent.trim()) {
          return '';
        }
        const wrapped = /^\s*<p[\s>]/i.test(htmlContent)
          ? htmlContent
          : `<p style="margin: 0 0 16px; line-height: 1.6;">${htmlContent}</p>`;
        return wrapped;
      }

      if (typeof segment === 'object' && Object.prototype.hasOwnProperty.call(segment, 'text')) {
        const textContent = segment.text || '';
        if (!textContent.trim()) {
          return '';
        }
        return `<p style="margin: 0 0 16px; line-height: 1.6;">${escapeHtml(textContent)}</p>`;
      }

      return '';
    })
    .filter(Boolean)
    .join('');
};

const renderEmailTemplate = ({
  previewText = '',
  title = 'Project X',
  headline = '',
  body = [],
  cta,
  footer = 'You received this email because you have an account with Project X.',
}) => {
  const bodyHtml = renderBodySegments(body);
  const headlineHtml = headline
    ? `<h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${themeTokens.cardForeground};">${escapeHtml(
        headline,
      )}</h1>`
    : '';

  const hasCta = cta && cta.url && cta.label;
  const ctaHtml = hasCta
    ? `<p style="margin: 32px 0 24px; text-align: center;">
        <a
          href="${cta.url}"
          style="display: inline-block; padding: 14px 24px; background: ${themeTokens.primary}; color: ${themeTokens.primaryForeground}; text-decoration: none; font-weight: 600; border-radius: ${themeTokens.radius};"
        >${escapeHtml(cta.label)}</a>
      </p>`
    : '';

  const shouldShowFallbackLink = hasCta && cta.showLink !== false;
  const fallbackText = cta && cta.fallbackText ? escapeHtml(cta.fallbackText) : 'If the button does not work, copy and paste this link into your browser:';
  const fallbackLinkHtml = shouldShowFallbackLink
    ? `<p style="margin: 0; font-size: 14px; color: ${themeTokens.mutedForeground}; text-align: center;">${fallbackText}</p>
      <p style="margin: 8px 0 0; font-size: 14px; text-align: center; word-break: break-all;">
        <a href="${cta.url}" style="color: ${themeTokens.primary}; text-decoration: none;">${cta.url}</a>
      </p>`
    : '';

  const logoMarkup = faviconDataUri
    ? `<div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: ${themeTokens.radius}; background: ${themeTokens.secondary}; margin-bottom: 16px;">
         <img src="${faviconDataUri}" alt="Project X" width="32" height="36" style="display: block;" />
       </div>`
    : '<div style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Project X</div>';

  const previewMarkup = previewText
    ? `<div class="email-preheader" style="display: none; max-height: 0; overflow: hidden; opacity: 0; visibility: hidden; mso-hide: all;">${escapeHtml(
        previewText,
      )}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        padding: 0;
        background: ${themeTokens.background};
        color: ${themeTokens.foreground};
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      }
      table {
        border-collapse: collapse;
      }
      a {
        color: ${themeTokens.primary};
      }
      .email-wrapper {
        width: 100%;
        background: ${themeTokens.background};
        padding: 24px 0;
      }
      .email-container {
        max-width: 640px;
        margin: 0 auto;
        background: ${themeTokens.card};
        border-radius: ${themeTokens.radius};
        overflow: hidden;
        border: 1px solid ${themeTokens.border};
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
      }
      .email-header {
        padding: 32px 32px 16px;
        text-align: center;
        background: ${themeTokens.card};
      }
      .email-content {
        padding: 0 32px 32px;
        color: ${themeTokens.cardForeground};
      }
      .email-footer {
        padding: 24px 32px;
        background: ${themeTokens.muted};
        color: ${themeTokens.mutedForeground};
        font-size: 14px;
        text-align: center;
        line-height: 1.5;
      }
      @media (max-width: 600px) {
        .email-wrapper {
          padding: 0;
        }
        .email-container {
          border-radius: 0;
        }
        .email-header {
          padding: 24px 20px 12px;
        }
        .email-content {
          padding: 0 20px 24px;
        }
        .email-footer {
          padding: 20px;
        }
        .email-content h1 {
          font-size: 22px !important;
        }
        .email-content p {
          font-size: 15px !important;
        }
        .email-content a {
          word-break: break-word;
        }
      }
    </style>
  </head>
  <body>
    ${previewMarkup}
    <div class="email-wrapper">
      <table role="presentation" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" class="email-container" width="100%">
              <tr>
                <td class="email-header">
                  ${logoMarkup}
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${themeTokens.mutedForeground};">Project X</p>
                </td>
              </tr>
              <tr>
                <td class="email-content">
                  ${headlineHtml}
                  ${bodyHtml}
                  ${ctaHtml}
                  ${fallbackLinkHtml}
                </td>
              </tr>
              <tr>
                <td class="email-footer">
                  ${escapeHtml(footer)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
};

const renderPlainTextTemplate = ({ previewText, headline, body = [], cta, footer }) => {
  const lines = [];

  if (previewText) {
    lines.push(stripHtml(previewText));
  }

  if (headline) {
    lines.push(stripHtml(headline));
  }

  body.forEach((segment) => {
    if (!segment) {
      return;
    }
    if (typeof segment === 'string') {
      if (segment.trim()) {
        lines.push(segment.trim());
      }
      return;
    }
    if (typeof segment === 'object' && Object.prototype.hasOwnProperty.call(segment, 'text')) {
      const textContent = segment.text || '';
      if (textContent.trim()) {
        lines.push(textContent.trim());
      }
      return;
    }
    if (typeof segment === 'object' && Object.prototype.hasOwnProperty.call(segment, 'html')) {
      const htmlContent = segment.html || '';
      const stripped = stripHtml(htmlContent);
      if (stripped) {
        lines.push(stripped);
      }
    }
  });

  if (cta && cta.label && cta.url) {
    lines.push(`${cta.label}: ${cta.url}`);
    if (cta.showLink !== false && cta.fallbackText) {
      lines.push(stripHtml(cta.fallbackText));
    }
  }

  if (footer) {
    lines.push(stripHtml(footer));
  }

  return lines.filter(Boolean).join('\n\n');
};

const createTemplatedEmail = ({
  previewText = '',
  title,
  headline,
  body,
  cta,
  footer,
  subject,
  ...message
}) => {
  const effectiveTitle = title || subject || 'Project X';
  const html = renderEmailTemplate({
    previewText,
    title: effectiveTitle,
    headline,
    body,
    cta,
    footer,
  });
  const text = renderPlainTextTemplate({ previewText, headline, body, cta, footer });

  return {
    ...message,
    subject,
    html,
    text,
  };
};

const transporter = nodemailer.createTransport({
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  secure: env.EMAIL_SMTP_SECURE,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error('Failed to verify SMTP transport', { error: error.message });
    throw error;
  }
};

const sendMail = async (message) => {
  const payload = {
    from: env.EMAIL_FROM,
    ...message,
  };

  try {
    const info = await transporter.sendMail(payload);
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: payload.to,
      subject: payload.subject,
    });
    return info;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to: payload.to,
      subject: payload.subject,
    });
    throw error;
  }
};

module.exports = {
  transporter,
  verifyTransporter,
  sendMail,
  renderEmailTemplate,
  createTemplatedEmail,
};
