import { useState } from "react"

export default function InputBox() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginResult, setLoginResult] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        setLoginResult("Login successful!")
        setLoggedIn(true)
      } else {
        setLoginResult(data.message || "Invalid credentials")
      }
    } catch (error) {
      setLoginResult("Login failed. Please try again.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setLoggedIn(false)
    setUsername("")
    setPassword("")
    setLoginResult("")
  }

  if (loggedIn) {
    return (
      <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
        <h2>Welcome, {username}!</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "darkred",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
      />
      <button
        onClick={handleLogin}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Login
      </button>
      {loginResult && (
        <p style={{ marginTop: "15px", color: "red", textAlign: "center" }}>
          {loginResult}
        </p>
      )}
    </div>
  )
}
