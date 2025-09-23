/*
  # Improved Articles System

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, required)
      - `slug` (text, unique, auto-generated)
      - `excerpt` (text, required)
      - `content` (text, required)
      - `category` (text, required)
      - `read_time` (text, required)
      - `featured_image` (text, optional)
      - `tags` (text array, optional)
      - `meta_title` (text, optional)
      - `meta_description` (text, optional)
      - `published` (boolean, default false)
      - `featured` (boolean, default false)
      - `view_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `articles` table
    - Add policies for public read access to published articles
    - Add policies for admin management

  3. Functions
    - Auto-generate slug from title
    - Auto-update timestamps