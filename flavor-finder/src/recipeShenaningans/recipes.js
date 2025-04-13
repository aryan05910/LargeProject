<div 
  key={recipe.id} 
  className="recipe-box" 
  onClick={() => handleRecipeClick(recipe)}
>
  <img src={recipe.image} alt={recipe.title} className="recipe-image" />
  <div className="recipe-title">{recipe.title}</div>
</div>
