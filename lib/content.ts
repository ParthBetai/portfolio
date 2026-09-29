/* ============================================================
   CONTENT
   Every word, link and project on the site is in this one file.
   Edit here, never in the components.

   Source: Parth's resume (public/Parth-Betai-Resume.pdf) and what Parth
   has confirmed directly: the GitHub, Instagram and X handles, which robot
   won at IIT Hyderabad, how the humanoid is built (eight or more servos,
   the exact count unknown, on a servo driver board run by an Arduino,
   with C++ that eases between hand-tuned poses), how the car decides
   where to turn, how the EV model is powered and switched, and the
   offline SOS app (React Native; each phone re-broadcasts an SOS over
   Bluetooth Low Energy, carrying GPS location, an optional short message
   and an ID so it is not relayed forever). React is part of his stack;
   he is still learning Flutter. Not confirmed, so never claimed: iOS,
   TypeScript, the Bluetooth SIG mesh standard, range or test counts.
   Nothing here should claim more than those do, and no number goes in
   that nobody counted. Where the resume and his project photos disagree,
   the photos win (the car has one ultrasonic sensor on a servo, not an
   array). Afferex was still finding its first clients when he wound it
   down, so the copy says what it offered, not work it delivered.
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
  body: "Hi, I'm Parth Betai, a software developer from Kolkata, now based in Jaipur for my undergraduate degree. I started out building Android apps in Java and Kotlin, and that curiosity soon led me into robotics, where I spend my time with Arduino boards, servo motors, sensors and a fair amount of trial and error. Along the way I founded and ran two ventures, an online store and a digital studio for small businesses, which taught me the business side: vendors, marketing and finding clients. The work I enjoy most sits where software meets the physical world. If you need an app, a website or an extra pair of hands on a hardware build, I would be glad to help.",

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
   progress rather than claiming them. The AI row names practices, not
   products: a list of model names says nothing about what he can build. */
export const stacks = [
  {
    label: "Stack",
    items: ["Java", "Kotlin", "React Native", "React", "Android Studio", "Bluetooth LE", "C++", "Python", "HTML", "CSS", "Spring", "REST APIs", "SQL", "Git", "GitHub"],
  },
  {
    label: "Intelligent systems",
    items: ["AI-assisted development", "LLM APIs", "Prompt engineering", "Automation", "AI workflows", "Model testing"],
  },
  {
    label: "Hardware",
    items: ["Arduino", "Embedded systems", "Sensor programming", "Servo motion", "Motor control", "Circuit design", "Wireless charging", "Prototyping"],
  },
  {
    label: "Learning",
    items: ["Flutter", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "Firebase", "Docker", "MongoDB", "PostgreSQL", "Linux", "AWS", "TensorFlow", "PyTorch", "ROS", "Raspberry Pi", "Figma", "Three.js"],
  },
];

