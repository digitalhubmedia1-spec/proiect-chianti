import React, { createContext, useContext, useState, useEffect } from 'react';
import { logAction } from '../utils/adminLogger';

const RecipeContext = createContext();

export const useRecipes = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
    const [recipes, setRecipes] = useState(() => {
        const saved = localStorage.getItem('chianti_recipes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('chianti_recipes', JSON.stringify(recipes));
    }, [recipes]);

    const addRecipe = (recipe) => {
        const newRecipe = { ...recipe, id: Date.now().toString() };
        setRecipes([...recipes, newRecipe]);
        logAction('REȚETAR', `Rețetă nouă: ${recipe.name}`);
    };

    const updateRecipe = (id, updatedData) => {
        setRecipes(recipes.map(r => r.id === id ? { ...r, ...updatedData } : r));
        logAction('REȚETAR', `Actualizare rețetă #${id}`);
    };

    const deleteRecipe = (id) => {
        setRecipes(recipes.filter(r => r.id !== id));
        logAction('REȚETAR', `Ștergere rețetă #${id}`);
    };

    return (
        <RecipeContext.Provider value={{
            recipes,
            addRecipe,
            updateRecipe,
            deleteRecipe
        }}>
            {children}
        </RecipeContext.Provider>
    );
};
