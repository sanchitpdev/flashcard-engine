import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Study from './pages/Study'
import Progress from './pages/Progress'
import Test from './pages/Test'
import TestResult from './pages/TestResult'
import InteractiveGrid from './components/InteractiveGrid';

function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <InteractiveGrid />
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/decks" element={<PrivateRoute><Decks /></PrivateRoute>} />
        <Route path="/decks/:id" element={<PrivateRoute><DeckDetail /></PrivateRoute>} />
        <Route path="/decks/:id/test" element={<PrivateRoute><Test /></PrivateRoute>} />
        <Route path="/decks/:id/test/result" element={<PrivateRoute><TestResult /></PrivateRoute>} />
        <Route path="/study" element={<PrivateRoute><Study /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
      </Routes>
    </>
  )
}
