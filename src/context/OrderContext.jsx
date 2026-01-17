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
        isCatering: dbOrder.is_catering
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
            archived: false
        };

        const { error } = await supabase.from('orders').insert([newOrder]);
        if (error) {
            console.error("Error creating order:", error);
            alert("Eroare la plasarea comenzii: " + error.message);
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

    return (
        <OrderContext.Provider value={{
            orders,
            addOrder,
            updateOrderStatus,
            deleteOrder,
            getOrdersByStatus,
            assignDriverToOrder,
            getDriverOrders,
            updateDriverStatus
        }}>
            {children}
        </OrderContext.Provider>
    );
};
