import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { SEED_STEPS, SEED_PRODUCTS } from '../data/configuratorData';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '../data/products';

// Context
const MenuContext = createContext();

export const useMenu = () => useContext(MenuContext);

export const MenuProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Load from Supabase
    // Initial Load from Supabase
    useEffect(() => {
        const fetchMenuData = async () => {
            if (!supabase) {
                console.warn("Supabase client not initialized.");
                setCategories([]);
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch Categories
                const { data: catsData, error: catsError } = await supabase
                    .from('categories')
                    .select('*')
                    .order('sort_order', { ascending: true });

                if (catsError) throw catsError;
                setCategories(catsData || []);

                // 2. Fetch Products
                const { data: prodsData, error: prodsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true);

                if (prodsError) throw prodsError;
                setProducts(prodsData || []);

            } catch (error) {
                console.error("Failed to load menu data:", error);
                setCategories([]);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuData();
    }, []);

    // --- Product Actions ---
    const addProduct = async (product) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        try {
            // Remove 'id' if present to let DB generate it, or handle it
            const { id, ...prodData } = product;
            const payload = {
                name: prodData.name,
                price: parseFloat(prodData.price),
                category: prodData.category,
                image: prodData.image || '',
                description: prodData.description || '',
                weight: prodData.weight || '',
                ingredients: prodData.ingredients || '',
                is_active: true,
                is_available: true
            };

            const { data, error } = await supabase.from('products').insert([payload]).select();

            if (error) throw error;
            if (data) setProducts(prev => [...prev, data[0]]);
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Eroare la adăugarea produsului: " + error.message);
        }
    };

    const updateProduct = async (id, updatedData) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        try {
            const { error } = await supabase.from('products').update(updatedData).eq('id', id);
            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Eroare la actualizare: " + error.message);
        }
    };

    const deleteProduct = async (id) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        if (!window.confirm("Sigur dorești să ștergi acest produs?")) return;
        try {
            // Soft delete
            const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Eroare: " + error.message);
        }
    };

    // --- Category Actions ---
    const addCategory = async (name, type = 'delivery') => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        try {
            const { data, error } = await supabase.from('categories').insert([{
                name,
                type,
                sort_order: categories.length
            }]).select();

            if (error) throw error;
            if (data) setCategories(prev => [...prev, data[0]]);
        } catch (error) {
            alert('Eroare la adăugarea categoriei: ' + error.message);
        }
    };

    const deleteCategory = async (categoryName) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        // Find ID by name
        const cat = categories.find(c => c.name === categoryName);
        if (!cat) return;

        if (!window.confirm(`Sigur dorești să ștergi categoria "${categoryName}"?`)) return;

        try {
            const { error } = await supabase.from('categories').delete().eq('id', cat.id);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== cat.id));
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Eroare: " + error.message);
        }
    };

    const updateCategory = async (oldName, newName, type) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        const cat = categories.find(c => c.name === oldName);
        if (!cat) return;

        try {
            const { error } = await supabase
                .from('categories')
                .update({ name: newName, type: type || cat.type })
                .eq('id', cat.id);

            if (error) throw error;

            // Update local state
            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName, type: type || c.type } : c));

            // Also update products if name changed (since we store category name in products table as per schema)
            // Ideally should normalize DB to use category_id, but staying compatible with current logic
            if (oldName !== newName) {
                // Update all products in DB with old category name
                const { error: prodError } = await supabase
                    .from('products')
                    .update({ category: newName })
                    .eq('category', oldName);

                if (prodError) console.error("Error updating product categories:", prodError);

                setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
            }
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const moveCategory = async (index, direction) => {
        const newCats = [...categories];
        if (direction === 'up' && index > 0) {
            [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
        } else if (direction === 'down' && index < newCats.length - 1) {
            [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
        }
        setCategories(newCats);

        if (!supabase) {
            console.warn("Database not connected, sort sort order will not persist.");
            return;
        }

        // Update DB Order (Batch update ideal, but simple loop for now)
        try {
            // Ideally call a procedure or just update the two swapped items
            // For now, trust local state or implement DB update
            // Skipping DB sort update for speed, will reset on refresh if not saved.
            // Let's TRY to save:
            const updates = newCats.map((c, idx) => ({ id: c.id, sort_order: idx }));
            for (const u of updates) {
                await supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id);
            }
        } catch (e) {
            console.error("Sort update failed", e);
        }
    };

    // --- Legacy / LocalStorage Features (Booking, Configurator) ---
    // Keeping these on LocalStorage for now to reduce migration risk/time

    // Booking Logic (Supabase)
    const [bookedDates, setBookedDates] = useState({});

    // Fetch Bookings
    useEffect(() => {
        const fetchBookings = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.from('venue_bookings').select('*');
                if (error) throw error;

                // Transform list [{venue, date}] into object { venetia: [date1, date2], ... }
                const bookingMap = {};
                (data || []).forEach(b => {
                    if (!bookingMap[b.venue]) bookingMap[b.venue] = [];
                    bookingMap[b.venue].push(b.date);
                });
                setBookedDates(bookingMap);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            }
        };

        fetchBookings();

        // Subscribe to changes for realtime updates
        const channel = supabase
            .channel('public:venue_bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'venue_bookings' }, () => {
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleBooking = async (venue, dateStr) => {
        if (!supabase) {
            alert("Baza de date nu este conectată.");
            return;
        }

        const currentVenueDates = bookedDates[venue] || [];
        const isBooked = currentVenueDates.includes(dateStr);

        // Optimistic Update
        setBookedDates(prev => {
            const venueDates = prev[venue] || [];
            return {
                ...prev,
                [venue]: isBooked ? venueDates.filter(d => d !== dateStr) : [...venueDates, dateStr]
            };
        });

        try {
            if (isBooked) {
                // Delete
                const { error } = await supabase
                    .from('venue_bookings')
                    .delete()
                    .match({ venue, date: dateStr });
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('venue_bookings')
                    .insert([{ venue, date: dateStr }]);
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling booking:", error);
            alert("Eroare la salvarea disponibilității: " + error.message);
            // Revert optimistic update? For now, we rely on the next fetch or user retry.
        }
    };

    // --- Configurator Logic (Supabase) ---
    const [configuratorSteps, setConfiguratorSteps] = useState([]);
    const [configuratorProducts, setConfiguratorProducts] = useState({});

    // Fetch Configurator Data
    const fetchConfigData = async () => {
        if (!supabase) return;
        try {
            // 1. Fetch Steps
            const { data: stepsData, error: stepsError } = await supabase
                .from('configurator_steps')
                .select('*')
                .order('sort_order', { ascending: true });

            if (stepsError) throw stepsError;

            // If empty, maybe seed? For now, just set.
            setConfiguratorSteps(stepsData || []);

            // 2. Fetch Products
            const { data: prodsData, error: prodsError } = await supabase
                .from('configurator_products')
                .select('*')
                .eq('is_active', true);

            if (prodsError) throw prodsError;

            // Transform flat list to Map { stepId: [products] }
            const prodMap = {};
            (prodsData || []).forEach(p => {
                if (!prodMap[p.step_id]) prodMap[p.step_id] = [];
                prodMap[p.step_id].push(p);
            });
            setConfiguratorProducts(prodMap);

            // If no steps in DB, and we have seed data, maybe we should insert them?
            // For now, let's assume manual entry or we inject seed if empty.
            if ((!stepsData || stepsData.length === 0) && SEED_STEPS.length > 0) {
                // Auto-seed Steps if empty (one-time migration helper)
                console.log("Seeding Configurator Steps...");
                for (let i = 0; i < SEED_STEPS.length; i++) {
                    const { data: newStep } = await supabase.from('configurator_steps').insert([{ title: SEED_STEPS[i].title, sort_order: i }].select());
                    // If we want to seed products too, we'd need ID mapping. Too complex for auto.
                }
                // Re-fetch
                // fetchConfigData(); // recursion risk, skip for now.
            }

        } catch (error) {
            console.error("Error fetching configurator data:", error);
        }
    };

    useEffect(() => {
        fetchConfigData();
    }, []);

    // Config Actions
    const updateStep = async (id, newTitle) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('configurator_steps').update({ title: newTitle }).eq('id', id);
            if (error) throw error;
            setConfiguratorSteps(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
        } catch (error) {
            alert("Eroare la actualizare pas: " + error.message);
        }
    };

    const addConfigProduct = async (stepId, product) => {
        if (!supabase) return;
        try {
            const payload = {
                step_id: stepId,
                name: product.name,
                price: parseFloat(product.price || 0),
                image: product.image || '',
                description: product.description || '',
                is_active: true
            };
            const { data, error } = await supabase.from('configurator_products').insert([payload]).select();
            if (error) throw error;

            if (data) {
                const newProd = data[0];
                setConfiguratorProducts(prev => ({
                    ...prev,
                    [stepId]: [...(prev[stepId] || []), newProd]
                }));
            }
        } catch (error) {
            console.error("Error adding config product:", error);
            alert("Eroare: " + error.message);
        }
    };

    const updateConfigProduct = async (stepId, productId, updatedData) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('configurator_products').update(updatedData).eq('id', productId);
            if (error) throw error;

            setConfiguratorProducts(prev => ({
                ...prev,
                [stepId]: prev[stepId].map(p => p.id === productId ? { ...p, ...updatedData } : p)
            }));
        } catch (error) {
            console.error("Error updating config product:", error);
            alert("Eroare: " + error.message);
        }
    };

    const deleteConfigProduct = async (stepId, productId) => {
        if (!window.confirm('Verifică intenția: Ștergi acest produs?')) return;
        if (!supabase) return;
        try {
            const { error } = await supabase.from('configurator_products').delete().eq('id', productId);
            if (error) throw error;

            setConfiguratorProducts(prev => ({
                ...prev,
                [stepId]: prev[stepId].filter(p => p.id !== productId)
            }));
        } catch (error) {
            console.error("Error deleting config product:", error);
            alert("Eroare: " + error.message);
        }
    };

    const value = {
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        updateCategory,
        moveCategory,
        loading,
        bookedDates,
        toggleBooking,
        configuratorSteps,
        configuratorProducts,
        updateStep,
        addConfigProduct,
        updateConfigProduct,
        deleteConfigProduct
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};
