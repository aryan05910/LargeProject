import { useState } from "react";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginResult, setLoginResult] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (data.id >= 0) {
        localStorage.setItem("user", JSON.stringify(data));
        setLoginResult(`Welcome, ${data.firstName}!`);
        setLoggedIn(true);
        setTimeout(() => {
          window.location.href = "/main";
        }, 1000);
      } else {
        setLoginResult("Invalid credentials");
      }
    } catch (error) {
      setLoginResult("Login failed. Please try again.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">Flavor Finder</header>
      <main>
        <h2>Login</h2>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Username"
          style={{
            width: "250px",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "250px",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleLogin}
          className="btn yes-btn"
          style={{ width: "250px" }}
        >
          Login
        </button>
        {loginResult && (
          <p style={{ color: "white", marginTop: "15px" }}>{loginResult}</p>
        )}
        <p style={{ color: "#fff", marginTop: "10px" }}>
          Don't have an account?{" "}
          <a href="/signup" style={{ color: "#4caf50", textDecoration: "none" }}>
            Register here
          </a>
        </p>
      </main>
    </div>
  );
}
