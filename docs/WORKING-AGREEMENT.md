How we actually worked with our genAI teammate

We did not write a formal protocol during the Architecture Investigation. Our early practice was informal: we pasted in whatever seemed relevant (the CI workflow file, a teammate’s QA report, the README) and asked questions as they came up. [If you had any informal expectations at the time, such as “use it to check our work,” add them here and label them as informal.]

What went wrong without a protocol

The AI bundled steps that weren’t all needed right away (branch commands, CI changes, and optional branch protection in one block), and we had to ask whether they were necessary right now.
When we pasted Erik’s report with no question, it guessed at our intent. It also referred to a battle.js output and an image that were never in the conversation.
It gave advice based on TutorialPage while our README says to branch off dev, and we hadn’t reconciled the two.

What we changed and why

After those problems, we wrote an onboarding prompt from the README. It sets the project constraints (vanilla JS, lowercase image names, saves only through SC.save) and working rules: read before writing, say what’s an assumption, label steps “do now” or “do later,” don’t invent ids or file names, and say how to verify each change. We made the change because the failures could have led to wrong edits, such as fixing an id that doesn’t exist.
