import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import carbonaraImg from './carbonara.jpg';
import tikkaImg from './tikka.jpeg';
import sushiImg from './sushi.jpg';
import Login from "./Login";

//sample recipe data.
const recipes =[
  {id: 1, title: 'Spaghetti Carbonara', summary: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.', image: carbonaraImg},
  {id: 2, title: 'Chicken Tikka Masala', summary: 'A popular Indian curry with tender chicken pieces in a spiced tomato sauce.', image: tikkaImg},
  {id: 3, title: 'Sushi Platter', summary: 'A refreshing assortment of fresh sushi, nigiri and rolls.', image: sushiImg}
];

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
function SwipePage({currentIndex, setCurrentIndex,recipes, setSavedRecipes, setFavorites }) {
  const moveNext = () => {
    setCurrentIndex(prev => prev - 1);
  };
  const handleNo = () => {
    console.log(`No for ${recipes[currentIndex].title}`);
    moveNext();
  };
  const handleYes = () => {
    console.log(`Yes for ${recipes[currentIndex].title}`);
    setSavedRecipes(prev => [...prev, recipes[currentIndex]]);
    moveNext();
  };
  const handleSuperLike = () => {
    console.log(`Super Like for ${recipes[currentIndex].title}`);
    setFavorites(prev => [...prev, recipes[currentIndex]]);
    setSavedRecipes(prev => [...prev, recipes[currentIndex]]);
    moveNext();
  };
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      console.log(`Swiped left on ${recipes[currentIndex].title}`);
      moveNext();
    },
    onSwipedRight: () => {
      console.log(`Swiped right on ${recipes[currentIndex].title}`);
      moveNext();
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
  return (
    <>{currentIndex >= 0 ? (
        <>
          <SwipeDeck recipes={recipes} currentIndex={currentIndex} swipeHandlers={swipeHandlers} />
          <div className="button-container">
            <button className="btn no-btn" onClick={handleNo}>No</button>
            <button className="btn yes-btn" onClick={handleYes}>Yes</button>
            <button className="btn super-btn" onClick={handleSuperLike}>Favorite</button>
          </div>
        </>
      ) : (
        <div className="no-more">
          <h2>No more recipes!</h2>
        </div>
      )}
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
        <section className="favorites-section">
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
      <button onClick={() => navigate(-1)}>Back</button>
      <div className="recipe-detail-columns">
        {/* Left Column: Recipe information */}
        <div className="left-column">
          <h2>{recipe.title}</h2>
          <img src={recipe.image} alt={recipe.title} />
          <p>{recipe.summary}</p>
        </div>
        {/* Right Column: Placeholder text */}
        <div className="right-column">
          <p>insert recipe here</p>
        </div>
      </div>
    </div>
  );
}

//navigation dropdown
function Navigation() {
  const [showDropdown, setShowDropdown] = useState(false);
  const toggleDropdown = () => setShowDropdown(!showDropdown);
  return (
    <div className="nav-menu">
      <button className="nav-button" onClick={toggleDropdown}>Navigation</button>
      {showDropdown && (
        <div className="dropdown-menu">
          <Link to="/app" onClick={() => setShowDropdown(false)}>Swipe Page</Link>
          <Link to="app/recipes" onClick={() => setShowDropdown(false)}>Recipe Page</Link>
          <Link to="/logout" onClick={() => { setShowDropdown(false); console.log('Logged out'); }}>Logout</Link>
        </div>
      )}
    </div>
  );
}

//main app shenanigans
function App() {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(recipes.length - 1);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Flavor Finder</h1>
        <Navigation />
      </header>
      <Routes>
        <Route 
          path="/" 
          element={
            <main>
              <SwipePage
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                recipes={recipes}
                setSavedRecipes={setSavedRecipes}
                setFavorites={setFavorites}
              />
            </main>
          } 
        />
        <Route path="/app/recipes" element={<RecipePage savedRecipes={savedRecipes} favorites={favorites} />} />
        <Route path="/app/recipe/:id" element={<RecipeDetail savedRecipes={savedRecipes} favorites={favorites} />} />
        <Route path="logout" element={
          <main style={{ padding: "20px" }}>
            <h2>You have been logged out</h2>
          </main>
        } />
      </Routes>
    </div>
  );
}


export default App;
