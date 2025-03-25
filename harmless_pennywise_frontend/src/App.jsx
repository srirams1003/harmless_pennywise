import { useState } from 'react'
import './App.css'
import FirstView from  './FirstView';
import InputForm from  './InputForm';
import SecondView from  './SecondView';

// this function is also no longer needed, as it was just part of the POC
function UserList({ users }) {
	// need to only show the first 20 users for now, as proof of concept
	users = users.slice(0, 20);

	return (
		<div style={{fontSize: '15px', color: 'cyan'}}>
			<hr/>
			{users.map(user => (
				<div key={user.id}>
					<div> <p style={{color: "pink"}}>User {user.id}:</p>  Age: {user.age} <br /> Gender: {user.gender} <br/> Major: {user.major} <br/> Preferred Payment Method: {user.preferred_payment_method}  </div>
					<hr />
				</div>

			))}
		</div>
	)
}

function App() {
	// this code block below is no longer needed as it was part of the proof of concept
	const [count, setCount] = useState(0);
	const [users, setUsers] = useState([]);
	const getUsersData = () => {
		fetch('http://localhost:8000/users')
			.then(response => response.json())
			.then(data => {
				console.log(data);
				setUsers(data);
			})
			.catch(error => console.error('Error fetching users:', error));
	}

	const [showForm, setShowForm] = useState(true);

	return (
		<div id='mainbody'>
			<h1>Harmless PennyWise</h1>
			<div style={{display: 'flex', flexDirection: 'column'}}>
				<button onClick={()=>{setShowForm(!showForm)}}>
					{showForm ? 'Hide Input Form' : 'Show Input Form'}
				</button>

				{showForm && <InputForm />}

				<div style={{display: 'flex', flexDirection: 'row'}}>
					<SecondView />
					<FirstView />
				</div>
			</div>
			{/*<div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '200px' }}>
		<button onClick={getUsersData}>
		  Get Users Data
		</button>
	  </div>*/}
			{/*<UserList users={users} />*/}
		</div>
	)
}

export default App
