# College0 Prototype

College0 is a React + Vite prototype for a college program management system. It includes separate student, instructor, and registrar experiences with role-based dashboards, course registration flows, recommendations, and basic operational views.

## What This Project Includes

- Public landing page
- Student dashboard and registration flow
- Smart course recommendations
- AI assistant mock experience
- Instructor dashboard with separate course, student, and grading views
- Registrar dashboard with separate applications, complaints, and semester control views

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide icons

## Requirements

- Node.js 18+ recommended
- npm

## Getting Started

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Vite will print a local URL in the terminal, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

## Build for Production

Create a production build:

```powershell
npm run build
```

The output will be generated in the `dist` folder.

## Main Routes

- `/` - public landing page
- `/student` - student dashboard
- `/student/registration` - registration flow
- `/student/smart-cre` - recommendation page
- `/student/ai-assistant` - AI assistant view
- `/instructor` - instructor dashboard
- `/instructor/courses` - instructor courses
- `/instructor/students` - instructor student roster
- `/instructor/grading` - instructor grading page
- `/registrar` - registrar dashboard
- `/registrar/applications` - registrar applications
- `/registrar/complaints` - registrar complaints
- `/registrar/semester-control` - registrar semester control

## Project Structure

```text
src/
  app/
    components/   reusable UI pieces
    layouts/      route layouts
    pages/        page-level screens
    data/         mock data used by the prototype
    routes.tsx    router configuration
  styles/         global styles and theme tokens
  main.tsx        app entry point
```

## Notes

- This is a prototype, not a production backend-connected system.
- Most data is mocked in `src/app/data/mockData.ts`.
- Some actions are UI-only and do not persist changes.

## Troubleshooting

If `npm run dev` fails because dependencies are missing, run:

```powershell
npm install
```

If the port is already in use, Vite may automatically choose another one. Check the terminal output for the correct local URL.
