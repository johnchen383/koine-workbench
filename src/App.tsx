import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Chapter from './pages/Chapter'
import Starred from './pages/Starred'

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <Link to="/" className="site-title">
          <span className="site-title__greek">λόγος</span> Koine Workbench
        </Link>
        <span className="site-tagline">work through NT Greek, decision by decision</span>
        <Link to="/starred" className="site-nav-link">
          ★ Starred
        </Link>
      </header>
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/starred" element={<Starred />} />
          <Route path="/:book/:chapter" element={<Chapter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>
          Greek text, morphology &amp; glosses: <a href="https://github.com/eliranwong/OpenGNT">OpenGNT</a> (CC BY-SA 4.0)
          · Lexicon: Dodson (public domain)
          · Morphology codes: Robinson (public domain)
          · Comparison translations: BSB (via bible.helloao.org), WEB, ASV, KJV (all public
          domain)
        </p>
        <p>
          Rule explanations and verse notes are study aids, not authorities — verify against a
          reference grammar and critical commentaries.
        </p>
      </footer>
    </div>
  )
}
