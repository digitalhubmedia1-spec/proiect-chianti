import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/adminLogger';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [pendingUpdates, setPendingUpdates] = useState(new Set());
    const pendingUpdatesRef = useRef(new Set());
    const ordersRef = useRef([]);

    // Sync refs with state to avoid stale closures in realtime events and async functions
    useEffect(() => {
        pendingUpdatesRef.current = pendingUpdates;
    }, [pendingUpdates]);

    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    // Helper to normalize DB snake_case to Frontend camelCase
    const mapOrderFromDB = (dbOrder) => ({
        ...dbOrder,
        customer: dbOrder.customer_data || dbOrder.customer, // Fallback if mixed
        finalTotal: dbOrder.final_total,
        deliveryCost: dbOrder.delivery_cost,
        assignedDriverId: dbOrder.assigned_driver_id,
        driverStatus: dbOrder.driver_status,
        isCatering: dbOrder.is_catering,
        orderNumber: dbOrder.order_number,
        userId: dbOrder.user_id
    });

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/ding-bell-right-answer.mp3');
            audio.volume = 1.0;
            audio.play().catch(err => console.error("Audio play failed:", err));
        } catch (err) {
            console.error("Audio creation failed:", err);
        }
    };

    useEffect(() => {
        if (!supabase) return;

        // 1. Initial Fetch (Only on mount)
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setOrders(data.map(mapOrderFromDB));
            }
        };

        fetchOrders();
    }, [supabase]); // Run once when supabase is available

    useEffect(() => {
        if (!supabase) return;

        // 2. Realtime Subscription (Only on mount)
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                // Check if we are specifically in the Admin Orders, Kanban or Kitchen section
                const currentTab = localStorage.getItem('adminActiveTab');
                const isNotificationSection = window.location.pathname.includes('/admin/orders') || 
                                             window.location.pathname.includes('/admin/kanban') ||
                                             window.location.pathname.includes('/admin/bucatarie') ||
                                             currentTab === 'orders' || 
                                             currentTab === 'kitchen' ||
                                             currentTab === 'kitchen_monitor'; // Added for kitchen monitor view if applicable
                
                // For Chef role, we should always allow sound if in kitchen or orders
                const role = (localStorage.getItem('admin_role') || '').toLowerCase().trim();
                const isChef = role === 'chef' || role === 'bucatar' || role === 'bucătar';
                
                const shouldPlaySound = isNotificationSection || (isChef && (currentTab === 'kitchen' || currentTab === 'orders'));
                
                if (payload.eventType === 'INSERT') {
                    const newOrder = mapOrderFromDB(payload.new);
                    setOrders(prev => {
                        if (prev.some(o => o.id === newOrder.id)) return prev;
                        
                        // Sound for new orders: 
                        // 1. 'pending' (from web, needs confirmation)
                        // 2. 'preparing' (from waiter/POS, direct to kitchen)
                        if (shouldPlaySound && (newOrder.status === 'pending' || newOrder.status === 'preparing')) {
                            playNotificationSound();
                        }
                        return [newOrder, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const updatedOrder = mapOrderFromDB(payload.new);
                    
                    setOrders(prev => {
                        // Check if this specific order is currently being updated by the client
                        // Use ref to avoid stale closure from the mount useEffect
                        if (pendingUpdatesRef.current.has(updatedOrder.id)) {
                            return prev;
                        }

                        const oldOrder = prev.find(o => o.id === updatedOrder.id);
                        
                        // Sound logic: 
                        // Trigger sound when confirmed (status moves from pending to preparing)
                        if (shouldPlaySound && oldOrder && oldOrder.status === 'pending' && updatedOrder.status === 'preparing') {
                            playNotificationSound();
                        }
                        return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                    });
                } else if (payload.eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]); // Only re-subscribe if supabase instance changes, not on order changes

    const addOrder = async (orderData) => {
        if (!supabase) return 'LOCAL_ID_' + Date.now(); // Fallback for no-db mode? Or fail.

        const newOrder = {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            status: 'pending',
            customer_data: orderData.customer,
            items: orderData.items,
            final_total: orderData.finalTotal,
            total: orderData.finalTotal, // Store in both generic total and specific final
            delivery_cost: orderData.deliveryCost || 0,
            is_catering: orderData.isCatering || false,
            archived: false,
            user_id: orderData.userId || null
        };

        const { error } = await supabase.from('orders').insert([newOrder]);
        if (error) {
            console.error("Error creating order:", error);
            alert("Eroare la plasarea comenzii: " + error.message);
            return null;
        }

        // --- CATERING STOCK DEDUCTION ---
        if (newOrder.is_catering && newOrder.items && newOrder.items.length > 0) {
            try {
                // 1. Identify Product IDs
                const productIds = newOrder.items.map(i => i.id);

                // 2. Fetch Recipes (Header -> Ingredients)
                // Get defined_recipes headers linked to these products
                const { data: headers } = await supabase
                    .from('defined_recipes')
                    .select('id, linked_product_id')
                    .in('linked_product_id', productIds);

                if (headers && headers.length > 0) {
                    const recipeIds = headers.map(h => h.id);
                    const prodToRecipe = {};
                    headers.forEach(h => prodToRecipe[h.linked_product_id] = h.id);

                    // Get Ingredients
                    const { data: ingredients } = await supabase
                        .from('recipes')
                        .select('recipe_id, ingredient_id, quantity_required')
                        .in('recipe_id', recipeIds);

                    if (ingredients) {
                        const transactions = [];

                        newOrder.items.forEach(item => {
                            const recipeId = prodToRecipe[item.id];
                            if (recipeId) {
                                const itemIngredients = ingredients.filter(ing => ing.recipe_id === recipeId);
                                itemIngredients.forEach(ing => {
                                    transactions.push({
                                        transaction_type: 'OUT',
                                        item_id: ing.ingredient_id,
                                        quantity: ing.quantity_required * item.quantity,
                                        reason: `Comanda Catering #${newOrder.id} - ${item.name}`,
                                        created_at: new Date().toISOString()
                                    });
                                });
                            }
                        });

                        if (transactions.length > 0) {
                            const { error: stockErr } = await supabase.from('inventory_transactions').insert(transactions);
                            if (stockErr) console.error("Catering stock deduction failed:", stockErr);
                            else logAction('STOC_AUTO', `Scăzut stoc pentru comanda catering #${newOrder.id}`);
                        }
                    }
                }
            } catch (err) {
                console.error("Auto-deduction error:", err);
            }
        }

        return newOrder.id;
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (!supabase) return;

        // 1. Add to pending updates (UI lock)
        setPendingUpdates(prev => {
            const next = new Set(prev).add(orderId);
            pendingUpdatesRef.current = next; // Update ref immediately!
            return next;
        });

        // 2. Optimistic Update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            
            // Release the UI lock after a short delay to let realtime catch up
            setTimeout(() => {
                setPendingUpdates(prev => {
                    const next = new Set(prev);
                    next.delete(orderId);
                    return next;
                });
            }, 1000);

            if (error) {
                console.error("Error updating order status:", error);
            } else {
                logAction('STATUS COMANDĂ', `Comanda #${orderId} -> ${newStatus}`);
            }
        } catch (err) {
            console.error("Update failed:", err);
            // Emergency cleanup
            setPendingUpdates(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    const deleteOrder = async (orderId) => {
        if (!supabase) return;
        if (window.confirm('Ești sigur că vrei să ștergi această comandă? (Arhivare)')) {
            await supabase.from('orders').update({ archived: true }).eq('id', orderId);
            logAction('ȘTERGERE COMANDĂ', `Comanda #${orderId} arhivată`);
        }
    };

    const updateOrderItems = async (orderId, updatedItems) => {
        if (!supabase) return;
        
        console.log(`[updateOrderItems] Start update for Order #${orderId}`, updatedItems);

        // Find current order from ref to avoid stale closure or async issues
        const currentOrder = ordersRef.current.find(o => o.id === orderId);
        if (!currentOrder) {
            console.error(`[updateOrderItems] Order #${orderId} not found in state!`);
            return;
        }

        // Recalculate total based on updated items
        const itemsTotal = updatedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const deliveryCost = Number(currentOrder.deliveryCost) || 0;
        const newTotal = Number((itemsTotal + deliveryCost).toFixed(2));

        console.log(`[updateOrderItems] New total calculated: ${newTotal} (items: ${itemsTotal}, delivery: ${deliveryCost})`);

        // 1. Add to pending updates (UI lock)
        setPendingUpdates(prev => {
            const next = new Set(prev).add(orderId);
            pendingUpdatesRef.current = next;
            return next;
        });

        // 2. Optimistic Update
        setOrders(prev => {
            const next = prev.map(o => o.id === orderId ? { 
                ...o, 
                items: updatedItems, 
                finalTotal: newTotal, 
                total: newTotal,
                final_total: newTotal // Keep snake_case in state too for consistency if needed
            } : o);
            ordersRef.current = next; // Update ref immediately!
            return next;
        });

        try {
            const updatePayload = { 
                items: updatedItems, 
                final_total: newTotal,
                total: newTotal
            };
            
            console.log(`[updateOrderItems] Sending update to Supabase for #${orderId}`, updatePayload);

            const { data, error } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', orderId)
                .select(); // Select back to confirm what was updated
            
            if (error) {
                console.error("[updateOrderItems] Supabase Error:", error);
                alert(`Eroare la actualizarea bazei de date: ${error.message} (${error.code})`);
                // Revert state if needed? For now let's hope it's rare.
            } else if (data && data.length > 0) {
                console.log("[updateOrderItems] Supabase Success! Updated row:", data[0]);
                logAction('MODIFICARE PRODUSE COMANDĂ', `Comanda #${orderId} - ${updatedItems.length} produse actualizate. Nou total: ${newTotal.toFixed(2)} Lei`);
            } else {
                console.warn("[updateOrderItems] No row was updated! Check if the ID exists.");
                alert("Nu s-a putut actualiza comanda în baza de date. Verifică dacă ID-ul este corect.");
            }
        } catch (err) {
            console.error("[updateOrderItems] Unexpected error:", err);
            alert("A apărut o eroare neașteptată la actualizarea produselor.");
        } finally {
            // Release the UI lock after a short delay to let realtime catch up
            setTimeout(() => {
                setPendingUpdates(prev => {
                    const next = new Set(prev);
                    next.delete(orderId);
                    pendingUpdatesRef.current = next; // Update ref immediately!
                    return next;
                });
            }, 2000); // Increased delay slightly
        }
    };

    const getOrdersByStatus = (status) => {
        return orders.filter(order => order.status === status && !order.archived);
    };

    const assignDriverToOrder = async (orderId, driverId) => {
        if (!supabase) return;
        await supabase.from('orders').update({
            assigned_driver_id: driverId,
            driver_status: 'assigned'
        }).eq('id', orderId);
        logAction('ASIGNARE LIVRATOR', `Livrator #${driverId} -> Comanda #${orderId}`);
    };

    const getDriverOrders = (driverId) => {
        // Use loose equality to match "123" (string from DB order) with 123 (number from auth profile)
        return orders.filter(order => order.assignedDriverId == driverId && !order.archived);
    };

    const updateDriverStatus = async (orderId, status) => {
        if (!supabase) return;
        const updatePayload = { driver_status: status };
        // Optional: Auto-complete logic can be handled here or by explicit action
        await supabase.from('orders').update(updatePayload).eq('id', orderId);
    };

    const getActiveOrders = () => {
        // Today at 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.filter(order => {
            if (order.archived) return false;

            // Always show pending orders (regardless of date)
            if (order.status === 'pending') return true;

            // For other statuses, check if created today
            const orderDate = new Date(order.created_at);
            return orderDate >= today;
        });
    };

    const getHistoryOrders = () => {
        // Today at 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.filter(order => {
            if (order.archived) return true; // Archived always history? Or just separate tab? User said "Historic Orders".

            // If it's pending, it's ACTIVE, not history (unless archived)
            if (order.status === 'pending') return false;

            // If created before today, it's history
            const orderDate = new Date(order.created_at);
            return orderDate < today;
        });
    };

    return (
        <OrderContext.Provider value={{
            orders,
            addOrder,
            updateOrderStatus,
            deleteOrder,
            updateOrderItems,
            getActiveOrders,
            getHistoryOrders,
            getOrdersByStatus,
            assignDriverToOrder,
            getDriverOrders,
            updateDriverStatus
        }}>
            {children}
        </OrderContext.Provider>
    );
};
