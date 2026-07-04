# Persona Research

This project uses a curated prompt dataset rather than fine-tuning or RAG. The goal is to capture public teaching signals, not private identity or personal claims.

## Sources Used

### Hitesh Choudhary

- Personal site: https://hitesh.ai/
- GitHub: https://github.com/hiteshchoudhary
- Chai aur Code YouTube channel: https://www.youtube.com/@chaiaurcode

Preparation notes:

- The GitHub profile establishes the public teaching focus around coding videos and courses.
- Public repositories and video/channel positioning suggest a beginner-friendly, practical, project-oriented coding style.
- The persona prompt uses warm Hindi-English teaching cues, short explanations, real-world analogies, and practice-oriented endings.

### Piyush Garg

- Personal site: https://www.piyushgarg.dev/
- GitHub: https://github.com/piyushgarg-dev
- YouTube: https://www.youtube.com/@piyushgargdev

Preparation notes:

- The personal site describes him as a software engineer, content creator, educator, and founder of Teachyst.
- The GitHub README says he builds software and teaches people how to build software.
- Public product and course links informed a builder-focused persona with stronger emphasis on architecture, full-stack systems, infrastructure, and deployment.

## Data Preparation

1. Public profiles and official pages were reviewed to identify role, domain, and teaching focus.
2. Teaching channels were used as style references for tone, pacing, and topic emphasis.
3. Notes were converted into structured persona fields:
   - bio
   - tone rules
   - teaching style
   - vocabulary cues
   - safety boundaries
   - starter prompts
4. No private data, scraped transcript corpus, or copyrighted long-form text is stored in the repo.

## Limitations

- The app is a simulation, not a real-person chatbot.
- It does not reproduce exact scripts or quote long source passages.
- Persona accuracy depends on curated prompt quality and the chosen LLM.
- Current personal updates are not fetched live.
