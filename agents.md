# AGENTS.md

## Project Overview

This project is a **Dynasty Fantasy Football Trade Calculator** built with **Next.js, TypeScript, TailwindCSS, and Supabase**.

The goal is to create a **highly SEO-optimized web tool** that calculates dynasty fantasy football player values and analyzes trades between two teams.

The application will eventually include:

* Dynasty trade calculator
* NFL player value rankings
* Player value history graphs
* Trade evaluation explanations
* Historical trade storage
* SEO landing pages for organic traffic

Primary objective: **Build a scalable calculator tool that can rank on Google and be monetized.**

---

# Tech Stack

Frontend

* Next.js (App Router)
* TypeScript
* TailwindCSS
* ShadCN UI

Backend

* Supabase (Postgres database)
* Supabase API
* Edge functions when necessary

Charts

* Recharts

External APIs

* NFL player data API for roster updates

Deployment

* Vercel

---

# Core Product Features

## Dynasty Trade Calculator

Users can:

* Add players to **Team A**
* Add players to **Team B**
* Adjust **league settings**
* Analyze trade fairness

The system returns:

* Team value totals
* Trade fairness result
* Explanation of why a trade favors a team

---

# Player Value System

Player values range between **1 and 100**.

Values are determined using multiple calculation layers.

### Base Value

Each player has a base ranking score.

Example:

Patrick Mahomes (KC) – QB – 98

---

# Value Adjustment Factors

Values are adjusted dynamically using these factors.

### Age Curve

22–26 → +3
27–29 → +1
30–32 → −2
33+ → −5

### Injury Adjustment

Healthy → 0
Minor Injury → −2
Major Injury → −6

### Starter Status

Starter → +3
Backup → −4

### Position Value

QB / RB / WR / TE positional weighting depending on league settings.

---

# Calculation Models

The calculator combines three models:

### Rank-Based Curve

Transforms base rankings into tiered value differences.

### Projection Adjustment Curve

Adjusts values using expected future performance.

### VORP (Value Over Replacement Player)

Measures value relative to a replacement-level player.

Final value formula:

Final Value =
Base Value

* Age Adjustment
* Injury Adjustment
* Schedule Adjustment
* Position Adjustment
* Starter Bonus
* Projection Adjustment

Values must be **clamped between 1 and 100**.

---

# League Settings

The calculator must support the following league formats:

### QB Format

1QB
2QB
Superflex

### Scoring Format

Standard
Half PPR
PPR

### League Size

12 Teams
18 Teams
24 Teams
32 Teams

League settings dynamically adjust positional value.

Example:

Superflex increases QB importance.

---

# Database Structure (Supabase)

## players

id
name
team
position
age
base_value
starter_status

---

## player_value_history

player_id
month
value

Stores monthly player value movement.

---

## trades

id
team_a_players
team_b_players
league_settings
trade_result
created_at

Stores historical trades for analytics.

---

# Player Data Rules

Player names should include team abbreviation.

Example:

Justin Jefferson (MIN)
Josh Allen (BUF)

This improves **SEO and usability**.

---

# UI Design Principles

The application must use **modern card-based UI**.

Required components:

PlayerCard
TradeComparisonCard
LeagueSettingsPanel
PlayerSearchModal
TradeResultCard
ValueBreakdownCard

Design requirements:

* clean spacing
* rounded cards
* subtle shadows
* mobile-first responsive layout
* interactive UI

---

# SEO Architecture

Pages required:

/dynasty-trade-calculator
/nfl-player-values
/player/[player-name]
/player-value-trends
/how-this-calculator-works
/about

SEO rules:

* semantic HTML
* metadata for every page
* structured data where possible
* static generation when possible
* fast loading performance

---

# Trade Explanation Engine

The calculator must explain trade results.

Example output:

Team A Wins Because:

* Higher positional value
* Younger player core
* Better VORP score
  − Slight injury risk

Reasons should be derived from the calculation factors.

---

# API Integration

External APIs will update:

* player teams
* roster changes
* depth charts

Data must sync with Supabase regularly.

---

# Development Rules

When implementing features:

1. Keep components modular.
2. Separate logic from UI.
3. Store calculation logic in `/lib/calculations`.
4. Store API functions in `/lib/api`.
5. Store database queries in `/lib/db`.

Folder structure should remain clean and scalable.

---

# Future Features

Planned improvements include:

* AI trade suggestions
* weekly value updates
* dynasty rookie rankings
* trade analyzer reports
* public trade sharing
* dynasty tier lists

---

# Development Philosophy

This project follows a **vibe coding approach**:

* Build gradually
* Validate features early
* Keep code modular
* Maintain SEO focus
* Prioritize performance

The project must always prioritize:

* clean architecture
* SEO optimization
* scalability
* mobile experience
