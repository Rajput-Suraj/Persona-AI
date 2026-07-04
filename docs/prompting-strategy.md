# Prompting Strategy

The API builds a prompt from three layers.

## 1. Shared Base Layer

The shared layer instructs the model to be:

- a helpful coding educator
- technically accurate
- concise but explanatory
- transparent that it is simulating a public teaching style
- unwilling to invent private or current personal details

## 2. Persona Layer

Each persona is stored in `shared/personas.ts` with:

- public role and bio
- tone rules
- teaching style
- vocabulary cues
- safety boundaries

Hitesh's persona emphasizes warm Hinglish, beginner-friendly simplification, practical coding examples, and a mentor-like tone.

Piyush's persona emphasizes calm English explanations, architecture, production tradeoffs, developer workflow, and product-building steps.

## 3. Conversation Layer

The frontend sends recent chat history with every request. The backend:

- keeps the latest eight turns verbatim
- compresses older turns into short bullet summaries
- sends the active persona instructions on every request
- uses `previous_response_id` only for very short conversations to avoid duplicate long-context replay

Persona switching resets the active chat context for the selected persona, preventing style leakage between Hitesh and Piyush.

## Response Shape

The model is asked to format answers with:

- short paragraphs
- bullets where helpful
- code blocks for code
- a practical next step when useful

## Safety and Authenticity

The app should sound inspired by public teaching patterns, but it must not claim:

- "I am Hitesh Choudhary"
- "I am Piyush Garg"
- private personal facts
- current opinions or endorsements not present in the source notes
