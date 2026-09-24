export interface MockResumeFixture {
  id: string;
  name: string;
  archetype: string;
  expectedMinScore?: number;
  expectedMaxScore?: number;
  content: string;
}

export const MOCK_RESUMES: Record<string, MockResumeFixture> = {
  excellent: {
    id: 'excellent',
    name: 'Sarah Chen - Staff Systems Engineer',
    archetype: 'Excellent resume',
    expectedMinScore: 85,
    content: `SARAH CHEN
San Francisco, CA | (555) 234-5678 | sarah.chen@example.com | linkedin.com/in/sarahchen-eng | github.com/sarahchen

PROFESSIONAL SUMMARY
Results-driven Staff Systems Engineer with 8+ years of expertise in distributed cloud architectures, high-throughput microservices, and Kubernetes orchestration. Proven track record scaling platforms to 25M+ active users while optimizing cloud spend by $320,000 annually.

TECHNICAL SKILLS
Languages: Go, TypeScript, Python, SQL, C++, Bash
Frameworks & Libraries: Node.js, React, Next.js, Express, gRPC
Cloud & DevOps: AWS (ECS, EKS, Lambda, S3, RDS), Kubernetes, Docker, Terraform, CI/CD (GitHub Actions)
Databases & Cache: PostgreSQL, Redis, Apache Kafka, DynamoDB

PROFESSIONAL EXPERIENCE
Staff Software Engineer | CloudScale Networks | San Francisco, CA | 2021 – Present
- Architected and deployed globally distributed event-driven microservices processing 45M+ transactions daily with 99.995% uptime.
- Spearheaded migration to containerized Kubernetes on AWS EKS, slashing compute infrastructure expenses by $320,000 per year.
- Optimized PostgreSQL queries and implemented Redis caching cluster, cutting p99 API response latency from 420ms to 48ms.
- Mentored a high-performing team of 10 engineers and established automated CI/CD security scanning, cutting defect escape rate by 40%.

Senior Backend Engineer | DataCore Systems | San Jose, CA | 2018 – 2021
- Designed and delivered resilient REST and gRPC microservices supporting 10M+ daily active mobile application users.
- Automated multi-region deployment pipelines using Terraform and GitHub Actions, reducing release cycle duration by 65%.
- Partnered with product and security teams to achieve SOC2 Type II certification ahead of audit schedule.

PROJECTS
OpenSource Distributed KV Store | Go, Raft Consensus, Docker
- Engineered a fault-tolerant distributed key-value store implementing the Raft consensus protocol, handling 15,000 writes/sec.
- Authored comprehensive integration test suite achieving 94% test coverage with automated fuzz testing.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2014 – 2018
- Magna Cum Laude, GPA: 3.85 / 4.0`,
  },

  average: {
    id: 'average',
    name: 'Mark Taylor - Web Developer',
    archetype: 'Average resume',
    expectedMinScore: 60,
    expectedMaxScore: 75,
    content: `MARK TAYLOR
mark.taylor@email.com | (555) 345-6789 | linkedin.com/in/marktaylor-dev

SUMMARY
Web developer with 3 years of experience in JavaScript and web application development looking for new growth opportunities.

SKILLS
JavaScript, React, Node.js, HTML, CSS, Git, MongoDB, Express

WORK EXPERIENCE
Software Developer | Tech Solutions Inc. | 2021 - Present
- Responsible for developing web applications using React and CSS.
- Worked on fixing bugs and improving front-end components for clients.
- Helped with database schema updates and backend API endpoints in Node.js.
- Participated in weekly team sprint meetings and code reviews.
- Handled basic server deployment tasks.

Junior Programmer | CodeCraft Labs | 2019 - 2021
- Worked on website updates and customer form validations.
- Assisted senior developers with debugging web modules.
- Supported documentation maintenance.

EDUCATION
B.S. in Information Technology | State University | 2019`,
  },

  poor: {
    id: 'poor',
    name: 'Alex Flawed',
    archetype: 'Poor resume',
    expectedMaxScore: 55,
    content: `Alex
alex@mail.com

I am an enthusiastic individual who wants to code. I love learning new things and helping out teams.

Experience:
- I worked on doing website tasks
- I helped team with whatever was needed
- Duties included changing colors and uploading images

Skills:
HTML, CSS`,
  },

  atsUnfriendly: {
    id: 'ats-unfriendly',
    name: 'Jordan Tables - ATS Trap Resume',
    archetype: 'ATS-unfriendly resume',
    content: `JORDAN SMITH
555-111-2222 | jordan@example.com

| SKILLS & CAPABILITIES ★★★★★ | RATINGS ◆◆◆◆◆ |
| -------------------------- | ------------- |
| Python & Django            | Expert ★★★★★  |
| PostgreSQL & AWS           | Advanced ★★★★ |
| Docker & CI/CD             | Competent ★★★ |

★ EXPERIENCE HIGHLIGHTS ★
| Company | Role | Dates |
| Tech Corp | Lead Dev | 2020 - 2023 |
| Soft Inc  | Dev      | 2018 - 2020 |

Duties included managing databases and building features.`,
  },

  student: {
    id: 'student',
    name: 'Emily Zhang - CS Student',
    archetype: 'Student resume',
    content: `EMILY ZHANG
Boston, MA | (555) 789-0123 | emily.zhang@university.edu | linkedin.com/in/emilyzhang | github.com/emilyzhang

EDUCATION
Candidate for Bachelor of Science in Computer Science | Massachusetts Institute of Technology | Expected May 2025
- GPA: 3.92 / 4.0 | Dean's First Honors
- Relevant Coursework: Data Structures & Algorithms, Operating Systems, Machine Learning, Database Systems, Computer Networks

TECHNICAL SKILLS
- Languages: Python, Java, C++, TypeScript, SQL
- Technologies & Tools: React, PyTorch, Git, Linux, Docker, PostgreSQL

PROJECTS
Autonomous Drone Navigation | Python, PyTorch, ROS, OpenCV
- Implemented real-time obstacle avoidance algorithm utilizing YOLOv8 and depth-sensing camera feeds, achieving 96% detection accuracy.
- Conducted 50+ simulation flight trials in Gazebo environment, demonstrating zero collision incidents.

Campus Study Room Booking Portal | React, TypeScript, Node.js, PostgreSQL
- Developed full-stack web application utilized by 3,500+ active university students to reserve library study spaces.
- Engineered automated reservation notification system via WebSockets, reducing no-show booking rates by 22%.

EXPERIENCE
Undergraduate Research Assistant | MIT CSAIL | Cambridge, MA | 2023 – Present
- Collaborated with PhD researchers on distributed training acceleration for large language models.
- Benchmarked GPU memory utilization across multi-node clusters, identifying bottlenecks and improving training throughput by 18%.

LEADERSHIP & AWARDS
- President, Women in Computer Science (WiCS), 2023 - Present
- First Place Winner, MIT Hackathon 2023 (out of 120 competing collegiate teams)`,
  },

  softwareEngineer: {
    id: 'swe',
    name: 'David Kim - Senior Software Engineer',
    archetype: 'Software engineer resume',
    expectedMinScore: 82,
    content: `DAVID KIM
Austin, TX | (555) 456-7890 | david.kim@swe.dev | linkedin.com/in/davidkim-swe | github.com/davidkim-code

SUMMARY
Senior Software Engineer with 6+ years specializing in modern JavaScript/TypeScript, scalable React architectures, and distributed Node.js cloud APIs. Delivered enterprise solutions supporting millions of daily interactions with emphasis on performance and clean architecture.

TECHNICAL PROFICIENCIES
- Core Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
- Frontend: React, Next.js, Redux Toolkit, TailwindCSS, Webpack, Vite
- Backend & Cloud: Node.js, Express, NestJS, GraphQL, REST APIs, AWS (Lambda, S3, CloudFront), Docker, CI/CD
- Data Stores: PostgreSQL, MongoDB, Redis

PROFESSIONAL EXPERIENCE
Senior Frontend Engineer | Nexa Commerce | Austin, TX | 2021 – Present
- Spearheaded redesign of global checkout funnel using Next.js and TypeScript, increasing conversion rates by 24% and generating $2.4M in incremental annual revenue.
- Decreased Lighthouse First Contentful Paint (FCP) from 2.8s to 0.9s across core storefront pages via server-side rendering and asset bundle optimization.
- Architected reusable design system component library adopted by 4 engineering teams, reducing feature sprint delivery cycles by 30%.

Full-Stack Software Engineer | Austin Cloud Solutions | Austin, TX | 2018 – 2021
- Developed scalable customer dashboard in React and GraphQL, handling real-time IoT sensor telemetry streams from 120,000 connected devices.
- Engineered automated integration test pipelines using Jest and Cypress, elevating test coverage from 52% to 88% and eliminating critical release blockers.
- Built asynchronous batch processing workers with Node.js and Redis queues, cutting report generation latency by 45%.

EDUCATION
Bachelor of Science in Software Engineering | University of Texas at Austin | 2014 – 2018`,
  },

  electricalEngineer: {
    id: 'ee',
    name: 'Rachel Patel - Electrical Systems Engineer',
    archetype: 'Electrical engineer resume',
    expectedMinScore: 80,
    content: `RACHEL PATEL, PE
San Diego, CA | (555) 678-9012 | rachel.patel@ee-pros.com | linkedin.com/in/rachelpatel-ee

PROFESSIONAL SUMMARY
Licensed Professional Electrical Engineer (PE) with 7+ years of experience designing embedded hardware, high-speed PCB layouts, and power distribution systems for aerospace and medical devices. Expert in mixed-signal design, firmware integration, and EMI/EMC compliance testing.

CORE COMPETENCIES
- Hardware Design: Schematic Capture, High-Speed PCB Layout (Altium Designer, KiCad), Signal Integrity, Power Electronics
- Firmware & Embedded: Embedded C, C++, FreeRTOS, ARM Cortex-M, SPI, I2C, UART, CAN Bus
- Simulation & Analysis: MATLAB, Simulink, SPICE, LTspice, Ansys HFSS
- Lab Equipment: Digital Oscilloscopes, Logic Analyzers, Spectrum Analyzers, Solder Rework Stations
- Compliance: ISO 13485, IEC 60601, FCC Part 15, CE Certification

PROFESSIONAL EXPERIENCE
Senior Electrical Hardware Engineer | AeroVanguard Technologies | San Diego, CA | 2021 – Present
- Designed 12-layer high-speed flight computer PCB utilizing ARM Cortex-M7 microcontroller and FPGA co-processor, meeting strict MIL-STD-810 thermal standards.
- Reduced board power consumption by 28% through switching regulator optimization and dynamic clock throttling.
- Conducted full EMI/EMC pre-compliance testing in RF anechoic chamber, achieving first-pass FCC certification.
- Supervised board bring-up and validation across 50 production test units, resolving critical signal integrity reflections.

Embedded Hardware Engineer | MedPulse Devices | Irvine, CA | 2018 – 2021
- Developed analog front-end circuitry for battery-powered diagnostic patient monitor with ultra-low noise instrumentation amplifiers.
- Authored bare-metal C firmware drivers for dual-channel ADC and Bluetooth Low Energy (BLE) peripheral transmission.
- Collaborated with biomedical engineering staff to secure FDA 510(k) clearance for portable medical instrumentation.

EDUCATION & LICENSURE
- Professional Engineer (PE) License | California Board for Professional Engineers | License #E-89241
- Bachelor of Science in Electrical Engineering | University of California, San Diego | 2014 – 2018`,
  },
};
