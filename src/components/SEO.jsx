import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, canonical }) => {
    return (
        <Helmet>
            <title>{title} | Restaurant Chianti Roman</title>
            <meta name="description" content={description} />
            {canonical && <link rel="canonical" href={`https://chianti.ro${canonical}`} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={`${title} | Restaurant Chianti Roman`} />
            <meta property="og:description" content={description} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${title} | Restaurant Chianti Roman`} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
};

export default SEO;
