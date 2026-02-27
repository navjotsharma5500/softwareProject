import transporter from "../config/email.config.js";
import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";

/**
 * Base email template with consistent branding
 * @param {string} content - Main content HTML
 * @param {string} title - Email title
 * @returns {string} Complete HTML email
 */
function getEmailTemplate(content, title) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                    🔍 Thapar Lost &amp; Found Portal
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                    Admin-managed listings — only items deposited with the campus guard or admin are shown.
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-align: center;">
                    <strong>Need Help?</strong>
                  </p>
                  <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.6;">
                    For assistance, please visit the admin in person during working hours at SBI Lawn (Mon–Fri, 09:00–17:00 on Thapar working days). Only items physically deposited with the campus guard or admin are listed in the portal.
                  </p>
                  <div style="text-align: center; margin-top: 16px;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                      Open Lost &amp; Found Portal
                    </a>
                  </div>
                  <div style="text-align: center; margin-top: 12px;">
                    <a href="${(process.env.FRONTEND_URL || "http://localhost:3000") + "/how-it-works"}" style="color: #4f46e5; text-decoration: none; font-size: 13px;">How the portal works</a>
                  </div>
                  <p style="margin: 18px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Thapar University Lost &amp; Found Portal.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send an email to a user
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise}
 */
export async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Thapar Lost & Found" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  // Await transporter send so callers can reliably use `await sendEmail(...)`
  return await transporter.sendMail(mailOptions);
}

/**
 * Generate claim status email body
 * @param {object} claim - Claim object (populated)
 * @param {string} status - approved/rejected
 */
export function getClaimStatusEmailBody(claim, status) {
  const isApproved = status.toLowerCase() === "approved";
  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBgColor = isApproved ? "#d1fae5" : "#fee2e2";
  const statusIcon = isApproved ? "✅" : "❌";

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; padding: 16px 32px; background-color: ${statusBgColor}; border-radius: 8px; border: 2px solid ${statusColor};">
        <h2 style="margin: 0; color: ${statusColor}; font-size: 24px; font-weight: bold;">
          ${statusIcon} Claim ${
            status.charAt(0).toUpperCase() + status.slice(1)
          }
        </h2>
      </div>
    </div>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      ${
        isApproved
          ? `Great news! Your claim has been approved and the item has been successfully handed over to you. This email serves as your receipt.`
          : `We regret to inform you that your claim has been rejected. This may be due to insufficient verification details, inability to verify ownership, or if the item has already been claimed by the rightful owner.`
      }
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        📦 Item Details
      </h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="color: #4b5563; font-size: 14px;">
        <tr>
          <td style="font-weight: 600; width: 40%; padding: 8px 0;">Item Name:</td>
          <td style="padding: 8px 0;">${claim.item?.name || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Category:</td>
          <td style="padding: 8px 0;">${claim.item?.category || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Found Location:</td>
          <td style="padding: 8px 0;">${claim.item?.foundLocation || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Date Found:</td>
          <td style="padding: 8px 0;">${
            claim.item?.dateFound
              ? new Date(claim.item.dateFound).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"
          }</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
        💬 Your Claim Remarks
      </h3>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        ${claim.remarks || "No additional remarks provided"}
      </p>
    </div>

    ${
      !isApproved
        ? `
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
          📋 Claim Status Record
        </h3>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
          Your claim has been reviewed and was not approved. This email serves as official documentation of the claim decision. Reasons may include insufficient verification or the item being claimed by its rightful owner.
        </p>
      </div>
    `
        : ``
    }

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      Thank you for using Thapar Lost & Found Portal. Keep this email as your receipt.
    </p>
  `;

  return getEmailTemplate(
    content,
    `Claim ${
      status.charAt(0).toUpperCase() + status.slice(1)
    } - Thapar Lost & Found Portal`,
  );
}

/**
 * Generate report submission email body
 * @param {object} report - Report object (populated)
 */
export function getReportSubmissionEmailBody(report) {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; padding: 16px 32px; background-color: #dbeafe; border-radius: 8px; border: 2px solid #3b82f6;">
        <h2 style="margin: 0; color: #1e40af; font-size: 24px; font-weight: bold;">
          📝 Report Submitted Successfully
        </h2>
      </div>
    </div>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Thank you for reporting your lost item. Your report has been successfully submitted to the Thapar University Lost & Found Portal. The portal does not send automatic match notifications — please check the portal regularly and submit a claim if you find your item.
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        🔍 Your Lost Item Report
      </h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="color: #4b5563; font-size: 14px;">
        <tr>
          <td style="font-weight: 600; width: 40%; padding: 8px 0;">Category:</td>
          <td style="padding: 8px 0;">${report.category || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Description:</td>
          <td style="padding: 8px 0;">${report.itemDescription || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Location Lost:</td>
          <td style="padding: 8px 0;">${report.location || "N/A"}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Date Lost:</td>
          <td style="padding: 8px 0;">${
            report.dateLost
              ? new Date(report.dateLost).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"
          }</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 8px 0;">Report ID:</td>
          <td style="padding: 8px 0; font-family: monospace; color: #667eea;">#${
            report._id?.toString().slice(-8).toUpperCase() || "N/A"
          }</td>
        </tr>
      </table>
    </div>

    ${
      report.additionalDetails
        ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
          📌 Additional Details
        </h3>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
          ${report.additionalDetails}
        </p>
      </div>
    `
        : ""
    }

    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">
        📍 What Happens Next?
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
        <li><strong>Check the Portal Regularly:</strong> Browse the found items section to see if your item appears</li>
        <li><strong>Check Regularly:</strong> The portal does not send automatic match notifications — please check the found items section regularly and submit a claim if you see your item.</li>
        <li><strong>Submit a Claim:</strong> When you find your item, submit a claim through the portal</li>
        <li><strong>Visit Admin Office:</strong> After claim approval, visit the office with your ID to collect the item</li>
      </ol>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
        ⚠️ Important Reminder
      </h3>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        The admin team will <strong>not</strong> proactively search for your item. Only items physically deposited with the campus guard or admin will appear in the found items list.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      We understand how stressful losing an item can be. Our team is here to help reunite you with your belongings.
    </p>
  `;

  return getEmailTemplate(
    content,
    "Lost Item Report Submitted - Thapar Lost & Found Portal",
  );
}

// /**
//  * Generate item found notification email for users with matching reports
//  * @param {object} user - User object
//  * @param {object} item - Found item object
//  */
// export function getItemFoundNotificationEmailBody(user, item) {
//   ...existing code...
// }

// /**
//  * Generate welcome email for new users
//  * @param {object} user - User object
//  */
// export function getWelcomeEmailBody(user) {
//   ...existing code...
// }

// // Helper to fetch full claim details from DB (with item and user)
// export async function getFullClaim(claimId) {
//   return Claim.findById(claimId).populate("item").populate("claimant");
// }

// // Helper to fetch full report details from DB (with user)
// export async function getFullReport(reportId) {
//   return Report.findById(reportId).populate("user");
// }
