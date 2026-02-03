# **App Name**: Statement Insights

## Core Features:

- PDF Upload & OCR: Allows users to upload bank statement PDFs. Performs OCR to extract text data.
- Data Extraction: Parses the extracted text to identify transactions, dates, amounts, and descriptions.
- Transaction Categorization: Automatically categorize transactions (e.g., groceries, utilities, entertainment) using a machine learning model as a tool. This feature is powered by a generative AI model.
- Spending Statistics: Generates spending statistics and visualizations (e.g., monthly spending, category breakdown).
- Customizable Categories: Allows users to create and manage custom spending categories.
- Statement History: Stores processed bank statements and transaction data for historical analysis. Uses Cloud SQL to store all the data.
- Report Generation: Generates downloadable reports of spending statistics in various formats (e.g., PDF, CSV).

## Style Guidelines:

- Primary color: Deep blue (#FFEB3B) to inspire confidence and security in handling financial data.
- Background color: Very light blue (#E8EAF6), almost white, to ensure a clean, uncluttered interface.
- Accent color: A bright, complementary yellow (#FFEB3B) for highlights, key actions, and data visualizations.
- Body and headline font: 'Inter' sans-serif font. Clean, modern, and highly readable for both headings and body text.
- Code font: 'Source Code Pro' for displaying extracted text or any code snippets.
- Use simple, outline-style icons for categories and actions, ensuring clarity and ease of understanding.
- A clean, card-based layout to organize information. Prioritize key metrics and visualizations on the dashboard.
- Subtle transitions and animations for loading data and navigating between views. Enhance user experience without being distracting.