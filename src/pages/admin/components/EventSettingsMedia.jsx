import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Upload, Trash2, Image, Video, Eye, EyeOff, Settings } from 'lucide-react';

const EventSettingsMedia = ({ eventId, event, onUpdateEvent }) => {
    const [uploading, setUploading] = useState(false);
    const [gallery, setGallery] = useState([]);

    useEffect(() => {
        fetchGallery();
    }, [eventId]);

    const fetchGallery = async () => {
        const { data } = await supabase.from('event_gallery').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
        setGallery(data || []);
    };

    const handleToggleHallPlan = async () => {
        const newValue = !event.show_hall_plan;
        const { error } = await supabase.from('events').update({ show_hall_plan: newValue }).eq('id', eventId);
        if (error) alert('Eroare: ' + error.message);
        else onUpdateEvent({ ...event, show_hall_plan: newValue });
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            for (const file of files) {
                const type = file.type.startsWith('video/') ? 'video' : 'image';
                const ext = file.name.split('.').pop();
                const path = `gallery/${eventId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
                
                const { error: uploadErr } = await supabase.storage.from('event-documents').upload(path, file);
                if (uploadErr) throw uploadErr;

                const { data: urlData } = supabase.storage.from('event-documents').getPublicUrl(path);
                
                await supabase.from('event_gallery').insert({
                    event_id: eventId,
                    url: urlData.publicUrl,
                    type: type,
                    name: file.name
                });
            }
            fetchGallery();
        } catch (err) {
            console.error(err);
            alert('Eroare upload: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sigur ștergi acest fișier?')) return;
        await supabase.from('event_gallery').delete().eq('id', id);
        fetchGallery();
    };

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} /> Setări Pagina Publică
            </h3>

            {/* Hall Plan Toggle */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Planul Sălii</h4>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        Dacă este activat, clienții vor putea alege masa pe hartă. <br/>
                        Dacă este dezactivat, se va afișa un formular simplu pentru rezervare.
                    </p>
                </div>
                <button 
                    onClick={handleToggleHallPlan}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                        background: event.show_hall_plan !== false ? '#111827' : '#e5e7eb', // Default true if undefined
                        color: event.show_hall_plan !== false ? 'white' : '#374151',
                        cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s'
                    }}
                >
                    {event.show_hall_plan !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                    {event.show_hall_plan !== false ? 'Vizibil' : 'Ascuns'}
                </button>
            </div>

            {/* Gallery Upload */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={20} /> Galerie Media (Foto/Video)
            </h3>
            
            <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                    display: 'block', padding: '2rem', border: '2px dashed #d1d5db', borderRadius: '8px', 
                    textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', background: '#f9fafb',
                    transition: 'all 0.2s'
                }}>
                    <input type="file" multiple accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                    <Upload size={32} color="#9ca3af" style={{ marginBottom: '10px' }} />
                    <p style={{ fontWeight: '600', color: '#374151' }}>
                        {uploading ? 'Se încarcă...' : 'Click pentru a încărca imagini sau video'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>JPG, PNG, MP4 (max 50MB)</p>
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {gallery.map(item => (
                    <div key={item.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '16/9', background: '#000' }}>
                        {item.type === 'video' ? (
                            <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls />
                        ) : (
                            <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ 
                                position: 'absolute', top: '8px', right: '8px', 
                                background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', 
                                borderRadius: '50%', width: '32px', height: '32px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                        {item.type === 'video' && <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}><Video size={12} /> Video</div>}
                    </div>
                ))}
                {gallery.length === 0 && <p style={{ color: '#9ca3af', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center' }}>Nu există fișiere media.</p>}
            </div>
        </div>
    );
};

export default EventSettingsMedia;
