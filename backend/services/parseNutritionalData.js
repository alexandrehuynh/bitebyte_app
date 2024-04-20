function parseNutritionalData(jsonData) {
    // Assuming jsonData is a valid JavaScript object already parsed from JSON
    const structuredData = {
        dish: jsonData.dish, 
        ingredients: jsonData.ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: ingredient.quantity || 'unknown quantity',
            unit: ingredient.unit || 'unknown unit', 
            calories: ingredient.calories,
            macronutrients: {
                fat: ingredient.macronutrients.fat,
                carbohydrates: ingredient.macronutrients.carbohydrates,
                protein: ingredient.macronutrients.protein
            }
        })),
        totals: {
            totalCalories: jsonData.totalNutrition.calories,
            totalFat: jsonData.totalNutrition.fat,
            totalCarbohydrates: jsonData.totalNutrition.carbohydrates,
            totalProtein: jsonData.totalNutrition.protein
        }
    };

    return structuredData;
}

function extractKeyNutrients(edamamData) {
    // Extract only the required nutrients from the Edamam response
    const requiredNutrients = {
      calories: edamamData.totalNutrientsKCal.ENERC_KCAL.quantity || 0 ,
      fat: edamamData.totalNutrients.FAT.quantity || 0,
      carbohydrates: edamamData.totalNutrients.CHOCDF.quantity || 0,
      protein: edamamData.totalNutrients.PROCNT.quantity || 0
    };
  
    // Return the extracted nutrients
    return requiredNutrients;
  }

  
module.exports = {parseNutritionalData, extractKeyNutrients};
