import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaMusic, FaFootballBall, FaLaptopCode, FaFilm, FaTheaterMasks, FaGraduationCap, FaUsers, FaArrowRight, FaStar, FaFire, FaMoon, FaSun, FaChevronRight, FaHome, FaSearch, FaInfoCircle, FaEnvelope, FaBars, FaTimes } from 'react-icons/fa'
import { GiPartyPopper, GiTrophy } from 'react-icons/gi'

// Enhanced Particle Background Component
const ParticleBackground = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, 255, ${Math.random() * 0.3 + 0.1})`
    }))
    setParticles(newParticles)

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: (p.x + p.speedX + 100) % 100,
        y: (p.y + p.speedY + 100) % 100
      })))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #8881 1px, transparent 1px),
                           linear-gradient(to bottom, #8881 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Moving particles */}
      {particles.map(particle => (
        <div 
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px ${particle.color}`,
            transition: 'all 0.1s linear'
          }}
        ></div>
      ))}
      
      {/* Floating blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  )
}

// Login Page Component (Placeholder for other developer)
const LoginPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <ParticleBackground />
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center animate-float">
          <FaCalendarAlt className="text-white text-3xl" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Login/Signup Page</h1>
        <p className="text-gray-400 mb-8">
          This page will be built by another developer. You'll be able to login or create an account here.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

// Main Landing Page Component
const LandingPage = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const eventCategories = [
    { icon: <FaLaptopCode />, title: "Tech Events", desc: "Hackathons, coding contests, tech talks", color: "from-blue-500 to-cyan-400" },
    { icon: <FaFootballBall />, title: "Sports", desc: "Football, cricket, basketball tournaments", color: "from-emerald-500 to-green-400" },
    { icon: <FaMusic />, title: "Musical Nights", desc: "Concerts, DJ nights, band performances", color: "from-pink-500 to-rose-400" },
    { icon: <FaFilm />, title: "Movie Nights", desc: "Campus screenings and film clubs", color: "from-violet-500 to-purple-400" },
    { icon: <GiTrophy />, title: "Competitions", desc: "Quizzes, debates, case competitions", color: "from-amber-500 to-yellow-400" },
    { icon: <FaTheaterMasks />, title: "Cultural Events", desc: "Festivals, drama, dance competitions", color: "from-orange-500 to-red-400" },
    { icon: <FaGraduationCap />, title: "Workshops", desc: "Skill sessions and learning events", color: "from-indigo-500 to-blue-400" },
    { icon: <GiPartyPopper />, title: "Shows & Performances", desc: "Stand-up comedy, open mics, talent shows", color: "from-teal-500 to-emerald-400" },
  ]

  const testimonials = [
    { name: "Alex Chen", role: "CS Major", text: "Found my first hackathon through EVENTIX and won! Campus life just got 10x better.", emoji: "🚀" },
    { name: "Maya Rodriguez", role: "Dance Team Captain", text: "Our cultural fest registration tripled after listing on EVENTIX. Game changer!", emoji: "💃" },
    { name: "Jordan Smith", role: "Student President", text: "Managing campus events has never been easier. The platform just works.", emoji: "👑" },
  ]

  return (
    <div className="min-h-screen">
      <ParticleBackground />
      
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                EVENTIX
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition group">
                <FaHome className="text-sm" />
                <span className="font-medium">Home</span>
              </Link>
              <button 
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition group"
              >
                <FaSearch className="text-sm" />
                <span className="font-medium">Discover</span>
              </button>
              <button 
                onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition group"
              >
                <FaInfoCircle className="text-sm" />
                <span className="font-medium">About</span>
              </button>
              <button 
                onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition group"
              >
                <FaEnvelope className="text-sm" />
                <span className="font-medium">Contact</span>
              </button>
            </div>
            
            {/* Right side buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition hover:scale-110"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              
              {/* Login/Signup Buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 rounded-full border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition hover:scale-105"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition"
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop with blur */}
            <div 
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu with close button */}
            <div className="md:hidden fixed top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-2xl z-50">
              {/* Close button (X) */}
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  aria-label="Close menu"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <div className="px-4 py-6 space-y-4">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FaHome className="text-xl" />
                  <span className="font-medium text-lg">Home</span>
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FaSearch className="text-xl" />
                  <span className="font-medium text-lg">Discover</span>
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FaInfoCircle className="text-xl" />
                  <span className="font-medium text-lg">About</span>
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FaEnvelope className="text-xl" />
                  <span className="font-medium text-lg">Contact</span>
                </button>
                
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-5 py-3 rounded-full border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg transition"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 animate-pulse">
                <FaFire className="text-cyan-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">🔥 #1 Campus Event Platform</span>
              </div>
              
              {/* Main Floating Text */}
              <div className="space-y-4 mb-8">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900 dark:text-white animate-float" style={{animationDelay: '0s'}}>
                  Your Campus.
                </h1>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900 dark:text-white animate-float" style={{animationDelay: '0.2s'}}>
                  Your Vibe.
                </h1>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent animate-float" style={{animationDelay: '0.4s'}}>
                  Your Events.
                </h1>
              </div>
              
              {/* Description */}
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Discover everything happening on campus. From hackathons and sports tournaments to musical nights and movie screenings — EVENTIX brings all college events together.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 animate-pulse-glow"
                >
                  <span>Explore Events</span>
                  <FaArrowRight className="animate-bounce" />
                </button>
                <button 
                  onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 font-semibold py-3 px-8 rounded-full border-2 border-cyan-600 dark:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Learn More</span>
                  <FaChevronRight />
                </button>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center space-x-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 border-2 border-gray-900 animate-float"
                      style={{animationDelay: `${i * 0.1}s`}}
                    ></div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Join 10,000+ students</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Already discovering campus events</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Animated Cards */}
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-64 h-64 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { emoji: "🎤", title: "Concerts", color: "bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-500/20" },
                  { emoji: "💻", title: "Hackathons", color: "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500/20" },
                  { emoji: "⚽", title: "Sports", color: "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/20" },
                  { emoji: "🎬", title: "Movie Nights", color: "bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-500/20" },
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`${item.color} rounded-2xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-float backdrop-blur-sm`}
                    style={{ animationDelay: `${idx * 0.3}s` }}
                  >
                    <div className="text-4xl mb-3 animate-bounce" style={{animationDelay: `${idx * 0.5}s`}}>{item.emoji}</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 px-4 md:px-8 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white animate-float">Everything Happening On Campus</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              From coding competitions to cultural festivals — find your vibe
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventCategories.map((category, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-700 animate-float"
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                  <div className="text-2xl text-white">{category.icon}</div>
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{category.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{category.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white animate-float">Campus Love 💜</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">What students are saying</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-700 animate-float"
                style={{animationDelay: `${idx * 0.2}s`}}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                  <div className="ml-auto text-3xl animate-bounce" style={{animationDelay: `${idx * 0.5}s`}}>{testimonial.emoji}</div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[1,2,3,4,5].map((star) => (
                    <FaStar key={star} className="text-yellow-400 animate-pulse" style={{animationDelay: `${star * 0.1}s`}} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-float">Ready to Level Up Your Campus Life?</h2>
            <p className="text-xl mb-10 opacity-90">
              Join thousands of students discovering events, making friends, and creating memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 font-bold py-4 px-10 rounded-full hover:bg-gray-100 hover:scale-105 transition text-lg animate-pulse-glow"
              >
                Get Started Free
              </button>
              <button className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-full hover:bg-white/10 hover:scale-105 transition text-lg">
                See Live Events
              </button>
            </div>
            <p className="mt-8 text-sm opacity-80">No credit card required • Free forever for students</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 text-white py-12 px-4 md:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center animate-float">
                  <FaCalendarAlt className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold">EVENTIX</span>
              </div>
              <p className="text-gray-400">
                The #1 platform for campus events. Where college life comes alive.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition">All Events</Link></li>
                <li><Link to="/" className="hover:text-white transition">Categories</Link></li>
                <li><Link to="/" className="hover:text-white transition">Trending</Link></li>
                <li><Link to="/" className="hover:text-white transition">Calendar</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/" className="hover:text-white transition">Careers</Link></li>
                <li><Link to="/" className="hover:text-white transition">Blog</Link></li>
                <li><Link to="/" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>© 2024 EVENTIX. Made with 💜 for campus communities worldwide.</p>
            <p className="mt-2 text-sm">Your Campus. Your Vibe. Your Events.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Main App Component
function App() {
  const [darkMode, setDarkMode] = useState(true) // Default to dark mode

  useEffect(() => {
    // Always start with dark mode
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <LandingPage 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
            />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App