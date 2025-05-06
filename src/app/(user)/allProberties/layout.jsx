import React from 'react'
import Header from '../../(admin)/units/_components/Header'

const layout = ({ children }) => {
  return (
    <div>

       <div className=''> <Header/></div>
      <main>{children}</main>
    </div>
  )
}

export default layout
