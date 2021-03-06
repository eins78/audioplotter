import React, { Fragment as F } from 'react'

const AppLayout = ({ version, menu, children }) => {
  return (
    <div className="app">
      {false && (
        <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
          <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3" href="#">
            Company name
          </a>
          <button
            className="navbar-toggler position-absolute d-md-none collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#sidebarMenu"
            aria-controls="sidebarMenu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <input
            className="form-control form-control-dark w-100"
            type="text"
            placeholder="Search"
            aria-label="Search"
          />
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap">
              <a className="nav-link" href="#">
                Sign out
              </a>
            </li>
          </ul>
        </header>
      )}
      <div className="container-fluid">
        <div className="row">
          <main className="col-md-11 col-lg-10 m-auto">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 className="h3">
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

              {menu && <div className="btn-toolbar mb-2 mb-md-0">{menu}</div>}
            </div>
            <div className="app-content">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
