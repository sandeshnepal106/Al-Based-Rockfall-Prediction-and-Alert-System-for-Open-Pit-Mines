import React from 'react'

const header = () => {
  return (
      <header className="w-full bg-slate-900/50 backdrop-blur-xl border-b border-slate-700 mb-8">
    <nav className="container mx-auto flex justify-between items-center py-4 px-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
        ⛰️ Rockfall AI Prediction
      </h1>
      <ul className="flex space-x-6">
        <li>
          <a href="#" className="text-white hover:text-cyan-300 transition-colors">
            Home
          </a>
        </li>
        <li>
          <a href="#" className="text-white hover:text-cyan-300 transition-colors">
            About
          </a>
        </li>
        <li>
          <a href="#" className="text-white hover:text-cyan-300 transition-colors">
            Contact
          </a>
        </li>
      </ul>
    </nav>
  </header>
  )
}

export default header
