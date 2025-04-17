import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const IMAGE_BASE_URL = "/api/images"

const transformRecipeData = (apiRecipe) => {
    if (!apiRecipe || !apiRecipe._id) {
        console.warn("Attempted to transform invalid recipe data:", apiRecipe);
        return null; // Return null or a default object if data is invalid
    }
    return {
        id: apiRecipe._id.toString(), // Use MongoDB's _id as the unique identifier
        title: apiRecipe.Title || 'Untitled Recipe', // Provide defaults
        summary: apiRecipe.Instructions || apiRecipe.Ingredients || 'No summary available.', // Use Instructions or Ingredients as summary
        image: `${IMAGE_BASE_URL}/${apiRecipe.Image_Name}.jpg`, // Construct the full image URL
        // Add other fields if needed by your components (like ingredients, full instructions)
        ingredients: apiRecipe.Ingredients,
        instructions: apiRecipe.Instructions,
    };
};

//card component swiping
const Card = ({ title, summary, image }) => (
  <motion.div className="card"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}>
    <img src={image} alt={title} className="card-image" />
    <div className="card-info">
      <h3>{title}</h3>
      <p>{summary}</p>
    </div>
  </motion.div>
);

// SwipePage: fetches recommendation, sends feedback on Yes/No
function SwipePage({ savedRecipes, setSavedRecipes, favorites, setFavorites }) {  
  const [recipe, setRecipe] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  const navigate = useNavigate();

  console.log('swipepage works',{userId})

  // Fetch next recommended recipe
  const fetchNext = async () => {
    try {
      console.log('fetchnext')
      const res = await fetch(`/api/recommend?userId=${userId}`);
      console.log('rec response status', res.status)
      const data = await res.json();
      console.log('rec response body', data)
      setRecipe(data);
    } catch (err) {
      console.error('Fetch recommend error:', err);
    }
  };

  // Load first recipe
  useEffect(() => { fetchNext(); }, []);

  // Handle user feedback
  const handleFeedback = async (liked) => {
    if (!recipe) return;

    // Update server-side preferences
    try {
      await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, recipeId: recipe._id, liked })
      });
    } catch (err) {
      console.error('Swipe error:', err);
    }

    // Update local saved/favorites state
    if (liked) {
      const normalized = transformRecipeData(recipe);
      if (normalized) {
        setSavedRecipes(prev => [...prev, normalized]);
  }
    }

    try {
      const prefsRes = await fetch(`/api/preferences?userId=${userId}`);
      const prefs = await prefsRes.json();
      console.log(' user preference vector:', prefs);
    } catch (err) {
        console.error('could not fetch prefs:', err);
    }

    // Load next
    fetchNext();
  };

  if (!recipe) return <div className="loading">Loading…</div>;

  return (
    <>
      <Card
        title={recipe.Title}
        summary={(recipe.Instructions || '').slice(0, 100) + '…'}
        image={`/api/images/${recipe.Image_Name}.jpg`}
      />

      <div className="button-container">
        <button className="btn no-btn" onClick={() => handleFeedback(false)}>No</button>
        <button className="btn yes-btn" onClick={() => handleFeedback(true)}>Yes</button>
      </div>
    </>
  );
}

//recipe page component
function RecipePage({savedRecipes, favorites }){
  const navigate = useNavigate();
  return (
    <div className="recipe-page">
      <h2>Your Recipes</h2>
      {favorites.length > 0 && (
        <section className="favorites-section">i
          <h3>Favorites</h3>
          <div className="recipe-grid">
            {favorites.map(recipe => (
              <div key={recipe.id} className="recipe-box" onClick={() => navigate(`/app/recipe${recipe.id}`)}>
                <img src={recipe.image} alt={recipe.title} />
                <h4>{recipe.title}</h4>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="saved-section">
        <h3>Saved Recipes</h3>
        <div className="recipe-grid">
          {savedRecipes.map(recipe => (
            <div key={recipe.id} className="recipe-box" onClick={() => navigate(`/app/recipe/${recipe.id}`)}>
              <img src={recipe.image} alt={recipe.title} />
              <h4>{recipe.title}</h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

//recipe detail page component
function RecipeDetail({ savedRecipes, favorites }) {
  const { id } = useParams();
  const recipeId = parseInt(id, 10);
  const recipe = [...favorites, ...savedRecipes].find(r => r.id === id);
  const navigate = useNavigate();
  if (!recipe) {
    return <div>Recipe not found.</div>;
  }
  return (
        <div className="recipe-detail">
            <button onClick={() => navigate(-1)}>Back</button> {/* Use navigate(-1) for browser back */}
            <div className="recipe-detail-columns">
                {/* Left Column: Recipe information */}
                <div className="left-column">
                    <h2>{recipe.title}</h2>
                    <img src={recipe.image} alt={recipe.title} />
                     {/* Display summary or full instructions if available */}
                    <p>{recipe.summary || 'No summary.'}</p>
                </div>
                {/* Right Column: Display Ingredients and Instructions */}
                <div className="right-column">
                    {recipe.ingredients && (
                        <>
                            <h3>Ingredients</h3>
                            {/* Format ingredients list nicely */}
                            <ul>
                                {typeof recipe.ingredients === 'string' && recipe.ingredients.startsWith('[')
                                 ? JSON.parse(recipe.ingredients.replace(/'/g, '"')).map((ing, index) => <li key={index}>{ing}</li>)
                                 : <li>{recipe.ingredients}</li>
                                }
                             </ul>
                        </>
                    )}
                     {!recipe.ingredients && !recipe.instructions && <p>Detailed recipe steps not available.</p>}
                </div>
            </div>
        </div>
    );
}

//navigation dropdown
function Navigation() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const handleLogout = () => {
        localStorage.removeItem("user"); // Clear user data from storage
        setShowDropdown(false);
        navigate("/"); // Redirect to login page
        console.log('Logged out');
    };

  return (
    <div className="nav-menu">
            <button className="nav-button" onClick={toggleDropdown}>Navigation</button>
            {showDropdown && (
                <div className="dropdown-menu">
                    <Link to="/app" onClick={() => setShowDropdown(false)}>Home</Link>
                    <Link to="/app/recipes" onClick={() => setShowDropdown(false)}>Saved</Link>
                    {/* Use button/link that calls handleLogout */}
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                     {/* Alternatively, keep as Link but prevent default and call handleLogout */}
                    {/* <Link to="/" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</Link> */}
                </div>
            )}
        </div>
  );
}

//main app shenanigans
function App() {
    //const [fetchedRecipes, setFetchedRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    //const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation

    
    return (
      <div className="App">
        <header className="App-header">
          <h1>Flavor Finder</h1>
          <Navigation />
        </header>
  
        <Routes>
          {/* default /app route */}
          <Route
            index
            element={
              <main>
                <SwipePage
                  savedRecipes={savedRecipes}
                  setSavedRecipes={setSavedRecipes}
                  favorites={favorites}
                  setFavorites={setFavorites}
                />
              </main>
            }
          />
  
          {/* /app/recipes */}
          <Route
            path="recipes"
            element={
              <RecipePage
                savedRecipes={savedRecipes}
                favorites={favorites}
              />
            }
          />
  
          {/* /app/recipe/:id */}
          <Route
            path="recipe/:id"
            element={
              <RecipeDetail
                savedRecipes={savedRecipes}
                favorites={favorites}
              />
            }
          />
  
          {/* fallback → Not Found */}
          <Route
            path="*"
            element={
              <main>
                <h2>Page Not Found</h2>
              </main>
            }
          />
        </Routes>
      </div>
    );
  }
  
  export default App;