export const services = {
  heading: ["What I", "can do"],
  items: [
    {
      title: "Mobile Development",
      points: [
        "Native Android in Java and Kotlin",
        /* Non-breaking spaces keep "React Native" and "Bluetooth LE"
           from splitting across lines in the narrow points column. */
        "Mobile apps in React\u00a0Native",
        "Offline SOS relay over Bluetooth\u00a0LE",
        "Android Studio and XML layouts",
        "Flutter (learning)",
      ],
      body: "I started on Android in Java and Kotlin, and now I build in React Native too. Among my apps are an offline SOS app that relays alerts from phone to phone over Bluetooth, and a replica of the Domino's ordering UI.",
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
      body: "I like it when code has to deal with the real world. I've built a mini humanoid, an obstacle-avoiding car and a wireless charging EV model. The humanoid took first place in Robotics at a national-level interstate competition at IIT Hyderabad.",
    },
    {
      title: "AI & Automation",
      points: [
        "AI-assisted development",
        "Prompt engineering and model testing",
        "Automating repetitive business tasks",
        "LLM APIs and AI workflows",
        "Chatbots and assistants (learning)",
      ],
      body: "At Afferex, the studio I ran for small businesses, I worked with AI-assisted workflows for websites, admin panels, business systems, logos and social media. That meant writing prompts, trying different models and automating the repetitive parts. Next I'm learning to build chatbots and assistants into apps.",
    },
    {
      title: "Full-Stack Development",
      points: [
        "React, HTML and CSS front ends",
        "Spring Framework and REST APIs",
        "SQL databases",
        "Message queues and build tools",
        "Node.js (learning)",
      ],
      body: "Through Afferex I offered small businesses websites and admin panels. I build front ends in React, and on the back end I work with Spring, REST APIs and SQL. Next I'm learning Node.js, so I can take a project from idea to launch on my own.",
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
  /* A short proof point or standout detail shown as a badge. Optional.
     No bare percentages: a number goes in only if it was counted, with
     what was counted. Keep it to 38 characters or fewer so it stays on
     one line on a 360px phone. */
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
    "A few things I've built. Some of them run on a phone, and some of them move.",
  /* Software first, then the hardware builds. `index` is the number shown
     on the card and also its React key and heading id, so renumber it
     (01, 02, ...) whenever the order changes. */
  projects: [
    {
      index: "01",
      title: "Android *App* Suite",
      kind: "Mobile",
      badge: "Offline SOS, relayed phone to phone",
      body: "A React Native SOS app that works with no internet or signal. A phone sends an SOS, with its GPS location and an optional short message, over Bluetooth Low Energy. Each phone running the app that picks it up sounds or vibrates and passes it on, so the phones form an offline mesh. An ID on each SOS stops it being relayed forever. In Java and XML I've built many more apps, including a replica of the Domino's ordering UI with carousels, ratings and reviews.",
      tags: ["React Native", "Bluetooth LE", "Java", "XML layouts"],
      image: "/work/android-app-suite.jpg",
      alt: "The XML layout of one of the Java apps open in a code editor: a scroll view holding a label and a number input, with two of its attributes highlighted",
    },
    {
      index: "02",
      title: "Mini *Humanoid* Robot",
      kind: "Robotics",
      badge: "1st place in Robotics · IIT Hyderabad",
      body: "A mini humanoid driven by 8+ servos through a PWM servo driver board on an Arduino. I designed it and wrote the motion code in C++: 5+ sequences built from hand-tuned poses, with every servo eased gradually from one pose to the next so the robot moves without jerking. It won first place in Robotics at a national-level interstate competition at IIT Hyderabad.",
      tags: ["Arduino", "C++", "PWM servo driver", "Motion easing"],
      image: "/work/mini-humanoid-robot.jpg",
      alt: "Building the mini humanoid: hands wiring its blue servos with coloured jumper wires, while a second pair of hands marks out the white base board in pencil",
    },
    {
      index: "03",
      title: "Obstacle-Avoiding *Autonomous* Car",
      kind: "Embedded",
      badge: "Looks both ways before it turns",
      body: "An Arduino car that finds its own way around obstacles. A single ultrasonic sensor sits at the front on a servo. When something is close ahead, my C++ code stops the car, turns the sensor to check left and right, and steers toward the side with more room, driving four geared motors through a motor driver board. In controlled tests it detected obstacles reliably.",
      tags: ["Arduino", "Ultrasonic sensor", "Motor drivers", "C++"],
      image: "/work/obstacle-avoiding-car.jpg",
      alt: "The obstacle-avoiding car: a four-wheeled chassis carrying an Arduino under a motor driver board, with an ultrasonic sensor on a servo at the front and a battery pack",
    },
    {
      index: "04",
      title: "Wireless Charging *EV* Model",
      kind: "Hardware",
      badge: "Solar-charged cells power the track",
      body: "A working EV model that charges without a cable. A solar panel charges three 18650 Li-ion cells, which power the track. When a sensor spots the car arriving, a relay switches on the transmitter coil set into the track. I built the wireless charging circuit and the embedded motor control, then showed it at two institutional exhibitions.",
      tags: ["Wireless charging", "Solar charging", "Relay", "Motor control"],
      image: "/work/wireless-charging-ev.jpg",
      alt: "The wireless charging EV model: the charging coil set into the middle of a model road, a relay module and a small sensor on the left, a board of heatsinked parts on the right with a yellow model car behind the clear wall beside it, and three 18650 Li-ion cells along the front",
    },
  ],
};

/* The small section after the work: the two businesses so far, oldest
   first. Source: the Experience section of the resume. */
export const ventures = {
  eyebrow: "Entrepreneurship journey",
  heading: ["Founder", "journey"],
  blurb: "Two small businesses so far. The first taught me how to sell online, the second how to set up a service business and go after its first clients.",
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
      kind: "Digital studio · Small businesses",
      status: "Wrapped up",
      live: false,
      body: "A studio that offered small businesses what they need online: websites, admin panels, business systems, logos and social media, built faster with AI-assisted workflows. I have since wound it down.",
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
    /* What the phone shows when the page runs without scripts: the
       greeting and the resume as usual, then this line, with Parth's
       email address as a link where the input bar would be. */
    noscript: {
      closing: "Easiest way to reach me is email. Drop me a line below and I'll write back.",
    },
  },
};

/* Footer and the legal pages. Update `updated` whenever a policy page
   changes, so visitors can see how current it is. */
export const legal = {
  owner: "Parth Betai",
  updated: "29 September 2026",
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
