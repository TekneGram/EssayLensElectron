# EssayLens
Read what this app is about before implementing anything.
Then follow the instructions to implement the relevant phase.

## What is EssayLens tech stack?
- This app is an electron app.
- Electron will handle the database.
- Tanstack will manage state in the front end.
- React with vite will provide the UI and component states
- Python is spawned in the backend to handle all LLM interactions. Python does not need to touch the database
- TypeScript is used everywhere in electron.

## Product Description
- This is a product for teachers to grade second language essays, focusing particularly on English.
- The teacher can select a folder on their own system which will contain student writing in either .docx or .pdf files. However, images can also be handled using OCR models and multi-modal projections.
- The teacher can select a file, displayed in the UI, and the students' writing will be rendered into the UI.
- The teacher can add block comments to the student's writing.
- The teacher can highlight certain parts of the file and add inline comments to the student's writing.
- The teacher can select a rubric from a list of rubrics and apply it to a project
- The teacher can design and create a rubric.
- The teacher can give an essay a score through the rubric.
- The teacher can send the essay to the LLM for block feedback.
- The teacher can send extracts of the essay to the LLM for inline feedback.
- The teacher can generate a feedback document which contains the student's original writing and both the inline and block comments, saved to disk.

## App workflow
1. The teacher selects the folder in the FileControl area - this updates the database filepath table.
2. When the teacher selects the folder, an algorithm loops through folders recursively down to two layers, looking for .docx, .pdf and image
  files and updates the filename table and if its an image, the image table, too. This allows us to display the file names in the
  FileDisplayBar. The ChatViewer displays a message e.g. "Great! We're now working in the folder" + folder name, and this updates the chat
  table. (not a real chat with an LLM, but simulating one)
3. Teacher can click on a filename in the FileDisplayBar. This opens up the document, gets the text out of it and renders it to the
  OriginalTextView. Nothing is updated on the database here. The chat displays some information about the text (e.g., "Are you ready to assess
  this essay? Let's do it!") and this updates the chat table in the database and ChatViewer. 
4. The teacher adds some feedback to the essay using the ChatInterface (with a specific feedback command). This is sent to the database and
  updates the feedback table. The CommentsView is also updated with the comment. (There are two types of comment, inline and block, but that is
  not important right now).
5. The teacher uses the ChatInterface to request an LLM assessment. The LLM returns some feedback, which is updated in the feedback table in
  the database, and the CommentsView is updated with the LLM comment. The ChatViewer also displays "comments added", updating the chat table in
  the database.
6. The teacher selects the RubricTab. This pulls in the rubric information from the rubrics table in the database.
7. The teacher selects one of the rubrics and this brings in information from rubric_details and rubric_scores which are combined in the
  front end to create the rubric layout.
8. The teacher edits the rubric by adding a new category and an extra score level. This is updated in the rubric_details and rubric_scores
  tables in the database. The chat notifies the user of the update, thus updating the chat table.
9. The teacher decides to chat with the LLM through the ChatInterface about the essay and get advice. The essay is sent to the LLM with the
  teacher's question. The LLM gives feedback, and this updates the ChatViewer with the information, as well as the chat table in the database.
10. The teacher selects the ScoreTool in the CommentsView which reveals the rubric in a ready-to-grade form. The teacher selects some cells
  from the rubric, thereby applying a score. This information updates the database tables file_rubric_instances and file_rubric_scores. The
  chat is also updated.
11. The teacher clicks to generate the feedback file in the OriginalTextView or through the ChatInterface. The feedback table and
  file_rubric_instances and file_rubric_scores tables are accessed and used to update the student's document, creating a new word document that
  is output to the folder specified by the information from filepath and filename tables.

   ## Delivery Mode: Phase-by-Phase (Round 2)

  For the phase requested:
  1. Read `10_Round2_phased_design.md`, read the mini spec and identify information about the phase requested.
  2. Read the listed spec files under the References part of the phase requested in step 1.
  3. Implement only that phase scope.
  4. Stop and summarize.
  5. Write a summary report in .planning called Phase{number}_report.md which explains what was done in order to hand off to the next phase. (Replace {number} with the phase number).
  6. Wait for user confirmation before next phase.

  Do not continue to next phase automatically.

  ## Git Policy Per Phase
  Output a set of git commands that I can copy and paste into the terminal, including add, commit, push and pull request using gh.
  - In the commit include the phase number. Give details in the body.
  - Open/update PR after each phase.
