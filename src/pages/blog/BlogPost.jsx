import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '../../context/BlogContext';
import { ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import SEO from '../../components/SEO';
import './Blog.css';

const BlogPost = () => {
    const { id } = useParams();
    const { getPostById } = useBlog();
    const navigate = useNavigate();
    const post = getPostById(id);

    const getEmbedUrl = (url) => {
        if (!url) return '';

        // YouTube
        const ytId = url.split('v=')[1] ? url.split('v=')[1].split('&')[0] : null;
        if (ytId) return `https://www.youtube.com/embed/${ytId}`;

        if (url.includes('youtu.be/')) {
            const shortId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${shortId}`;
        }

        // Vimeo
        if (url.includes('vimeo.com/')) {
            const vimeoId = url.split('vimeo.com/')[1].split('/')[0];
            return `https://player.vimeo.com/video/${vimeoId}`;
        }

        return url;
    };

    useEffect(() => {
        if (!post) {
            navigate('/blog');
        }
        window.scrollTo(0, 0);
    }, [id, post, navigate]);

    if (!post) return null;

    return (
        <div className="blog-post-page">
            <SEO
                title={post.title}
                description={post.excerpt}
                canonical={`/blog/${id}`}
            />
            <div className="post-hero" style={{ backgroundImage: `url(${post.image})` }}>
                <div className="post-hero-overlay">
                    <div className="container">
                        <h1>{post.title}</h1>
                    </div>
                </div>
            </div>

            <div className="container post-container">
                <Link to="/blog" className="back-link">
                    <ArrowLeft size={16} /> Înapoi la articole
                </Link>

                {post.video_url && (
                    <div className="video-container" style={{ marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <iframe
                            width="100%"
                            height="450"
                            src={getEmbedUrl(post.video_url)}
                            title="Video Player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                <div className="post-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            </div>
        </div>
    );
};

export default BlogPost;
