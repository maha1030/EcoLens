function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-gray-800 bg-white/[0.02] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]">
      
      {/* Icon */}
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold tracking-tight text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-sm leading-6 text-gray-400">
        {description}
      </p>

    </div>
  );
}

export default FeatureCard;