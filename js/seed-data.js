/**
 * Default content.
 * Used (1) when Firebase is not configured yet and (2) by the admin
 * "Import default content" button to seed Firestore.
 *
 * Rule: real information only. Fields with unknown values are left empty
 * and the UI hides them. Fill them from the admin panel.
 */

const BEHANCE = 'https://www.behance.net/afrozariju';

export const seed = {
  settings: {
    name: 'Afroza Riju',
    role: 'Product Designer (UI/UX), UX & HCI Researcher',
    seoTitle: 'Afroza Riju — Product Designer | UI/UX Designer | UX & HCI Researcher',
    seoDescription: 'Afroza Riju is a Product Designer (UI/UX) and UX & HCI researcher in Dhaka, Bangladesh with 3+ years of experience in user research, usability testing, design systems, accessibility (WCAG) and prototyping, backed by a degree in Computer Science & Engineering.',
    email: 'afrozariju@gmail.com',
    location: 'Dhaka, Bangladesh',
    resumeUrl: '',
    aboutStatement: "I'm a product designer and UX & HCI researcher with a background in computer science. I bring research, visual design, interaction design and technical understanding together to build products that are intuitive, accessible and ready to scale.",
    contactHeadline: 'Have a problem worth designing?',
    contactLede: "Tell me about the product, the people using it, and where it's getting stuck. I reply to every message.",
    footerText: 'Designed with curiosity. Built with intention.',
    accentColor: '#7b93ff',
    fontPair: 'geist',
    showGrain: true,
    showLoader: true
  },

  hero: {
    eyebrow: 'Product Designer (UI/UX), UX & HCI Researcher in Dhaka',
    headline: 'Designing digital experiences people understand, use and remember.',
    roles: ['Product Designer', 'UI/UX Designer', 'UX & HCI Researcher'],
    ctaPrimaryLabel: 'See selected work',
    ctaPrimaryHref: '#work',
    ctaSecondaryLabel: 'Start a conversation',
    profileImage: { url: './assets/images/afroza.jpg', alt: 'Portrait of Afroza Riju' },
    noteText: 'Users hesitate at step 3.'
  },

  projects: [
    {
      id: 'ai-grocery-list-parser',
      slug: 'ai-grocery-list-parser',
      title: 'AI Grocery List Parser',
      category: 'UX case study',
      tags: ['Case study'],
      shortDescription: 'A UX case study for an AI tool that parses grocery lists.',
      role: '', tools: [], year: '', industry: 'Retail and AI',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/247422857/AI-Grocery-List-Parser-UX-Case-Study',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/94f305247422857.Y3JvcCw1MzEzLDQxNTYsMjIzLDA.png', alt: 'AI Grocery List Parser case study cover' },
      gallery: [], caseStudy: {}, hue: 150,
      featured: true, published: true, order: 0
    },
    {
      id: 'fauget-fitness-dashboard',
      slug: 'fauget-fitness-dashboard',
      title: 'FAUGET',
      category: 'Fitness dashboard',
      tags: ['Case study', 'Dashboard'],
      shortDescription: 'A UX case study for a fitness tracking dashboard.',
      role: '', tools: [], year: '', industry: 'Health and fitness',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/239215165/FAUGET-Fitness-Dashboard-UX-Case-Study',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/7dff01239215165.Y3JvcCwyODgwLDIyNTIsMCww.png', alt: 'FAUGET fitness dashboard case study cover' },
      gallery: [], caseStudy: {}, hue: 20,
      featured: true, published: true, order: 1
    },
    {
      id: 'r-movie-booking',
      slug: 'r-movie-booking',
      title: 'R-Movie Booking',
      category: 'Cinematic app experience',
      tags: ['Mobile app'],
      shortDescription: 'A movie-ticket booking app with a cinematic feel.',
      role: '', tools: [], year: '', industry: 'Entertainment',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/238737169/R-Movie-Booking-A-Cinematic-App-Experience',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/02a582238737169.Y3JvcCwyNDMyLDE5MDIsMjQ2LDA.png', alt: 'R-Movie Booking app cover' },
      gallery: [], caseStudy: {}, hue: 350,
      featured: true, published: true, order: 2
    },
    {
      id: 'wallet-finance-app',
      slug: 'wallet-finance-app',
      title: 'Wallet',
      category: 'Finance and money transfer app',
      tags: ['Mobile app'],
      shortDescription: 'UI/UX for a modern finance and money-transfer app.',
      role: '', tools: [], year: '', industry: 'Fintech',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/236385469/Wallet-Modern-Finance-Money-Transfer-App-UIUX',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/f2ed41236385469.Y3JvcCwyNzAyLDIxMTQsODYsMA.png', alt: 'Wallet finance app cover' },
      gallery: [], caseStudy: {}, hue: 228,
      featured: true, published: true, order: 3
    },
    {
      id: 'frozehna-real-estate',
      slug: 'frozehna-real-estate',
      title: 'Frozehna',
      category: 'Real estate app and website',
      tags: ['Mobile app', 'Website'],
      shortDescription: 'A real estate mobile app with a companion website.',
      role: '', tools: [], year: '', industry: 'Real estate',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/235660677/Real-Estate-Mobile-App-Website-Solution-Frozehna',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/7ea1f6235660677.Y3JvcCwyMDcxLDE2MjAsMTAyLDA.png', alt: 'Frozehna real estate app and website cover' },
      gallery: [], caseStudy: {}, hue: 190,
      featured: true, published: true, order: 4
    },
    {
      id: 'aeroassist',
      slug: 'aeroassist',
      title: 'AeroAssist',
      category: 'Airport help and assistance',
      tags: ['Case study', 'Mobile app'],
      shortDescription: 'A team case study on airport help and assistance for travellers.',
      role: 'Team project', tools: [], year: '', industry: 'Aviation and travel',
      problem: '', solution: '', outcome: '',
      behanceUrl: 'https://www.behance.net/gallery/233749355/AeroAssist-Airport-Help-Assistance-Case-Study',
      coverImage: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/6c79c4233749355.Y3JvcCwzMjMyLDI1MjgsMCww.png', alt: 'AeroAssist airport assistance case study cover' },
      gallery: [], caseStudy: {}, hue: 260,
      featured: true, published: true, order: 5
    }
  ],

  experience: [
    {
      id: 'mediusware-trainee',
      company: 'Mediusware Ltd.',
      role: 'UI/UX Designer Trainee',
      period: 'Nov 2025',
      start: '2025-11', end: '',
      summary: 'Improving interface quality through UX principles and audits.',
      responsibilities: [
        'Applied UX principles and the Laws of UX to design decisions',
        'Improved interface consistency, layout and visual hierarchy',
        'Refined white space and alignment across screens',
        'Checked designs against WCAG accessibility guidelines',
        'Ran UX audits to find and document usability issues'
      ],
      order: 0
    },
    {
      id: 'mediusware-intern',
      company: 'Mediusware Ltd.',
      role: 'UI/UX Designer Intern',
      period: 'Oct 2024 – Dec 2024',
      start: '2024-10', end: '2024-12',
      summary: 'End-to-end design work alongside the product development team.',
      responsibilities: [
        'Conducted user research and gathered stakeholder requirements',
        'Built wireframes, UI designs and interactive prototypes',
        'Collaborated with product development on implementation',
        'Worked within a team, communicating design decisions clearly'
      ],
      order: 1
    },
    {
      id: 'dhaka-cast',
      company: 'Dhaka Cast Ltd.',
      role: 'Junior Executive, UI/UX & Operations',
      period: 'Dec 2020 – Nov 2022',
      start: '2020-12', end: '2022-11',
      summary: 'Designing for patients in a telehealth product.',
      responsibilities: [
        'Designed telehealth interfaces and improved the patient experience',
        'Improved mobile app usability and accessibility',
        'Created patient onboarding materials',
        'Produced content and marketing visuals',
        'Collaborated across functions to ship improvements'
      ],
      order: 2
    }
  ],

  achievements: [
    { id: 'huawei', title: 'Huawei ICT Startup Competition', org: 'Press Interviewer', year: '', type: 'Media', description: 'Served as press interviewer at the competition. The interview reel is featured above.', url: '#moment', order: 0, highlight: true },
    { id: 'sdlc', title: 'Mastering SDLC', org: 'TLECE Bangladesh', year: '2024', type: 'Program', description: 'A program on the software development life cycle, from requirements through delivery.', url: '', order: 1 },
    { id: 'devpost', title: 'Devpost Hackathon', org: 'Participant', year: '', type: 'Hackathon', description: 'Participated in a hackathon hosted on Devpost.', url: '', order: 2 },
    { id: 'simcubator', title: 'Simcubator Bootcamp 2022', org: 'SELISE and Simcubator Bangladesh', year: '2022', type: 'Bootcamp', description: 'A bootcamp run by SELISE and Simcubator Bangladesh.', url: '', order: 3 },
    { id: 'debate', title: 'Joint Secretary, Debating Club', org: 'Green University of Bangladesh', year: '', type: 'Leadership', description: 'Served as Joint Secretary of the university debating club.', url: '', order: 4 }
  ],

  skills: [
    { id: 'research', category: 'UX research', description: 'Finding out what people actually need before deciding what to build.', items: ['User interviews', 'Personas', 'Journey mapping', 'Usability testing', 'UX audits'], order: 0 },
    { id: 'product', category: 'Product design', description: 'Turning insight into structure, flows and working prototypes.', items: ['Information architecture', 'Wireframing', 'Prototyping', 'Design systems', 'Interaction design'], order: 1 },
    { id: 'visual', category: 'Visual design', description: 'Making hierarchy obvious so people know where to look.', items: ['Typography', 'Layout', 'Visual hierarchy', 'Responsive design'], order: 2 },
    { id: 'a11y', category: 'Accessibility', description: 'Designing so more people can use the product, by default.', items: ['WCAG', 'Inclusive design'], order: 3 },
    { id: 'tools', category: 'Tools', description: 'Where the work happens.', items: ['Figma', 'FigJam', 'Adobe XD', 'Photoshop', 'Illustrator'], order: 4 },
    { id: 'tech', category: 'Technical', description: 'Enough engineering fluency to design what can ship.', items: ['Computer science', 'Frontend understanding', 'Product development collaboration'], order: 5 }
  ],

  social: [
    { id: 'behance', label: 'Behance', url: BEHANCE, icon: 'behance', order: 0 },
    { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/afrozariju19/', icon: 'linkedin', order: 1 },
    { id: 'dribbble', label: 'Dribbble', url: 'http://dribbble.com/afroza_riju', icon: 'dribbble', order: 2 },
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/afroza.riju', icon: 'facebook', order: 3 }
  ],

  featured: {
    published: true,
    embed: true,
    videoUrl: './assets/video/huawei-interview.mp4',
    label: 'Featured moment',
    mega: 'HUAWEI ICT',
    title: 'Press Interviewer at the Huawei ICT Startup Competition',
    description: 'I served as press interviewer at the Huawei ICT Startup Competition. Watch the interview reel on Facebook.',
    reelUrl: 'https://www.facebook.com/reel/1239532156786714',
    thumbnail: null,
    posterTitle: 'Interview feature'
  },

  process: [
    { id: 'discover', title: 'Discover', summary: 'Understand the people, their context and the business before touching a pixel.', activities: ['Stakeholder conversations', 'User interviews', 'Competitor review'], deliverables: ['Research plan', 'Interview notes', 'Assumption map'], methods: ['Contextual inquiry', 'Desk research', 'UX audit'], mindset: 'Stay curious. The first problem stated is rarely the real one.', order: 0 },
    { id: 'define', title: 'Define', summary: 'Turn raw findings into a problem the whole team agrees on.', activities: ['Affinity mapping', 'Persona building', 'Journey mapping'], deliverables: ['Problem statement', 'Personas', 'Journey map'], methods: ['How might we', 'Jobs to be done', 'Prioritisation'], mindset: 'A well-framed problem is half the solution.', order: 1 },
    { id: 'ideate', title: 'Ideate', summary: 'Explore many directions quickly, then converge on the strongest.', activities: ['Sketching', 'Flow exploration', 'Team critique'], deliverables: ['User flows', 'Concept sketches', 'Information architecture'], methods: ['Crazy 8s', 'Card sorting', 'Laws of UX'], mindset: 'Quantity first, then judgment.', order: 2 },
    { id: 'design', title: 'Design', summary: 'Build structure, then hierarchy, then detail. In that order.', activities: ['Wireframing', 'High-fidelity UI', 'Component design'], deliverables: ['Wireframes', 'UI screens', 'Design system'], methods: ['Auto layout', 'Design tokens', 'WCAG checks'], mindset: 'Every element has to earn its place on the screen.', order: 3 },
    { id: 'test', title: 'Test', summary: 'Put the design in front of real people and watch what happens.', activities: ['Prototype testing', 'Task observation', 'Accessibility review'], deliverables: ['Interactive prototype', 'Test findings', 'Severity ratings'], methods: ['Usability testing', 'Think-aloud', 'Heuristic evaluation'], mindset: "If users struggle, the design is wrong, not the user.", order: 4 },
    { id: 'refine', title: 'Refine', summary: 'Fix what testing revealed, hand off cleanly, keep improving after launch.', activities: ['Iteration', 'Developer handoff', 'Design QA'], deliverables: ['Revised designs', 'Specs and states', 'Handoff notes'], methods: ['Design reviews', 'Edge-case mapping', 'Post-launch audits'], mindset: 'Shipping is the start of learning, not the end of design.', order: 5 }
  ],

  techflow: [
    { id: 'user', label: 'User', icon: 'user', designer: true, what: 'Everything starts with a person trying to get something done.', cse: 'A technical background helps me connect what people say with how the system actually behaves.', order: 0 },
    { id: 'research', label: 'Research', icon: 'search', designer: true, what: 'Interviews, testing and audits reveal what people need and where they struggle.', cse: 'Structured, analytical thinking from computer science helps me plan studies and make sense of findings.', order: 1 },
    { id: 'ux', label: 'UX', icon: 'flow', designer: true, what: 'Flows, information architecture and wireframes shape how the product works.', cse: 'Thinking in states and logic means flows account for errors, empty states and edge cases, not just the happy path.', order: 2 },
    { id: 'ui', label: 'UI', icon: 'layout', designer: true, what: 'Visual hierarchy, typography and components make the structure clear and usable.', cse: 'Knowing how layouts are built helps me design responsive behaviour that holds up in code.', order: 3 },
    { id: 'system', label: 'System', icon: 'grid', designer: true, what: 'A design system keeps decisions consistent as the product grows.', cse: 'Tokens and components map directly to how frontend code is organised, which makes handoff smoother.', order: 4 },
    { id: 'dev', label: 'Development', icon: 'code', designer: false, what: 'Engineers turn designs into working software.', cse: 'Understanding technical constraints lets me discuss trade-offs with developers early, instead of handing designs over the wall.', order: 5 },
    { id: 'product', label: 'Product', icon: 'box', designer: false, what: 'A shipped product that people can use, measure and improve.', cse: 'A shared vocabulary with engineers helps keep what ships close to what was designed.', order: 6 }
  ]
};
