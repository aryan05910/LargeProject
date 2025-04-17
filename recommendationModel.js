// recommendationModel.js
// const { ObjectId } = require('mongodb'); // Only needed if comparing ObjectIds directly

/**
 * Shuffles array in place using Fisher-Yates algorithm.
 * @param {Array} array Array to shuffle.
 * @returns {Array} Shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

/**
 * Placeholder recommendation model.
 * Fetches all recipe IDs, filters out favorites, and returns a random selection.
 * @param {string} userId - The ID of the user requesting recommendations (currently unused in this placeholder).
 * @param {string[]} favoriteRecipeIds - An array of recipe IDs (as strings) favorited by the user.
 * @param {Db} db - The MongoDB database connection instance.
 * @param {number} numRecommendations - The maximum number of recommendations to return.
 * @returns {Promise<string[]>} A promise that resolves to an array of recommended recipe ID strings.
 */
async function getRecommendations(userId, favoriteRecipeIds = [], db, numRecommendations = 5) {
    console.log(`Generating recommendations for UserID: ${userId}, excluding ${favoriteRecipeIds.length} favorites.`);
    try {
        // Fetch all recipe IDs (_id field only) from the database for efficiency
        const allRecipesCursor = db.collection('Recipes').find({}, { projection: { _id: 1 } });
        const allRecipes = await allRecipesCursor.toArray();

        // Convert all fetched ObjectIds to strings
        const allRecipeIds = allRecipes.map(recipe => recipe._id.toString());

        // Ensure favoriteRecipeIds are represented as a Set for efficient lookup
        // Assuming incoming favoriteRecipeIds are already strings from frontend/API
        const favoriteIdsSet = new Set(favoriteRecipeIds);

        // Filter out recipes that the user has already favorited
        const potentialRecommendationIds = allRecipeIds.filter(id => !favoriteIdsSet.has(id));
        console.log(`Found ${potentialRecommendationIds.length} potential recipes after filtering.`);

        // Shuffle the potential recommendations
        const shuffledRecommendationIds = shuffleArray(potentialRecommendationIds);

        // Take the top N recommendations (or fewer if not enough available)
        const finalRecommendationIds = shuffledRecommendationIds.slice(0, numRecommendations);
        console.log(`Returning ${finalRecommendationIds.length} recommended recipe IDs.`);

        return finalRecommendationIds; // Return array of recipe ID strings

    } catch (error) {
        // Log the error and re-throw or throw a new one for the route handler
        console.error("Error generating recommendations in model:", error);
        throw new Error("Failed to generate recommendations due to a database or logic error.");
    }
}

// Export the function to be used in server.js
module.exports = { getRecommendations };
