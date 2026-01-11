import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        if (!supabase) return false;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert("Autentificare eșuată: " + error.message);
            return false;
        }
        return true;
    };

    const register = async (name, email, password, phone) => {
        if (!supabase) return false;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone // standardized meta data
                }
            }
        });

        if (error) {
            alert("Înregistrare eșuată: " + error.message);
            return false;
        }
        alert("Cont creat cu succes! Verifică email-ul pentru confirmare (dacă este activată) sau autentifică-te.");
        return true;
    };

    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        localStorage.removeItem('driver_token');
    };

    // --- Driver Logic (Table: 'driver_applications') ---
    const submitDriverApplication = async (appData) => {
        if (!supabase) return null;
        const { data, error } = await supabase.from('driver_applications').insert([{
            name: `${appData.nume} ${appData.prenume}`,
            phone: appData.telefon,
            email: appData.email,
            experience: appData.experienta,
            vehicle: appData.vehicul,
            status: 'pending'
        }]).select();

        if (error) {
            console.error("Error submitting application:", error);
            alert("Eroare: " + error.message);
        }
        return data ? data[0] : null;
    };

    const getDriverApplications = async () => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('driver_applications').select('*');
        if (error) console.error(error);
        return data || [];
    };

    const approveDriverApplication = async (appId) => {
        if (!supabase) return false;

        // 1. Update status
        const { error: updateError } = await supabase
            .from('driver_applications')
            .update({ status: 'approved' })
            .eq('id', appId);

        if (updateError) {
            console.error("Error approving application:", updateError);
            alert("Eroare la aprobare: " + updateError.message);
            return false;
        }

        // 2. Create Driver (in 'drivers' table) to allow login
        const { data: appData, error: fetchError } = await supabase
            .from('driver_applications')
            .select('*')
            .eq('id', appId)
            .single();

        if (fetchError || !appData) {
            console.error("Error fetching app data:", fetchError);
            return false; // update succeeded but fetch failed? odd state.
        }

        if (appData) {
            // Check if already exists to avoid duplicates
            const { data: existing } = await supabase.from('drivers').select('*').eq('email', appData.email).single();
            if (!existing) {
                const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!@#";
                const { error: insertError } = await supabase.from('drivers').insert([{
                    name: appData.name,
                    email: appData.email,
                    phone: appData.phone,
                    status: 'active',
                    password: generatedPassword
                }]);

                if (insertError) {
                    console.error("Error creating driver profile:", insertError);
                    alert("Aplicația a fost aprobată, dar contul de livrator nu a putut fi creat: " + insertError.message);
                } else {
                    alert(`Livrator aprobat! Parola generată este: ${generatedPassword}. Salveaz-o și trimite-o livratorului.`);
                }
            }
        }
        return true;
    };

    const rejectDriverApplication = async (appId) => {
        if (!supabase) return false;
        await supabase.from('driver_applications').update({ status: 'rejected' }).eq('id', appId);
        return true;
    };

    const deleteDriverApplication = async (appId) => {
        if (!supabase) return false;

        // 1. Get email to delete associated driver account if exists
        const { data: appData } = await supabase.from('driver_applications').select('email').eq('id', appId).single();

        if (appData && appData.email) {
            // Delete from drivers table
            await supabase.from('drivers').delete().eq('email', appData.email);
        }

        // 2. Delete application
        const { error } = await supabase.from('driver_applications').delete().eq('id', appId);

        if (error) {
            console.error("Error deleting application:", error);
            return false;
        }
        return true;
    };

    // --- Driver Auth (Table: 'drivers') ---
    const getDrivers = async () => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('drivers').select('*');
        if (error) console.error(error);
        return data || [];
    };

    const driverLogin = async (email, password) => {
        if (!supabase) return null;
        // Specialized simple login for drivers accessing the dashboard
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (data) {
            localStorage.setItem('driver_token', JSON.stringify(data));
            return data;
        }
        return null;
    };

    const getDriverProfile = () => {
        // Keep using localStorage for driver session persistence in this simple flow
        const token = localStorage.getItem('driver_token');
        return token ? JSON.parse(token) : null;
    };

    return (
        <AuthContext.Provider value={{
            user, login, register, logout, loading,
            submitDriverApplication, getDriverApplications, approveDriverApplication, rejectDriverApplication, deleteDriverApplication,
            getDrivers, driverLogin, getDriverProfile
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
