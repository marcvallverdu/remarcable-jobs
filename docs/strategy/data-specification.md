# FindOperators - Data Specification

## Overview
This document specifies all data points needed to create rich, operator-focused company profiles on FindOperators. Data points are organized by category for easy reference when building data collection systems.

## 1. Company Core Data

### Basic Information
- Company name
- Website URL
- Logo URL
- Tagline/one-liner
- Year founded
- Headquarters location
- Office locations (all)
- Company domain/URL

### Industry & Classification
- Primary industry
- Sub-industry/vertical
- Business model (B2B, B2C, marketplace, SaaS, etc.)
- Operational complexity tags (regulated, logistics, fintech, hardware)
- Tech stack/primary technologies

## 2. Growth & Traction Signals

### Funding Data
- Latest funding round type (Seed, Series A-E)
- Latest funding amount
- Latest funding date
- Total funding raised
- Valuation (if public)
- Lead investors (latest round)
- All investors (complete list)
- Board members

### Growth Metrics
- Employee count (current)
- Employee count (6 months ago)
- Employee count (12 months ago)
- Employee growth rate (6-month)
- Employee growth rate (12-month)
- Headcount by department
- Recent senior hires (last 6 months)
- Open roles count

### Business Metrics (where available)
- ARR tier (<$1M, $1-10M, $10-50M, $50M+)
- Growth rate (MoM, QoQ, YoY)
- Customer count/tier
- Market share position
- NPS/customer satisfaction scores

## 3. Expansion & Strategic Data

### Geographic Expansion
- Countries currently operating in
- Cities with offices
- Markets launched (last 12 months)
- Planned market entries
- International revenue %
- Languages supported

### Product/Service Expansion
- Core product/service
- Product lines/verticals
- Recent product launches
- Planned product expansions
- Platform integrations
- API/developer ecosystem

### Strategic Initiatives
- Recent acquisitions
- Partnership announcements
- Major customer wins
- Regulatory approvals/licenses
- Awards/recognition

## 4. Operational Characteristics

### Work Culture & Practices
- Remote work policy (fully remote, hybrid, office-first)
- Flexible work arrangements
- Meeting culture (async-first, meeting-heavy)
- Documentation practices
- Communication tools used
- Decision-making speed
- Performance review cycle

### Tech & Tools
- Engineering languages/frameworks
- Data stack
- Cloud providers
- Productivity tools
- CI/CD practices
- Security certifications

### Company Stage Indicators
- Product-market fit status
- Profitability status
- Burn rate tier
- Runway (months)
- Key business risks
- Competitive positioning

## 5. Team & Leadership Data

### Leadership Team
- CEO name and background
- C-suite composition
- VP/Director level leaders
- Previous companies (for each leader)
- LinkedIn profiles
- Years at company
- Notable achievements

### Team Composition
- Engineering team size
- Product team size
- Sales team size
- Operations team size
- Support team size
- Geographic distribution
- Diversity metrics (if public)

### Advisory & Governance
- Board composition
- Independent directors
- Advisors
- Investor board seats
- Board meeting frequency

## 6. Role-Specific Data (Per Job/Mandate)

### Mandate Definition
- Role title
- Mandate summary (one line)
- 90-day objectives
- 6-month objectives
- 12-month objectives
- 18-month objectives
- Success metrics/KPIs

### Ownership & Authority
- Budget authority ($)
- Hiring authority (headcount)
- P&L responsibility
- Decision rights
- Reporting structure
- Key stakeholders
- Cross-functional partners

### Requirements & Preferences
- Must-have experience
- Nice-to-have experience
- Industry background preferences
- Language requirements
- Travel requirements
- Location flexibility

### Compensation & Benefits
- Salary range
- Equity range
- Equity type (options, RSUs)
- Benefits overview
- Perks/allowances
- Promotion timeline
- Performance bonus structure

## 7. Challenge & Opportunity Data

### Current Challenges
- Operational bottlenecks
- Market challenges
- Technical debt
- Competitive pressures
- Regulatory hurdles
- Unit economics issues
- Growth plateaus

### Opportunities
- Market size (TAM/SAM/SOM)
- Expansion potential
- Product-market gaps
- Competitive advantages
- Network effects potential
- Platform opportunities

## 8. External Validation & Evidence

### Media & PR
- Recent press coverage
- Podcast appearances
- Conference talks
- Blog posts
- Case studies
- Industry reports mentioning company

### Social Proof
- Customer testimonials
- Customer logos
- Partner endorsements
- Investor quotes
- Industry analyst coverage
- User reviews/ratings

### Performance Evidence
- Public metrics/milestones
- Growth announcements
- Award wins
- Certifications
- Rankings/lists inclusion
- Patents/IP

## 9. Competitive & Market Context

### Competitive Landscape
- Main competitors
- Competitive advantages
- Market position
- Differentiation factors
- Pricing position
- Win/loss reasons

### Market Dynamics
- Market growth rate
- Market maturity
- Regulatory environment
- Technology trends affecting business
- Customer behavior shifts
- Supply chain factors

## 10. Cultural & Values Indicators

### Company Values
- Stated values
- Cultural principles
- Mission statement
- Vision statement
- ESG/sustainability initiatives
- DEI commitments

### Employee Sentiment (from reviews)
- Glassdoor rating
- eNPS score
- Common pros mentioned
- Common cons mentioned
- CEO approval rating
- Recommend to friend %

## Data Priority Tiers

### Tier 1 - Essential (Must Have)
- Company basics (name, website, logo)
- Latest funding information
- Current employee count and growth
- Industry/vertical
- Headquarters location
- Role title and mandate summary
- Salary range

### Tier 2 - Important (Should Have)
- Full funding history
- Leadership team profiles
- Geographic presence
- Growth metrics
- Tech stack
- Recent press/announcements
- Benefits and equity

### Tier 3 - Enhanced (Nice to Have)
- Detailed team composition
- Customer logos
- Employee sentiment scores
- Competitive analysis
- Market dynamics
- Cultural indicators
- Advisory network

## Data Freshness Requirements

### Real-Time Updates (Daily)
- Open roles/mandates
- Funding announcements
- Major news/press

### Weekly Updates
- Employee count
- Leadership changes
- New market launches

### Monthly Updates
- Growth metrics
- Team composition
- Customer wins

### Quarterly Updates
- Market analysis
- Competitive landscape
- Cultural indicators

## Data Quality Standards

### Accuracy
- Verify from multiple sources when possible
- Flag uncertain data
- Date-stamp all data points
- Track data source

### Completeness
- Minimum viable profile = Tier 1 complete
- Target profile = Tier 1 + 2 complete
- Premium profile = All tiers complete

### Consistency
- Standardize formats (dates, numbers, etc.)
- Use consistent categorization
- Apply same methodology across companies

## Notes for Implementation

1. **Start with publicly available data** - LinkedIn, Crunchbase, company websites, news
2. **Build incrementally** - Focus on Tier 1 first, then expand
3. **Automate where possible** - APIs and scraping for scale
4. **Validate regularly** - Set up alerts for data changes
5. **Track coverage** - Monitor which data points have highest/lowest coverage
6. **Prioritize by impact** - Focus on data that most influences operator decisions