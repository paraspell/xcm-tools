function submitForm(event) {
  event.preventDefault();

  var response = grecaptcha.getResponse();
  var captchaMessage = document.getElementById('captcha-message');

  if (response.length === 0) {
    captchaMessage.style.display = 'block';
  } else {
    var apiPrefix = getApiPrefixFromPathname(window.location.pathname);
    fetch(apiPrefix + '/auth/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recaptchaResponse: response }),
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 403) {
            captchaMessage.textContent =
              'Captcha verification failed. Please try again.';
          } else if (response.status === 500) {
            captchaMessage.textContent =
              'Error verifying captcha on the server. Please try again later.';
          } else {
            captchaMessage.textContent =
              'An error occurred during API request. Please try again.';
          }
          captchaMessage.style.display = 'block';
          throw new Error('API request failed');
        }
        return response.json();
      })
      .then((data) => {
        if (data.api_key) {
          sessionStorage.setItem('api_key', data.api_key);
          window.location.href = 'show-api-key.html';
        } else {
          console.error('API key not received in the response.');
        }
      })
      .catch((error) => {
        console.error('Error during API request:', error);
      });
  }
}
