import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()


def _send_email(receiver_email: str, subject: str, body: str):
    try:
        sender_email = os.getenv("EMAIL_USER")
        app_password = os.getenv("EMAIL_PASSWORD")

        msg = MIMEText(body,"html")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = receiver_email

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(sender_email, app_password)
            server.send_message(msg)

        print(f"✅ EMAIL SENT to {receiver_email}")
        return True

    except Exception as e:
        print("❌ EMAIL ERROR:", e)
        return False


def send_otp_email(receiver_email, otp):
    html = f"""
    <html>
    <body style="font-family:Arial;background:#f4f4f4;padding:30px;">
        <div style="max-width:600px;margin:auto;background:white;
                    border-radius:10px;padding:30px;">

            <h1 style="color:#2563eb;">InventIQ</h1>

            <h2>Email Verification</h2>

            <p>Hello,</p>

            <p>Thank you for registering with <b>InventIQ</b>.</p>

            <p>Please use the verification code below:</p>

            <div style="
                background:#2563eb;
                color:white;
                font-size:34px;
                font-weight:bold;
                text-align:center;
                padding:18px;
                border-radius:8px;
                letter-spacing:8px;
                margin:25px 0;">
                {otp}
            </div>

            <p>This OTP is valid for <b>10 minutes</b>.</p>

            <p>If you didn't request this email, you can safely ignore it.</p>

            <hr>

            <p style="font-size:12px;color:#777;">
                © 2026 InventIQ • AI Inventory Management System
            </p>

        </div>
    </body>
    </html>
    """

    return _send_email(
        receiver_email,
        "Verify Your InventIQ Account",
        html,
    )


def send_low_stock_alert_email(admin_email: str, products: list):
    """
    products: list of dicts like {sku, name, stock, reorder_point}
    """
    lines = [
        f"- {p['sku']} | {p['name']} | Stock: {p['stock']} (Reorder Point: {p['reorder_point']})"
        for p in products
    ]
    body = (
        "InventIQ Low Stock Alert\n\n"
        "The following products are below or near their reorder point:\n\n"
        + "\n".join(lines)
        + "\n\nPlease review and raise purchase orders as needed.\n\n"
        "— InventIQ AI System"
    )
    return _send_email(
        admin_email,
        f"⚠️ InventIQ: {len(products)} Product(s) Low on Stock",
        body,
    )


def send_reset_email(receiver_email, token):
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    html = f"""
    <html>
    <body style="font-family:Arial;background:#f4f4f4;padding:30px;">
        <div style="max-width:600px;margin:auto;background:white;
                    border-radius:10px;padding:30px;">

            <h1 style="color:#2563eb;">InventIQ</h1>

            <h2>Reset Your Password</h2>

            <p>Hello,</p>

            <p>We received a request to reset your InventIQ account password.</p>

            <p>Click the button below to create a new password:</p>

            <div style="text-align:center;margin:30px 0;">
                <a href="{reset_link}"
                   style="background:#2563eb;
                          color:white;
                          padding:14px 28px;
                          text-decoration:none;
                          border-radius:8px;
                          font-weight:bold;">
                    Reset Password
                </a>
            </div>

            <p>Or copy and paste this link into your browser:</p>

            <p style="word-break:break-all;">
                {reset_link}
            </p>

            <p>This link will expire after it has been used.</p>

            <hr>

            <p style="font-size:12px;color:#777;">
                © 2026 InventIQ • AI Inventory Management System
            </p>

        </div>
    </body>
    </html>
    """

    return _send_email(
        receiver_email,
        "Reset Your InventIQ Password",
        html
    )