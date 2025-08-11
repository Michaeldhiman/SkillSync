import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token') // for now we store token in localStorage
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}
export default ProtectedRoute;
