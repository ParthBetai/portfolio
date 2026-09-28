/* ============================================================
   CONTENT
   Every word, link and project on the site is in this one file.
   Edit here, never in the components.

   Source: Parth's resume (PB_RESUME.pdf). Nothing here should claim more
   than that document does. Where the site needs something the resume
   does not give (the GitHub, Instagram and X handles), it came from Parth
   directly.
   ============================================================ */

export const identity = {
  /* Short form, set at viewport scale in the nav and footer wordmark. */
  name: "PARTH",
  fullName: "Parth Betai",
  /* The giant hero word the name decodes into on load. */
  heroWord: "PORTFOLIO",
  role: "Software Developer",
  email: "parthbetai007@gmail.com",
  /* Phone deliberately not published: a number on a public page gets
     scraped for spam calls within weeks. The contact form covers it.
     Where he can take on work in person: Jaipur for the length of the
     undergrad, Kolkata as home base. */
  locations: { primary: "Jaipur, India", secondary: "Kolkata, India" },
};

/* The downloadable resume in /public. `size` and `updated` are shown on
   the floppy label and the chat attachment, so update them whenever the
   PDF is replaced. Note the PDF itself includes a phone number. */
export const resume = {
  href: "/Parth-Betai-Resume.pdf",
  fileName: "Parth-Betai-Resume.pdf",
  size: "184 KB",
  pages: 1,
  updated: "May 2026",
};

export const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

