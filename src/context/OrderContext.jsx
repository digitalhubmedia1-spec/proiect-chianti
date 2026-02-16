import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/adminLogger';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);

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

    useEffect(() => {
        if (!supabase) return;

        // 1. Initial Fetch
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

        // 2. Realtime Subscription
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setOrders(prev => [mapOrderFromDB(payload.new), ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setOrders(prev => prev.map(o => o.id === payload.new.id ? mapOrderFromDB(payload.new) : o));
                } else if (payload.eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        logAction('STATUS COMANDĂ', `Comanda #${orderId} -> ${newStatus}`);
    };

    const deleteOrder = async (orderId) => {
        if (!supabase) return;
        if (window.confirm('Ești sigur că vrei să ștergi această comandă? (Arhivare)')) {
            await supabase.from('orders').update({ archived: true }).eq('id', orderId);
            logAction('ȘTERGERE COMANDĂ', `Comanda #${orderId} arhivată`);
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
