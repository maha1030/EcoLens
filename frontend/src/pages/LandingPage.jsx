import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";

function LandingPage() {
  const features = [
    {
      icon: "📈",
      title: "Progress Analysis",
      description:
        "Compare expected progress against actual environmental outcomes and identify performance gaps early.",
    },
    {
      icon: "⚠️",
      title: "Risk Detection",
      description:
        "Detect unusual patterns and identify environmental projects that may be falling behind schedule.",
    },
    {
      icon: "🔮",
      title: "Outcome Prediction",
      description:
        "Estimate whether a project is likely to achieve its environmental targets within the planned timeline.",
    },
  ];

  return (
    <>
      <Hero />

      {/* Features Section */}
      <section className="border-t border-gray-800 px-6 py-24">
        
        <div className="mx-auto max-w-7xl">
          
          {/* Section heading */}
          <div className="mx-auto mb-14 max-w-2xl text-center">
            
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              How It Works
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              From Promises to{" "}
              <span className="text-emerald-400">
                Measurable Progress
              </span>
            </h2>

            <p className="mt-5 leading-7 text-gray-400">
              EcoPromise AI transforms environmental project claims into
              measurable insights that companies can use to make better
              sustainability decisions.
            </p>

          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}

          </div>

        </div>

      </section>
    </>
  );
}

export default LandingPage;