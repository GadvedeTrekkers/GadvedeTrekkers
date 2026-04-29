import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendTrekAssignmentEmail({ leaderEmail, leaderName, trekName, eventDate, participants, leaderFee, whatsappGroupLink }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Email not configured — skipping email to", leaderEmail);
    return { ok: false, reason: "Email not configured" };
  }
  const transporter = createTransporter();
  const formattedDate = new Date(eventDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0D9488, #065f46); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Gadvede Trekkers</h1>
        <p style="color: #a7f3d0; margin: 8px 0 0;">Trek Assignment Notification</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #0f172a; margin-top: 0;">Hey ${leaderName}! 🏔️</h2>
        <p style="color: #475569;">You have been assigned as the <strong>Trek Leader</strong> for the upcoming event.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #0D9488; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Trek Name</td><td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${trekName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event Date</td><td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${formattedDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Participants</td><td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${participants} people</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Your Fee</td><td style="padding: 8px 0; font-weight: 700; color: #0D9488;">₹${Number(leaderFee).toLocaleString("en-IN")}</td></tr>
            ${whatsappGroupLink ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">WhatsApp Group</td><td style="padding: 8px 0;"><a href="${whatsappGroupLink}" style="color: #0D9488;">Join Group</a></td></tr>` : ""}
          </table>
        </div>
        <p style="color: #475569;">Please log in to your <strong>Employee Portal</strong> to view full details, participant list, and pickup points.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://gadvede.com/employee-login" style="background: #0D9488; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">View My Trek →</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Gadvede Trekkers | gadvedetrekkers@gmail.com</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: `"Gadvede Trekkers" <${process.env.GMAIL_USER}>`,
    to: leaderEmail,
    subject: `🏔️ Trek Assignment: ${trekName} on ${formattedDate}`,
    html,
  });
  return { ok: true };
}
