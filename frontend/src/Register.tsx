import { useState } from "react";

export default function Register() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerResult, setRegisterResult] = useState("");

  const handleRegister = async () => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password, firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        localStorage.setItem("user", JSON.stringify(data));
        setRegisterResult("Registration successful!");
        setTimeout(() => {
          window.location.href = "/main";
        }, 1000);
      } else {
        setRegisterResult(data.error || "Registration failed.");
      }
    } catch (error) {
      setRegisterResult("Server error. Please try again.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">Flavor Finder</header>
      <main>
        <h2>Register</h2>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          style={inputStyle}
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          style={inputStyle}
        />
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Username"
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={inputStyle}
        />
        <button
          onClick={handleRegister}
          className="btn super-btn"
          style={{ width: "250px" }}
        >
          Register
        </button>
        {registerResult && (
          <p style={{ color: "white", marginTop: "15px" }}>{registerResult}</p>
        )}
        <p style={{ color: "#fff", marginTop: "10px" }}>
          Already have an account?{" "}
          <a href="/" style={{ color: "#2196f3", textDecoration: "none" }}>
            Login here
          </a>
        </p>
      </main>
    </div>
  );
}

const inputStyle = {
  width: "250px",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
};
