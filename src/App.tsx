import { useRelay } from './store'
import Login from './surfaces/Login'
import TopBar from './surfaces/TopBar'
import DeskSidebar from './surfaces/DeskSidebar'
import Queue from './surfaces/Queue'
import TicketDetail from './surfaces/TicketDetail'
import Dashboard from './surfaces/Dashboard'
import Oncall from './surfaces/Oncall'
import Settings from './surfaces/Settings'
import Portal from './surfaces/Portal'
import BulkBar from './overlays/BulkBar'
import AssignPopover from './overlays/AssignPopover'
import MergeModal from './overlays/MergeModal'
import NewTicketModal from './overlays/NewTicketModal'
import CommandPalette from './overlays/CommandPalette'
import ToastView from './overlays/ToastView'

export default function App() {
  const { state, caps } = useRelay()

  // Not signed in → the demo sign-in screen (with the toast for feedback).
  if (!state.currentUserId) {
    return (
      <>
        <Login />
        <ToastView />
      </>
    )
  }

  const c = caps()
  const isEmployee = c.isEmployee

  // Clamp the page to what this role may access.
  let page = state.page
  if (page === 'dashboard' && !c.canDashboard) page = 'queue'
  if (page === 'settings' && !c.canSettings) page = 'queue'
  if (page === 'oncall' && !c.canOncall) page = 'queue'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      {isEmployee ? (
        <Portal />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', minHeight: 0 }}>
          <DeskSidebar />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {page === 'queue' && <Queue />}
            {page === 'detail' && <TicketDetail />}
            {page === 'dashboard' && <Dashboard />}
            {page === 'oncall' && <Oncall />}
            {page === 'settings' && <Settings />}
          </div>
        </div>
      )}

      {/* Overlays (agent-only actions won't be reachable for employees anyway) */}
      <BulkBar />
      <AssignPopover />
      <MergeModal />
      <NewTicketModal />
      <CommandPalette />
      <ToastView />
    </div>
  )
}
