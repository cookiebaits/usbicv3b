import { chromium } from 'playwright';

async function verify2FA() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Logging in as John Doe (who has 2FA enabled)...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'johndoe');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Two-factor verification');
    console.log('2FA page reached.');

    const emailText = await page.isVisible('text=registered email address');
    console.log('Registered email text visible:', emailText);

    await page.screenshot({ path: '2fa_email_verification.png' });
    console.log('Screenshot saved: 2fa_email_verification.png');

    // Enter mock code
    const otpInputs = await page.$$('input[id^="otp-"]');
    for(let i=0; i<6; i++) {
        await otpInputs[i].fill(['1','2','3','4','5','6'][i]);
    }
    await page.click('button:has-text("Verify Code")');

    await page.waitForURL('**/dashboard');
    console.log('Login successful after 2FA.');

  } catch (err) {
    console.error('Verification failed:', err);
    await page.screenshot({ path: '2fa_error.png' });
  } finally {
    await browser.close();
  }
}

verify2FA();
