import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/auth";

const initialLoginForm = {
  username: "",
  password: ""
};

const initialRegisterForm = {
  name: "",
  email: "",
  phoneNumber: "",
  username: "",
  password: ""
};

const initialPaintingForm = {
  title: "",
  price: "",
  image: null
};

function PaintingImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="painting-image-fallback" role="img" aria-label={alt}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      className="painting-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [paintingForm, setPaintingForm] = useState(initialPaintingForm);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    loadPaintings();
  }, []);

  const loadPaintings = async () => {
    try {
      const response = await fetch(`${API_BASE}/paintings`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load paintings.");
      }

      setPaintings(data.paintings || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleFormChange = (event, setter) => {
    const { name, value, files } = event.target;

    setter((current) => ({
      ...current,
      [name]: name === "image" ? files?.[0] ?? null : value
    }));
  };

  const goToScreen = (nextScreen) => {
    setScreen(nextScreen);
    setMessage("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setUser(data.user);
      setLoginForm(initialLoginForm);
      setScreen("home");
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setRegisterForm(initialRegisterForm);
      setScreen("login");
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!user) {
      setMessage("Please log in to upload a painting.");
      setScreen("login");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", paintingForm.title);
      formData.append("price", paintingForm.price);
      formData.append("userId", user.id);

      if (paintingForm.image) {
        formData.append("image", paintingForm.image);
      }

      const response = await fetch(`${API_BASE}/paintings`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to upload painting.");
      }

      setPaintingForm(initialPaintingForm);
      setMessage(data.message);
      setScreen("home");
      await loadPaintings();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBuy = async (paintingId) => {
    if (!user) {
      setMessage("Please log in to buy a painting.");
      setScreen("login");
      return;
    }

    setBuyingId(paintingId);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/paintings/${paintingId}/buy`, {
        method: "POST"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to order product.");
      }

      setMessage(data.message);
      setPaintings((current) =>
        current.map((painting) => (painting.id === paintingId ? data.painting : painting))
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBuyingId(null);
    }
  };

  const renderAuthPanel = () => {
    if (screen === "login") {
      return (
        <section className="panel auth-card">
          <p className="eyebrow">Art Gallery</p>
          <h2>Login</h2>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={(event) => handleFormChange(event, setLoginForm)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={(event) => handleFormChange(event, setLoginForm)}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          <p className="helper-text">
            No account?{" "}
            <button className="text-button" type="button" onClick={() => goToScreen("register")}>
              Sign up here
            </button>
          </p>
        </section>
      );
    }

    if (screen === "register") {
      return (
        <section className="panel auth-card">
          <p className="eyebrow">Art Gallery</p>
          <h2>Create account</h2>
          <form className="form" onSubmit={handleRegister}>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={registerForm.name}
                onChange={(event) => handleFormChange(event, setRegisterForm)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={(event) => handleFormChange(event, setRegisterForm)}
                required
              />
            </label>

            <label>
              Phone number
              <input
                type="tel"
                name="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={(event) => handleFormChange(event, setRegisterForm)}
                required
              />
            </label>

            <label>
              Username
              <input
                type="text"
                name="username"
                value={registerForm.username}
                onChange={(event) => handleFormChange(event, setRegisterForm)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={(event) => handleFormChange(event, setRegisterForm)}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>
          </form>

          <p className="helper-text">
            Already have an account?{" "}
            <button className="text-button" type="button" onClick={() => goToScreen("login")}>
              Login here
            </button>
          </p>
        </section>
      );
    }

    if (screen === "upload") {
      return (
        <section className="panel auth-card upload-card">
          <p className="eyebrow">Art Gallery</p>
          <h2>Upload painting</h2>
          <form className="form" onSubmit={handleUpload}>
            <label>
              Painting title
              <input
                type="text"
                name="title"
                placeholder="Evening River"
                value={paintingForm.title}
                onChange={(event) => handleFormChange(event, setPaintingForm)}
                required
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="1"
                step="0.01"
                name="price"
                placeholder="199.00"
                value={paintingForm.price}
                onChange={(event) => handleFormChange(event, setPaintingForm)}
                required
              />
            </label>

            <label>
              Image file
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(event) => handleFormChange(event, setPaintingForm)}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload painting"}
            </button>
          </form>
        </section>
      );
    }

    return null;
  };

  const showOverlayPage = screen === "login" || screen === "register" || screen === "upload";

  return (
    <main className="page gallery-page">
      <header className="site-header">
        <div>
          <p className="eyebrow">Art Gallery</p>
          <h1>Art Gallery</h1>
        </div>

        {user ? (
          <div className="header-actions">
            <span className="welcome-text">Hello, {user.name}</span>
            <button className="secondary-button" type="button" onClick={() => goToScreen("upload")}>
              Upload
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setUser(null);
                setMessage("");
                setScreen("home");
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <button className="secondary-button" type="button" onClick={() => goToScreen("login")}>
            Login
          </button>
        )}
      </header>

      {message ? <p className="message banner-message">{message}</p> : null}

      <section className="gallery-section">
        <div className="section-heading">
          <p className="eyebrow">Gallery</p>
          <h3>Paintings</h3>
        </div>

        <div className="gallery-grid">
          {paintings.length === 0 ? (
            <article className="empty-card">
              <h4>No paintings yet</h4>
              <p>Upload the first painting to start the gallery.</p>
            </article>
          ) : (
            paintings.map((painting) => (
              <article className="painting-card" key={painting.id}>
                <div className="painting-image-wrap">
                  <PaintingImage src={painting.imageUrl} alt={painting.title} />
                </div>
                <div className="painting-body">
                  <div>
                    <p className="card-kicker">By {painting.seller}</p>
                    <h4>{painting.title}</h4>
                    <p className="price-tag">Rs. {painting.price}</p>
                  </div>

                  <button
                    className="primary-button"
                    type="button"
                    disabled={painting.isOrdered || buyingId === painting.id}
                    onClick={() => handleBuy(painting.id)}
                  >
                    {painting.isOrdered
                      ? "Ordered"
                      : buyingId === painting.id
                        ? "Ordering..."
                        : "Buy"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {showOverlayPage ? (
        <section className="auth-shell">
          {renderAuthPanel()}
          <button className="text-button back-button" type="button" onClick={() => goToScreen("home")}>
            Back to home
          </button>
        </section>
      ) : null}
    </main>
  );
}
