import UserList from './components/UserList'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import { Link,Route,Routes,Navigate } from 'react-router-dom'


function App() {


  return (
    <>
       <nav className="p-4 border-b">
        <Link className="mr-4" to="/">Home</Link>
        <Link className="mr-4" to="/signup">Signup</Link>
        <Link className="mr-4" to="/login">Login</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default App
