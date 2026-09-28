import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import RequireTipoNegocio from '@/components/RequireTipoNegocio'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contatos from '@/pages/Contatos'
import Agendamentos from '@/pages/Agendamentos'
import Estatisticas from '@/pages/Estatisticas'
import Configuracoes from '@/pages/Configuracoes'
import Atendimentos from '@/pages/Atendimentos'
import ClienteNovo from '@/pages/ClienteNovo'
import Cardapio from '@/pages/Cardapio'
import Pedidos from '@/pages/Pedidos'
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
              <RequireTipoNegocio tipo="agendamento">
                <Contatos />
              </RequireTipoNegocio>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/agendamentos"
        element={
          <ProtectedRoute>
            <Layout>
              <RequireTipoNegocio tipo="agendamento">
                <Agendamentos />
              </RequireTipoNegocio>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/estatisticas"
        element={
          <ProtectedRoute>
            <Layout>
              <RequireTipoNegocio tipo="agendamento">
                <Estatisticas />
              </RequireTipoNegocio>
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
      <Route
        path="/app/cardapio"
        element={
          <ProtectedRoute>
            <Layout>
              <RequireTipoNegocio tipo="pedidos">
                <Cardapio />
              </RequireTipoNegocio>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/pedidos"
        element={
          <ProtectedRoute>
            <Layout>
              <RequireTipoNegocio tipo="pedidos">
                <Pedidos />
              </RequireTipoNegocio>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/clientes/novo"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <ClienteNovo />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
