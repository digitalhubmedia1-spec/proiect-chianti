import React from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../../context/BlogContext';
import { ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';
import './Blog.css';

const BlogList = () => {
    const { posts } = useBlog();

    return (
        <div className="blog-page">
            <SEO title="Blog Culinar - Rețete & Povești Chianti Roman" description="Descoperă secretele bucătăriei italiene, rețete autentice și poveștile din spatele preparatelor noastre." canonical="/blog" />
            <div className="container">
                <div className="blog-header">
                    <h1>Blog & Noutăți</h1>
                    <p>Descoperă povestea din spatele preparatelor noastre</p>
                </div>

                <div className="blog-grid">
                    {posts.map(post => (
                        <div key={post.id} className="blog-card">
                            <div className="blog-image">
                                <img src={post.image} alt={post.title} />
                            </div>
                            <div className="blog-content">
                                <h3>{post.title}</h3>
                                <p>{post.excerpt}</p>
                                <Link to={`/blog/${post.id}`} className="read-more-btn">
                                    Citește mai mult <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogList;
