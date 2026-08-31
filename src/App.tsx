import { useRelay } from './store'
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
  const { state } = useRelay()
  const isDesktop = state.surface === 'Desk'
  const isPortal = state.surface === 'Portal'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      {isDesktop && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', minHeight: 0 }}>
          <DeskSidebar />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {state.page === 'queue' && <Queue />}
            {state.page === 'detail' && <TicketDetail />}
            {state.page === 'dashboard' && <Dashboard />}
            {state.page === 'oncall' && <Oncall />}
            {state.page === 'settings' && <Settings />}
          </div>
        </div>
      )}

      {isPortal && <Portal />}

      {/* Overlays */}
      <BulkBar />
      <AssignPopover />
      <MergeModal />
      <NewTicketModal />
      <CommandPalette />
      <ToastView />
    </div>
  )
}
