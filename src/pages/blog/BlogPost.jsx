import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '../../context/BlogContext';
import { ArrowLeft } from 'lucide-react';
import './Blog.css';

const BlogPost = () => {
    const { id } = useParams();
    const { getPostById } = useBlog();
    const navigate = useNavigate();
    const post = getPostById(id);

    useEffect(() => {
        if (!post) {
            navigate('/blog');
        }
        window.scrollTo(0, 0);
    }, [id, post, navigate]);

    if (!post) return null;

    return (
        <div className="blog-post-page">
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

                <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        </div>
    );
};

export default BlogPost;
