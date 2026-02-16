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

    const approveDriverApplication = async (appOrId) => {
        if (!supabase) return false;

        const appId = typeof appOrId === 'object' ? appOrId.id : appOrId;
        const appDataInput = typeof appOrId === 'object' ? appOrId : null;

        // alert(`Debug: Încerc aprobare pentru ID: ${appId}`);

        // 1. Try to Update status of existing DB row
        let { data: updatedData, error: updateError } = await supabase
            .from('driver_applications')
            .update({ status: 'approved' })
            .eq('id', appId)
            .select();

        let appData = null;

        if (updateError) {
            console.error("Error approving application (update):", updateError);
            alert("Eroare la aprobare (SQL): " + updateError.message);
            return false;
        }

        if (updatedData && updatedData.length > 0) {
            appData = updatedData[0];
        } else {
            // Row not found in DB. If we have the source data (legacy local app), MIGRATE IT.
            if (appDataInput) {
                console.log("Legacy application found. Migrating to database...");
                // Insert new row
                const { data: insertedData, error: insertError } = await supabase
                    .from('driver_applications')
                    .insert([{
                        name: `${appDataInput.nume} ${appDataInput.prenume}`,
                        phone: appDataInput.telefon,
                        email: appDataInput.email,
                        experience: appDataInput.experienta || '',
                        vehicle: appDataInput.vehicul || '',
                        status: 'approved',
                        created_at: new Date(appDataInput.date || Date.now()).toISOString()
                    }])
                    .select();

                if (insertError) {
                    console.error("Error migrating legacy app:", insertError);
                    alert("Eroare la migrarea aplicației locale: " + insertError.message);
                    return false;
                }
                appData = insertedData[0];
            } else {
                alert("Eroare: Aplicația nu a fost găsită în baza de date și nu există date locale pentru migrare.");
                return false;
            }
        }

        // 2. Create Driver (in 'drivers' table) to allow login
        if (appData) {
            // Check if already exists to avoid duplicates
            const { data: existing } = await supabase.from('drivers').select('*').eq('email', appData.email).single();
            if (!existing) {
                const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!@#";
                const { error: insertError } = await supabase.from('drivers').insert([{
                    name: appData.name, // drivers table uses 'name'
                    email: appData.email,
                    phone: appData.phone,
                    status: 'active',
                    password: generatedPassword
                }]);

                if (insertError) {
                    console.error("Error creating driver profile:", insertError);
                    alert("Aplicația a fost aprobată/migrată, dar contul de livrator nu a putut fi creat: " + insertError.message);
                } else {
                    alert(`Livrator aprobat și migrat în baza de date! Parola generată este: ${generatedPassword}.`);
                }
            } else {
                // Already exists as driver, just ensure app is approved (done above)
                // Maybe show password of existing? No, security.
                alert("Această aplicație a fost aprobată. Livratorul există deja în sistem.");
            }
        }
        return true;
    };

    const rejectDriverApplication = async (appOrId) => {
        if (!supabase) return false;

        const appId = typeof appOrId === 'object' ? appOrId.id : appOrId;
        const appDataInput = typeof appOrId === 'object' ? appOrId : null;

        // 1. Try Update status
        const { data: updatedData, error: updateError } = await supabase
            .from('driver_applications')
            .update({ status: 'rejected' })
            .eq('id', appId)
            .select();

        if (updateError) {
            console.error("Error rejecting application:", updateError);
            alert("Eroare la respingere: " + updateError.message);
            return false;
        }

        // 2. If valid update, we are done
        if (updatedData && updatedData.length > 0) {
            return true;
        }

        // 3. If not found, try Migration (for legacy local apps)
        if (appDataInput) {
            console.log("Legacy application found. Migrating as REJECTED...");
            const { error: insertError } = await supabase
                .from('driver_applications')
                .insert([{
                    name: `${appDataInput.nume} ${appDataInput.prenume}`,
                    phone: appDataInput.telefon,
                    email: appDataInput.email,
                    experience: appDataInput.experienta || '',
                    vehicle: appDataInput.vehicul || '',
                    status: 'rejected',
                    created_at: new Date(appDataInput.date || Date.now()).toISOString()
                }]);

            if (insertError) {
                console.error("Error migrating rejection:", insertError);
                alert("Eroare la migrare (respingere): " + insertError.message);
                return false;
            }
            return true;
        }

        alert("Eroare: Aplicația nu a putut fi găsită pentru a fi respinsă.");
        return false;
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
        // Secure RPC Login to avoid public read access to 'drivers' table
        const { data, error } = await supabase.rpc('login_driver', {
            p_email: email,
            p_password: password
        });

        if (error) {
            console.error("Driver login error:", error);
            return null;
        }

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
