# 📧 How to Set Up Free Gmail SMTP

To send real emails for free using your Gmail account, you cannot use your normal password. You must generate an **App Password**.

## Step 1: Enable 2-Factor Authentication (2FA)
*   Go to [Google Account Security](https://myaccount.google.com/security).
*   Ensure **2-Step Verification** is turned **ON**.

## Step 2: Generate App Password
1.  Go to the **2-Step Verification** page.
2.  Scroll to the bottom to **App passwords**. (Or search "App passwords" in the top search bar).
3.  **App name**: Type "Cerno" or "Django".
4.  Click **Create**.
5.  Copy the **16-character code** (it looks like `abcd efgh ijkl mnop`).

## Step 3: Update `.env`
1.  Open `d:/Featured Projects/Cerno/backend/.env`.
2.  Set `EMAIL_HOST_USER` to your Gmail address.
3.  Set `EMAIL_HOST_PASSWORD` to the 16-character code you just copied.

```env
EMAIL_HOST_USER=your.email@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
```
*Note: Remove spaces from the password if you want, but Django handles them usually. Best to paste it as one string without spaces just in case.*
