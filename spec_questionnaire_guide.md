# Interactive Spec Questionnaire Guide

*This document serves as the guide for the AI assistant when a new application is initiated. Give this file to the AI assistant alongside the `hybrid_spec_template.md` to trigger the interactive scoping process.*

---

## Instructions for the Assistant
When the user provides this guide and the template to start a new application specification, ask the following **5-Step scoping questionnaire**. Ask them one step at a time (or as a structured group) to avoid overwhelming the user, and use the responses to fully generate the completed `hybrid_spec_template.md` for their new app.

---

## Phase 1: High-Level Overview & Objectives
1. **Application Name**: What is the name of the new application?
2. **Project Scope**: What is the main purpose/goal of the application?
3. **Problem Statement**: What specific problem does it solve for users or the business?
4. **Key Features**: What are the 3-5 core features of the MVP?
5. **Target Audience**: Who are the primary user cohorts?

## Phase 2: Functional Details & User Flow
1. **User Personas**: Describe the main personas (e.g., their background, goals, technical skills, and pain points).
2. **Guided Workflows**: Are there step-by-step processes the app guides users through (like the debt collection workflow in the Debt SaaS)? If so, list the steps.
3. **Document Templates**: Will this app generate dynamic documents (e.g., invoices, reports, letters)? What templates are needed?

## Phase 3: Technical Stack & Exemptions
1. **Standard Tech Stack**: By default, the app uses Next.js App Router (TypeScript, TailwindCSS), .NET 10 Web API (C#, EF Core, ASP.NET Core Identity + JWT), React Native (Expo) for mobile, and Azure SQL/SQLite.
   - Do you plan to adhere 100% to this Comzera Unified Tech Stack?
   - If not, what are the deviations, and has Dian Marx pre-approved them?
2. **Scale**: Will the app serve a small volume (allowing SQLite with persistence container volume warning) or is it a larger enterprise system requiring Azure SQL Database?
3. **Mobile Requirement**: Does this application require a mobile companion app (React Native/Expo)?

## Phase 4: Database Schema & API
1. **Domain Entities**: What are the main nouns/objects we need to track in the database (e.g., Records, Bookings, Shipments, Invoices)?
2. **API Requirements**: Are there external APIs or services we must integrate with (e.g., SendGrid, third-party payment gateways, custom systems)?

## Phase 5: POPIA & Security Compliance
1. **Personal Information**: What personal details (names, emails, ID numbers, locations, etc.) will the application process?
2. **Lawful Basis & Retention**: For each type of personal data, what is the justification, and how long does it need to be kept to comply with POPIA?
