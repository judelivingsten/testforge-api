# TestForge API

An AI-powered test case generator built with Node.js and Claude AI.

## What It Does
- Accepts user stories via text or Word/PDF document upload
- Uses Claude AI to generate comprehensive test cases automatically
- Covers positive, negative, and edge case scenarios
- Exports test cases as Excel files
- Built-in API key security and rate limiting

## Tech Stack
- Node.js + Express
- Anthropic Claude AI API
- ExcelJS for Excel export
- Mammoth for Word document parsing
- PDF-Parse for PDF parsing

## API Endpoints
- POST /api/v1/generate — Generate from text
- POST /api/v1/generate/file — Generate from file upload
- POST /api/v1/export/excel — Export as Excel

## Built By
Jude Livingsten | Senior Business Systems Analyst
