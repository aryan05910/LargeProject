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
        id: apiRecipe._id, // Use MongoDB's _id as the unique identifier
        title: apiRecipe.Title || 'Untitled Recipe', // Provide defaults
        summary: apiRecipe.Instructions || apiRecipe.Ingredients || 'No summary available.', // Use Instructions or Ingredients as summary
        image: `${IMAGE_BASE_URL}/${apiRecipe.Image_Name}.jpg`, // Construct the full image URL
        // Add other fields if needed by your components (like ingredients, full instructions)
        ingredients: apiRecipe.Ingredients,
        instructions: apiRecipe.Instructions,
    };
};

//card component swiping
const Card = ({ recipe})=> (
  <motion.div className="card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}>
    <img src={recipe.image} alt={recipe.title} className="card-image" />
    <div className="card-info">
      <h3>{recipe.title}</h3>
      <p>{recipe.summary}</p>
    </div>
  </motion.div>
);

//swipedeck component
const SwipeDeck =({recipes, currentIndex, swipeHandlers }) => (
  <div className="swipe-deck"{...swipeHandlers}>
    <AnimatePresence>
      {currentIndex >= 0 && (
        <Card key={recipes[currentIndex].id} recipe={recipes[currentIndex]} />
      )}
    </AnimatePresence>
  </div>
);

