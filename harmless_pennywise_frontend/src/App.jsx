import { useState } from 'react'
import './App.css'

function UserList({ users }) {
  // need to only show the first 5 users for now, as proof of concept
  users = users.slice(0, 5)

  return (
    <div style={{fontSize: '15px', color: 'cyan'}}>
      <hr/>
      {users.map(user => (
        <div key={user.id}>
          <p >User {user.id}.  Age: {user.age} <br /> Gender: {user.gender}   </p>
          <hr />
        </div>

      ))}
    </div>
  )
}

function App() {
  const [count, setCount] = useState(0)
  const [users, setUsers] = useState([])

  const getUsersData = () => {
    fetch('http://localhost:8000/users')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setUsers(data);
      })
      .catch(error => console.error('Error fetching users:', error));
  }

  return (
    <>
      <h1>Harmless PennyWise</h1>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '200px' }}>
        <button onClick={getUsersData}>
          Get Users Data
        </button>
      </div>
      <UserList users={users} />
    </>
  )
}

export default App