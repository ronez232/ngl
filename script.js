function sendMessage() {
    const message = document.getElementById('message').value;
  
    fetch('/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('response').innerText = 'Wysłano!';
        document.getElementById('message').value = '';
      } else {
        document.getElementById('response').innerText = 'Błąd podczas wysyłania.';
      }
    });
  }