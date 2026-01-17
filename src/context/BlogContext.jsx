import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logAction } from '../utils/adminLogger';

const BlogContext = createContext();

export const useBlog = () => useContext(BlogContext);

export const BlogProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const addPost = async (newPost) => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase.from('blog_posts').insert([newPost]).select();
            if (error) throw error;
            if (data) {
                setPosts(prev => [data[0], ...prev]);
                logAction('BLOG', `Articol nou: ${newPost.title}`);
            }
        } catch (error) {
            console.error("Error adding post:", error);
            alert("Eroare la adăugarea articolului: " + error.message);
        }
    };

    const updatePost = async (id, updatedPost) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('blog_posts').update(updatedPost).eq('id', id);
            if (error) throw error;
            setPosts(prev => prev.map(post => post.id === id ? { ...post, ...updatedPost } : post));
            logAction('BLOG', `Actualizare articol: ${updatedPost.title || '#' + id}`);
        } catch (error) {
            console.error("Error updating post:", error);
            alert("Eroare la actualizarea articolului: " + error.message);
        }
    };

    const deletePost = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest articol?')) return;
        if (!supabase) return;
        try {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) throw error;
            setPosts(prev => prev.filter(post => post.id !== id));
            logAction('BLOG', `Ștergere articol #${id}`);
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Eroare la ștergerea articolului: " + error.message);
        }
    };

    const getPostById = (id) => posts.find(p => p.id === id || p.id === parseInt(id));

    return (
        <BlogContext.Provider value={{ posts, loading, getPostById, addPost, updatePost, deletePost }}>
            {children}
        </BlogContext.Provider>
    );
};
