function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username && password) {
    window.location.href = "welcome.html";
    return false;
  } else {
    alert("Please enter both fields!");
    return false;
  }
}
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.success) {
    message.style.color = 'limegreen';
    message.textContent = 'Login successful! Redirecting...';
    setTimeout(() => {
      window.location.href = 'welcome.html';
    }, 1500);
  } else {
    message.style.color = 'red';
    message.textContent = data.message || 'Invalid username or password.';
  }
});
