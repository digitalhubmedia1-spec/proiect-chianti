import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/adminLogger';

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
                    .select('*, parent_id, is_visible')
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
                gallery: prodData.gallery || [],
                production_gallery: prodData.production_gallery || [],
                description: prodData.description || '',
                weight: prodData.weight || '',
                ingredients: prodData.ingredients || '',
                product_options: prodData.product_options || [],
                is_active: true,
                is_available: true
            };

            const { data, error } = await supabase.from('products').insert([payload]).select();

            if (error) throw error;
            const newProduct = data ? data[0] : null;
            if (newProduct) {
                setProducts(prev => [...prev, newProduct]);
                logAction('ADĂUGARE PRODUS', `Produs: ${newProduct.name} (${newProduct.price} RON)`);
            }
            return newProduct;
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Eroare la adăugarea produsului: " + error.message);
            return null;
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
            logAction('ACTUALIZARE PRODUS', `Produs ID: ${id}`);
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
            logAction('ȘTERGERE PRODUS', `Produs ID: ${id}`);
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Eroare: " + error.message);
        }
    };

    // --- Category Actions ---
    const addCategory = async (name, type = 'delivery', parentId = null) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        try {
            const { data, error } = await supabase.from('categories').insert([{
                name,
                type,
                parent_id: parentId,
                is_visible: true,
                sort_order: categories.length
            }]).select();

            if (error) throw error;
            if (data) {
                setCategories(prev => [...prev, data[0]]);
                logAction('ADĂUGARE CATEGORIE', `Categorie: ${name} (Sub: ${parentId ? 'Da' : 'Nu'})`);
            }
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
            logAction('ȘTERGERE CATEGORIE', `Categorie: ${categoryName}`);
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Eroare: " + error.message);
        }
    };

    const updateCategory = async (id, updates) => {
        if (!supabase) {
            alert("Eroare: Baza de date nu este conectată! Nu poți face modificări.");
            return;
        }
        // Use loose equality for ID matching in case of string/number mismatch
        const cat = categories.find(c => c.id == id);
        if (!cat) {
            console.error(`Category not found for update: ${id}`);
            return;
        }

        try {
            const { error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

            if (updates.name && updates.name !== cat.name) {
                logAction('ACTUALIZARE CATEGORIE', `Nume: ${cat.name} -> ${updates.name}`);
                // Update products if name changed (Legacy support)
                const { error: prodError } = await supabase
                    .from('products')
                    .update({ category: updates.name })
                    .eq('category', cat.name);
                if (!prodError) {
                    setProducts(prev => prev.map(p => p.category === cat.name ? { ...p, category: updates.name } : p));
                }
            } else if (updates.is_visible !== undefined) {
                logAction('VIZIBILITATE CATEGORIE', `${cat.name}: ${updates.is_visible ? 'Visible' : 'Hidden'}`);
            }

        } catch (error) {
            console.error("Error updating category:", error);
            alert("Eroare: " + error.message);
        }
    };

    const toggleCategoryVisibility = async (id) => {
        const cat = categories.find(c => c.id == id);
        if (cat) {
            // Treat undefined/null as true (visible). So valid toggle is: if false->true, else->false
            const nextState = cat.is_visible === false ? true : false;
            await updateCategory(id, { is_visible: nextState });
        }
    };

    const reorderCategory = async (id, direction) => {
        // 1. Find Current Item
        const item = categories.find(c => c.id == id);
        if (!item) return;

        // 2. Find Siblings (Same Parent)
        // Loose equality check for parent_id just in case (null vs undefined) or mismatch
        const siblings = categories
            .filter(c => (c.parent_id == item.parent_id)) // Handles null == null
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const currentIndex = siblings.findIndex(c => c.id == item.id);
        if (currentIndex === -1) return;

        // 3. Determine Target Swap
        let swapWithIndex = -1;
        if (direction === 'up' && currentIndex > 0) {
            swapWithIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < siblings.length - 1) {
            swapWithIndex = currentIndex + 1;
        }

        if (swapWithIndex === -1) return; // Cannot move

        const swapItem = siblings[swapWithIndex];

        // 4. Swap Sort Orders
        // Ensure they have valid sort_orders (init if missing)
        const itemOrder = item.sort_order !== undefined ? item.sort_order : 0;
        const swapOrder = swapItem.sort_order !== undefined ? swapItem.sort_order : 0;

        // If orders are identical, we force a difference, otherwise standard swap
        const newOrderForItem = swapOrder;
        const newOrderForSwap = itemOrder;

        // OPTIMIZATION: If identical, we might need a full re-index, 
        // but for now simple swap of values works if values were distinct.
        // Better approach: Re-index array indices.

        const updatedSiblings = [...siblings];
        // Swap items in the array to get desired order
        [updatedSiblings[currentIndex], updatedSiblings[swapWithIndex]] = [updatedSiblings[swapWithIndex], updatedSiblings[currentIndex]];

        // Assign new sort_orders based on array index (normalized)
        const updates = updatedSiblings.map((c, idx) => ({
            id: c.id,
            sort_order: idx + (siblings[0].sort_order || 0) // Keep relative range? Or just 0-based? 
            // Better: Just 0-based for the group or re-index whole list?
            // Localized re-index is safer:
        }));

        // 5. Update State
        // Create new categories array with updates applied
        const newCategories = categories.map(c => {
            const update = updates.find(u => u.id === c.id);
            return update ? { ...c, sort_order: update.sort_order } : c;
        });

        setCategories(newCategories);

        // 6. Persist to DB
        if (supabase) {
            try {
                for (const u of updates) {
                    await supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id);
                }
            } catch (err) {
                console.error("Failed to reorder:", err);
            }
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
                logAction('EVENIMENTE', `Anulare rezervare: ${venue} - ${dateStr}`);
            } else {
                // Insert
                const { error } = await supabase
                    .from('venue_bookings')
                    .insert([{ venue, date: dateStr }]);
                if (error) throw error;
                logAction('EVENIMENTE', `Rezervare: ${venue} - ${dateStr}`);
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
                .select('id, step_id, name, description, full_description, image, price, is_active')
                .eq('is_active', true);

            if (prodsError) throw prodsError;

            // Transform flat list to Map { stepId: [products] }
            const prodMap = {};
            (prodsData || []).forEach(p => {
                if (!prodMap[p.step_id]) prodMap[p.step_id] = [];
                // Map DB schema to UI schema
                // DB: name, description, full_description
                // UI: title, desc, fullDesc
                const uiProduct = {
                    ...p,
                    title: p.name,
                    desc: p.description || '',
                    fullDesc: p.full_description || ''
                };
                prodMap[p.step_id].push(uiProduct);
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
            logAction('CONFIGURATOR', `Redenumire pas: ${newTitle}`);
        } catch (error) {
            alert("Eroare la actualizare pas: " + error.message);
        }
    };

    const addConfigProduct = async (stepId, product) => {
        if (!supabase) return;
        try {
            const allowedCols = ['step_id', 'name', 'price', 'image', 'description', 'full_description', 'is_active'];
            const safePayload = {
                step_id: stepId,
                name: product.title || '',
                price: parseFloat(product.price || 0),
                image: product.image || '',
                description: product.desc || '',
                full_description: product.fullDesc || '',
                is_active: true
            };

            // Final check to ensure no prototype leaking although unlikely here
            const dbPayload = {};
            Object.keys(safePayload).forEach(key => {
                if (allowedCols.includes(key)) dbPayload[key] = safePayload[key];
            });

            const { data, error } = await supabase.from('configurator_products').insert([dbPayload]).select();
            if (error) throw error;

            if (data) {
                const newProd = data[0];
                setConfiguratorProducts(prev => ({
                    ...prev,
                    [stepId]: [...(prev[stepId] || []), newProd]
                }));
                logAction('CONFIGURATOR', `Produs nou: ${newProd.name}`);
            }
        } catch (error) {
            console.error("Error adding config product:", error);
            alert("Eroare: " + error.message);
        }
    };

    const updateConfigProduct = async (stepId, productId, updatedData) => {
        if (!supabase) return;
        try {
            // Whitelist cleaning for safety
            const allowedCols = ['step_id', 'name', 'price', 'image', 'description', 'full_description', 'is_active'];
            const safePayload = {};

            // Map legacy keys if present
            if (updatedData.title && !updatedData.name) safePayload.name = updatedData.title;
            if (updatedData.desc && !updatedData.description) safePayload.description = updatedData.desc;
            if (updatedData.fullDesc && !updatedData.full_description) safePayload.full_description = updatedData.fullDesc;

            // Copy explicit allowed keys
            Object.keys(updatedData).forEach(key => {
                if (allowedCols.includes(key)) safePayload[key] = updatedData[key];
            });

            // Ensure mapped keys are also kept if they match allowedCols (they do)
            if (safePayload.name === undefined && updatedData.title) safePayload.name = updatedData.title;
            if (safePayload.description === undefined && updatedData.desc) safePayload.description = updatedData.desc;
            if (safePayload.full_description === undefined && updatedData.fullDesc) safePayload.full_description = updatedData.fullDesc;

            const { error } = await supabase.from('configurator_products').update(safePayload).eq('id', productId);
            if (error) throw error;

            setConfiguratorProducts(prev => ({
                ...prev,
                [stepId]: prev[stepId].map(p => p.id === productId ? { ...p, ...updatedData } : p)
            }));
            logAction('CONFIGURATOR', `Actualizare produs #${productId}`);
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
            logAction('CONFIGURATOR', `Ștergere produs #${productId}`);
        } catch (error) {
            console.error("Error deleting config product:", error);
            alert("Eroare: " + error.message);
        }
    };

    // --- Recommendation Logic (Extras) ---
    const fetchRecommendations = async (productId) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('product_recommendations')
                .select(`
                    id,
                    recommended_product_id,
                    products:recommended_product_id (*)
                `)
                .eq('product_id', productId);

            if (error) throw error;
            // Flatten the structure: return the full 'products' object, but keep the relation 'id' if needed
            // Actually, we usually just want the products list.
            return data.map(item => item.products);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            return [];
        }
    };

    const addRecommendation = async (productId, recommendedProductId) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from('product_recommendations')
                .insert([{ product_id: productId, recommended_product_id: recommendedProductId }]);

            if (error) {
                // Ignore unique constraint error (if already added)
                if (error.code === '23505') return;
                throw error;
            }
        } catch (error) {
            console.error("Error adding recommendation:", error);
            alert("Eroare la adăugarea recomandării: " + error.message);
        }
    };

    const removeRecommendation = async (productId, recommendedProductId) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from('product_recommendations')
                .delete()
                .match({ product_id: productId, recommended_product_id: recommendedProductId });

            if (error) throw error;
        } catch (error) {
            console.error("Error removing recommendation:", error);
            alert("Eroare la ștergerea recomandării: " + error.message);
        }
    };

    const fetchDailyMenu = async (dateStr) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('daily_menu_items')
                .select('product_id, stock')
                .eq('date', dateStr);

            if (error) throw error;
            if (!data) return [];
            return data.map(item => ({
                id: item.product_id,
                stock: item.stock
            }));
        } catch (error) {
            console.error("Error fetching daily menu:", error);
            return [];
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
        reorderCategory,
        toggleCategoryVisibility,
        bookedDates,
        toggleBooking,
        configuratorSteps,
        configuratorProducts,
        updateStep,
        addConfigProduct,
        updateConfigProduct,
        deleteConfigProduct,
        fetchRecommendations,
        addRecommendation,
        removeRecommendation,
        // Extras
        fetchExtras: async (productId) => {
            if (!supabase) return [];
            try {
                const { data, error } = await supabase
                    .from('product_extras')
                    .select(`
                        id,
                        extra_product_id,
                        products:extra_product_id (*)
                    `)
                    .eq('parent_product_id', productId);

                if (error) throw error;
                // Safely map even if products is null (though unlikely with inner join)
                return data.map(item => item.products).filter(Boolean);
            } catch (error) {
                console.error("Error fetching extras:", error);
                return [];
            }
        },
        addExtra: async (productId, extraProductId) => {
            if (!supabase) return;
            try {
                const { error } = await supabase
                    .from('product_extras')
                    .insert([{ parent_product_id: productId, extra_product_id: extraProductId }]);
                if (error && error.code !== '23505') throw error;
            } catch (error) {
                console.error("Error adding extra:", error);
                alert("Eroare la adăugarea extra: " + error.message);
            }
        },
        removeExtra: async (productId, extraProductId) => {
            if (!supabase) return;
            try {
                const { error } = await supabase
                    .from('product_extras')
                    .delete()
                    .match({ parent_product_id: productId, extra_product_id: extraProductId });
                if (error) throw error;
            } catch (error) {
                console.error("Error removing extra:", error);
                alert("Eroare la ștergerea extra: " + error.message);
            }
        },
        fetchDailyMenu
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};
