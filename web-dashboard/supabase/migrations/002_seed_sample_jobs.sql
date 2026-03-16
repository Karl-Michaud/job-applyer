-- ============================================================
-- 002_seed_sample_jobs.sql
-- Sample data for UI development — delete when scraper is live
-- ============================================================

-- Companies
insert into companies (id, name, domain) values
  ('c1000000-0000-0000-0000-000000000001', 'Shopify',  'shopify.com'),
  ('c1000000-0000-0000-0000-000000000002', 'Stripe',   'stripe.com'),
  ('c1000000-0000-0000-0000-000000000003', 'Notion',   'notion.so'),
  ('c1000000-0000-0000-0000-000000000004', 'Figma',    'figma.com'),
  ('c1000000-0000-0000-0000-000000000005', 'Linear',   'linear.app'),
  ('c1000000-0000-0000-0000-000000000006', 'Vercel',   'vercel.com')
on conflict (id) do nothing;

-- Jobs
insert into jobs (
  id, title, source_url, company_id,
  location, location_type, job_type,
  term, duration,
  description_text,
  posted_at, closing_at, deadline_type,
  salary_min, salary_max,
  tags, status
) values

(
  'b1000000-0000-0000-0000-000000000001',
  'Software Engineer Intern',
  'https://greenhouse.io/shopify/swe-intern',
  'c1000000-0000-0000-0000-000000000001',
  'Ottawa, ON', 'hybrid', 'internship',
  'summer-2026', '4 months',
  'Join Shopify''s engineering team for a 4-month summer internship. You''ll work on real production systems used by millions of merchants worldwide.

Responsibilities:
- Build and ship features end-to-end
- Collaborate with senior engineers in code reviews
- Write tests and documentation

Requirements:
- Currently enrolled in a CS or related program
- Experience with Ruby, Go, or TypeScript
- Comfortable with distributed systems concepts',
  '2026-03-10 09:00:00+00',
  '2026-03-18 23:59:00+00',
  'date',
  45, 55,
  array['TypeScript', 'Go', 'Ruby', 'Distributed Systems'],
  'new'
),

(
  'b1000000-0000-0000-0000-000000000002',
  'Backend Engineering Intern',
  'https://jobs.lever.co/stripe/backend-intern',
  'c1000000-0000-0000-0000-000000000002',
  'Toronto, ON', 'onsite', 'internship',
  'summer-2026', '4 months',
  'Stripe is looking for backend engineering interns to work on payments infrastructure.

You''ll be embedded in a product team shipping features that process billions of dollars in transactions.

What you''ll do:
- Design and implement APIs consumed by external developers
- Improve reliability of Stripe''s core payment flows
- Participate in on-call rotations with mentorship

We use Ruby, Java, and Scala on the backend.',
  '2026-03-08 14:00:00+00',
  '2026-03-20 23:59:00+00',
  'date',
  55, 65,
  array['Ruby', 'Java', 'Scala', 'APIs', 'Payments'],
  'new'
),

(
  'b1000000-0000-0000-0000-000000000003',
  'Frontend Developer Co-op',
  'https://jobs.lever.co/notion/frontend-coop',
  'c1000000-0000-0000-0000-000000000003',
  'San Francisco, CA (Remote OK)', 'remote', 'internship',
  'fall-2026', '8 months',
  'Notion is hiring a frontend co-op to help build the next generation of our editor.

You''ll work closely with our design and product teams to ship user-facing features.

Stack: React, TypeScript, CSS-in-JS

Ideal candidate:
- Strong React fundamentals
- Eye for design and UX details
- Passionate about developer tools and productivity software',
  '2026-03-12 10:00:00+00',
  null,
  'rolling',
  40, 50,
  array['React', 'TypeScript', 'CSS', 'Design Systems'],
  'new'
),

(
  'b1000000-0000-0000-0000-000000000004',
  'ML Platform Intern',
  'https://greenhouse.io/figma/ml-platform-intern',
  'c1000000-0000-0000-0000-000000000004',
  'New York, NY', 'hybrid', 'internship',
  'summer-2026', '12 weeks',
  'Figma''s ML Platform team is building infrastructure to power AI features across the product.

As an ML Platform Intern you will:
- Build data pipelines for training and evaluation
- Improve model serving latency and reliability
- Collaborate with ML engineers to productionize research models

Tech: Python, PyTorch, Kubernetes, Spark',
  '2026-03-05 08:00:00+00',
  '2026-03-16 23:59:00+00',
  'date',
  50, 60,
  array['Python', 'PyTorch', 'Kubernetes', 'ML', 'Data Pipelines'],
  'new'
),

(
  'b1000000-0000-0000-0000-000000000005',
  'Software Developer Intern',
  'https://greenhouse.io/linear/swe-intern',
  'c1000000-0000-0000-0000-000000000005',
  'Remote', 'remote', 'internship',
  'summer-2026', '4 months',
  'Linear is building the new standard for software project management. We''re a small, high-output team that ships fast.

This is a full-stack internship — you''ll work across our Electron app, web app, and Node.js backend.

We care deeply about performance, design, and developer experience.

Stack: TypeScript, React, Node.js, PostgreSQL',
  '2026-03-11 11:00:00+00',
  null,
  'unknown',
  null, null,
  array['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Electron'],
  'new'
),

(
  'b1000000-0000-0000-0000-000000000006',
  'Infrastructure Engineering Intern',
  'https://jobs.lever.co/vercel/infra-intern',
  'c1000000-0000-0000-0000-000000000006',
  'Remote', 'remote', 'internship',
  'winter-2027', '4 months',
  'Join Vercel''s infrastructure team and help scale the platform that powers millions of frontend deployments.

You''ll work on:
- Edge network and CDN optimizations
- Build pipeline performance improvements
- Internal developer tooling

Requirements:
- Familiarity with Linux, networking fundamentals
- Experience with Go or Rust a plus
- Interest in distributed systems and cloud infrastructure',
  '2026-03-13 16:00:00+00',
  '2026-04-15 23:59:00+00',
  'date',
  48, 58,
  array['Go', 'Rust', 'Networking', 'CDN', 'Linux'],
  'new'
)

on conflict (id) do nothing;
