document.addEventListener('DOMContentLoaded', () => {
  // Set current year
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Email obfuscation to prevent scraping
  const emailParts = ['suvashish991', 'gmail.com'];
  const email = emailParts[0] + '@' + emailParts[1];
  
  // Set email in both locations
  const emailSpan = document.getElementById('email');
  const emailContactSpan = document.getElementById('email-contact');
  
  if (emailSpan) emailSpan.textContent = email;
  if (emailContactSpan) emailContactSpan.textContent = email;
  
  // Copy email to clipboard
  const copyBtn = document.getElementById('copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = original;
        }, 2000);
      } catch (err) {
        console.warn('Clipboard copy failed:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  }
});
