import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "TripCraft <tripcraft@shredstack.net>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface CatalogGenerationEmailParams {
  to: string;
  prompt: string;
  totalGenerated: number;
  savedCount: number;
  skippedCount: number;
  adminUrl: string;
}

export async function sendCatalogGenerationEmail(
  params: CatalogGenerationEmailParams
) {
  const { to, prompt, totalGenerated, savedCount, skippedCount, adminUrl } =
    params;

  const subject = `TripCraft: ${savedCount} new destinations generated`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Catalog Generation Complete</h2>
      <p style="color: #475569;">Your AI generation job has finished.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #64748b;">Prompt</td>
          <td><strong>${escapeHtml(prompt)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #64748b;">Generated</td>
          <td><strong>${totalGenerated}</strong> destinations</td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #64748b;">Saved as Draft</td>
          <td><strong>${savedCount}</strong></td>
        </tr>
        ${
          skippedCount > 0
            ? `<tr>
          <td style="padding: 4px 16px 4px 0; color: #64748b;">Skipped (duplicates)</td>
          <td><strong>${skippedCount}</strong></td>
        </tr>`
            : ""
        }
      </table>
      <p style="color: #475569;">
        All new destinations are saved as <strong>draft</strong>.
        Review and publish them from the admin panel:
      </p>
      <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View Destinations
      </a>
    </div>
  `;

  await getResend().emails.send({ from: FROM_EMAIL, to, subject, html });
}

export async function sendCatalogGenerationFailedEmail(
  to: string,
  errorMessage: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "TripCraft: Catalog generation failed",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Catalog Generation Failed</h2>
        <p style="color: #475569;">Your catalog generation job encountered an error:</p>
        <p style="color: #ef4444; font-family: monospace; background: #fef2f2; padding: 12px; border-radius: 6px;">
          ${escapeHtml(errorMessage)}
        </p>
        <p style="color: #475569;">Check the Inngest dashboard for more details.</p>
      </div>
    `,
  });
}
