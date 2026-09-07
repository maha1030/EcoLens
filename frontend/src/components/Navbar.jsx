import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="border-b border-gray-800 bg-[#0B0F0D]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="text-xl">🌍</span>

          <span>
            EcoPromise{" "}
            <span className="text-emerald-400">AI</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/projects"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Projects
          </Link>

          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            to="/projects/create"
            className="rounded-lg border border-emerald-500/60 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-black"
          >
            Create Project
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;