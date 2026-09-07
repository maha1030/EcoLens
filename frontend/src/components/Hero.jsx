import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-6">
      
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <span className="text-xs font-medium tracking-[0.18em] text-emerald-400">
            AI-POWERED ENVIRONMENTAL INTELLIGENCE
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl">
          Choose Environmental Projects
          <br />
          Based on{" "}
          <span className="text-emerald-400">
            Evidence, Not Promises.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
          EcoPromise AI helps companies evaluate environmental projects
          using measurable progress, evidence analysis, risk detection,
          and AI-powered outcome prediction.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          
          <Link
            to="/projects"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Explore Projects →
          </Link>

          <Link
            to="/projects/create"
            className="rounded-xl border border-gray-700 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400"
          >
            Submit a Project
          </Link>

        </div>

      </div>
    </section>
  );
}

export default Hero;