//swiping page component
function SwipePage({recipes, currentIndex, setCurrentIndex, setSavedRecipes, setFavorites }) {
  const currentRecipe = (currentIndex >= 0 && currentIndex < recipes.length) ? recipes[currentIndex] : null;

  const moveNext = () => {
    setCurrentIndex(prev => prev - 1);
  };
  const handleNo = () => {
    console.log(`No for ${currentRecipe.title}`);
    moveNext();
  };
  const handleYes = () => {
    console.log(`Yes for ${currentRecipe.title}`);
    setSavedRecipes(prev => [...prev, currentRecipe]);
    moveNext();
  };
  const handleSuperLike = () => {
    console.log(`Super Like for ${currentRecipe.title}`);
    setFavorites(prev => [...prev, currentRecipe]);
    setSavedRecipes(prev => [...prev, currentRecipe]);
    moveNext();
  };
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      console.log(`Swiped left on ${currentRecipe.title}`);
      moveNext();
    },
    onSwipedRight: () => {
      console.log(`Swiped right on ${currentRecipe.title}`);
      moveNext();
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
  if (!currentRecipe) {
        return (
            <div className="no-more">
                <h2>No more recipes!</h2>
                {/* Optionally add a button to refresh or fetch more */}
            </div>
        );
    }
  return (
        <>
            <SwipeDeck recipes={recipes} currentIndex={currentIndex} swipeHandlers={swipeHandlers} />
            <div className="button-container">
                <button className="btn no-btn" onClick={handleNo}>No</button>
                <button className="btn yes-btn" onClick={handleYes}>Yes</button>
                <button className="btn super-btn" onClick={handleSuperLike}>Favorite</button>
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
              <div key={recipe.id} className="recipe-box" onClick={() => navigate(`/recipe/${recipe.id}`)}>
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
            <div key={recipe.id} className="recipe-box" onClick={() => navigate(`/recipe/${recipe.id}`)}>
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
  const recipe = [...favorites, ...savedRecipes].find(r => r.id === recipeId);
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
                    {recipe.instructions && (
                         <>
                            <h3>Instructions</h3>
                             {/* Format instructions - potentially split by newline */}
                            <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>
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
  const [fetchedRecipes, setFetchedRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation

    // useEffect to check auth and fetch recipes
    useEffect(() => {
        let currentUserId = null; // Variable to hold the user ID

        // 1. Check localStorage for user data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                // Check if ID exists and is valid (assuming ID >= 0 is valid based on Login.tsx)
                if (userData && userData.id !== undefined && userData.id >= 0) {
                    currentUserId = String(userData.id); // Store the ID as a string
                    console.log("User ID found:", currentUserId);
                } else {
                     console.warn("Stored user data is invalid or missing ID:", userData);
                }
            } catch (parseError) {
                console.error("Failed to parse user data from localStorage:", parseError);
                 localStorage.removeItem("user"); // Clear corrupted data
            }
        }

        // 2. If no valid userId found, redirect to login
        if (!currentUserId) {
            console.log("No valid user ID found, redirecting to login.");
            setIsLoading(false); // Stop loading indicator
            navigate("/"); // Redirect to the login page
            return; // Stop the effect here
        }

        // 3. Define the async function to fetch recipes (only runs if userId is valid)
        const fetchRecipes = async () => {
            // Ensure loading is true before fetch starts
             setIsLoading(true);
             setError(null);

            // Extract IDs from the current favorites state
            const favoriteRecipeIds = favorites.map(fav => fav.id).filter(id => !!id);

            try {
                // Get recommended recipe IDs using the retrieved userId
                const recommendResponse = await fetch(`/api/getRecommendedRecipes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                     // Use the retrieved currentUserId here
                    body: JSON.stringify({ userId: currentUserId, favoriteRecipeIds })
                });
                 // ... (rest of the fetching and processing logic remains the same) ...
                if (!recommendResponse.ok) {
                    // Try to get error message from response body
                    let errorMsg = `HTTP error! status: ${recommendResponse.status}`;
                    try {
                        const errorBody = await recommendResponse.json();
                        errorMsg = errorBody.error || errorMsg;
                    } catch (_) { /* Ignore parsing error */ }
                    throw new Error(errorMsg);
                }
                const recommendData = await recommendResponse.json();

                if (recommendData.error) {
                    throw new Error(`API Error: ${recommendData.error}`);
                }

                const recommendedIds = recommendData.recommendedRecipeIds;

                if (!recommendedIds || recommendedIds.length === 0) {
                    setFetchedRecipes([]);
                    setCurrentIndex(-1);
                    console.log("No recommendations received.");
                    setIsLoading(false);
                    return;
                }

                const recipeDetailPromises = recommendedIds.map(id =>
                    fetch(`/api/getRecipeByID/${id}`)
                        .then(res => {
                            if (!res.ok) {
                                console.error(`Failed to fetch recipe ${id}, status: ${res.status}`);
                                return null;
                            }
                            return res.json();
                        })
                        .catch(err => {
                            console.error(`Error fetching recipe ${id}:`, err);
                            return null;
                        })
                );

                const results = await Promise.all(recipeDetailPromises);

                const transformedRecipes = results
                    .filter(recipe => recipe !== null)
                    .map(transformRecipeData)
                    .filter(recipe => recipe !== null); // Filter out nulls from transformation

                console.log("Fetched and transformed recipes:", transformedRecipes);
                setFetchedRecipes(transformedRecipes);
                setCurrentIndex(transformedRecipes.length - 1);

            } catch (err) {
                console.error("Failed to fetch recipes:", err);
                setError(`Could not load recipes: ${err.message || 'Please try again later.'}`);
                setFetchedRecipes([]);
                setCurrentIndex(-1);
            } finally {
                setIsLoading(false);
            }
        };

        // 4. Call fetchRecipes (since we have a valid userId at this point)
        fetchRecipes();

        // Dependency array is empty `[]` to run only once on mount after login redirects.
        // If the app allows logging in/out *without* redirecting away from /app,
        // you might need a global state (Context API) or other mechanism
        // to trigger this effect again when the login state changes.
    }, [navigate]); // Add navigate to dependency array as per ESLint rules

    // --- Render Logic ---
    // Note: The Router should likely wrap the entire application in index.js or main.jsx/tsx
    // If it's here, ensure it correctly encompasses Login and App routes.
    // Assuming Router is handled higher up, we only render Routes here.
    // If App *is* the top level component managing routing, keep <Router>
    return (
        // <Router> - Remove if Router is in index.js/main.jsx
            <div className="App">
                <header className="App-header">
                    <h1>Flavor Finder</h1>
                    {/* Navigation should only show if logged in, potentially */}
                    {/* We know user is likely logged in if this component renders */}
                    {/* due to the redirect logic in useEffect */}
                    <Navigation />
                </header>

                 {/* Routes specific to the authenticated App */}
                 {/* If loading, show indicator */}
                {isLoading && <main><div>Loading recipes...</div></main>}
                {/* If error, show error */}
                {error && <main><div className="error-message">{error}</div></main>}
                {/* If not loading and no error, show the main content */}
                {!isLoading && !error && (
                     <Routes>
                         {/* Default view for /app */}
                        <Route index element={
                             <main>
                                 <SwipePage
                                    recipes={fetchedRecipes}
                                    currentIndex={currentIndex}
                                    setCurrentIndex={setCurrentIndex}
                                    setSavedRecipes={setSavedRecipes}
                                    setFavorites={setFavorites}
                                />
                            </main>
                        }/>
                        <Route path="recipes" element={<RecipePage savedRecipes={savedRecipes} favorites={favorites} />} />
                        <Route path="recipe/:id" element={<RecipeDetail savedRecipes={savedRecipes} favorites={favorites} />} />
                         {/* Logout isn't really a page, handled by Navigation */}
                         {/* You might add a fallback route */}
                         <Route path="*" element={<main><h2>Page Not Found</h2></main>} />
                    </Routes>
                 )}
            </div>
        // </Router> - Remove if Router is in index.js/main.jsx
    );
}


export default App;