/* `label` also picks the icon (see components/SocialIcon.tsx). */
export const socials = [
  { label: "Github", href: "https://github.com/ParthBetai" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/codewithparth" },
  { label: "Instagram", href: "https://www.instagram.com/ftxparth" },
  { label: "X", href: "https://x.com/ftxparth" },
];

/* The paragraph is revealed word by word on scroll, so write it as one
   continuous string. Wrap a word in *asterisks* for the serif accent. */
export const intro = {
  eyebrow: "About",
  heading: "Intro",
  body: "Hi, I'm Parth Betai, a software developer from Kolkata, now based in Jaipur for my undergraduate degree. I started out building Android apps in Java and Kotlin, and that curiosity soon led me into robotics, where I spend my time with Arduino boards, servo motors, sensors and a fair amount of trial and error. Along the way I founded and ran two small ventures, an online store and a digital studio for local businesses, which taught me how to work with real clients and real deadlines. The work I enjoy most sits where software meets the physical world. If you need an app, a website or an extra pair of hands on a hardware build, I would be glad to help.",

  /* The card beside the paragraph. Plain facts, in the order someone
     skimming would want them. */
  factsTitle: "The short version",
  /* Optional: the path of a second background-removed photo in /public
     (for example "/portrait-2.png"). When set, it takes the card's place. */
  photo: null as string | null,
  facts: [
    { label: "Primary work location", value: "Jaipur, India" },
    { label: "Secondary work location", value: "Kolkata, India" },
    { label: "Status", value: "Undergraduate, first year" },
  ],
  /* The rolling row at the bottom of the card: one entry at a time. */
  availableLabel: "Available to work as",
  available: [
    "Android developer",
    "Software engineering intern",
    "Robotics intern",
    "Embedded systems intern",
    "Web developer",
    "Freelance designer",
    "AI automation builder",
  ],
};

/* Marquee rows, each with the label shown pinned at its left edge.
   "Learning" is deliberately labelled: listing a tool as a skill invites
   an interview question about it, so the page says which ones are in
   progress rather than claiming them. */
export const stacks = [
  {
    label: "Stack",
    items: ["Java", "Kotlin", "Android Studio", "C++", "Python", "HTML", "CSS", "Spring", "REST APIs", "SQL", "Git", "GitHub"],
  },
  {
    label: "AI models",
    items: ["GPT", "Gemini", "Llama", "Mistral", "DeepSeek", "Grok", "Qwen", "Perplexity", "Whisper", "Stable Diffusion", "Midjourney", "Copilot"],
  },
  {
    label: "Hardware",
    items: ["Arduino", "Embedded systems", "Sensor programming", "Servo motion", "Motor control", "Circuit design", "Wireless charging", "Prototyping"],
  },
  {
    label: "Learning",
    items: ["React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "Flutter", "Firebase", "Docker", "MongoDB", "PostgreSQL", "Linux", "AWS", "TensorFlow", "PyTorch", "ROS", "Raspberry Pi", "Figma", "Three.js"],
  },
];

export const services = {
  heading: ["What I", "can do"],
  items: [
    {
      title: "Mobile Development",
      points: [
        "Native Android in Java and Kotlin",
        "Android Studio, from layout to release",
        "Ordering screens and menu cards",
        "Carousels, ratings and reviews",
        "REST APIs to connect it all",
      ],
      body: "Android is where I started. I build native apps in Java and Kotlin, and the one I'm proudest of is a full food-ordering experience modelled on Domino's, with product carousels, ratings and reviews.",
    },
    {
      title: "Robotics & Embedded Systems",
      points: [
        "Arduino and sensor programming",
        "Ultrasonic obstacle detection",
        "Multi-servo motion sequences",
        "Motor control and circuit design",
        "Hardware prototyping",
      ],
      body: "I like it when code has to deal with the real world. I've built an obstacle-avoiding car, a wireless charging EV model and a mini humanoid with programmable moves, and I took first place in robotics at a national-level competition at IIT Hyderabad.",
    },
    {
      title: "AI & Automation",
      points: [
        "AI-assisted workflows for client work",
        "Prompting and testing different models",
        "Automating the repetitive parts of a business",
        "ChatGPT, Gemini and Copilot every day",
        "Chatbots and assistants (learning)",
      ],
      body: "At Afferex I used AI to move faster on real client work: drafting, designing and automating the boring bits so the time went into what mattered. Next I'm learning to build AI features straight into apps.",
    },
    {
      title: "Full-Stack Development",
      points: [
        "HTML and CSS front ends",
        "Spring Framework and REST APIs",
        "SQL databases",
        "Message queues and build tools",
        "React and Node.js (learning)",
      ],
      body: "I built websites and admin panels for small businesses through Afferex, with Spring and SQL behind them. I'm adding React and Node so I can take a project from idea to launch on my own.",
    },
    {
      title: "Cybersecurity",
      points: [
        "Network defence basics",
        "Identity and access management",
        "Risk assessment and auditing",
        "Ethical hacking fundamentals",
        "Cisco and Tata cybersecurity training",
      ],
      body: "I've done Cisco's Introduction to Cybersecurity and Tata Group's cybersecurity analyst simulation, so I think about how something could break before I ship it, not after.",
    },
    {
      title: "Web Design & Branding",
      points: [
        "Websites for small businesses",
        "Logos and brand identity",
        "Social media management",
        "E-commerce stores and listings",
        "Digital marketing",
      ],
      body: "Before Afferex I ran Psquare Online, a dropshipping store I grew to more than 50 products over a year. It taught me that a site has to look good and sell, so I design for both.",
    },
    {
      title: "DevOps & Tooling",
      points: [
        "Git and version control",
        "Build tools",
        "Solution architecture",
        "Docker and cloud deploys (learning)",
        "Linux (learning)",
      ],
      body: "The unglamorous layer that keeps projects alive: version control, repeatable builds and clean handovers. Docker and cloud deployment are next on my list.",
    },
  ],
};

/* Wrap one word per title in *asterisks* for the serif accent.
   `image` is any URL or a path in /public. These are Parth's own photos
   and screenshots of each build, in /public/work.
   `links` is optional: projects without one simply show no buttons. */
export type Project = {
  index: string;
  title: string;
  kind: string;
  /* A short proof point shown as a badge. Optional. */
  badge?: string;
  body: string;
  tags: string[];
  image: string;
  alt: string;
  /* Optional CSS object-position for the crop, e.g. "85% 50%" to keep
     the right side of a wide screenshot in frame. */
  focus?: string;
  links?: { label: string; href: string }[];
};

export const work: { heading: [string, string]; blurb: string; projects: Project[] } = {
  heading: ["Selected", "work"],
  blurb:
    "A few things I've built. Some of them move, and some of them run on your phone.",
  projects: [
    {
      index: "01",
      title: "Mini *Humanoid* Robot",
      kind: "Robotics",
      badge: "National level · IIT Hyderabad",
      body: "A multi-servo humanoid with more than five programmable motion sequences. I designed it, wired it and wrote the motion code, and it was selected for the National-Level Robotics Competition at IIT Hyderabad.",
      tags: ["Arduino", "Servo motors", "C++", "Motion sequencing"],
      image: "/work/mini-humanoid-robot.jpg",
      alt: "Hands wiring the servos of the mini humanoid robot on a workbench, with colourful jumper wires and a pencil marking the base board",
    },
    {
      index: "02",
      title: "Obstacle-Avoiding *Autonomous* Car",
      kind: "Embedded",
      badge: "100% detection in tests",
      body: "An Arduino car that finds its own way around. A set of ultrasonic sensors watches the path ahead and the car steers around whatever is in the way. It caught every obstacle in controlled tests.",
      tags: ["Arduino", "Ultrasonic sensors", "C++", "Motor drivers"],
      image: "/work/obstacle-avoiding-car.jpg",
      alt: "The obstacle-avoiding car: a four-wheeled Arduino chassis with an ultrasonic sensor on a servo at the front, a motor driver board and a battery pack",
    },
    {
      index: "03",
      title: "Wireless Charging *EV* Model",
      kind: "Hardware",
      badge: "100% solar powered",
      body: "A working electric vehicle prototype that charges without a cable, and the whole system runs on solar panels. I built the wireless charging circuit, the solar power stage and the embedded motor control, then showed it at two institutional exhibitions.",
      tags: ["Solar power", "Wireless charging", "Circuit design", "Motor control"],
      image: "/work/wireless-charging-ev.jpg",
      alt: "The wireless charging EV model: a charging pad with its coil in the middle of a road track, relay and regulator boards on either side, a yellow model car at the end and a row of 18650 lithium cells along the front",
    },
    {
      index: "04",
      title: "Android *App* Suite",
      kind: "Android",
      badge: "Domino's-style ordering app",
      body: "The centrepiece is a food-ordering app modelled on Domino's: swipeable product carousels, menu cards with prices, star ratings and a full customer review section, laid out by hand in XML and brought to life in Java. I built it to feel like the real thing, right down to the small details. Around it sit many more apps I made while learning Android properly, a quiz app among them, each one a little more ambitious than the last.",
      tags: ["Java", "XML layouts", "Android Studio", "UI design"],
      image: "/work/android-app-suite.jpg",
      alt: "Android Studio with the XML layout of one of the apps open, a text field and its attributes highlighted",
    },
  ],
};

/* The small section after the work: the two businesses so far, oldest
   first. Source: the Experience section of the resume. */
export const ventures = {
  eyebrow: "Entrepreneurship journey",
  heading: ["Founder", "journey"],
  blurb: "Two small businesses so far. The first taught me how to sell online, the second how to build for clients.",
  items: [
    {
      name: "Psquare Online",
      role: "CEO & Founder",
      period: "Jul 2024 to 2025",
      kind: "E-commerce · Dropshipping",
      status: "Wrapped up",
      live: false,
      body: "A dropshipping store I started in school and grew to more than 50 products. For a year I ran all of it: vendors, the supply pipeline and every bit of the marketing. Then I closed it to focus on Afferex.",
      facts: ["50+ products", "12 months", "Pivoted to Afferex"],
    },
    {
      name: "Afferex",
      role: "Founder",
      period: "Mar 2026 to 2026",
      kind: "AI-powered digital studio",
      status: "Wrapped up",
      live: false,
      body: "A studio that gave small businesses what they need online: websites, admin panels, business systems, logos and social media, built faster with AI-assisted workflows. I have since wound it down.",
      facts: ["5 services", "AI-assisted workflows", "Wound down in 2026"],
    },
  ],
};

export const contact = {
  heading: ["Get in", "touch"],
  blurb: "Got a project, an internship, or just an idea you want to talk through? Send me a message.",
  footerNote: "Let's build something",
  footerBlurb: "Open to internships, freelance work and collaborations.",

  /* The conversation on the phone in the contact section. It is a form
     in disguise: each question fills one field, and the last step sends
     the message straight to Parth's inbox through /api/contact. If that
     fails, the visitor can still open their own mail app instead.
     `{name}` and `{email}` are replaced with what the visitor typed. */
  chat: {
    title: "Parth Betai",
    status: "Usually replies within a day",
    greeting: ["Hey! Thanks for stopping by.", "Here's my resume if you want the whole story."],
    askName: "What should I call you?",
    askEmail: "Nice to meet you, {name}. What's your email, so I can write back?",
    badEmail: "Hmm, that doesn't look like an email address. Mind checking it?",
    askTopic: "What's this about?",
    topics: ["A project", "An internship", "Freelance work", "Just saying hi"],
    askMessage: "Tell me a bit more. What are you working on?",
    confirm: "Got it. Shall I send this over?",
    sending: "Sending...",
    sent: "Sent. It's in my inbox now, and I'll reply to {email} soon.",
    failed: "That didn't go through on my side. You can send it from your own email app instead, everything's filled in.",
    actions: { send: "Send message", restart: "Start over", mailApp: "Use my email app" },
    placeholders: {
      name: "Type your name",
      email: "you@example.com",
      topic: "Pick one or type your own",
      message: "Type a message",
    },
  },
};

/* Footer and the legal pages. Update `updated` whenever a policy page
   changes, so visitors can see how current it is. */
export const legal = {
  owner: "Parth Betai",
  updated: "28 September 2026",
  pages: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
    { label: "Credits", href: "/credits" },
  ],
};

export const meta = {
  title: "Parth Betai · Software Developer",
  description:
    "Parth Betai is a software developer who builds Android apps, robots and websites, and an undergraduate in Jaipur, India.",
};
