import React, { useState } from 'react';
import { useBlog } from '../../../context/BlogContext';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { compressImage } from '../../../utils/imageUtils';

const AdminBlog = () => {
    const { posts, addPost, updatePost, deletePost } = useBlog();
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);

    const emptyPost = {
        title: '',
        image: '',
        excerpt: '',
        content: '',
        video_url: ''
    };

    const handleEdit = (post) => {
        setCurrentPost(post);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentPost(emptyPost);
        setIsEditing(true);
    };

    const handleDelete = (id) => {
        deletePost(id);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (currentPost.id) {
            updatePost(currentPost.id, currentPost);
        } else {
            addPost(currentPost);
        }
        setIsEditing(false);
        setCurrentPost(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 800, 0.6);
                setCurrentPost(prev => ({ ...prev, image: compressedBase64 }));
            } catch (error) {
                console.error("Error compressing image:", error);
                alert("A apărut o eroare la procesarea imaginii.");
            }
        }
    };

    if (isEditing) {
        return (
            <div className="admin-blog-editor">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>{currentPost.id ? 'Editare Articol' : 'Adăugare Articol Nou'}</h3>
                    <button onClick={() => setIsEditing(false)} className="btn btn-outline-dark" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <X size={18} /> Anulează
                    </button>
                </div>

                <form onSubmit={handleSave} style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="form-group">
                        <label>Titlu</label>
                        <input
                            type="text"
                            className="form-control"
                            value={currentPost.title}
                            onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Imagine (URL sau Upload)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={handleImageUpload}
                                style={{ width: 'auto' }}
                            />
                        </div>
                        <input
                            type="text"
                            className="form-control"
                            value={currentPost.image}
                            onChange={e => setCurrentPost({ ...currentPost, image: e.target.value })}
                            required
                        />
                    </div>
                    {currentPost.image && (
                        <div style={{ marginBottom: '1rem' }}>
                            <img src={currentPost.image} alt="Preview" style={{ height: '100px', borderRadius: '4px' }} />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Video URL (YouTube / Vimeo - Opțional)</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={currentPost.video_url || ''}
                            onChange={e => setCurrentPost({ ...currentPost, video_url: e.target.value })}
                        />
                        <small className="text-muted">Adaugă un link video pentru a fi afișat în articol.</small>
                    </div>
                    <div className="form-group">
                        <label>Rezumat (pentru lista de articole)</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={currentPost.excerpt}
                            onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Conținut (HTML acceptat - p, h3, ul, li tags)</label>
                        <textarea
                            className="form-control"
                            rows="10"
                            value={currentPost.content}
                            onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                            required
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Save size={18} /> Salvează Articolul
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-blog-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Gestionare Blog ({posts.length} articole)</h3>
                <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={18} /> Adaugă Articol
                </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', width: '80px' }}>Img</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Titlu</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Rezumat</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(post => (
                            <tr key={post.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>
                                    <img src={post.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{post.title}</td>
                                <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem', maxWidth: '300px' }}>
                                    {post.excerpt.substring(0, 60)}...
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="btn btn-sm btn-outline-dark"
                                            title="Editează"
                                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="btn btn-sm btn-danger"
                                            title="Șterge"
                                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #dc3545', background: '#dc3545', color: 'white', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBlog;
