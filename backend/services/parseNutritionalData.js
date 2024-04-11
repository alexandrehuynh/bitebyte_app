function parseNutritionalData(jsonData) {
    // Assuming jsonData is a valid JavaScript object already parsed from JSON
    const structuredData = {
        dish: jsonData.dish, 
        ingredients: jsonData.ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: ingredient.quantity || 'unknown quantity',
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

module.exports = parseNutritionalData;
