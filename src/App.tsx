import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contatos from '@/pages/Contatos'
import Agendamentos from '@/pages/Agendamentos'
import Estatisticas from '@/pages/Estatisticas'
import Configuracoes from '@/pages/Configuracoes'
import Atendimentos from '@/pages/Atendimentos'
import AgendarPublico from '@/pages/public/AgendarPublico'
import Landing from '@/pages/public/Landing'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agendar/:slug" element={<AgendarPublico />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/contatos"
        element={
          <ProtectedRoute>
            <Layout>
              <Contatos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/agendamentos"
        element={
          <ProtectedRoute>
            <Layout>
              <Agendamentos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/estatisticas"
        element={
          <ProtectedRoute>
            <Layout>
              <Estatisticas />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/configuracoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/atendimentos"
        element={
          <ProtectedRoute>
            <Layout>
              <Atendimentos />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
