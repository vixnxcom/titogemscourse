import { ArrowRight } from "lucide-react";

export default function WelcomeScreen({ onContinue }) {
  return (
    <main className="journey-welcome" aria-labelledby="journey-welcome-title">
      <div className="journey-welcome-content bg-copy">
        <p className="eyebrow">TitoGems Student Portal</p>
        <h1 id="journey-welcome-title" className="gallant-bold ">
          WELCOME TO YOUR JOURNEY OF GROWTH
        </h1>

        <p>
          You are about to begin a journey of self-discovery, mindset
          transformation and intentional growth.
        </p>
        <p>
          This course is designed to help you understand yourself better,
          challenge limiting beliefs, build confidence, develop productive
          habits, set meaningful goals and take purposeful action toward the
          life you want to create.
        </p>

        <p className="journey-emphasis">Your growth is your responsibility.</p>
        <p>
          So, don&apos;t rush through the lessons. Take time to reflect, complete
          each activity honestly, and apply what you learn to your everyday
          life.
        </p>

        <h2>HOW THE COURSE WORKS</h2>
        <p>
          Once your enrollment is confirmed, Week 1 will become available
          immediately. Each subsequent week will unlock every 7 days after you
          successfully complete the previous week&apos;s quiz.
        </p>
        <p>Come prepared to learn, reflect, act and grow.</p>
        <p className="journey-signoff">Your life is your brand. Build it intentionally.</p>

        <button className="primary-button journey-continue" type="button" onClick={onContinue}>
          View dashboard
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
