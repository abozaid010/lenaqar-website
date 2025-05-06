import React from 'react'

const Chat_with = ({name}) => {
  return (
    <div>
       <h1 className="text-xl text-gray-700">
         <span className="text-primary font-bold">{name}</span>
        </h1>
    </div>
  )
}

export default Chat_with
