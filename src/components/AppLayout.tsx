interface AppLayoutProps {
  version?: string
  menu?: React.ReactNode
  children?: React.ReactNode
  preview?: React.ReactNode
}

const AppLayout = ({ version, menu, children, preview }: AppLayoutProps) => {
  return (
    <div className="app">
      {/* Header - fixed at top of viewport (flex-shrink: 0) */}
      <header className="app-header container-fluid">
        <div className="row">
          <div className="col-md-11 col-lg-10 m-auto">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center">
              <h1 className="h3 mb-0">
                <b>audioplotter</b>
                {!!version && (
                  <>
                    {' '}
                    <small
                      className="ui-version text-muted font-monospace"
                      style={{ verticalAlign: 'super', fontSize: '0.75rem', letterSpacing: '-0.05em' }}
                    >
                      {version}
                    </small>
                  </>
                )}
              </h1>
              {menu && <div className="btn-toolbar">{menu}</div>}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - fills remaining space with internal scrolling */}
      <main className="app-main container-fluid">
        <div className="row h-100">
          <div className="col-md-11 col-lg-10 m-auto h-100">
            <div className="app-content">{children}</div>
          </div>
        </div>
      </main>

      {/* Preview panel - direct child of .app for proper stacking */}
      {preview}

      {/* Portal target for preview panel when using createPortal */}
      <div id="preview-portal-root" />
    </div>
  )
}

export default AppLayout
