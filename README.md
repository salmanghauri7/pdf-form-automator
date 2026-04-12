# PDF Form Mapper

Map JSON data to fillable PDF form fields through a visual node-based canvas, preview the generated output, and export a completed PDF.

## Project Description

PDF Form Mapper is a Next.js web app that automates form filling by connecting JSON data to PDF AcroForm fields. Users can upload a fillable PDF and a JSON object, map JSON paths to PDF fields using a visual interface, validate mappings, and generate a preview of the filled PDF before download.

The app supports common PDF field types (text, checkbox, radio, dropdown, and option list) and uses an embedded Unicode font to ensure special characters render correctly.

## Setup Instructions

### Prerequisites

- Node.js 20 or later
- npm

### Installation and Run

1. Clone the repository:

```bash
git clone <your-repo-url>
cd pdf-form
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

The application redirects to the upload page.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- pdf-lib + fontkit
- React Flow
- Lodash
- Sonner (toast notifications)

