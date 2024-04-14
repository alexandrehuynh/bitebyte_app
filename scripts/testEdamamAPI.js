const {
    getNutritionalAnalysis,
    getFoodDatabaseInfo,
    searchRecipes,
  } = require('../src/api/edamam'); 
  
  // A sample function to test the Nutrition Analysis API
  async function testNutritionAnalysis() {
    try {
      const analysis = await getNutritionalAnalysis('1 large apple');
      console.log('Nutrition Analysis:', analysis);
    } catch (error) {
      console.error('Nutrition Analysis API Error:', error);
    }
  }
  
  // A sample function to test the Food Database API
  async function testFoodDatabase() {
    try {
      const foodInfo = await getFoodDatabaseInfo('apple');
      console.log('Food Database Info:', foodInfo);
    } catch (error) {
      console.error('Food Database API Error:', error);
    }
  }
  
  // A sample function to test the Recipe Search API
  async function testRecipeSearch() {
    try {
      const recipes = await searchRecipes('chicken');
      console.log('Recipes:', recipes);
    } catch (error) {
      console.error('Recipe Search API Error:', error);
    }
  }
  
  // Run the test functions
  testNutritionAnalysis();
  testFoodDatabase();
  testRecipeSearch();
  