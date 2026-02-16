import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/adminLogger';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        if (!supabase) {
            setLoading(false);
            // Set fallback categories to prevent UI crashes if needed
            setCategories(['Ingrediente', 'Băuturi', 'Ambalaje', 'Curățenie']);
            return;
        }
        setLoading(true);
        try {
            // 1. Fetch Categories
            const { data: catsData, error: catsError } = await supabase.from('inventory_categories').select('*');

            // 2. Fetch Items
            const { data: itemsData, error: itemsError } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });

            if (catsError && catsError.code !== 'PGRST116') console.error(catsError); // Ignore if table missing initially? No, schema created.
            if (itemsError) throw itemsError;

            if (catsData) {
                const catNames = catsData.map(c => c.name);
                if (catNames.length === 0) {
                    // Init defaults if empty
                    const defaults = ['Ingrediente', 'Băuturi', 'Ambalaje', 'Curățenie'];
                    // Optional: Insert logic here or just show defaults locally?
                    // To ensure other users see them, we should probably insert them if really empty, 
                    // but let's just default to local array if empty for now to prevent broken UI
                    setCategories(defaults);
                } else {
                    setCategories(catNames);
                }
            } else {
                setCategories(['Ingrediente', 'Băuturi', 'Ambalaje', 'Curățenie']);
            }

            if (itemsData) {
                // Map snake_case to camelCase
                const mappedItems = itemsData.map(item => ({
                    ...item,
                    entryDate: item.entry_date
                }));
                setItems(mappedItems);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to log stock movement
    const logStockMovement = async (item, operation, quantity = 0) => {
        if (!supabase) return;
        const adminName = localStorage.getItem('admin_name') || 'Admin';

        try {
            await supabase.from('stock_history').insert([{
                item_name: item.name,
                category: item.category,
                quantity: parseFloat(quantity),
                unit: item.unit,
                operation: operation,
                operator: adminName
            }]);
        } catch (e) {
            console.error("Failed to log stock movement", e);
        }
    };

    // Actions - Categories
    const addCategory = async (name) => {
        if (categories.includes(name)) return;
        if (!supabase) return;

        try {
            const { error } = await supabase.from('inventory_categories').insert([{ name }]);
            if (error) throw error;
            setCategories(prev => [...prev, name]);
            logAction('INVENTAR', `Categorie nouă: ${name}`);
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Eroare: " + error.message);
        }
    };

    const deleteCategory = async (name) => {
        if (!supabase) return;
        if (!window.confirm(`Ștergi categoria "${name}"?`)) return;

        try {
            const { error } = await supabase.from('inventory_categories').delete().eq('name', name);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c !== name));
            logAction('INVENTAR', `Categorie ștearsă: ${name}`);
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    // Actions - Items
    const addItem = async (item) => {
        if (!supabase) return;
        const payload = {
            name: item.name,
            category: item.category,
            stock: parseFloat(item.stock),
            unit: item.unit,
            entry_date: item.entryDate || new Date().toISOString()
        };

        try {
            const { data, error } = await supabase.from('inventory_items').insert([payload]).select();
            if (error) throw error;
            if (data) {
                const newItem = { ...data[0], entryDate: data[0].entry_date };
                setItems(prev => [...prev, newItem]);
                logAction('INVENTAR', `Produs nou: ${newItem.name} (${newItem.stock} ${newItem.unit})`);
                logStockMovement(newItem, 'INTRARE', newItem.stock);
            }
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Eroare: " + error.message);
        }
    };

    const updateItem = async (id, updatedData) => {
        if (!supabase) return;

        // Auto-delete if stock becomes 0 or less
        if (updatedData.stock !== undefined && parseFloat(updatedData.stock) <= 0) {
            await deleteItem(id);
            return;
        }

        const payload = {};
        if (updatedData.name) payload.name = updatedData.name;
        if (updatedData.category) payload.category = updatedData.category;
        if (updatedData.stock !== undefined) payload.stock = parseFloat(updatedData.stock);
        if (updatedData.unit) payload.unit = updatedData.unit;
        if (updatedData.entryDate) payload.entry_date = updatedData.entryDate;

        try {
            const { data, error } = await supabase.from('inventory_items').update(payload).eq('id', id).select();
            if (error) throw error;

            if (data) {
                const updatedItem = { ...data[0], entryDate: data[0].entry_date };
                setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            }
        } catch (error) {
            console.error("Error updating item:", error);
        }
    };

    const deleteItem = async (id) => {
        if (!supabase) return;
        // Find item to log before deletion
        const itemToDelete = items.find(i => i.id === id);

        if (!window.confirm("Ștergi acest element?")) return;
        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw error;
            setItems(prev => prev.filter(item => item.id !== id));
            logAction('INVENTAR', `Produs șters #${id}`);
            if (itemToDelete) logStockMovement(itemToDelete, 'STERGERE', itemToDelete.stock);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const updateStock = async (id, newStock) => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase.from('inventory_items').update({ stock: parseFloat(newStock) }).eq('id', id).select();
            if (error) throw error;

            if (data) {
                const updatedItem = { ...data[0], entryDate: data[0].entry_date };
                setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            }
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    };

    return (
        <InventoryContext.Provider value={{
            categories, items, loading,
            addCategory, deleteCategory,
            addItem, updateItem, deleteItem, updateStock
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
