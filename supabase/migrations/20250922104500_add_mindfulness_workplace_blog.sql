-- Insert the mindfulness workplace blog post
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  read_time,
  image_url,
  approval_status,
  user_id,
  created_at,
  updated_at
) VALUES (
  'Mindfulness in the Workplace: Why Companies Are Investing in Employee Wellbeing',
  'mindfulness-workplace-corporate-wellness',
  'Discover how forward-thinking companies are transforming their workplace culture and boosting productivity through mindfulness programs, and learn how Mindful Family can help implement effective corporate wellness solutions.',
  (SELECT content FROM storage.objects WHERE name = 'mindfulness-workplace.md'),
  'corporate_wellness',
  '5 min read',
  'https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/corporate-wellness-mindfulness.jpg',
  'approved',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NOW(),
  NOW()
);




