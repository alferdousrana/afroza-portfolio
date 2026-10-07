/**
 * Default content.
 * Used (1) when Firebase is not configured yet and (2) by the admin
 * "Import default content" button to seed Firestore.
 *
 * Rule: real information only. Fields with unknown values are left empty
 * and the UI hides them. Fill them from the admin panel.
 */

const BEHANCE = 'https://www.behance.net/afrozariju';

/**
 * Every section on the home page, in default order (v2).
 * The hero always comes first and the footer always last; everything in
 * between can be reordered and hidden from Studio → Sections & menu.
 */
export const SECTIONS = [
  ['marquee', 'Moving ticker'],
  ['about', 'About and capabilities'],
  ['live', 'Right now (live status)'],
  ['process', 'How I think'],
  ['work', 'Selected work'],
  ['moment', 'Featured moment (Huawei)'],
  ['gallery', 'Gallery'],
  ['experience', 'Experience'],
  ['tech', 'Design meets technology'],
  ['achievements', 'Milestones'],
  ['contact', 'Contact']
];

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
    // v2: colours per theme. Empty = use the preset's colour.
    palettePreset: 'original',
    darkBg: '', darkInk: '', darkAccent: '', darkWarm: '',
    lightBg: '', lightInk: '', lightAccent: '', lightWarm: '',
    // v2: typography
    fontPair: 'geist',
    customDisplayFont: '', customBodyFont: '', customDisplayWeight: 500,
    typeScale: 1,
    bodyScale: 1,
    // v2: "Let's talk" button
    ctaLabel: "Let's talk",
    ctaHref: '#contact',
    ctaStyle: 'live',
    showGrain: true,
    showLoader: true
  },

  /* v2: every heading, label and list on the home page */
  page: {
    sections: SECTIONS.map(([id]) => ({ id, visible: true })),
    nav: [
      { label: 'About', target: 'about' },
      { label: 'Work', target: 'work' },
      { label: 'Gallery', target: 'gallery' },
      { label: 'Experience', target: 'experience' },
      { label: 'Milestones', target: 'achievements' },
      { label: 'Contact', target: 'contact' }
    ],
    tabHome: 'Home', tabAbout: 'About', tabWork: 'Work', tabCareer: 'Career', tabContact: 'Contact',

    aboutTitle: "I don't just design interfaces. I design how they feel to use.",
    facts: [
      { label: 'Experience', value: '3+ years in research-informed product design' },
      { label: 'Education', value: 'B.Sc. Computer Science & Engineering, Green University of Bangladesh. Graduate' },
      { label: 'Based in', value: 'Dhaka, Bangladesh' },
      { label: 'Open to', value: 'Full-time roles and freelance projects' }
    ],
    capabilitiesTitle: 'Capabilities',

    processTitle: 'How I think',
    processLede: 'Six stages, never strictly linear. Select one to see what happens there, what comes out of it, and how I approach it.',
    workTitle: 'Selected work',
    workMoreLabel: 'See everything on Behance',
    galleryTitle: 'Gallery',
    galleryLede: 'Work, events and the moments in between. Select any image to see it larger.',
    expTitle: "Where I've worked",
    expLede: 'Select a company, or a bar on the timeline, to see the role and what I contributed.',
    techTitle: 'Design meets technology',
    techLede: 'My computer science degree means I can follow a design all the way into code: talk constraints with engineers, spec states properly, and keep what ships close to what was designed.',
    achTitle: 'Milestones',
    achLede: 'Programs, competitions and leadership that shaped how I work.',

    liveTitle: 'Right now',
    liveLede: 'What I am working on and whether I can take something new. This panel updates itself.',
    liveAvailable: true,
    liveStatus: 'Open to full-time roles and freelance projects',
    liveCity: 'Dhaka',
    liveTimezone: 'Asia/Dhaka',
    liveNow: [
      'Working as a UI/UX Designer Trainee at Mediusware',
      'Auditing interfaces against WCAG',
      'Applying the Laws of UX to everyday screens',
      'Turning research notes into flows in Figma'
    ],
    stats: [
      { value: '3', suffix: '+', label: 'Years in product design' },
      { value: 'auto:projects', suffix: '', label: 'Case studies on this site' },
      { value: 'auto:companies', suffix: '', label: 'Companies worked with' },
      { value: 'auto:milestones', suffix: '', label: 'Programs and milestones' }
    ],

    marqueeItems: ['User research', 'Usability testing', 'Design systems', 'Accessibility', 'Interaction design', 'Prototyping', 'UX audits'],
    marqueeItems2: ['Figma', 'Personas', 'Journey maps', 'Wireframes', 'High-fidelity UI', 'Developer handoff', 'HCI research'],
    marqueeSpeed: 1,

    contactLegend: 'What is this about?',
    contactTopics: ['Full-time role', 'Freelance project', 'UX research', 'Something else'],
    contactSubmit: 'Send message',

    loaderSteps: ['Research', 'Define', 'Design', 'Test', 'Refine'],
    heroHint: "Drag the frames. They're yours to rearrange.",
    heroScroll: 'Scroll',
    framePhone: 'Home / Mobile',
    framePhoneCta: 'Continue',
    frameComponent: 'Button / States',
    frameNoteMeta: 'Usability test, insight',
    frameContrast: 'WCAG AA passed',
    framePersonaTitle: 'Persona',
    framePersonaText: 'First-time user'
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

  /* v2: gallery. Starts with real work covers; replace or add photos from Studio → Gallery. */
  gallery: [
    { id: 'g-portrait', title: 'Afroza Riju', caption: 'Portrait', category: 'People', year: '', size: 'tall', image: { url: './assets/images/afroza.jpg', alt: 'Portrait of Afroza Riju' }, link: '', published: true, order: 0 },
    { id: 'g-grocery', title: 'AI Grocery List Parser', caption: 'UX case study', category: 'Work', year: '', size: 'large', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/94f305247422857.Y3JvcCw1MzEzLDQxNTYsMjIzLDA.png', alt: 'AI Grocery List Parser case study cover' }, link: 'https://www.behance.net/gallery/247422857/AI-Grocery-List-Parser-UX-Case-Study', published: true, order: 1 },
    { id: 'g-fauget', title: 'FAUGET', caption: 'Fitness dashboard', category: 'Work', year: '', size: 'normal', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/7dff01239215165.Y3JvcCwyODgwLDIyNTIsMCww.png', alt: 'FAUGET fitness dashboard cover' }, link: 'https://www.behance.net/gallery/239215165/FAUGET-Fitness-Dashboard-UX-Case-Study', published: true, order: 2 },
    { id: 'g-movie', title: 'R-Movie Booking', caption: 'Cinematic app experience', category: 'Work', year: '', size: 'normal', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/02a582238737169.Y3JvcCwyNDMyLDE5MDIsMjQ2LDA.png', alt: 'R-Movie Booking app cover' }, link: 'https://www.behance.net/gallery/238737169/R-Movie-Booking-A-Cinematic-App-Experience', published: true, order: 3 },
    { id: 'g-wallet', title: 'Wallet', caption: 'Finance and money transfer app', category: 'Work', year: '', size: 'wide', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/f2ed41236385469.Y3JvcCwyNzAyLDIxMTQsODYsMA.png', alt: 'Wallet finance app cover' }, link: 'https://www.behance.net/gallery/236385469/Wallet-Modern-Finance-Money-Transfer-App-UIUX', published: true, order: 4 },
    { id: 'g-frozehna', title: 'Frozehna', caption: 'Real estate app and website', category: 'Work', year: '', size: 'normal', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/7ea1f6235660677.Y3JvcCwyMDcxLDE2MjAsMTAyLDA.png', alt: 'Frozehna real estate cover' }, link: 'https://www.behance.net/gallery/235660677/Real-Estate-Mobile-App-Website-Solution-Frozehna', published: true, order: 5 },
    { id: 'g-aero', title: 'AeroAssist', caption: 'Airport help and assistance (team project)', category: 'Work', year: '', size: 'normal', image: { url: 'https://mir-s3-cdn-cf.behance.net/projects/404/6c79c4233749355.Y3JvcCwzMjMyLDI1MjgsMCww.png', alt: 'AeroAssist case study cover' }, link: 'https://www.behance.net/gallery/233749355/AeroAssist-Airport-Help-Assistance-Case-Study', published: true, order: 6 }
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
