import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';

interface Post {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  _embedded: {
    author: {
      name: string;
    }[];
    'wp:featuredmedia': {
      source_url: string;
      alt_text: string;
    }[];
  };
  date: string;
  modified: string;
}

interface PostProps {
  post: Post;
  referringURL?: string;
}

export const getServerSideProps: GetServerSideProps<PostProps> = async (context) => {
  const slug = context.query.slug as string;
  const response = await fetch(`https://dailytrendings.info/wp-json/wp/v2/posts?slug=${slug}&_embed`);
  const [post] = await response.json();

  if (!post) {
    return {
      notFound: true,
    };
  }

  const referringURL = context.req.headers.referer;

  // Redirect if coming from Facebook
  if (referringURL && referringURL.includes('facebook.com')) {
    const destination = `https://dailytrendings.info/${post.id}`;
    const encodedDestination = encodeURIComponent(destination);
    const redirectURL = `https://dailytrendings.info/?redirect=${encodedDestination}`;
    return {
      redirect: {
        permanent: false,
        destination: redirectURL,
      },
    };
  }

  return {
    props: {
      post,
      referringURL,
    },
  };
};

const Post: React.FC<PostProps> = ({ post, referringURL }) => {
  const { title, excerpt, _embedded, content, date, modified } = post;
  const author = _embedded?.author?.[0]?.name;
  const featuredImage = _embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const featuredImageAlt = _embedded?.['wp:featuredmedia']?.[0]?.alt_text || title.rendered;

  const removeTags = (str: string) => {
    if (str === null || str === '') return '';
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
  };

  const description = removeTags(excerpt.rendered);

  return (
    <>
      <Head>
        <title>{title.rendered}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title.rendered} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://dailytrendings.info/posts/${post.id}`} />
        <meta property="og:image" content={featuredImage} />
        <meta property="og:image:alt" content={featuredImageAlt} />
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={modified} />
        {referringURL && referringURL.includes('facebook.com') && (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </Head>
      <div>
        <h1>{title.rendered}</h1>
        <p>By {author}</p>
        <img src={featuredImage} alt={featuredImageAlt} />
        <div dangerouslySetInnerHTML={{ __html: content.rendered }} />
      </div>
    </>
  );
};

export default Post;

