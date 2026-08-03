import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contatos from '@/pages/Contatos'
import Agendamentos from '@/pages/Agendamentos'
import Estatisticas from '@/pages/Estatisticas'
import Configuracoes from '@/pages/Configuracoes'
import Integracoes from '@/pages/Integracoes'
import Atendimentos from '@/pages/Atendimentos'
import AgendarPublico from '@/pages/public/AgendarPublico'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/agendar/:slug" element={<AgendarPublico />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contatos"
        element={
          <ProtectedRoute>
            <Layout>
              <Contatos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendamentos"
        element={
          <ProtectedRoute>
            <Layout>
              <Agendamentos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estatisticas"
        element={
          <ProtectedRoute>
            <Layout>
              <Estatisticas />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Integracoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/atendimentos"
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
