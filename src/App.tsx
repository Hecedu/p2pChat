import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Peer from 'peerjs';

type PeerMessage = {
  senderId: string
  lamportClock: number
  message: string
  chatLog: string[]
};

function App() {
  const [id, setId] = useState<string>('')
  const [stateText, setStateText] = useState<string>('welcome')
  const [chatLog, setChatLog] = useState<string[]>([''])
  const [lamportClock, setLamportClock] = useState<number>(0)
  const peerInstance = useRef<Peer>()
  const connectionInstance = useRef<Peer.DataConnection>()
  var connectionId = ''
  var chatMessage = ''

  useEffect(() => {
    console.log(connectionInstance.current)
    function randId(): string {
      let roomLength = 6
      let lowChar = "A".charCodeAt(0)
      let highChar = "Z".charCodeAt(0)
      let possibleChars = highChar - lowChar + 1
      let randChar = () => {
        let r = Math.round(Math.random() * possibleChars) + lowChar
        return String.fromCharCode(r)
      }
      return [...new Array(roomLength).keys()].map(randChar).join("");
    }

    var myId: string = randId();
    var peer = new Peer(myId, {
      host: '45.79.192.219',
      port: 9000,
      path: '/myapp'
    });

    peer.on('open', function (id) {
      console.log("connection successfull, your id: " + id)
      setId(id)
    });

    peer.on('connection', function (conn) {
      conn.on('data', function (data: PeerMessage) {
        setLamportClock(lamportClock > data.lamportClock ? lamportClock + 1 : data.lamportClock + 1);
        setChatLog([...data.chatLog,generateChatString(data)])
      });
    });

    peerInstance.current = peer;
  }, []);

  function onConnectionIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    connectionId = e.target.value
  }
  function onChatChange(e: React.ChangeEvent<HTMLInputElement>) {
    chatMessage = e.target.value
  }

  function onSubmitConnectionRequest() {
    setLamportClock(lamportClock + 1)
    connectionInstance.current = peerInstance.current?.connect(connectionId);
    connectionInstance?.current?.on('open', function () {
      setStateText("successfully connected to: " + connectionId)
      var message: PeerMessage = { senderId: id, lamportClock: lamportClock, message: `${id} has entered the chat`, chatLog: chatLog }
      setChatLog([...chatLog, generateChatString(message)])
      connectionInstance?.current?.send(message);
    });
  }
  function onSubmitChat() {
    setLamportClock(lamportClock + 1)
    var message: PeerMessage = { senderId: id, lamportClock: lamportClock, message: chatMessage, chatLog: chatLog }
    setChatLog([...chatLog, generateChatString(message)])
    connectionInstance?.current?.send(message);
  }

  function generateChatString(message: PeerMessage) {
    return `${message.senderId} at L(${message.lamportClock}): ${message.message}`
  }

  return (
    <div className="App">
      <h1>ID: {id}</h1>
      <p>{stateText}</p>
      <div>
        <label>
          Connect to id:
          <input type="text" name="name" onChange={onConnectionIdChange} />
        </label>
        <input className="btn btn-primary" type="submit" value="Submit" onClick={onSubmitConnectionRequest}></input>
      </div>
      <div>
        <h2>Chat</h2>
        {chatLog.map((message, index) => {
          return <p key={index}>{message}</p>
        })}
      </div>
      {connectionInstance.current == undefined ?
        <p>not connected</p> :
        <div>
          <label>
            Chat:
            <input type="text" name="name" onChange={onChatChange} />
          </label>
          <input className="btn btn-primary" type="submit" value="Submit" onClick={onSubmitChat}></input>
        </div>
      }
    </div>
  );
}

export default App;
