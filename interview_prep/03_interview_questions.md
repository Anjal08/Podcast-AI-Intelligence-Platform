# Interview Questions & Answers

Use this guide to prepare for technical deep-dives during your interview.

### Q1: Why did you choose FastAPI over Django or Flask for the backend?
**Answer:** "I chose FastAPI primarily for its built-in support for asynchronous programming (`async/await`) and Background Tasks. Processing audio and running AI models is heavily I/O and CPU bound. FastAPI allows me to immediately return a task ID to the client without blocking the main event loop. Additionally, it natively supports Pydantic for data validation and auto-generates Swagger documentation, which sped up development."

### Q2: How does your Chat feature work? Do you send the entire podcast to the LLM?
**Answer:** "No, sending a 2-hour podcast to an LLM would exceed token limits and be very expensive. I implemented a RAG (Retrieval-Augmented Generation) pipeline. During processing, every sentence is vectorized. When a user asks a question, I vectorize their query, run a cosine similarity search against the transcript, grab the top 5 most relevant sentences, and inject only those sentences into the LLM's prompt. This makes the chat fast, cheap, and highly accurate."

### Q3: How do you figure out where chapters begin and end in the audio?
**Answer:** "I use a mathematical approach rather than just relying on an LLM. I use `sentence-transformers` to turn every sentence into a vector. As the podcast progresses, I measure the cosine similarity between consecutive sentences. If the speakers change topics, the semantic meaning shifts, causing a sharp dip in the cosine similarity score. I detect these 'dips' as chapter boundaries. It's much faster and cheaper than asking an LLM to read the whole text."

### Q4: I noticed you are using Groq for the LLM. Why Groq instead of OpenAI?
**Answer:** "Groq uses specialized hardware (LPUs) that make inference incredibly fast—often returning hundreds of tokens per second. Because I need to generate summaries and answer chat questions in real-time for the user interface, minimizing latency was a top priority for the user experience."

### Q5: How did you handle CORS issues between React and your API?
**Answer:** "In development, React runs on port 3000 and FastAPI on 8000. Browsers block cross-origin requests for security. I solved this by importing `CORSMiddleware` in FastAPI and attaching it to the `app`, explicitly allowing `allow_origins=["*"]` (which I would restrict to the production domain before deploying)."

### Q6: What was the hardest bug you had to fix in this project?
**Answer:** "Handling Unicode exceptions on Windows. The backend crashed because a library was trying to print an emoji (`🔹`) to the Windows terminal, which defaulted to a `cp1252` encoding instead of UTF-8. It instantly killed the background task. I learned the importance of safe logging and sanitizing terminal outputs, and ensuring uniform UTF-8 encoding across environments."

### Q7: If you had 2 more weeks, what would you add to this project?
**Answer:** 
1. "I would add **Speaker Diarization** (using a model like PyAnnote) so the transcript explicitly says 'Speaker 1' and 'Speaker 2' instead of just a block of text."
2. "I would move the vector embeddings into a proper **Vector Database** like Pinecone or Qdrant. Right now they are stored in memory per session. With a Vector DB, users could search across *all* their past podcasts simultaneously."
3. "User Authentication using JWTs so users can save their historical podcast analyses."

### Q8: How did you manage State in React?
**Answer:** "I used the React Context API. I created an `AnalysisContext` to hold the uploaded file data, the task ID, and the final processed JSON results. This allowed me to easily share the data across the Dashboard, Transcript, and Chat pages without having to 'prop-drill' massive objects down the component tree."

To prepare for a tough interview, you need to expect "Trade-off Questions." Senior engineers don't just want to know how you built it; they want to know why you chose those specific tools and what the alternatives were. A good engineer knows that no tool is perfect—every choice has a trade-off.

Here are the most common "Cross Questions" (Why X over Y?) you should prepare for, and how to defend your choices:

1. The Backend Choice: "Why FastAPI and not Node.js/Express or Django?"
The Interviewer's Cross Question: "Your frontend is in React (JavaScript). Wouldn't it have been easier to just use Node.js/Express for the backend so your whole stack is in one language?"
How to Defend It: "If this were a standard CRUD app, yes, Node.js would be perfect. But this is an AI application. Python is the undisputed king of the AI/ML ecosystem. Using FastAPI allowed me to natively import sentence-transformers, torch, and whisper directly into my backend without having to build a messy bridge between a Node.js server and separate Python scripts. I chose FastAPI specifically over Django because FastAPI is fundamentally built on asyncio, which is crucial for handling long-running background tasks (like a 5-minute audio transcription) without blocking the server."
2. The Database / State Choice: "Where is the Database?"
The Interviewer's Cross Question: "I noticed you are keeping the tasks and embeddings in a Python dictionary in memory. What happens when your server restarts or if you have 10,000 users?"
How to Defend It (Admit the limitation!): "You're absolutely right, an in-memory dictionary won't scale and is purely for this MVP version to reduce infrastructure complexity. In a production environment, I would decouple this. I would use Redis to store the task statuses so the frontend can poll a fast cache. For the transcript data and vectors, I would use a PostgreSQL database with pgvector or a dedicated vector database like Pinecone/Qdrant. This would allow users to log in, see their historical podcasts, and even do cross-podcast RAG searches."
3. The RAG & Segmentation Choice: "Why not just give the whole transcript to Llama-3?"
The Interviewer's Cross Question: "Models like Claude 3.5 or Gemini 1.5 have massive 1-million-token context windows now. Why bother with the complex Sentence-Transformer cosine-similarity math for segmentation and RAG? Why not just dump the whole transcript into the prompt and say 'summarize this into chapters'?"
How to Defend It: "Two reasons: Latency and Cost. While large context windows exist, processing 100,000 tokens of audio transcript takes a long time and is incredibly expensive per API call. By doing the semantic chunking locally for free using lightweight Sentence-Transformer math, I only send small, highly-targeted text chunks to the LLM. This keeps my API costs near zero and makes the user's Chat experience lightning fast. As an engineer, I believe in optimizing compute."
4. The Frontend Styling: "Why Vanilla CSS instead of Tailwind CSS?"
The Interviewer's Cross Question: "Tailwind is the industry standard right now. Why did you choose to write custom Vanilla CSS variables for your styling?"
How to Defend It: "I wanted complete, un-abstracted control over the design system to achieve a very specific 'premium' aesthetic with custom blur effects, micro-animations, and glassmorphism. By utilizing CSS variables (--color-primary, --color-surface), I created a robust design token system that makes it incredibly easy to add a Light Theme later just by swapping out a few variables at the root level, without polluting my React components with massive utility-class strings."
💡 Pro-Tip for the Interview: "The Rule of Trade-offs"
If an interviewer asks you about a technology choice, never say "because it's the best." Always answer with the formula:

"I chose [Tool A] because it gave me [Benefit], which was important for this specific app. The trade-off is that we sacrifice [Drawback of Tool A], but for this use-case, that was an acceptable compromise compared to using [Tool B]."

If you can talk like that, they won't just see you as a junior developer who followed a tutorial—they will see you as a Software Engineer who makes calculated architecture decisions.